import { NetworkService } from './NetworkService';
import { OfflineStorageService } from './OfflineStorageService';
import { SyncService } from './SyncService';
import { LogService } from './LogService';
import { RoutineDay, ScheduledExercise, Serie, ServiceResponse, SetUpdatePayload } from '../types/models';
import { isNetworkError as utilsIsNetworkError, retryWithBackoff } from '../utils/networkRetry';

export async function checkIsOffline(): Promise<boolean> {
    try {
        return await NetworkService.isOffline();
    } catch {
        return false;
    }
}

export function isNetworkError(error: unknown): boolean {
    return utilsIsNetworkError(error);
}

export function isSchemaColumnError(error: unknown): boolean {
    if (!error) return false;
    const errObj = error as { code?: string; message?: string; details?: string; hint?: string } | null;
    if (errObj?.code === 'PGRST204') return true;
    if (errObj?.code === '42703') return true;
    const msg = String(errObj?.message || errObj?.details || errObj?.hint || error).toLowerCase();
    return msg.includes('tipo_serie') || msg.includes('is_completed') || msg.includes('completada') || (msg.includes('column') && msg.includes('schema cache'));
}

export { retryWithBackoff };

export const WorkoutOfflineService = {
    checkIsOffline,
    isNetworkError,
    isSchemaColumnError,
    retryWithBackoff,

    async getOfflineWorkoutDetails(workoutId: string): Promise<ServiceResponse<RoutineDay>> {
        const cachedRes = await OfflineStorageService.getCachedWorkouts();
        const cachedWorkout = cachedRes.data?.find((w) => w.id === workoutId);
        if (cachedWorkout) {
            if (cachedWorkout.ejercicios_programados) {
                cachedWorkout.ejercicios_programados.forEach((ex: ScheduledExercise) => {
                    if (ex.series) {
                        ex.series = ex.series.map((s: Serie) => {
                            const isCompleted = Boolean(s.is_completed || s.completada);
                            return {
                                ...s,
                                is_completed: isCompleted,
                                completada: isCompleted,
                            };
                        });
                    }
                });
            }
            return { data: cachedWorkout, error: null };
        }
        return { data: null, error: new Error('Workout details not available offline') };
    },

    async saveWorkoutToCache(workout: RoutineDay): Promise<void> {
        try {
            const cachedRes = await OfflineStorageService.getCachedWorkouts();
            const currentCached = cachedRes.data || [];
            const filtered = currentCached.filter((w) => w.id !== workout.id);
            await OfflineStorageService.saveWorkouts([...filtered, workout]);
        } catch (err) {
            LogService.warn('Could not save workout to cache:', err);
        }
    },

    reconcileCachedSeries(data: RoutineDay, currentCached: RoutineDay[], workoutId: string): void {
        const existingCachedWorkout = currentCached.find((w) => w.id === workoutId);
        const cachedSeriesMap = new Map<string, Serie>();
        if (existingCachedWorkout?.ejercicios_programados) {
            existingCachedWorkout.ejercicios_programados.forEach((ex: ScheduledExercise) => {
                if (ex.series) {
                    ex.series.forEach((s: Serie) => {
                        if (s.id) cachedSeriesMap.set(s.id, s);
                    });
                }
            });
        }

        if (data?.ejercicios_programados) {
            data.ejercicios_programados.sort(
                (a: ScheduledExercise, b: ScheduledExercise) => (a.orden_ejecucion || 0) - (b.orden_ejecucion || 0)
            );

            data.ejercicios_programados.forEach((ex: ScheduledExercise) => {
                if (ex.series) {
                    ex.series.sort((a: Serie, b: Serie) => (a.numero_serie || 0) - (b.numero_serie || 0));

                    ex.series = ex.series.map((s: Serie) => {
                        const cachedSet = cachedSeriesMap.get(s.id);
                        const isCompleted = Boolean(
                            s.is_completed || s.completada || cachedSet?.is_completed || cachedSet?.completada
                        );
                        return {
                            ...s,
                            is_completed: isCompleted,
                            completada: isCompleted,
                            is_pr: Boolean(s.is_pr || cachedSet?.is_pr),
                            tipo_serie: s.tipo_serie || cachedSet?.tipo_serie || 'normal',
                            peso_utilizado: s.peso_utilizado !== undefined && s.peso_utilizado !== null
                                ? s.peso_utilizado
                                : (cachedSet?.peso_utilizado ?? 0),
                            repeticiones: s.repeticiones !== undefined && s.repeticiones !== null
                                ? s.repeticiones
                                : (cachedSet?.repeticiones ?? 0),
                            rpe: s.rpe !== undefined && s.rpe !== null ? s.rpe : cachedSet?.rpe,
                        };
                    });
                }
            });
        }
    },

    async enqueueAndCacheCompleteWorkout(workoutId: string, durationMinutes?: number, customEndTime?: string): Promise<ServiceResponse<RoutineDay>> {
        const endTimeIso = customEndTime || new Date().toISOString();
        await SyncService.enqueueOperation('WORKOUT_COMPLETE', { workoutId, durationMinutes, customEndTime: endTimeIso, timestamp: Date.now() });

        const cachedRes = await OfflineStorageService.getCachedWorkouts();
        const workouts = cachedRes.data || [];

        let updatedWorkout: RoutineDay | null = null;
        const updatedList = workouts.map((w) => {
            if (w.id === workoutId) {
                updatedWorkout = { ...w, completada: true, hora_fin: endTimeIso };
                return updatedWorkout;
            }
            return w;
        });

        if (updatedList.length > 0) {
            await OfflineStorageService.saveWorkouts(updatedList);
        }

        return {
            data: updatedWorkout || ({ id: workoutId, completada: true, hora_fin: endTimeIso } as unknown as RoutineDay),
            error: null,
        };
    },

    async updateCachedWorkoutOnComplete(workoutId: string, horaFin: string): Promise<void> {
        try {
            const cachedRes = await OfflineStorageService.getCachedWorkouts();
            const workouts = cachedRes.data || [];
            const updatedList = workouts.map((w) => (w.id === workoutId ? { ...w, completada: true, hora_fin: horaFin } : w));
            await OfflineStorageService.saveWorkouts(updatedList);
        } catch (err) {
            LogService.warn('Could not update cached workout on complete:', err);
        }
    },

    async enqueueAndCacheSetUpdate(setId: string, dbUpdates: SetUpdatePayload): Promise<ServiceResponse<Serie>> {
        await SyncService.enqueueOperation('SET_UPSERT', { setId, dbUpdates, timestamp: Date.now() });

        const mockSet: Serie = {
            id: setId,
            ejercicio_programado_id: 'offline-ex-id',
            numero_serie: dbUpdates.numero_serie || 1,
            peso_utilizado: dbUpdates.peso_utilizado || 0,
            repeticiones: dbUpdates.repeticiones || 0,
            rpe: dbUpdates.rpe,
            descanso_segundos: dbUpdates.descanso_segundos,
            tipo_serie: dbUpdates.tipo_serie || 'normal',
            is_completed: dbUpdates.is_completed ?? dbUpdates.completada ?? false,
            completada: dbUpdates.completada ?? dbUpdates.is_completed ?? false,
        };

        const cachedRes = await OfflineStorageService.getCachedWorkouts();
        const workouts = cachedRes.data || [];
        const updatedList = workouts.map((w) => {
            if (w.ejercicios_programados) {
                w.ejercicios_programados.forEach((ex) => {
                    if (ex.series) {
                        ex.series = ex.series.map((s) => (s.id === setId ? {
                            ...s,
                            ...dbUpdates,
                            is_completed: dbUpdates.is_completed ?? s.is_completed ?? false,
                            completada: dbUpdates.completada ?? dbUpdates.is_completed ?? s.completada ?? false,
                        } : s));
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

    async updateCachedWorkoutOnSetUpdate(setId: string, normalized: Serie | null, dbUpdates: SetUpdatePayload): Promise<void> {
        try {
            const cachedRes = await OfflineStorageService.getCachedWorkouts();
            const workouts = cachedRes.data || [];
            const updatedList = workouts.map((w) => {
                if (w.ejercicios_programados) {
                    w.ejercicios_programados.forEach((ex) => {
                        if (ex.series) {
                            ex.series = ex.series.map((s) => (s.id === setId ? { ...s, ...normalized, ...dbUpdates } : s));
                        }
                    });
                }
                return w;
            });
            await OfflineStorageService.saveWorkouts(updatedList);
        } catch (err) {
            LogService.warn('Could not update cached workout on set update:', err);
        }
    },

    async updateCachedWorkoutOnSwap(
        workoutId: string,
        programmedExerciseId: string,
        newExerciseId: string,
        newSetsCount: number,
        exerciseObj?: any
    ): Promise<void> {
        try {
            const cachedRes = await OfflineStorageService.getCachedWorkouts();
            const workouts = cachedRes.data || [];
            const updatedList = workouts.map((w) => {
                if (w.id === workoutId && w.ejercicios_programados) {
                    w.ejercicios_programados = w.ejercicios_programados.map((ep) => {
                        if (ep.id === programmedExerciseId) {
                            return {
                                ...ep,
                                ejercicio_id: newExerciseId,
                                ejercicio: exerciseObj || ep.ejercicio,
                                series: Array.from({ length: newSetsCount }, (_, i) => ({
                                    id: `temp-${Date.now()}-${i}`,
                                    ejercicio_programado_id: programmedExerciseId,
                                    numero_serie: i + 1,
                                    peso_utilizado: 0,
                                    repeticiones: 0,
                                })),
                            };
                        }
                        return ep;
                    });
                }
                return w;
            });
            await OfflineStorageService.saveWorkouts(updatedList);
        } catch (cacheErr) {
            LogService.warn('Could not update cache on swapExerciseInWorkout:', cacheErr);
        }
    },
};
