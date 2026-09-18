import { supabase } from '../lib/supabase';
import { isE2EMockEnabled, mockStore } from '../lib/e2eMockAdapter';
import { OfflineStorageService } from './OfflineStorageService';
import { WorkoutOfflineService } from './WorkoutOfflineService';
import { LogService } from './LogService';
import { formatLocalDateKey, parseDateKeyAsLocalDate } from '../utils/dateUtils';
import { RoutineDay, ScheduledExercise, Serie, ServiceResponse, ExerciseHistoryRow } from '../types/models';
import { SetType, TipoPeso } from '../types/setTypes';

interface ExerciseHistoryDbRow {
    id: string;
    numero_serie: number;
    peso_utilizado?: number | null;
    repeticiones?: number | null;
    rpe?: number | null;
    ejercicios_programados?: {
        tipo_peso?: string | null;
        rutinas_diarias?: {
            fecha_dia?: string | null;
            id?: string | null;
        } | null;
    } | null;
}

export const WorkoutQueryService = {
    async getWorkoutDetails(workoutId: string): Promise<ServiceResponse<RoutineDay>> {
        if (isE2EMockEnabled()) {
            return { data: mockStore.getMockRoutineDay(workoutId) as unknown as RoutineDay, error: null };
        }

        const offline = await WorkoutOfflineService.checkIsOffline();
        if (!offline) {
            try {
                const { data, error } = await supabase
                    .from('rutinas_diarias')
                    .select(`
              *,
              ejercicios_programados (
                *,
                ejercicio:ejercicios (*),
                series (*)
              )
            `)
                    .eq('id', workoutId)
                    .single();

                if (error) {
                    if (WorkoutOfflineService.isNetworkError(error)) throw error;
                    return { data: null, error };
                }

                // Reconcile with cached values (optimistic updates, offline state)
                const cachedRes = await OfflineStorageService.getCachedWorkouts();
                const currentCached = cachedRes.data || [];
                WorkoutOfflineService.reconcileCachedSeries(data, currentCached, workoutId);

                // Cache workout locally
                if (data) {
                    await WorkoutOfflineService.saveWorkoutToCache(data);
                }

                return { data, error: null };
            } catch (error) {
                LogService.warn('Network query failed for workout details, trying offline cache:', error);
            }
        }

        // Offline fallback
        return WorkoutOfflineService.getOfflineWorkoutDetails(workoutId);
    },

    async getSeriesForExercise(workoutId: string, exerciseId: string): Promise<ServiceResponse<Serie[]>> {
        try {
            const { data: scheduledExercise, error: findError } = await supabase
                .from('ejercicios_programados')
                .select('id')
                .eq('rutina_diaria_id', workoutId)
                .eq('ejercicio_id', exerciseId)
                .maybeSingle();

            if (findError) throw findError;
            if (!scheduledExercise) return { data: [], error: null };

            const { data: series, error: seriesError } = await supabase
                .from('series')
                .select('*')
                .eq('ejercicio_programado_id', scheduledExercise.id)
                .order('numero_serie', { ascending: true });

            if (seriesError) throw seriesError;
            const normalizedSeries = (series || []).map((s) => ({
                ...s,
                tipo_serie: (s as { tipo_serie?: SetType }).tipo_serie || 'normal',
            }));
            return { data: normalizedSeries, error: null };
        } catch (error) {
            LogService.error('Error fetching series for exercise:', error);
            return { data: null, error };
        }
    },

    async getLastCompletedWorkoutForDay(userId: string, routineDayId: string): Promise<ServiceResponse<RoutineDay>> {
        try {
            const { data: templateDay } = await supabase
                .from('rutinas_diarias')
                .select('nombre_dia, rutina_semanal_id')
                .eq('id', routineDayId)
                .single();

            if (!templateDay) return { data: null, error: 'Template not found' };

            const { data, error } = await supabase
                .from('rutinas_diarias')
                .select(`
          *,
          ejercicios_programados (
            *,
            ejercicio:ejercicios (*),
            series (*)
          )
        `)
                .eq('rutina_semanal_id', templateDay.rutina_semanal_id)
                .eq('nombre_dia', templateDay.nombre_dia)
                .eq('completada', true)
                .not('fecha_dia', 'is', null)
                .order('hora_fin', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;

            if (data && data.fecha_dia) {
                const todayStr = formatLocalDateKey(new Date());
                const todayDate = parseDateKeyAsLocalDate(todayStr);
                const workoutDate = parseDateKeyAsLocalDate(data.fecha_dia);
                const diffTime = todayDate.getTime() - workoutDate.getTime();
                const daysDiff = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
                data.days_diff = daysDiff;
                data.isStale = daysDiff > 14;
            }

            return { data, error: null };
        } catch (error) {
            LogService.error('Error fetching last completed workout:', error);
            return { data: null, error };
        }
    },

    async getExerciseHistory(userId: string, exerciseId: string): Promise<ServiceResponse<ExerciseHistoryRow[]>> {
        try {
            const { data, error } = await supabase
                .from('series')
                .select(`
                    id,
                    numero_serie,
                    peso_utilizado,
                    repeticiones,
                    rpe,
                    ejercicios_programados!inner(
                        ejercicio_id,
                        tipo_peso,
                        rutinas_diarias!inner(
                            id,
                            fecha_dia,
                            rutinas_semanales!inner(usuario_id)
                        )
                    )
                `)
                .eq('ejercicios_programados.ejercicio_id', exerciseId)
                .eq('ejercicios_programados.rutinas_diarias.rutinas_semanales.usuario_id', userId)
                .not('ejercicios_programados.rutinas_diarias.fecha_dia', 'is', null)
                .not('peso_utilizado', 'is', null);

            if (error) throw error;

            const history: ExerciseHistoryRow[] = ((data || []) as ExerciseHistoryDbRow[]).map((row) => ({
                id: row.id,
                numero_serie: row.numero_serie,
                peso_utilizado: row.peso_utilizado ?? 0,
                repeticiones: row.repeticiones ?? 0,
                rpe: row.rpe ?? null,
                tipo_peso: (row.ejercicios_programados?.tipo_peso || 'total') as TipoPeso,
                fecha: row.ejercicios_programados?.rutinas_diarias?.fecha_dia || '',
                rutina_id: row.ejercicios_programados?.rutinas_diarias?.id || '',
            }))
                .filter((item) => Boolean(item.fecha))
                .sort((a, b) => parseDateKeyAsLocalDate(a.fecha).getTime() - parseDateKeyAsLocalDate(b.fecha).getTime());

            return { data: history, error: null };
        } catch (error) {
            LogService.error('Error fetching exercise history:', error);
            return { data: null, error };
        }
    },
};
