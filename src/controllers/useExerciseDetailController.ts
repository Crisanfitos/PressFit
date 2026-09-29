import { useState, useEffect } from 'react';
import { ExerciseService, Exercise } from '../services/ExerciseService';

export const useExerciseDetailController = (exerciseId: string | undefined) => {
    const [exercise, setExercise] = useState<Exercise | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!exerciseId) {
            setLoading(false);
            return;
        }

        const loadExercise = async () => {
            setLoading(true);
            const { data } = await ExerciseService.getExerciseById(exerciseId);
            if (data) {
                setExercise(data);
            }
            setLoading(false);
        };

        loadExercise();
    }, [exerciseId]);

    return {
        exercise,
        loading,
    };
};
