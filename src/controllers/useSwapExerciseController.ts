import { useState, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useExerciseController, Exercise } from './useExerciseController';
import { WorkoutService } from '../services/WorkoutService';
import { LogService } from '../services/LogService';

export interface OldExerciseData {
    id: string;
    titulo: string;
    routine_exercise_id: string;
    target_sets?: number;
    sets?: any[];
    series?: any[];
    grupo_muscular?: string;
    tipo_peso?: any;
    imagen_url?: string;
}

export interface UseSwapExerciseControllerProps {
    workoutId: string;
    oldExercise: OldExerciseData;
    navigation?: any;
}

export const useSwapExerciseController = ({
    workoutId,
    oldExercise,
    navigation,
}: UseSwapExerciseControllerProps) => {
    const { t } = useTranslation();

    const initialSetsCount = useMemo(() => {
        const currentSets =
            oldExercise?.sets?.length ||
            oldExercise?.series?.length ||
            oldExercise?.target_sets ||
            3;
        return Math.max(1, Math.min(10, currentSets));
    }, [oldExercise]);

    const [step, setStep] = useState<1 | 2>(1);
    const [selectedCandidate, setSelectedCandidate] = useState<Exercise | null>(null);
    const [setsCount, setSetsCount] = useState<number>(initialSetsCount);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        exercises,
        loading,
        searchQuery,
        setSearchQuery,
        filters,
        setFilter,
        clearFilter,
        filterOptions,
    } = useExerciseController(undefined, undefined);

    const handleSelectExercise = useCallback((exercise: Exercise) => {
        setSelectedCandidate((prev) => (prev?.id === exercise.id ? null : exercise));
    }, []);

    const handleContinueToStep2 = useCallback(() => {
        if (!selectedCandidate) return;
        setStep(2);
    }, [selectedCandidate]);

    const handleBack = useCallback(() => {
        if (step === 2) {
            setStep(1);
        } else if (navigation?.goBack) {
            navigation.goBack();
        }
    }, [step, navigation]);

    const handleIncrementSets = useCallback(() => {
        setSetsCount((prev) => Math.min(10, prev + 1));
    }, []);

    const handleDecrementSets = useCallback(() => {
        setSetsCount((prev) => Math.max(1, prev - 1));
    }, []);

    const handleFinalizeSwap = useCallback(async () => {
        if (!selectedCandidate || !oldExercise?.routine_exercise_id || !workoutId) {
            Alert.alert(
                t('common.error', 'Error'),
                t('swapExercise.missingDataError', 'Faltan datos necesarios para realizar el intercambio.')
            );
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await WorkoutService.swapExerciseInWorkout(
                workoutId,
                oldExercise.routine_exercise_id,
                selectedCandidate.id,
                setsCount
            );

            if (res.error) {
                Alert.alert(
                    t('common.error', 'Error'),
                    t('swapExercise.swapError', 'No se pudo intercambiar el ejercicio. Inténtalo de nuevo.')
                );
                setIsSubmitting(false);
                return;
            }

            // Successfully swapped
            if (navigation?.goBack) {
                navigation.goBack();
            }
        } catch (err) {
            LogService.error('Error swapping exercise:', err);
            Alert.alert(
                t('common.error', 'Error'),
                t('swapExercise.unexpectedError', 'Ocurrió un fallo inesperado al intercambiar el ejercicio.')
            );
            setIsSubmitting(false);
        }
    }, [selectedCandidate, oldExercise, workoutId, setsCount, navigation, t]);

    return {
        step,
        setStep,
        selectedCandidate,
        setsCount,
        initialSetsCount,
        isSubmitting,
        exercises,
        loading,
        searchQuery,
        setSearchQuery,
        filters,
        setFilter,
        clearFilter,
        filterOptions,
        handleSelectExercise,
        handleContinueToStep2,
        handleBack,
        handleIncrementSets,
        handleDecrementSets,
        handleFinalizeSwap,
    };
};

export default useSwapExerciseController;
