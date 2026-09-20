import { useState, useCallback } from 'react';
import { WorkoutService } from '../../services/WorkoutService';
import { RoutineService } from '../../services/RoutineService';
import { LogService } from '../../services/LogService';
import { clearActiveWorkoutParams, saveActiveWorkoutParams } from '../../services/TimerNotificationService';
import { RoutineDay } from '../../types/models';
import { WorkoutData } from './useWorkoutSets';

export type WorkoutMode = 'ACTIVE' | 'VIEW' | 'MISSED' | 'PREVIEW' | 'PENDING';

export interface UseWorkoutModeOptions {
    initialWorkoutId: string | null;
    routineDayId: string;
    userId: string;
    dayOfWeek: number;
    isEditingTemplate: boolean;
    loadExercises: (rDayId: string, wId: string | null, prevWorkout?: RoutineDay | null) => Promise<void>;
    timer: number;
    setTimer: React.Dispatch<React.SetStateAction<number>>;
    setIsTimerRunning: React.Dispatch<React.SetStateAction<boolean>>;
    stopTimer: () => void;
}

export interface UseWorkoutModeReturn {
    workout: WorkoutData | null;
    setWorkout: React.Dispatch<React.SetStateAction<WorkoutData | null>>;
    mode: WorkoutMode;
    setMode: React.Dispatch<React.SetStateAction<WorkoutMode>>;
    loading: boolean;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    initWorkout: () => Promise<void>;
    startWorkout: () => Promise<void>;
    finishWorkout: () => Promise<boolean>;
}

