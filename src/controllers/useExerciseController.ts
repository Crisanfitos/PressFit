import { useState, useEffect, useCallback, useMemo } from 'react';
import { ExerciseService } from '../services/ExerciseService';

interface Exercise {
    id: string;
    titulo: string;
    musculos_primarios?: string | string[];
    musculos_secundarios?: string;
    descripcion?: string;
    url_video?: string;
    imagen_url?: string;
}

export const useExerciseController = (routineDayId: string | undefined, userId: string | undefined) => {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
    const [selectedExercises, setSelectedExercises] = useState<string[]>([]);

    const fetchExercises = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await ExerciseService.getExercises();
            setExercises(data || []);
        } catch (error) {
            console.error('Error fetching exercises:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchExercises();
    }, [fetchExercises]);

    const muscleGroups = useMemo(() => {
        if (!exercises.length) return [];

        const allGroups = new Set<string>();
        exercises.forEach((ex) => {
            const raw = ex.musculos_primarios;
            if (raw) {
                if (Array.isArray(raw)) {
                    raw.forEach((g) => {
                        if (g) allGroups.add(g.trim());
                    });
                } else if (typeof raw === 'string') {
                    raw
                        .split(',')
                        .map((g) => g.trim())
                        .forEach((g) => {
                            if (g) allGroups.add(g);
                        });
                }
            }
        });
        return [...allGroups].sort();
    }, [exercises]);

    const filteredExercises = useMemo(() => {
        let filtered = exercises;

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter((ex) => ex.titulo.toLowerCase().includes(lowerQuery));
        } else if (selectedMuscleGroup && selectedMuscleGroup !== '__ALL__') {
            filtered = filtered.filter((ex) => {
                if (!ex.musculos_primarios) return false;
                if (Array.isArray(ex.musculos_primarios)) {
                    return ex.musculos_primarios.includes(selectedMuscleGroup);
                }
                return ex.musculos_primarios.includes(selectedMuscleGroup);
            });
        }

        return [...filtered].sort((a, b) => a.titulo.localeCompare(b.titulo));
    }, [exercises, searchQuery, selectedMuscleGroup]);

    const toggleSelection = useCallback((exerciseId: string) => {
        setSelectedExercises((prev) => {
            if (prev.includes(exerciseId)) {
                return prev.filter((id) => id !== exerciseId);
            } else {
                return [...prev, exerciseId];
            }
        });
    }, []);

    const saveSelection = async () => {
        if (selectedExercises.length === 0 || !routineDayId || !userId) return false;

        setSaving(true);
        try {
            const { error } = await ExerciseService.addExercisesToRoutineDay(userId, routineDayId, selectedExercises);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error saving selection:', error);
            return false;
        } finally {
            setSaving(false);
        }
    };

    return {
        exercises: filteredExercises,
        loading,
        saving,
        searchQuery,
        setSearchQuery,
        selectedMuscleGroup,
        setSelectedMuscleGroup,
        selectedExercises,
        toggleSelection,
        saveSelection,
        muscleGroups,
        clearSelection: () => setSelectedExercises([]),
    };
};
