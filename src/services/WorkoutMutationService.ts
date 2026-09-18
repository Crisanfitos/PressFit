import { supabase } from '../lib/supabase';
import { isE2EMockEnabled, mockStore } from '../lib/e2eMockAdapter';
import { WorkoutOfflineService } from './WorkoutOfflineService';
import { WorkoutQueryService } from './WorkoutQueryService';
import { WorkoutSetMutationService } from './WorkoutSetMutationService';
import { LogService } from './LogService';
import { formatLocalDateKey } from '../utils/dateUtils';
import {
    RoutineDay,
    ScheduledExercise,
    Serie,
    ServiceResponse,
    SetUpdatePayload,
    SeriesInsert,
} from '../types/models';
import { SetType, TipoPeso } from '../types/setTypes';

async function copyPreviousSeries(
    templateDay: { rutina_semanal_id: string; nombre_dia: string },
    insertedExercises: { id: string; ejercicio_id: string }[]
): Promise<void> {
    try {
        const todayStr = formatLocalDateKey(new Date());

        const selectWithTipo = 'id, ejercicios_programados(ejercicio_id, series(numero_serie, peso_utilizado, repeticiones, rpe, tipo_serie))';
        let lastWorkoutsRes = await supabase
            .from('rutinas_diarias')
            .select(selectWithTipo)
            .eq('rutina_semanal_id', templateDay.rutina_semanal_id)
            .eq('nombre_dia', templateDay.nombre_dia)
            .lt('fecha_dia', todayStr)
            .eq('completada', true)
            .not('fecha_dia', 'is', null)
            .order('fecha_dia', { ascending: false })
            .limit(1);

        if (lastWorkoutsRes.error && WorkoutOfflineService.isSchemaColumnError(lastWorkoutsRes.error)) {
            LogService.warn('[WorkoutService] tipo_serie column not found in schema cache, querying previous series without tipo_serie');
            const selectLegacy = 'id, ejercicios_programados(ejercicio_id, series(numero_serie, peso_utilizado, repeticiones, rpe))';
            lastWorkoutsRes = await supabase
                .from('rutinas_diarias')
                .select(selectLegacy)
                .eq('rutina_semanal_id', templateDay.rutina_semanal_id)
                .eq('nombre_dia', templateDay.nombre_dia)
                .lt('fecha_dia', todayStr)
                .eq('completada', true)
                .not('fecha_dia', 'is', null)
                .order('fecha_dia', { ascending: false })
                .limit(1);
        }

        const lastWorkouts = lastWorkoutsRes.data;

        if (lastWorkouts?.[0]?.ejercicios_programados && insertedExercises) {
            const newExerciseMap = new Map<string, string>();
            insertedExercises.forEach((ex) => newExerciseMap.set(ex.ejercicio_id, ex.id));

            const seriesToInsert: SeriesInsert[] = [];
            for (const lastExercise of lastWorkouts[0].ejercicios_programados) {
                const newExerciseId = newExerciseMap.get(lastExercise.ejercicio_id);
                if (newExerciseId && lastExercise.series?.length > 0) {
                    for (const serie of lastExercise.series) {
                        seriesToInsert.push({
                            ejercicio_programado_id: newExerciseId,
                            numero_serie: serie.numero_serie,
                            peso_utilizado: serie.peso_utilizado,
                            repeticiones: 0,
                            descanso_segundos: 0,
                            tipo_serie: serie.tipo_serie || 'normal',
                        });
                    }
                }
            }

            if (seriesToInsert.length > 0) {
                const insertCopyRes = await supabase.from('series').insert(seriesToInsert);
                if (insertCopyRes.error && WorkoutOfflineService.isSchemaColumnError(insertCopyRes.error)) {
                    LogService.warn('[WorkoutService] tipo_serie column not supported on insert copy, inserting legacy series');
                    const legacySeries = seriesToInsert.map((s) => {
                        const { tipo_serie: _removed, ...legacyCopy } = s;
                        return legacyCopy;
                    });
                    await supabase.from('series').insert(legacySeries);
                }
            }
        }
    } catch (copyError) {
        LogService.warn('Could not copy series from last workout:', copyError);
    }
}

