import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { WorkoutService } from '../services/WorkoutService';
import { RoutineService } from '../services/RoutineService';

export type WorkoutMode = 'ACTIVE' | 'VIEW' | 'MISSED' | 'PREVIEW' | 'PENDING';

interface Set {
    id: string;
    ejercicio_programado_id: string;
    numero_serie: number;
    repeticiones: number;
    peso_utilizado: number;
    pending?: boolean;
}

interface Exercise {
    id: string;
    titulo: string;
    routine_exercise_id: string;
    target_sets: number;
    sets: Set[];
    is_routine: boolean;
    grupo_muscular?: string;
    imagen_url?: string;
}

interface Workout {
    id: string;
    hora_inicio?: string;
    hora_fin?: string;
    completada?: boolean;
    descripcion?: string;
    fecha_dia?: string;
    nombre_dia?: string;
    ejercicios_programados?: any[];
}

export const useWorkoutController = (
    initialWorkoutId: string | null,
    routineDayId: string,
    userId: string,
    dayOfWeek: number,
    isEditingTemplate: boolean = false  // New param to allow editing in template/routine edit mode
) => {
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [mode, setMode] = useState<WorkoutMode>('ACTIVE');
    const [previousWorkout, setPreviousWorkout] = useState<any>(null);
    const timerInterval = useRef<NodeJS.Timeout | null>(null);

    const loadExercises = useCallback(async (rDayId: string, wId: string | null, prevWorkout?: any) => {
        let finalExercises: Exercise[] = [];

        if (wId) {
            const { data: workoutData } = await WorkoutService.getWorkoutDetails(wId);
            if (workoutData) {
                setWorkout(workoutData);
                if (workoutData.ejercicios_programados) {
                    finalExercises = workoutData.ejercicios_programados.map((ex: any) => ({
                        ...ex.ejercicio,
                        id: ex.ejercicio.id,
                        routine_exercise_id: ex.id,
                        target_sets: 3,
                        sets: ex.series || [],
                        is_routine: true,
                    }));
                }
            }
        } else {
            const { data: routineDay } = await RoutineService.getRoutineDayById(rDayId);
            if (routineDay) {
                setWorkout(routineDay as any);
                if (routineDay.ejercicios_programados) {
                    finalExercises = routineDay.ejercicios_programados.map((re: any) => {
                        // Use series from previous workout if available, otherwise use template's own series
                        let setsToUse: Set[] = re.series || [];
                        if (prevWorkout?.ejercicios_programados) {
                            const prevExercise = prevWorkout.ejercicios_programados.find(
                                (pe: any) => pe.ejercicio_id === re.ejercicio.id
                            );
                            if (prevExercise?.series && prevExercise.series.length > 0) {
                                setsToUse = prevExercise.series.map((s: any) => ({
                                    ...s,
                                    fromPrevious: true,
                                }));
                            }
                        }

                        return {
                            ...re.ejercicio,
                            id: re.ejercicio.id,
                            routine_exercise_id: re.id,
                            target_sets: 3,
                            sets: setsToUse,
                            is_routine: true,
                        };
                    });
                }
            }
        }

        setExercises(finalExercises);
    }, []);

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
                setPreviousWorkout(lastData);
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

            // PREVIEW mode: read directly from the template (no workout created)
            if (calculatedMode === 'PREVIEW' || calculatedMode === 'PENDING') {
                await loadExercises(routineDayId, null);
                setLoading(false);
                return;
            }

            // ACTIVE mode: find existing active workout
            if (!currentWorkoutId) {
                const { data: active } = await RoutineService.getActiveWorkout(userId, routineDayId);
                if (active) {
                    currentWorkoutId = active.id;
                } else {
                    // No active workout found — show preview
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
                        setWorkout({ ...workoutData, completada: true, hora_fin: new Date().toISOString() });
                        setMode('VIEW');
                    } else {
                        setWorkout(workoutData);
                        setTimer(diffSeconds > 0 ? diffSeconds : 0);
                        setIsTimerRunning(true);
                    }
                } else {
                    setWorkout(workoutData);
                }
            }

            await loadExercises(routineDayId, currentWorkoutId);
        } catch (error) {
            console.error('Error initializing workout:', error);
        } finally {
            setLoading(false);
        }
    }, [initialWorkoutId, routineDayId, userId, dayOfWeek, isEditingTemplate, loadExercises]);

    const startWorkout = async () => {
        setLoading(true);
        try {
            const now = new Date();

            // Create a new workout from the template (copies exercises + series)
            const { data: newWorkout } = await RoutineService.startDailyWorkout(
                routineDayId,
                now.toISOString(),
                now.toISOString()
            );

            if (!newWorkout) throw new Error('Failed to start workout');

            const { data: fullWorkout } = await WorkoutService.getWorkoutDetails(newWorkout.id);
            setWorkout(fullWorkout);
            setMode('ACTIVE');
            await loadExercises(routineDayId, newWorkout.id);
            setIsTimerRunning(true);
        } catch (error) {
            console.error('Error starting workout:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initWorkout();
        return () => stopTimer();
    }, [initWorkout]);

    useEffect(() => {
        if (isTimerRunning) {
            timerInterval.current = setInterval(() => {
                setTimer((prev) => prev + 1);
            }, 1000);
        } else {
            if (timerInterval.current) clearInterval(timerInterval.current);
        }
        return () => {
            if (timerInterval.current) clearInterval(timerInterval.current);
        };
    }, [isTimerRunning]);

    const stopTimer = () => {
        setIsTimerRunning(false);
        if (timerInterval.current) clearInterval(timerInterval.current);
    };

    // Load series for a specific exercise from backend and update only that exercise in local state
    const loadSeriesForExercise = useCallback(async (targetWorkoutId: string, exerciseId: string) => {
        const { data: series } = await WorkoutService.getSeriesForExercise(targetWorkoutId, exerciseId);
        if (series) {
            setExercises((prev) => {
                const updated = [...prev];
                const exIdx = updated.findIndex((e) => e.id === exerciseId);
                if (exIdx !== -1) {
                    updated[exIdx] = {
                        ...updated[exIdx],
                        sets: series as Set[],
                    };
                }
                return updated;
            });
        }
    }, []);

    const addSets = async (exerciseId: string, count: number) => {
        // Allow editing in ACTIVE, PREVIEW mode, or when editing a template/routine
        const canEdit = mode === 'ACTIVE' || mode === 'PREVIEW' || isEditingTemplate;
        if (!workout || !canEdit) return;

        const exerciseIndex = exercises.findIndex((e) => e.id === exerciseId);
        if (exerciseIndex === -1) return;

        try {
            const targetWorkoutId = workout.id;

            // Get actual current series count from backend to avoid duplicate numbers
            const { data: existingSeries } = await WorkoutService.getSeriesForExercise(targetWorkoutId, exerciseId);
            const currentCount = existingSeries?.length || 0;
            const lastSeries = existingSeries && existingSeries.length > 0 ? existingSeries[existingSeries.length - 1] : null;
            const baseRep = lastSeries ? lastSeries.repeticiones : 0;
            const baseWeight = lastSeries ? lastSeries.peso_utilizado : 0;

            // Create sets in backend on the current workout
            for (let i = 0; i < count; i++) {
                await WorkoutService.addSet(
                    targetWorkoutId,
                    exerciseId,
                    currentCount + 1 + i,
                    baseWeight,
                    baseRep
                );
            }

            // Backend ok → reload series for this exercise
            await loadSeriesForExercise(targetWorkoutId, exerciseId);
        } catch (error: any) {
            console.error('Failed to add sets', error);
            Alert.alert('Error Add Sets', JSON.stringify(error));
        }
    };

    const addSet = async (exerciseId: string) => {
        await addSets(exerciseId, 1);
    };

    const updateSet = async (setId: string, field: string, value: any) => {
        const canEdit = mode === 'ACTIVE' || mode === 'PREVIEW' || isEditingTemplate;
        if (!canEdit) return;

        let dbField = field;
        if (field === 'weight') dbField = 'peso_utilizado';
        if (field === 'reps') dbField = 'repeticiones';

        setExercises((prev) =>
            prev.map((ex) => ({
                ...ex,
                sets: ex.sets.map((s) => (s.id === setId ? { ...s, [dbField]: value } : s)),
            }))
        );

        try {
            const dbValue = value === '' || value === undefined ? null : value;
            await WorkoutService.updateSet(setId, { [field]: dbValue });
        } catch (error) {
            console.error('Failed to update set', error);
        }
    };

    const deleteSet = async (setId: string, exerciseId: string) => {
        const canEdit = mode === 'ACTIVE' || mode === 'PREVIEW' || isEditingTemplate;
        if (!canEdit) return;
        setExercises((prev) =>
            prev.map((ex) => {
                if (ex.id === exerciseId) {
                    return { ...ex, sets: ex.sets.filter((s) => s.id !== setId) };
                }
                return ex;
            })
        );

        try {
            await WorkoutService.deleteSet(setId);
        } catch (error) {
            console.error('Failed to delete set', error);
            if (workout) loadExercises(routineDayId, workout.id);
        }
    };

    const removeExercise = async (exerciseId: string, routineExerciseId: string) => {
        if (mode !== 'ACTIVE' && mode !== 'PREVIEW') return;
        setExercises((prev) => prev.filter((e) => e.id !== exerciseId));

        try {
            if (routineExerciseId) {
                await WorkoutService.removeExerciseFromRoutine(routineExerciseId);
            } else if (workout) {
                await WorkoutService.removeExerciseFromWorkout(workout.id, exerciseId);
            }
        } catch (error) {
            console.error('Failed to remove exercise', error);
            if (workout) loadExercises(routineDayId, workout.id);
        }
    };

    const addExercise = async (exerciseId: string) => {
        if (!workout || (mode !== 'ACTIVE' && mode !== 'PREVIEW')) return;

        try {
            await WorkoutService.addExerciseToWorkout(workout.id, exerciseId);
            loadExercises(routineDayId, workout.id);
        } catch (error) {
            console.error('Failed to add exercise', error);
        }
    };

    const finishWorkout = async () => {
        if (!workout || mode !== 'ACTIVE') return false;
        stopTimer();
        const durationMinutes = Math.floor(timer / 60);
        try {
            await WorkoutService.completeWorkout(workout.id, durationMinutes);
            return true;
        } catch (error) {
            console.error('Failed to finish workout', error);
            return false;
        }
    };

    return {
        workout,
        exercises,
        loading,
        timer,
        mode,
        previousWorkout,
        startWorkout,
        addSet,
        addSets,
        updateSet,
        deleteSet,
        removeExercise,
        addExercise,
        finishWorkout,
        loadSeriesForExercise,
        reloadExercises: () => loadExercises(routineDayId, workout?.id || null),
    };
};
