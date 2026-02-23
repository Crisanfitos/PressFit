import { useState, useCallback, useEffect } from 'react';
import { RoutineService } from '../services/RoutineService';

interface WeeklyRoutine {
    id: string;
    usuario_id: string;
    nombre: string;

    activa: boolean;
    objetivo?: string;
    rutinas_diarias?: any[];
}

export const useWeeklyRoutineController = (userId: string | undefined) => {
    const [routines, setRoutines] = useState<WeeklyRoutine[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'active' | 'inactive'>('active');

    const fetchRoutines = useCallback(async (silent = false) => {
        if (!userId) return;
        if (!silent) setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await RoutineService.getAllWeeklyRoutines(userId);
            if (fetchError) throw fetchError;
            setRoutines(data || []);
        } catch (err) {
            console.error('Error fetching weekly routines:', err);
            setError('Error al cargar rutinas');
        } finally {
            if (!silent) setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (userId) fetchRoutines();
    }, [userId, fetchRoutines]);

    const getFilteredRoutines = (): WeeklyRoutine[] => {
        switch (filter) {
            case 'active':
                return routines.filter((r) => r.activa);
            case 'inactive':
                return routines.filter((r) => !r.activa);
            default:
                return routines;
        }
    };

    const createRoutine = async (name: string, isTemplate = false, isActive = false) => {
        if (!userId) return { success: false, error: 'No user' };
        setLoading(true);
        try {
            const newRoutine = {
                usuario_id: userId,
                nombre: name,
                es_plantilla: true,
                activa: isActive,
                objetivo: 'Nueva Rutina',
            };
            const { data, error: createError } = await RoutineService.createWeeklyRoutine(newRoutine);
            if (createError) throw createError;

            if (data) setRoutines((prev) => [data, ...prev]);
            return { success: true };
        } catch (err: any) {
            console.error('Error creating routine:', err);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const updateRoutine = async (id: string, updates: Partial<WeeklyRoutine>) => {
        try {
            const { data, error: updateError } = await RoutineService.updateWeeklyRoutine(id, updates);
            if (updateError) throw updateError;
            if (data) setRoutines((prev) => prev.map((r) => (r.id === id ? data : r)));
            return true;
        } catch (err) {
            console.error('Error updating routine:', err);
            return false;
        }
    };

    const deleteRoutine = async (id: string) => {
        try {
            const { error: deleteError } = await RoutineService.deleteWeeklyRoutine(id);
            if (deleteError) throw deleteError;
            setRoutines((prev) => prev.filter((r) => r.id !== id));
            return true;
        } catch (err) {
            console.error('Error deleting routine:', err);
            return false;
        }
    };

    const toggleActiveStatus = async (routine: WeeklyRoutine) => {
        try {
            return await updateRoutine(routine.id, { activa: !routine.activa });
        } catch (err) {
            return false;
        }
    };

    return {
        routines: getFilteredRoutines(),
        allRoutines: routines,
        loading,
        error,
        filter,
        setFilter,
        fetchRoutines,
        createRoutine,
        updateRoutine,
        deleteRoutine,
        toggleActiveStatus,
    };
};
