import { getActiveWorkoutParams, clearActiveWorkoutParams, cancelTimerNotification } from './TimerNotificationService';
import { WorkoutService } from './WorkoutService';

export interface RecoverySession {
    workoutId: string;
    routineDayId: string;
    dayName: string;
    dayOfWeek: number;
    startTime: string;
    elapsedMinutes: number;
    exerciseCount: number;
    completedSetsCount: number;
    totalSetsCount: number;
}

export const WorkoutRecoveryService = {
    /**
     * Inspects local storage to detect if an active workout was left uncompleted.
     * Returns RecoverySession data if a valid active session is found, or null otherwise.
     */
    async checkPendingWorkoutSession(): Promise<RecoverySession | null> {
        try {
            const params = await getActiveWorkoutParams();
            if (!params || !params.workoutId) {
                return null;
            }

            if (params.mode && params.mode !== 'ACTIVE') {
                return null;
            }

            const { data: workout } = await WorkoutService.getWorkoutDetails(params.workoutId);
            if (!workout || workout.completada) {
                await clearActiveWorkoutParams();
                return null;
            }

            const startTime = workout.hora_inicio || params.startTime;
            let elapsedMinutes = 0;
            if (startTime) {
                const start = new Date(startTime).getTime();
                const now = Date.now();
                const diffSeconds = Math.floor((now - start) / 1000);

                // Threshold: If workout was started > 12 hours ago (43200s), treat as expired/abandoned
                if (diffSeconds > 43200) {
                    await clearActiveWorkoutParams();
                    return null;
                }
                elapsedMinutes = Math.max(0, Math.floor(diffSeconds / 60));
            }

            let exerciseCount = 0;
            let completedSetsCount = 0;
            let totalSetsCount = 0;

            if (workout.ejercicios_programados && Array.isArray(workout.ejercicios_programados)) {
                exerciseCount = workout.ejercicios_programados.length;
                for (const ep of workout.ejercicios_programados) {
                    if (ep.series && Array.isArray(ep.series)) {
                        totalSetsCount += ep.series.length;
                        for (const s of ep.series) {
                            if (Boolean(s.is_completed ?? s.completada) || (s.repeticiones && s.repeticiones > 0) || (s.peso_utilizado && s.peso_utilizado > 0)) {
                                completedSetsCount++;
                            }
                        }
                    }
                }
            }

            return {
                workoutId: params.workoutId,
                routineDayId: params.routineDayId || workout.rutina_diaria_id || '',
                dayName: params.dayName || workout.nombre_dia || 'Entrenamiento',
                dayOfWeek: params.dayOfWeek ?? (new Date().getDay() === 0 ? 7 : new Date().getDay()),
                startTime: startTime || new Date().toISOString(),
                elapsedMinutes,
                exerciseCount,
                completedSetsCount,
                totalSetsCount,
            };
        } catch (error) {
            console.error('Error checking pending workout session:', error);
            return null;
        }
    },

    /**
     * Clears local active session parameters and cancels any associated rest timer notifications.
     */
    async discardRecoverySession(): Promise<void> {
        try {
            await clearActiveWorkoutParams();
            await Promise.resolve(cancelTimerNotification()).catch(() => {});
        } catch (error) {
            console.error('Error discarding recovery session:', error);
        }
    },
};
