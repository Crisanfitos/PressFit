import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { WorkoutService } from '../../services/WorkoutService';
import { RoutineService } from '../../services/RoutineService';
import { TipoPeso, SetType } from '../../types/setTypes';
import { validateRpe } from '../../utils/rpeValidation';
import { checkSetLimits } from '../../utils/setLimits';
import { RoutineDay, ScheduledExercise, Serie } from '../../types/models';

export interface Set {
    id: string;
    ejercicio_programado_id: string;
    numero_serie: number;
    repeticiones: number;
    peso_utilizado: number;
    rpe?: number;
    descanso_segundos?: number;
    tipo_serie?: SetType;
    is_completed?: boolean;
    completada?: boolean;
    is_pr?: boolean;
    pending?: boolean;
    fromPrevious?: boolean;
}

export interface Exercise {
    id: string;
    titulo: string;
    routine_exercise_id: string;
    target_sets: number;
    sets: Set[];
    is_routine: boolean;
    tipo_peso: TipoPeso;
    grupo_muscular?: string;
    imagen_url?: string;
}

export interface WorkoutData {
    id: string;
    rutina_semanal_id?: string;
    rutina_diaria_id?: string;
    nombre?: string;
    hora_inicio?: string;
    hora_fin?: string;
    completada?: boolean;
    descripcion_usuario?: string;
    descripcion?: string;
    fecha_dia?: string | null;
    nombre_dia?: string;
    ejercicios_programados?: ScheduledExercise[];
    rutina_semanal?: { usuario_id: string };
    isStale?: boolean;
    days_diff?: number;
}

export interface UseWorkoutSetsOptions {
    workout: WorkoutData | null;
    setWorkout: (w: WorkoutData | null) => void;
    mode: string;
    isEditingTemplate: boolean;
    routineDayId: string;
    onPrefetchPRs?: (exercises: Exercise[]) => Promise<void>;
    onCheckPR?: (
        targetEx: { id: string; titulo: string },
        targetSet: { id: string; peso_utilizado: number; repeticiones: number }
    ) => Promise<{ isPR: boolean; celebrationData: any }>;
}

export interface UseWorkoutSetsReturn {
    exercises: Exercise[];
    setExercises: React.Dispatch<React.SetStateAction<Exercise[]>>;
    previousWorkout: RoutineDay | null;
    setPreviousWorkout: React.Dispatch<React.SetStateAction<RoutineDay | null>>;
    loadExercises: (rDayId: string, wId: string | null, prevWorkout?: RoutineDay | null) => Promise<void>;
    loadSeriesForExercise: (targetWorkoutId: string, exerciseId: string) => Promise<void>;
    addSet: (exerciseId: string, setType?: SetType) => Promise<void>;
    addSets: (exerciseId: string, count?: number, setType?: SetType) => Promise<void>;
    updateSet: (setId: string, field: string, value: string | number | boolean | SetType | null) => Promise<void>;
    toggleCompleteSet: (setId: string, isCompleted: boolean) => Promise<void>;
    updateSetType: (setId: string, newType: SetType) => Promise<void>;
    deleteSet: (setId: string, exerciseId: string) => Promise<void>;
    removeExercise: (exerciseId: string, routineExerciseId: string) => Promise<void>;
    addExercise: (exerciseId: string) => Promise<void>;
    updateWeightType: (routineExerciseId: string, exerciseId: string, tipoPeso: TipoPeso) => Promise<void>;
    swapExercise: (
        oldRoutineExerciseId: string,
        newExercise: { id: string; titulo: string; grupo_muscular?: string; imagen_url?: string; tipo_peso?: TipoPeso },
        newSetsCount?: number
    ) => Promise<boolean>;
    reloadExercises: () => Promise<void>;
}