export const useWorkoutMode = ({
    initialWorkoutId,
    routineDayId,
    userId,
    dayOfWeek,
    isEditingTemplate,
    loadExercises,
    timer,
    setTimer,
    setIsTimerRunning,
    stopTimer,
}: UseWorkoutModeOptions): UseWorkoutModeReturn => {
    const [workout, setWorkout] = useState<WorkoutData | null>(null);
    const [mode, setMode] = useState<WorkoutMode>('ACTIVE');
    const [loading, setLoading] = useState<boolean>(true);

    const initWorkout = useCallback(async () => {
        setLoading(true);
        try {
            const today = new Date().getDay();
            const adjustDay = (d: number) => (d === 0 ? 6 : d - 1);
            const currentDayAdjusted = adjustDay(today);
            const targetDayAdjusted = adjustDay(dayOfWeek);

            let calculatedMode: WorkoutMode = 'ACTIVE';

            if (targetDayAdjusted < currentDayAdjusted) {
                if (initialWorkoutId) {
                    calculatedMode = 'VIEW';
                } else {
                    const { data: stats } = await RoutineService.getWorkoutStatsForRoutineDay(userId, routineDayId);
                    calculatedMode = stats?.exerciseCount && stats.exerciseCount > 0 ? 'VIEW' : 'MISSED';
                }
            } else if (targetDayAdjusted > currentDayAdjusted) {
                calculatedMode = 'PENDING';
            } else {
                if (initialWorkoutId) {
                    calculatedMode = 'ACTIVE';
                } else {
                    const { data: active } = await RoutineService.getActiveWorkout(userId, routineDayId);
                    calculatedMode = active ? 'ACTIVE' : 'PREVIEW';
                }
            }

            setMode(calculatedMode);
            let currentWorkoutId = initialWorkoutId;

            if (calculatedMode === 'MISSED') {
                const { data: lastData } = await WorkoutService.getLastCompletedWorkoutForDay(userId, routineDayId);
                await loadExercises(routineDayId, null, lastData);
                setLoading(false);
                return;
            }

            if (calculatedMode === 'VIEW') {
                if (currentWorkoutId) {
                    const { data: workoutData } = await WorkoutService.getWorkoutDetails(currentWorkoutId);
                    setWorkout(workoutData);
                    await loadExercises(routineDayId, currentWorkoutId);
                }
                setLoading(false);
                return;
            }

            if (calculatedMode === 'PREVIEW' || calculatedMode === 'PENDING') {
                await loadExercises(routineDayId, null);
                setLoading(false);
                return;
            }

            if (!currentWorkoutId) {
                const { data: active } = await RoutineService.getActiveWorkout(userId, routineDayId);
                if (active) {
                    currentWorkoutId = active.id;
                } else {
                    setMode('PREVIEW');
                    await loadExercises(routineDayId, null);
                    setLoading(false);
                    return;
                }
            }

            if (currentWorkoutId) {
                const { data: workoutData } = await WorkoutService.getWorkoutDetails(currentWorkoutId);

                if (workoutData?.hora_inicio && !workoutData.completada) {
                    const start = new Date(workoutData.hora_inicio);
                    const now = new Date();
                    const diffSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);

                    if (diffSeconds > 10800) {
                        await WorkoutService.completeWorkout(currentWorkoutId, Math.floor(diffSeconds / 60));
                        await clearActiveWorkoutParams();
                        setWorkout({ ...workoutData, completada: true, hora_fin: new Date().toISOString() });
                        setMode('VIEW');
                    } else {
                        setWorkout(workoutData);
                        setTimer(diffSeconds > 0 ? diffSeconds : 0);
                        setIsTimerRunning(true);
                    }
                } else {
                    setWorkout(workoutData);
                    if (workoutData?.completada) {
                        setMode('VIEW');
                    }
                }
            }

            if (calculatedMode === 'ACTIVE') {
                const { data: prevData } = await WorkoutService.getLastCompletedWorkoutForDay(userId, routineDayId);
                let ghostSource = prevData;
                if (!ghostSource) {
                    const { data: templateDay } = await RoutineService.getRoutineDayById(routineDayId);
                    ghostSource = templateDay;
                }
                await loadExercises(routineDayId, currentWorkoutId, ghostSource);
            } else {
                await loadExercises(routineDayId, currentWorkoutId);
            }
        } catch (error) {
            LogService.error('Error initializing workout:', error);
        } finally {
            setLoading(false);
        }
    }, [initialWorkoutId, routineDayId, userId, dayOfWeek, isEditingTemplate, loadExercises, setTimer, setIsTimerRunning]);

    const startWorkout = async () => {
        setLoading(true);
        try {
            const now = new Date();

            const { data: prevData } = await WorkoutService.getLastCompletedWorkoutForDay(userId, routineDayId);

            let ghostSource = prevData;
            if (!ghostSource) {
                const { data: templateDay } = await RoutineService.getRoutineDayById(routineDayId);
                ghostSource = templateDay;
            }

            const { data: newWorkout } = await RoutineService.startDailyWorkout(
                routineDayId,
                now.toISOString(),
                now.toISOString()
            );

            if (!newWorkout) throw new Error('Failed to start workout');

            const { data: fullWorkout } = await WorkoutService.getWorkoutDetails(newWorkout.id);
            setWorkout(fullWorkout);
            setMode('ACTIVE');
            await saveActiveWorkoutParams({
                routineDayId,
                workoutId: newWorkout.id,
                dayName: fullWorkout?.nombre_dia,
                dayOfWeek,
                mode: 'ACTIVE',
            });

            await loadExercises(routineDayId, newWorkout.id, ghostSource);
            setIsTimerRunning(true);
        } catch (error) {
            LogService.error('Error starting workout:', error);
        } finally {
            setLoading(false);
        }
    };

    const finishWorkout = async () => {
        if (!workout || mode !== 'ACTIVE') return false;
        stopTimer();
        const durationMinutes = Math.floor(timer / 60);
        try {
            await WorkoutService.completeWorkout(workout.id, durationMinutes);
            await clearActiveWorkoutParams();
            return true;
        } catch (error) {
            LogService.error('Failed to finish workout', error);
            return false;
        }
    };

    return {
        workout,
        setWorkout,
        mode,
        setMode,
        loading,
        setLoading,
        initWorkout,
        startWorkout,
        finishWorkout,
    };
};