export const WorkoutMutationService = {
    // Set mutation delegation
    addSet: WorkoutSetMutationService.addSet,
    updateSet: WorkoutSetMutationService.updateSet,
    deleteSet: WorkoutSetMutationService.deleteSet,

    async createWorkout(userId: string, routineDayId: string): Promise<ServiceResponse<RoutineDay>> {
        if (isE2EMockEnabled()) {
            return { data: mockStore.startWorkout(routineDayId) as unknown as RoutineDay, error: null };
        }
        try {
            const { data: templateDay, error: templateError } = await supabase
                .from('rutinas_diarias')
                .select(`*, ejercicios_programados (*)`)
                .eq('id', routineDayId)
                .single();

            if (templateError) throw templateError;

            const { data: newWorkout, error: createError } = await supabase
                .from('rutinas_diarias')
                .insert({
                    rutina_semanal_id: templateDay.rutina_semanal_id,
                    nombre_dia: templateDay.nombre_dia,
                    fecha_dia: formatLocalDateKey(new Date()),
                    hora_inicio: new Date().toISOString(),
                    completada: false,
                })
                .select()
                .single();

            if (createError) throw createError;

            if (templateDay.ejercicios_programados?.length > 0) {
                const exercisesToInsert = templateDay.ejercicios_programados.map((ex: ScheduledExercise) => ({
                    rutina_diaria_id: newWorkout.id,
                    ejercicio_id: ex.ejercicio_id,
                    orden_ejecucion: ex.orden_ejecucion,
                    notas_sesion: ex.notas_sesion,
                    tipo_peso: ex.tipo_peso || 'total',
                }));

                const { data: insertedExercises, error: exercisesError } = await supabase
                    .from('ejercicios_programados')
                    .insert(exercisesToInsert)
                    .select('id, ejercicio_id');

                if (exercisesError) throw exercisesError;

                await copyPreviousSeries(templateDay, insertedExercises);
            }

            const { data: completeWorkout } = await WorkoutQueryService.getWorkoutDetails(newWorkout.id);
            return { data: completeWorkout || newWorkout, error: null };
        } catch (error) {
            LogService.error('Error creating workout:', error);
            return { data: null, error };
        }
    },

    async completeWorkout(workoutId: string, durationMinutes?: number, customEndTime?: string): Promise<ServiceResponse<RoutineDay>> {
        if (isE2EMockEnabled()) {
            return { data: mockStore.completeWorkout(customEndTime) as unknown as RoutineDay, error: null };
        }

        const endTimeIso = customEndTime || new Date().toISOString();
        const offline = await WorkoutOfflineService.checkIsOffline();
        if (!offline) {
            try {
                const { data, error } = await supabase
                    .from('rutinas_diarias')
                    .update({
                        completada: true,
                        hora_fin: endTimeIso,
                    })
                    .eq('id', workoutId)
                    .select()
                    .single();

                if (error) {
                    if (WorkoutOfflineService.isNetworkError(error)) throw error;
                    return { data: null, error };
                }

                if (data) {
                    await WorkoutOfflineService.updateCachedWorkoutOnComplete(workoutId, data.hora_fin);
                }

                return { data, error: null };
            } catch (error) {
                LogService.warn('Supabase completeWorkout network failure, falling back to offline enqueue:', error);
            }
        }

        return WorkoutOfflineService.enqueueAndCacheCompleteWorkout(workoutId, durationMinutes, endTimeIso);
    },

    async removeExerciseFromRoutine(routineExerciseId: string): Promise<{ error: unknown }> {
        if (isE2EMockEnabled()) {
            mockStore.deleteExerciseFromRoutineDay(routineExerciseId);
            return { error: null };
        }
        try {
            const { error } = await supabase
                .from('ejercicios_programados')
                .delete()
                .eq('id', routineExerciseId);

            if (error) throw error;
            return { error: null };
        } catch (error) {
            LogService.error('Error removing exercise from routine:', error);
            return { error };
        }
    },

    async addExerciseToWorkout(workoutId: string, exerciseId: string): Promise<ServiceResponse<ScheduledExercise>> {
        try {
            const { data: maxOrderData } = await supabase
                .from('ejercicios_programados')
                .select('orden_ejecucion')
                .eq('rutina_diaria_id', workoutId)
                .order('orden_ejecucion', { ascending: false })
                .limit(1)
                .maybeSingle();

            const nextOrder = (maxOrderData?.orden_ejecucion || 0) + 1;

            const { data, error } = await supabase
                .from('ejercicios_programados')
                .insert({
                    rutina_diaria_id: workoutId,
                    ejercicio_id: exerciseId,
                    orden_ejecucion: nextOrder,
                })
                .select(`*, ejercicio:ejercicios (*)`)
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            LogService.error('Error adding exercise to workout:', error);
            return { data: null, error };
        }
    },

    async removeExerciseFromWorkout(workoutId: string, exerciseId: string): Promise<{ error: unknown }> {
        if (isE2EMockEnabled()) {
            mockStore.deleteExerciseFromRoutineDay(exerciseId);
            return { error: null };
        }
        try {
            const { error } = await supabase
                .from('ejercicios_programados')
                .delete()
                .eq('rutina_diaria_id', workoutId)
                .eq('ejercicio_id', exerciseId);

            if (error) throw error;
            return { error: null };
        } catch (error) {
            LogService.error('Error removing exercise from workout:', error);
            return { error };
        }
    },

    async updateWeightType(scheduledExerciseId: string, tipoPeso: TipoPeso): Promise<ServiceResponse<ScheduledExercise>> {
        try {
            const { data, error } = await supabase
                .from('ejercicios_programados')
                .update({ tipo_peso: tipoPeso })
                .eq('id', scheduledExerciseId)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            LogService.error('Error updating weight type:', error);
            return { data: null, error };
        }
    },

    async swapExerciseInWorkout(
        workoutId: string,
        programmedExerciseId: string,
        newExerciseId: string,
        newSetsCount: number = 3
    ): Promise<ServiceResponse<ScheduledExercise>> {
        if (isE2EMockEnabled()) {
            return {
                data: {
                    id: programmedExerciseId,
                    rutina_diaria_id: workoutId,
                    ejercicio_id: newExerciseId,
                    orden_ejecucion: 1,
                    created_at: new Date().toISOString(),
                } as unknown as ScheduledExercise,
                error: null,
            };
        }

        try {
            const { data: updatedProgrammed, error: updateError } = await supabase
                .from('ejercicios_programados')
                .update({ ejercicio_id: newExerciseId })
                .eq('id', programmedExerciseId)
                .select(`*, ejercicio:ejercicios (*)`)
                .single();

            if (updateError) throw updateError;

            const { error: deleteSeriesError } = await supabase
                .from('series')
                .delete()
                .eq('ejercicio_programado_id', programmedExerciseId);

            if (deleteSeriesError) {
                LogService.warn('Could not delete old series during exercise swap:', deleteSeriesError);
            }

            if (newSetsCount > 0) {
                const newSeries = Array.from({ length: newSetsCount }, (_, i) => ({
                    ejercicio_programado_id: programmedExerciseId,
                    numero_serie: i + 1,
                    peso_utilizado: 0,
                    repeticiones: 0,
                }));
                const { error: insertSeriesError } = await supabase.from('series').insert(newSeries);
                if (insertSeriesError) {
                    LogService.warn('Could not insert new series during exercise swap:', insertSeriesError);
                }
            }

            await WorkoutOfflineService.updateCachedWorkoutOnSwap(
                workoutId,
                programmedExerciseId,
                newExerciseId,
                newSetsCount,
                updatedProgrammed?.ejercicio
            );

            return { data: updatedProgrammed, error: null };
        } catch (error) {
            LogService.error('Error swapping exercise in workout:', error);
            return { data: null, error };
        }
    },
};