export const useWorkoutSets = ({
    workout,
    setWorkout,
    mode,
    isEditingTemplate,
    routineDayId,
    onPrefetchPRs,
    onCheckPR,
}: UseWorkoutSetsOptions): UseWorkoutSetsReturn => {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [previousWorkout, setPreviousWorkout] = useState<RoutineDay | null>(null);

    const loadExercises = useCallback(async (rDayId: string, wId: string | null, prevWorkout?: RoutineDay | null) => {
        let finalExercises: Exercise[] = [];

        if (prevWorkout !== undefined) {
            setPreviousWorkout(prevWorkout);
        }

        if (wId) {
            const { data: workoutData } = await WorkoutService.getWorkoutDetails(wId);
            if (workoutData) {
                setWorkout(workoutData);
                if (workoutData.ejercicios_programados) {
                    finalExercises = workoutData.ejercicios_programados.map((ex: ScheduledExercise) => ({
                        ...ex.ejercicio,
                        titulo: ex.ejercicio?.titulo || ex.ejercicio?.nombre || 'Ejercicio',
                        id: ex.ejercicio?.id || ex.ejercicio_id,
                        routine_exercise_id: ex.id,
                        target_sets: 3,
                        sets: (ex.series || []).map((s: Serie) => ({
                            ...s,
                            is_completed: Boolean(s.is_completed || s.completada),
                            completada: Boolean(s.is_completed || s.completada),
                            is_pr: Boolean(s.is_pr),
                        })),
                        is_routine: true,
                        tipo_peso: (ex.tipo_peso as TipoPeso) || 'total',
                    }));
                }
            }
        } else {
            const { data: routineDay } = await RoutineService.getRoutineDayById(rDayId);
            if (routineDay) {
                setWorkout(routineDay as unknown as WorkoutData);
                if (routineDay.ejercicios_programados) {
                    finalExercises = routineDay.ejercicios_programados.map((re: ScheduledExercise) => {
                        let setsToUse: Set[] = re.series || [];
                        if (prevWorkout?.ejercicios_programados) {
                            const prevExercise = prevWorkout.ejercicios_programados.find(
                                (pe: ScheduledExercise) => pe.ejercicio_id === re.ejercicio?.id || pe.ejercicio_id === re.ejercicio_id
                            );
                            if (prevExercise?.series && prevExercise.series.length > 0) {
                                setsToUse = prevExercise.series.map((s: Serie) => ({
                                    ...s,
                                    fromPrevious: true,
                                }));
                            }
                        }

                        return {
                            ...re.ejercicio,
                            titulo: re.ejercicio?.titulo || re.ejercicio?.nombre || 'Ejercicio',
                            id: re.ejercicio?.id || re.ejercicio_id,
                            routine_exercise_id: re.id,
                            target_sets: 3,
                            sets: setsToUse,
                            is_routine: true,
                            tipo_peso: (re.tipo_peso as TipoPeso) || 'total',
                        };
                    });
                }
            }
        }

        setExercises(finalExercises);
        if (onPrefetchPRs) {
            onPrefetchPRs(finalExercises);
        }
    }, [setWorkout, onPrefetchPRs]);

    const loadSeriesForExercise = useCallback(async (targetWorkoutId: string, exerciseId: string) => {
        const { data: series } = await WorkoutService.getSeriesForExercise(targetWorkoutId, exerciseId);
        if (series) {
            setExercises((prev) => {
                const updated = [...prev];
                const exIdx = updated.findIndex((e) => e.id === exerciseId);
                if (exIdx !== -1) {
                    updated[exIdx] = {
                        ...updated[exIdx],
                        sets: (series as Set[]).map((s) => ({
                            ...s,
                            tipo_serie: s.tipo_serie || 'normal',
                        })),
                    };
                }
                return updated;
            });
        }
    }, []);

    const addSets = async (exerciseId: string, count: number = 1, setType: SetType = 'normal') => {
        const canEdit = mode === 'ACTIVE' || mode === 'PREVIEW' || isEditingTemplate;
        if (!workout || !canEdit) return;

        const exerciseIndex = exercises.findIndex((e) => e.id === exerciseId);
        if (exerciseIndex === -1) return;

        const exercise = exercises[exerciseIndex];
        const currentSets = exercise.sets || [];

        const limitValidation = checkSetLimits(currentSets, count, setType);
        if (!limitValidation.allowed) {
            Alert.alert('Límite de series', limitValidation.reason || 'No se pueden añadir más series.');
            return;
        }

        try {
            const targetWorkoutId = workout.id;
            const { data: existingSeries } = await WorkoutService.getSeriesForExercise(targetWorkoutId, exerciseId);
            const currentCount = existingSeries?.length || 0;
            const lastSeries = existingSeries && existingSeries.length > 0 ? existingSeries[existingSeries.length - 1] : null;
            const baseRep = lastSeries ? lastSeries.repeticiones : 0;
            const baseWeight = lastSeries ? lastSeries.peso_utilizado : 0;

            for (let i = 0; i < count; i++) {
                if (setType && setType !== 'normal') {
                    await WorkoutService.addSet(
                        targetWorkoutId,
                        exerciseId,
                        currentCount + 1 + i,
                        baseWeight,
                        baseRep,
                        setType
                    );
                } else {
                    await WorkoutService.addSet(
                        targetWorkoutId,
                        exerciseId,
                        currentCount + 1 + i,
                        baseWeight,
                        baseRep
                    );
                }
            }

            await loadSeriesForExercise(targetWorkoutId, exerciseId);
        } catch (error: unknown) {
            console.error('Failed to add sets', error);
            Alert.alert('Error Add Sets', String(error));
        }
    };

    const addSet = async (exerciseId: string, setType: SetType = 'normal') => {
        await addSets(exerciseId, 1, setType);
    };

    const updateSet = async (setId: string, field: string, value: string | number | boolean | SetType | null) => {
        const canEdit = mode === 'ACTIVE' || mode === 'PREVIEW' || isEditingTemplate;
        if (!canEdit) return;

        let dbField = field;
        if (field === 'weight') dbField = 'peso_utilizado';
        if (field === 'reps') dbField = 'repeticiones';
        if (field === 'setType' || field === 'tipo_serie') dbField = 'tipo_serie';
        if (field === 'is_completed' || field === 'completada') dbField = 'is_completed';

        let processedValue = value;
        let dbValue: string | number | boolean | SetType | null = value === '' || value === undefined ? null : value;

        if (field === 'rpe') {
            const validation = validateRpe(value);
            processedValue = validation.value;
            dbValue = validation.value;
        }

        if (field === 'setType' || field === 'tipo_serie') {
            processedValue = value as SetType;
            dbValue = value as SetType;
        }

        if (field === 'is_completed' || field === 'completada') {
            const boolVal = Boolean(value === true || value === 'true');
            processedValue = boolVal;
            dbValue = boolVal;
        }

        setExercises((prev) =>
            prev.map((ex) => ({
                ...ex,
                sets: ex.sets.map((s) => (s.id === setId ? {
                    ...s,
                    [dbField]: processedValue ?? undefined,
                    ...(dbField === 'is_completed' ? { is_completed: Boolean(processedValue), completada: Boolean(processedValue) } : {})
                } : s)),
            }))
        );

        try {
            const updatesPayload: Parameters<typeof WorkoutService.updateSet>[1] = (field === 'setType' || field === 'tipo_serie')
                ? { tipo_serie: dbValue as SetType }
                : (field === 'is_completed' || field === 'completada')
                    ? { is_completed: Boolean(dbValue), completada: Boolean(dbValue) }
                    : { [field]: dbValue as number };
            await WorkoutService.updateSet(setId, updatesPayload);
        } catch (error) {
            console.error('Failed to update set', error);
        }
    };

    const toggleCompleteSet = async (setId: string, isCompleted: boolean) => {
        const canEdit = mode === 'ACTIVE' || mode === 'PREVIEW' || isEditingTemplate;
        if (!canEdit) return;

        let isPR = false;

        if (isCompleted && onCheckPR) {
            let targetEx: Exercise | undefined;
            let targetSet: Set | undefined;

            for (const ex of exercises) {
                const s = ex.sets.find((item) => item.id === setId);
                if (s) {
                    targetEx = ex;
                    targetSet = s;
                    break;
                }
            }

            if (targetEx && targetSet) {
                const prResult = await onCheckPR(
                    { id: targetEx.id, titulo: targetEx.titulo },
                    { id: targetSet.id, peso_utilizado: targetSet.peso_utilizado, repeticiones: targetSet.repeticiones }
                );
                isPR = prResult.isPR;
            }
        }

        setExercises((prev) =>
            prev.map((ex) => ({
                ...ex,
                sets: ex.sets.map((s) => (s.id === setId ? {
                    ...s,
                    is_completed: isCompleted,
                    completada: isCompleted,
                    is_pr: isCompleted ? (isPR || s.is_pr) : false,
                } : s)),
            }))
        );

        try {
            await WorkoutService.updateSet(setId, {
                is_completed: isCompleted,
                completada: isCompleted,
                is_pr: isCompleted ? isPR : false,
            });
        } catch (error) {
            console.error('Failed to toggle set completion', error);
        }
    };

    const updateSetType = async (setId: string, newType: SetType) => {
        const canEdit = mode === 'ACTIVE' || mode === 'PREVIEW' || isEditingTemplate;
        if (!canEdit) return;

        setExercises((prev) =>
            prev.map((ex) => ({
                ...ex,
                sets: ex.sets.map((s) => (s.id === setId ? { ...s, tipo_serie: newType } : s)),
            }))
        );

        try {
            await WorkoutService.updateSet(setId, { tipo_serie: newType });
        } catch (error) {
            console.error('Failed to update set type', error);
        }
    };

    const deleteSet = async (setId: string, exerciseId: string) => {
        const canEdit = mode === 'ACTIVE' || mode === 'PREVIEW' || isEditingTemplate;
        if (!canEdit) return;

        const targetExercise = exercises.find(
            (e) => e.id === exerciseId || e.routine_exercise_id === exerciseId
        );
        const originalSets = targetExercise?.sets || [];
        const filtered = originalSets.filter((s) => s.id !== setId);
        const renumberedSets = filtered.map((s, index) => ({
            ...s,
            numero_serie: index + 1,
        }));

        setExercises((prev) =>
            prev.map((ex) => {
                if (ex.id === exerciseId || ex.routine_exercise_id === exerciseId) {
                    return { ...ex, sets: renumberedSets };
                }
                return ex;
            })
        );

        try {
            await WorkoutService.deleteSet(setId);
            for (const s of renumberedSets) {
                const prev = originalSets.find((os) => os.id === s.id);
                if (prev && prev.numero_serie !== s.numero_serie && s.id && !s.id.startsWith('temp-')) {
                    await WorkoutService.updateSet(s.id, { numero_serie: s.numero_serie });
                }
            }
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

    const updateWeightType = async (routineExerciseId: string, exerciseId: string, tipoPeso: TipoPeso) => {
        const canEdit = mode === 'ACTIVE' || mode === 'PREVIEW' || isEditingTemplate;
        if (!canEdit) return;

        setExercises((prev) =>
            prev.map((ex) =>
                ex.id === exerciseId && ex.routine_exercise_id === routineExerciseId
                    ? { ...ex, tipo_peso: tipoPeso }
                    : ex
            )
        );

        try {
            await WorkoutService.updateWeightType(routineExerciseId, tipoPeso);
        } catch (error) {
            console.error('Failed to update weight type', error);
            if (workout) loadExercises(routineDayId, workout.id);
        }
    };

    const swapExercise = async (
        oldRoutineExerciseId: string,
        newExercise: { id: string; titulo: string; grupo_muscular?: string; imagen_url?: string; tipo_peso?: TipoPeso },
        newSetsCount: number = 3
    ) => {
        if (!workout) return false;

        try {
            setExercises((prev) =>
                prev.map((ex) => {
                    if (ex.routine_exercise_id === oldRoutineExerciseId || ex.id === oldRoutineExerciseId) {
                        return {
                            ...ex,
                            id: newExercise.id,
                            titulo: newExercise.titulo,
                            grupo_muscular: newExercise.grupo_muscular || ex.grupo_muscular,
                            imagen_url: newExercise.imagen_url || ex.imagen_url,
                            tipo_peso: newExercise.tipo_peso || ex.tipo_peso || 'total',
                            target_sets: newSetsCount,
                            sets: Array.from({ length: newSetsCount }, (_, i) => ({
                                id: `temp-${Date.now()}-${i}`,
                                ejercicio_programado_id: oldRoutineExerciseId,
                                numero_serie: i + 1,
                                peso_utilizado: 0,
                                repeticiones: 0,
                            })),
                        };
                    }
                    return ex;
                })
            );

            const res = await WorkoutService.swapExerciseInWorkout(
                workout.id,
                oldRoutineExerciseId,
                newExercise.id,
                newSetsCount
            );

            await loadExercises(routineDayId, workout.id);
            return !res.error;
        } catch (error) {
            console.error('Failed to swap exercise in controller:', error);
            if (workout) await loadExercises(routineDayId, workout.id);
            return false;
        }
    };

    const reloadExercises = useCallback(async () => {
        await loadExercises(routineDayId, workout?.id || null);
    }, [loadExercises, routineDayId, workout?.id]);

    return {
        exercises,
        setExercises,
        previousWorkout,
        setPreviousWorkout,
        loadExercises,
        loadSeriesForExercise,
        addSet,
        addSets,
        updateSet,
        toggleCompleteSet,
        updateSetType,
        deleteSet,
        removeExercise,
        addExercise,
        updateWeightType,
        swapExercise,
        reloadExercises,
    };
};
