import { useState, useEffect } from 'react';
import { ExerciseService } from '../services/ExerciseService';

interface Exercise {
    id: string;
    titulo: string;
    musculos_primarios?: string;
    musculos_secundarios?: string;
    descripcion?: string;
    description?: string;
    url_video?: string;
    url_foto?: string;
    url_imagen?: string;
}

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
