import { supabase } from '../lib/supabase';

interface PersonalRecord {
    peso_maximo: number;
    repeticiones: number;
    fecha_pr: string;
    fecha_dia: string;
}

interface ExerciseHistoryEntry {
    fecha_dia: string;
    peso_sesion: number;
    reps_totales: number;
    volumen_sesion: number;
}

interface ServiceResponse<T> {
    data: T | null;
    error: any | null;
}

export const PersonalRecordService = {
    /**
     * Fetch the personal record (max weight) for a specific exercise and user.
     * Uses the Supabase RPC function `get_personal_record`.
     */
    async getPersonalRecord(
        userId: string,
        exerciseId: string
    ): Promise<ServiceResponse<PersonalRecord | null>> {
        try {
            const { data, error } = await supabase.rpc('get_personal_record', {
                p_usuario_id: userId,
                p_ejercicio_id: exerciseId,
            });

            if (error) throw error;

            // RPC returns an array; take the first (and only) row
            const record = Array.isArray(data) && data.length > 0 ? data[0] : null;
            return { data: record, error: null };
        } catch (error) {
            console.error('Error fetching personal record:', error);
            return { data: null, error };
        }
    },

    /**
     * Fetch the exercise history (last 10 sessions) for a specific exercise and user.
     * Uses the Supabase RPC function `get_exercise_history`.
     */
    async getExerciseHistory(
        userId: string,
        exerciseId: string
    ): Promise<ServiceResponse<ExerciseHistoryEntry[]>> {
        try {
            const { data, error } = await supabase.rpc('get_exercise_history', {
                p_usuario_id: userId,
                p_ejercicio_id: exerciseId,
            });

            if (error) throw error;
            return { data: data || [], error: null };
        } catch (error) {
            console.error('Error fetching exercise history:', error);
            return { data: null, error };
        }
    },
};
