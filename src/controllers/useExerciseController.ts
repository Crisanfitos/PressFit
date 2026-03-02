import { useState, useEffect, useCallback, useMemo } from 'react';
import { ExerciseService } from '../services/ExerciseService';

export interface Exercise {
    id: string;
    titulo: string;
    musculos_primarios?: string | string[];
    musculos_secundarios?: string | string[];
    descripcion?: string;
    url_video?: string;
    imagen_url?: string;
    dificultad?: string;
    categoria?: string;
}

export type FilterKey = 'primaryMuscle' | 'secondaryMuscle' | 'category' | 'difficulty';

export interface FilterState {
    primaryMuscle: string | null;
    secondaryMuscle: string | null;
    category: string | null;
    difficulty: string | null;
}

export interface FilterOptions {
    primaryMuscles: string[];
    secondaryMuscles: string[];
    categories: string[];
    difficulties: string[];
}

/** Parse a field that may be a string (comma-separated) or string array into a flat array of trimmed values. */
const parseField = (raw: string | string[] | undefined): string[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map((s) => s.trim()).filter(Boolean);
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
};

/** Check if an exercise's field (string | string[]) contains the given value. */
const fieldContains = (raw: string | string[] | undefined, value: string): boolean => {
    if (!raw) return false;
    if (Array.isArray(raw)) return raw.some((v) => v.trim() === value);
    return raw.split(',').some((v) => v.trim() === value);
};

const INITIAL_FILTERS: FilterState = {
    primaryMuscle: null,
    secondaryMuscle: null,
    category: null,
    difficulty: null,
};

export const useExerciseController = (routineDayId: string | undefined, userId: string | undefined) => {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
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

    // Extract distinct filter option values from the full exercise list
    const filterOptions: FilterOptions = useMemo(() => {
        const primarySet = new Set<string>();
        const secondarySet = new Set<string>();
        const categorySet = new Set<string>();
        const difficultySet = new Set<string>();

        exercises.forEach((ex) => {
            parseField(ex.musculos_primarios).forEach((v) => primarySet.add(v));
            parseField(ex.musculos_secundarios).forEach((v) => secondarySet.add(v));
            if (ex.categoria?.trim()) categorySet.add(ex.categoria.trim());
            if (ex.dificultad?.trim()) difficultySet.add(ex.dificultad.trim());
        });

        return {
            primaryMuscles: [...primarySet].sort(),
            secondaryMuscles: [...secondarySet].sort(),
            categories: [...categorySet].sort(),
            difficulties: [...difficultySet].sort(),
        };
    }, [exercises]);

    const hasActiveFilters = useMemo(
        () => Object.values(filters).some((v) => v !== null),
        [filters]
    );

    const filteredExercises = useMemo(() => {
        let filtered = exercises;

        // Text search
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter((ex) => ex.titulo.toLowerCase().includes(lowerQuery));
        }

        // Apply filter dimensions with AND logic
        if (filters.primaryMuscle) {
            filtered = filtered.filter((ex) => fieldContains(ex.musculos_primarios, filters.primaryMuscle!));
        }
        if (filters.secondaryMuscle) {
            filtered = filtered.filter((ex) => fieldContains(ex.musculos_secundarios, filters.secondaryMuscle!));
        }
        if (filters.category) {
            filtered = filtered.filter((ex) => ex.categoria?.trim() === filters.category);
        }
        if (filters.difficulty) {
            filtered = filtered.filter((ex) => ex.dificultad?.trim() === filters.difficulty);
        }

        return [...filtered].sort((a, b) => a.titulo.localeCompare(b.titulo));
    }, [exercises, searchQuery, filters]);

    const setFilter = useCallback((key: FilterKey, value: string | null) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    }, []);

    const clearFilter = useCallback((key: FilterKey) => {
        setFilters((prev) => ({ ...prev, [key]: null }));
    }, []);

    const clearAllFilters = useCallback(() => {
        setFilters(INITIAL_FILTERS);
    }, []);

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
        filters,
        setFilter,
        clearFilter,
        clearAllFilters,
        hasActiveFilters,
        filterOptions,
        selectedExercises,
        toggleSelection,
        saveSelection,
        clearSelection: () => setSelectedExercises([]),
    };
};
