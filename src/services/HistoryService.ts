import { supabase } from '../lib/supabase';
import { formatLocalDateKey, getStartOfWeek } from '../utils/dateUtils';

interface WorkoutSession {
    id: string;
    hora_inicio?: string;
    hora_fin?: string;
    fecha_dia?: string;
    ejercicios_programados?: any[];
    [key: string]: any;
}

interface ServiceResponse<T> {
    data: T | null;
    error: any | null;
}

export const HistoryService = {
    async getDailyProgress(userId: string, date: Date): Promise<ServiceResponse<WorkoutSession[]>> {
        try {
            const dateStr = formatLocalDateKey(date);

            const { data, error } = await supabase
                .from('rutinas_diarias')
                .select(`
          *,
          rutina_semanal:rutinas_semanales!inner(usuario_id),
          ejercicios_programados (
            *,
            ejercicio:ejercicios (*),
            series (*)
          )
        `)
                .eq('rutina_semanal.usuario_id', userId)
                .eq('fecha_dia', dateStr)
                .not('hora_fin', 'is', null)
                .order('hora_fin', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching daily progress:', error);
            return { data: null, error };
        }
    },

    async getWeeklyProgress(userId: string): Promise<ServiceResponse<WorkoutSession[]>> {
        try {
            const startOfWeek = getStartOfWeek(new Date());
            const startOfWeekStr = formatLocalDateKey(startOfWeek);

            const { data, error } = await supabase
                .from('rutinas_diarias')
                .select(`
          id,
          hora_inicio,
          hora_fin,
          fecha_dia,
          rutina_semanal:rutinas_semanales!inner(usuario_id)
        `)
                .eq('rutina_semanal.usuario_id', userId)
                .gte('fecha_dia', startOfWeekStr)
                .not('hora_fin', 'is', null);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching weekly progress:', error);
            return { data: null, error };
        }
    },

    async getMonthlyProgress(
        userId: string,
        year: number | null = null,
        month: number | null = null
    ): Promise<ServiceResponse<WorkoutSession[]>> {
        try {
            const now = new Date();
            const targetYear = year ?? now.getFullYear();
            const targetMonth = month ?? now.getMonth();

            const startOfMonth = new Date(targetYear, targetMonth, 1);
            const endOfMonth = new Date(targetYear, targetMonth + 1, 0);

            const startOfMonthStr = formatLocalDateKey(startOfMonth);
            const endOfMonthStr = formatLocalDateKey(endOfMonth);

            const { data, error } = await supabase
                .from('rutinas_diarias')
                .select(`
          id,
          hora_inicio,
          hora_fin,
          fecha_dia,
          rutina_semanal:rutinas_semanales!inner(usuario_id)
        `)
                .eq('rutina_semanal.usuario_id', userId)
                .gte('fecha_dia', startOfMonthStr)
                .lte('fecha_dia', endOfMonthStr)
                .not('hora_fin', 'is', null);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching monthly progress:', error);
            return { data: null, error };
        }
    },

    async getExerciseHistory(userId: string, exerciseId: string): Promise<ServiceResponse<any[]>> {
        try {
            const { data, error } = await supabase
                .from('series')
                .select(`
          *,
          ejercicio_programado:ejercicios_programados!inner (
            id,
            ejercicio_id,
            rutina_diaria:rutinas_diarias!inner (
              hora_fin,
              rutina_semanal:rutinas_semanales!inner (
                usuario_id
              )
            )
          )
        `)
                .eq('ejercicio_programado.ejercicio_id', exerciseId)
                .eq('ejercicio_programado.rutina_diaria.rutina_semanal.usuario_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching exercise history:', error);
            return { data: null, error };
        }
    },
};
