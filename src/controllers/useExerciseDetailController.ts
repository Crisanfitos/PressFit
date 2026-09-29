import { useState, useEffect, useCallback } from 'react';
import { ExerciseService, Exercise } from '../services/ExerciseService';

export const useExerciseDetailController = (exerciseId: string | undefined) => {
    const [exercise, setExercise] = useState<Exercise | null>(null);
    const [loading, setLoading] = useState(true);

    const refetch = useCallback(async () => {
        if (!exerciseId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const { data } = await ExerciseService.getExerciseById(exerciseId);
        if (data) {
            setExercise(data);
        }
        setLoading(false);
    }, [exerciseId]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return {
        exercise,
        loading,
        refetch,
    };
};
