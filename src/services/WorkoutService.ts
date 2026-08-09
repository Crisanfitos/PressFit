import { NetworkService } from './NetworkService';
import { supabase } from '../lib/supabase';
import { TipoPeso } from '../types/setTypes';
import { formatLocalDateKey, parseDateKeyAsLocalDate } from '../utils/dateUtils';
import { isE2EMockEnabled, mockStore } from '../lib/e2eMockAdapter';
import { OfflineStorageService } from './OfflineStorageService';
import { SyncService } from './SyncService';
import {
    Serie,
    ScheduledExercise,
    RoutineDay,
    ServiceResponse,
    SetUpdatePayload,
    PostgrestError,
    SeriesInsert,
    ExerciseHistoryRow,
} from '../types/models';

async function checkIsOffline(): Promise<boolean> {
    try {
        return await NetworkService.isOffline();
    } catch {
        return false;
    }
}

function isNetworkError(error: any): boolean {
    if (!error) return false;
    const msg = String(error.message || error.name || error).toLowerCase();
    return msg.includes('fetch') || msg.includes('network') || msg.includes('offline') || msg.includes('timeout');
}

export const WorkoutService = {
    async getWorkoutDetails(workoutId: string): Promise<ServiceResponse<RoutineDay>> {
        if (isE2EMockEnabled()) {
            return { data: mockStore.getMockRoutineDay(workoutId) as any, error: null };
        }

        const offline = await checkIsOffline();
        if (!offline) {
            try {
                const { data, error } = await supabase
                    .from('rutinas_diarias')
                    .select(`
              *,
              ejercicios_programados (
                *,
                ejercicio:ejercicios (*),
                series (*)
              )
            `)
                    .eq('id', workoutId)
                    .single();

                if (error) {
                    if (isNetworkError(error)) throw error;
                    return { data: null, error };
                }

                // Sort exercises by order
                if (data?.ejercicios_programados) {
                    data.ejercicios_programados.sort(
                        (a: ScheduledExercise, b: ScheduledExercise) => (a.orden_ejecucion || 0) - (b.orden_ejecucion || 0)
                    );

                    // Sort sets by number
                    data.ejercicios_programados.forEach((ex: ScheduledExercise) => {
                        if (ex.series) {
                            ex.series.sort(
                                (a: Serie, b: Serie) => (a.numero_serie || 0) - (b.numero_serie || 0)
                            );
                        }
                    });
                }

                // Cache workout locally
                if (data) {
                    const cachedRes = await OfflineStorageService.getCachedWorkouts();
                    const currentCached = cachedRes.data || [];
                    const filtered = currentCached.filter((w) => w.id !== data.id);
                    await OfflineStorageService.saveWorkouts([...filtered, data]);
                }

                return { data, error: null };
            } catch (error) {
                console.warn('Network query failed for workout details, trying offline cache:', error);
            }
        }

        // Offline fallback
        const cachedRes = await OfflineStorageService.getCachedWorkouts();
        const cachedWorkout = cachedRes.data?.find((w) => w.id === workoutId);
        if (cachedWorkout) {
            return { data: cachedWorkout, error: null };
        }

        return { data: null, error: new Error('Workout details not available offline') };
    },

    async createWorkout(userId: string, routineDayId: string): Promise<ServiceResponse<RoutineDay>> {
        if (isE2EMockEnabled()) {
            return { data: mockStore.startWorkout(routineDayId) as any, error: null };
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

                // Try to copy series from last completed workout for the same day
                try {
                    const todayStr = formatLocalDateKey(new Date());

                    // Find the most recent completed workout for the same day name
                    const { data: lastWorkouts } = await supabase
                        .from('rutinas_diarias')
                        .select(`
                            id,
                            ejercicios_programados (
                                ejercicio_id,
                                series (numero_serie, peso_utilizado, repeticiones, rpe)
                            )
                        `)
                        .eq('rutina_semanal_id', templateDay.rutina_semanal_id)
                        .eq('nombre_dia', templateDay.nombre_dia)
                        .lt('fecha_dia', todayStr)
                        .eq('completada', true)
                        .not('fecha_dia', 'is', null)
                        .order('fecha_dia', { ascending: false })
                        .limit(1);

                    if (lastWorkouts?.[0]?.ejercicios_programados && insertedExercises) {
                        // Map exercise_id -> new ejercicio_programado_id
                        const newExerciseMap = new Map<string, string>();
                        insertedExercises.forEach((ex: { ejercicio_id: string; id: string }) => {
                            newExerciseMap.set(ex.ejercicio_id, ex.id);
                        });

                        // Copy series with only weight filled, reps/rpe as 0 (shown as placeholders)
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
                                    });
                                }
                            }
                        }

                        if (seriesToInsert.length > 0) {
                            await supabase.from('series').insert(seriesToInsert);
                        }
                    }
                } catch (copyError) {
                    console.warn('Could not copy series from last workout:', copyError);
                    // Continue even if copying fails - workout is still created
                }
            }

            // Reload workout with all related data (including copied series) before returning
            const { data: completeWorkout } = await this.getWorkoutDetails(newWorkout.id);
            return { data: completeWorkout || newWorkout, error: null };
        } catch (error) {
            console.error('Error creating workout:', error);
            return { data: null, error };
        }
    },

    async completeWorkout(workoutId: string, durationMinutes?: number): Promise<ServiceResponse<RoutineDay>> {
        if (isE2EMockEnabled()) {
            return { data: mockStore.completeWorkout() as any, error: null };
        }

        const offline = await checkIsOffline();
        if (!offline) {
            try {
                const { data, error } = await supabase
                    .from('rutinas_diarias')
                    .update({
                        completada: true,
                        hora_fin: new Date().toISOString(),
                    })
                    .eq('id', workoutId)
                    .select()
                    .single();

                if (error) {
                    if (isNetworkError(error)) throw error;
                    return { data: null, error };
                }

                // Update local cache
                if (data) {
                    const cachedRes = await OfflineStorageService.getCachedWorkouts();
                    const workouts = cachedRes.data || [];
                    const updatedList = workouts.map((w) => (w.id === workoutId ? { ...w, completada: true, hora_fin: data.hora_fin } : w));
                    await OfflineStorageService.saveWorkouts(updatedList);
                }

                return { data, error: null };
            } catch (error) {
                console.warn('Supabase completeWorkout network failure, falling back to offline enqueue:', error);
            }
        }

        // Offline Fallback: Enqueue mutation & update local cache
        await SyncService.enqueueOperation('WORKOUT_COMPLETE', { workoutId, durationMinutes, timestamp: Date.now() });

        const cachedRes = await OfflineStorageService.getCachedWorkouts();
        const workouts = cachedRes.data || [];
        const nowIso = new Date().toISOString();

        let updatedWorkout: RoutineDay | null = null;
        const updatedList = workouts.map((w) => {
            if (w.id === workoutId) {
                updatedWorkout = { ...w, completada: true, hora_fin: nowIso };
                return updatedWorkout;
            }
            return w;
        });

        if (updatedList.length > 0) {
            await OfflineStorageService.saveWorkouts(updatedList);
        }

        return {
            data: updatedWorkout || ({ id: workoutId, completada: true, hora_fin: nowIso } as any),
            error: null,
        };
    },

    // Get all series for a specific exercise within a specific workout
    async getSeriesForExercise(
        workoutId: string,
        exerciseId: string
    ): Promise<ServiceResponse<Serie[]>> {
        try {
            // Find the ejercicio_programado linking this exercise to this workout
            const { data: scheduledExercise, error: findError } = await supabase
                .from('ejercicios_programados')
                .select('id')
                .eq('rutina_diaria_id', workoutId)
                .eq('ejercicio_id', exerciseId)
                .maybeSingle();

            if (findError) throw findError;
            if (!scheduledExercise) return { data: [], error: null };

            // Fetch all series for this scheduled exercise
            const { data: series, error: seriesError } = await supabase
                .from('series')
                .select('*')
                .eq('ejercicio_programado_id', scheduledExercise.id)
                .order('numero_serie', { ascending: true });

            if (seriesError) throw seriesError;
            return { data: series || [], error: null };
        } catch (error) {
            console.error('Error fetching series for exercise:', error);
            return { data: null, error };
        }
    },

    async addSet(
        workoutId: string,
        exerciseId: string,
        setNumber: number,
        weight: number,
        reps: number
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

            const { data, error } = await supabase
                .from('series')
                .insert({
                    ejercicio_programado_id: scheduledExercise!.id,
                    numero_serie: setNumber,
                    peso_utilizado: weight || 0,
                    repeticiones: reps || 0,
                })
                .select()
                .single();

            if (isE2EMockEnabled()) {
                const mockAdded = mockStore.addSet(exerciseId);
                return { data: (mockAdded || data) as any, error: null };
            }

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error adding set:', error);
            return { data: null, error };
        }
    },

    async updateSet(
        setId: string,
        updates: { weight?: number; reps?: number; rpe?: number; descanso_segundos?: number }
    ): Promise<ServiceResponse<Serie>> {
        const dbUpdates: SetUpdatePayload = {};
        if (updates.weight !== undefined) dbUpdates.peso_utilizado = updates.weight;
        if (updates.reps !== undefined) dbUpdates.repeticiones = updates.reps;
        if (updates.rpe !== undefined) dbUpdates.rpe = updates.rpe;
        if (updates.descanso_segundos !== undefined) dbUpdates.descanso_segundos = updates.descanso_segundos;

        if (isE2EMockEnabled()) {
            const mockUpdated = mockStore.updateSet(setId, dbUpdates);
            return { data: mockUpdated as any, error: null };
        }

        const offline = await checkIsOffline();
        if (!offline) {
            try {
                const { data, error } = await supabase
                    .from('series')
                    .update(dbUpdates)
                    .eq('id', setId)
                    .select()
                    .single();

                if (error) {
                    if (isNetworkError(error)) throw error;
                    return { data: null, error };
                }

                // Update local cache
                if (data) {
                    const cachedRes = await OfflineStorageService.getCachedWorkouts();
                    const workouts = cachedRes.data || [];
                    const updatedList = workouts.map((w) => {
                        if (w.ejercicios_programados) {
                            w.ejercicios_programados.forEach((ex) => {
                                if (ex.series) {
                                    ex.series = ex.series.map((s) => (s.id === setId ? { ...s, ...data } : s));
                                }
                            });
                        }
                        return w;
                    });
                    await OfflineStorageService.saveWorkouts(updatedList);
                }

                return { data, error: null };
            } catch (error) {
                console.warn('Supabase updateSet network failure, falling back to offline enqueue:', error);
            }
        }

        // Offline Fallback: Enqueue mutation & update local cache
        await SyncService.enqueueOperation('SET_UPSERT', { setId, dbUpdates, timestamp: Date.now() });

        const mockSet: Serie = {
            id: setId,
            ejercicio_programado_id: 'offline-ex-id',
            numero_serie: 1,
            peso_utilizado: dbUpdates.peso_utilizado || 0,
            repeticiones: dbUpdates.repeticiones || 0,
            rpe: dbUpdates.rpe,
            descanso_segundos: dbUpdates.descanso_segundos,
        };

        const cachedRes = await OfflineStorageService.getCachedWorkouts();
        const workouts = cachedRes.data || [];
        const updatedList = workouts.map((w) => {
            if (w.ejercicios_programados) {
                w.ejercicios_programados.forEach((ex) => {
                    if (ex.series) {
                        ex.series = ex.series.map((s) => (s.id === setId ? { ...s, ...dbUpdates } : s));
                    }
                });
            }
            return w;
        });

        if (updatedList.length > 0) {
            await OfflineStorageService.saveWorkouts(updatedList);
        }

        return { data: mockSet, error: null };
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
            console.error('Error deleting set:', error);
            return { error };
        }
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
            console.error('Error removing exercise from routine:', error);
            return { error };
        }
    },

    async getLastCompletedWorkoutForDay(
        userId: string,
        routineDayId: string
    ): Promise<ServiceResponse<RoutineDay>> {
        try {
            const { data: templateDay } = await supabase
                .from('rutinas_diarias')
                .select('nombre_dia, rutina_semanal_id')
                .eq('id', routineDayId)
                .single();

            if (!templateDay) return { data: null, error: 'Template not found' };

            const { data, error } = await supabase
                .from('rutinas_diarias')
                .select(`
          *,
          ejercicios_programados (
            *,
            ejercicio:ejercicios (*),
            series (*)
          )
        `)
                .eq('rutina_semanal_id', templateDay.rutina_semanal_id)
                .eq('nombre_dia', templateDay.nombre_dia)
                .eq('completada', true)
                .not('fecha_dia', 'is', null)
                .order('hora_fin', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;

            if (data && data.fecha_dia) {
                const todayStr = formatLocalDateKey(new Date());
                const todayDate = parseDateKeyAsLocalDate(todayStr);
                const workoutDate = parseDateKeyAsLocalDate(data.fecha_dia);
                const diffTime = todayDate.getTime() - workoutDate.getTime();
                const daysDiff = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
                data.days_diff = daysDiff;
                data.isStale = daysDiff > 14;
            }

            return { data, error: null };
        } catch (error) {
            console.error('Error fetching last completed workout:', error);
            return { data: null, error };
        }
    },

    async addExerciseToWorkout(
        workoutId: string,
        exerciseId: string
    ): Promise<ServiceResponse<ScheduledExercise>> {
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
            console.error('Error adding exercise to workout:', error);
            return { data: null, error };
        }
    },

    async removeExerciseFromWorkout(
        workoutId: string,
        exerciseId: string
    ): Promise<{ error: unknown }> {
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
            console.error('Error removing exercise from workout:', error);
            return { error };
        }
    },

    async getExerciseHistory(
        userId: string,
        exerciseId: string
    ): Promise<ServiceResponse<ExerciseHistoryRow[]>> {
        try {
            // Join series with ejercicios_programados and rutinas_diarias to get the date
            // Ordered by rutinas_diarias.fecha_dia
            const { data, error } = await supabase
                .from('series')
                .select(`
                    id,
                    numero_serie,
                    peso_utilizado,
                    repeticiones,
                    rpe,
                    ejercicios_programados!inner(
                        ejercicio_id,
                        tipo_peso,
                        rutinas_diarias!inner(
                            id,
                            fecha_dia,
                            rutinas_semanales!inner(usuario_id)
                        )
                    )
                `)
                .eq('ejercicios_programados.ejercicio_id', exerciseId)
                .eq('ejercicios_programados.rutinas_diarias.rutinas_semanales.usuario_id', userId)
                .not('ejercicios_programados.rutinas_diarias.fecha_dia', 'is', null)
                .not('peso_utilizado', 'is', null);

            if (error) throw error;

            // Flatten and sort the data in JS to ensure correctness
            const history = (data || []).map((row: ExerciseHistoryRow) => ({
                id: row.id,
                numero_serie: row.numero_serie,
                peso_utilizado: row.peso_utilizado,
                repeticiones: row.repeticiones,
                rpe: row.rpe,
                tipo_peso: row.ejercicios_programados?.tipo_peso || 'total',
                fecha: row.ejercicios_programados?.rutinas_diarias?.fecha_dia,
                rutina_id: row.ejercicios_programados?.rutinas_diarias?.id,
            }))
                .filter((item) => item.fecha)
                .sort((a, b) => parseDateKeyAsLocalDate(a.fecha).getTime() - parseDateKeyAsLocalDate(b.fecha).getTime());

            return { data: history, error: null };
        } catch (error) {
            console.error('Error fetching exercise history:', error);
            return { data: null, error };
        }
    },

    async updateWeightType(
        scheduledExerciseId: string,
        tipoPeso: TipoPeso
    ): Promise<ServiceResponse<ScheduledExercise>> {
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
            console.error('Error updating weight type:', error);
            return { data: null, error };
        }
    },
};
