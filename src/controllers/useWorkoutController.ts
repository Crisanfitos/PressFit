import { useEffect, useRef, useCallback } from 'react';
import { useWorkoutTimer } from '../hooks/workout/useWorkoutTimer';
import { useWorkoutPR, ActivePRCelebration } from '../hooks/workout/useWorkoutPR';
import { useWorkoutSets, Set, Exercise, WorkoutData } from '../hooks/workout/useWorkoutSets';
import { useWorkoutMode, WorkoutMode } from '../hooks/workout/useWorkoutMode';
import { RoutineDay } from '../types/models';

export type { WorkoutMode, ActivePRCelebration, Set, Exercise, WorkoutData };

export const useWorkoutController = (
    initialWorkoutId: string | null,
    routineDayId: string,
    userId: string,
    dayOfWeek: number,
    isEditingTemplate: boolean = false
) => {
    const timerHook = useWorkoutTimer();
    const prHook = useWorkoutPR(userId);

    const loadExercisesRef = useRef<((rDayId: string, wId: string | null, prevWorkout?: RoutineDay | null) => Promise<void>) | null>(null);

    const loadExercisesProxy = useCallback(async (rDayId: string, wId: string | null, prevWorkout?: RoutineDay | null) => {
        if (loadExercisesRef.current) {
            await loadExercisesRef.current(rDayId, wId, prevWorkout);
        }
    }, []);

    const modeHook = useWorkoutMode({
        initialWorkoutId,
        routineDayId,
        userId,
        dayOfWeek,
        isEditingTemplate,
        loadExercises: loadExercisesProxy,
        timer: timerHook.timer,
        setTimer: timerHook.setTimer,
        setIsTimerRunning: timerHook.setIsTimerRunning,
        stopTimer: timerHook.stopTimer,
    });

    const setsHook = useWorkoutSets({
        workout: modeHook.workout,
        setWorkout: modeHook.setWorkout,
        mode: modeHook.mode,
        isEditingTemplate,
        routineDayId,
        onPrefetchPRs: prHook.prefetchPRs,
        onCheckPR: prHook.checkAndCelebratePR,
    });

    loadExercisesRef.current = setsHook.loadExercises;

    const { initWorkout } = modeHook;
    const { stopTimer } = timerHook;

    useEffect(() => {
        initWorkout();
        return () => stopTimer();
    }, [initWorkout, stopTimer]);

    return {
        workout: modeHook.workout,
        exercises: setsHook.exercises,
        loading: modeHook.loading,
        timer: timerHook.timer,
        mode: modeHook.mode,
        previousWorkout: setsHook.previousWorkout,
        startWorkout: modeHook.startWorkout,
        addSet: setsHook.addSet,
        addSets: setsHook.addSets,
        updateSet: setsHook.updateSet,
        updateSetType: setsHook.updateSetType,
        toggleCompleteSet: setsHook.toggleCompleteSet,
        deleteSet: setsHook.deleteSet,
        removeExercise: setsHook.removeExercise,
        addExercise: setsHook.addExercise,
        swapExercise: setsHook.swapExercise,
        finishWorkout: modeHook.finishWorkout,
        updateWeightType: setsHook.updateWeightType,
        loadSeriesForExercise: setsHook.loadSeriesForExercise,
        activePRCelebration: prHook.activePRCelebration,
        dismissPRCelebration: prHook.dismissPRCelebration,
        reloadExercises: setsHook.reloadExercises,
    };
};
