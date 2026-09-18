import { supabase } from '../lib/supabase';
import { isE2EMockEnabled, mockStore } from '../lib/e2eMockAdapter';
import { WorkoutOfflineService } from './WorkoutOfflineService';
import { LogService } from './LogService';
import {
    Serie,
    ServiceResponse,
    SetUpdatePayload,
    PostgrestError,
} from '../types/models';
import { SetType } from '../types/setTypes';

export const WorkoutSetMutationService = {
    async addSet(
        workoutId: string,
        exerciseId: string,
        setNumber: number,
        weight: number,
        reps: number,
        setType: SetType = 'normal'
    ): Promise<ServiceResponse<Serie>> {
        try {
            let { data: scheduledExercise, error: findError } = await supabase
                .from('ejercicios_programados')
                .select('id')
                .eq('rutina_diaria_id', workoutId)
                .eq('ejercicio_id', exerciseId)
                .single();

            if (findError && (findError as PostgrestError).code !== 'PGRST116') throw findError;

            if (!scheduledExercise) {
                const { data: maxOrderData } = await supabase
                    .from('ejercicios_programados')
                    .select('orden_ejecucion')
                    .eq('rutina_diaria_id', workoutId)
                    .order('orden_ejecucion', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                const nextOrder = (maxOrderData?.orden_ejecucion || 0) + 1;

                const { data: newEx, error: createExError } = await supabase
                    .from('ejercicios_programados')
                    .insert({
                        rutina_diaria_id: workoutId,
                        ejercicio_id: exerciseId,
                        orden_ejecucion: nextOrder,
                    })
                    .select()
                    .single();

                if (createExError) throw createExError;
                scheduledExercise = newEx;
            }

            let { data, error } = await supabase
                .from('series')
                .insert({
                    ejercicio_programado_id: scheduledExercise!.id,
                    numero_serie: setNumber,
                    peso_utilizado: weight || 0,
                    repeticiones: reps || 0,
                    tipo_serie: setType || 'normal',
                })
                .select()
                .single();

            if (error && WorkoutOfflineService.isSchemaColumnError(error)) {
                LogService.warn('[WorkoutService] tipo_serie column missing in schema cache, falling back to insert without tipo_serie');
                const fallbackRes = await supabase
                    .from('series')
                    .insert({
                        ejercicio_programado_id: scheduledExercise!.id,
                        numero_serie: setNumber,
                        peso_utilizado: weight || 0,
                        repeticiones: reps || 0,
                    })
                    .select()
                    .single();
                data = fallbackRes.data;
                error = fallbackRes.error;
            }

            if (isE2EMockEnabled()) {
                const mockAdded = mockStore.addSet(exerciseId, setType);
                return { data: (mockAdded || data) as unknown as Serie, error: null };
            }

            if (error) throw error;
            const serieData = data as (Serie & { tipo_serie?: SetType }) | null;
            const normalizedData = serieData
                ? { ...serieData, tipo_serie: serieData.tipo_serie || setType || 'normal' }
                : data;
            return { data: normalizedData, error: null };
        } catch (error) {
            LogService.error('Error adding set:', error);
            return { data: null, error };
        }
    },

    async updateSet(
        setId: string,
        updates: { weight?: number; reps?: number; rpe?: number; descanso_segundos?: number; tipo_serie?: SetType; numero_serie?: number; is_completed?: boolean; completada?: boolean; is_pr?: boolean }
    ): Promise<ServiceResponse<Serie>> {
        const dbUpdates: SetUpdatePayload = {};
        if (updates.weight !== undefined) dbUpdates.peso_utilizado = updates.weight;
        if (updates.reps !== undefined) dbUpdates.repeticiones = updates.reps;
        if (updates.rpe !== undefined) dbUpdates.rpe = updates.rpe;
        if (updates.descanso_segundos !== undefined) dbUpdates.descanso_segundos = updates.descanso_segundos;
        if (updates.tipo_serie !== undefined) dbUpdates.tipo_serie = updates.tipo_serie;
        if (updates.numero_serie !== undefined) dbUpdates.numero_serie = updates.numero_serie;
        if (updates.is_completed !== undefined) dbUpdates.is_completed = updates.is_completed;
        if (updates.completada !== undefined) dbUpdates.completada = updates.completada;
        if (updates.is_pr !== undefined) dbUpdates.is_pr = updates.is_pr;

        const effectiveCompleted = updates.is_completed !== undefined ? updates.is_completed : updates.completada;
        if (effectiveCompleted !== undefined) {
            dbUpdates.is_completed = effectiveCompleted;
            dbUpdates.completada = effectiveCompleted;
        }

        if (isE2EMockEnabled()) {
            const mockUpdated = mockStore.updateSet(setId, dbUpdates);
            return { data: mockUpdated as unknown as Serie, error: null };
        }

        const offline = await WorkoutOfflineService.checkIsOffline();
        if (!offline) {
            try {
                const supabasePayload: Partial<SetUpdatePayload> = { ...dbUpdates };
                delete supabasePayload.completada;

                let { data, error } = await supabase
                    .from('series')
                    .update(supabasePayload)
                    .eq('id', setId)
                    .select()
                    .single();

                if (error && WorkoutOfflineService.isSchemaColumnError(error)) {
                    LogService.warn('[WorkoutService] schema column missing in cache, falling back to update without optional columns');
                    const errorMsg = String(error.message || error.details || error.hint || '').toLowerCase();
                    const fallbackUpdates = { ...supabasePayload };

                    if (errorMsg.includes('tipo_serie')) {
                        delete fallbackUpdates.tipo_serie;
                    } else if (errorMsg.includes('is_completed')) {
                        delete fallbackUpdates.is_completed;
                    } else if (errorMsg.includes('is_pr')) {
                        delete fallbackUpdates.is_pr;
                    } else {
                        delete fallbackUpdates.tipo_serie;
                        delete fallbackUpdates.is_completed;
                        delete fallbackUpdates.is_pr;
                    }

                    const fallbackRes = await supabase.from('series').update(fallbackUpdates).eq('id', setId).select().single();
                    data = fallbackRes.data;
                    error = fallbackRes.error;
                }

                if (error) {
                    if (WorkoutOfflineService.isNetworkError(error)) throw error;
                    return { data: null, error };
                }

                let normalized: Serie | null = data;
                if (data) {
                    const rawData = data as Serie & { tipo_serie?: SetType; is_completed?: boolean; completada?: boolean };
                    normalized = {
                        ...data,
                        tipo_serie: rawData.tipo_serie || dbUpdates.tipo_serie || 'normal',
                        is_completed: rawData.is_completed ?? dbUpdates.is_completed ?? false,
                        completada: rawData.completada ?? rawData.is_completed ?? dbUpdates.completada ?? dbUpdates.is_completed ?? false,
                    };
                    await WorkoutOfflineService.updateCachedWorkoutOnSetUpdate(setId, normalized, dbUpdates);
                }

                return { data: normalized, error: null };
            } catch (error) {
                LogService.warn('Supabase updateSet network failure, falling back to offline enqueue:', error);
            }
        }

        return WorkoutOfflineService.enqueueAndCacheSetUpdate(setId, dbUpdates);
    },

    async deleteSet(setId: string): Promise<{ error: unknown }> {
        try {
            if (isE2EMockEnabled()) {
                mockStore.deleteSet(setId);
                return { error: null };
            }

            const { error } = await supabase.from('series').delete().eq('id', setId);
            if (error) throw error;
            return { error: null };
        } catch (error) {
            LogService.error('Error deleting set:', error);
            return { error };
        }
    },
};
