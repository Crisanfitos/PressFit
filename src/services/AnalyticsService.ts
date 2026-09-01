import { supabase } from '../lib/supabase';
import { ServiceResponse } from '../types/models';
import { parseDateKeyAsLocalDate, formatLocalDateKey } from '../utils/dateUtils';
import {
    calculate1RM,
    calculateBrzycki,
    calculateEpley,
    calculateMax1RM,
    getBestSetFor1RM,
    isEffectiveSet,
    aggregateEffectiveSetsByMuscle,
    calculateWeeklyFatigue,
    OneRMFormula,
    EffectiveSetsSummary,
    ExerciseWithSeriesForVolume,
    AggregateOptions,
    FatigueAnalysisResult,
} from '../utils/analyticsUtils';

export interface OneRMHistoryEntry {
    fecha: string;
    estimated1RM: number;
    peso_utilizado: number;
    repeticiones: number;
    numero_serie: number;
    formula: 'brzycki' | 'epley';
    rutina_id?: string;
}

export interface GetEffectiveSetsOptions extends AggregateOptions {
    startDate?: string;
    endDate?: string;
    daysLookback?: number;
}

export interface GetWeeklyFatigueOptions {
    startDate?: string;
    endDate?: string;
    daysLookback?: number;
}

export const AnalyticsService = {
    /**
     * Re-exports the pure 1RM calculation function for service consumers.
     *
     * @param weight - Weight lifted in kg/lbs.
     * @param reps - Repetitions performed.
     * @param formula - Strategy to calculate 1RM ('auto' | 'brzycki' | 'epley').
     * @returns Estimated 1RM.
     */
    calculate1RM(
        weight: number,
        reps: number,
        formula: OneRMFormula = 'auto'
    ): number {
        return calculate1RM(weight, reps, formula);
    },

    /**
     * Calculates 1RM using Brzycki formula.
     */
    calculateBrzycki(weight: number, reps: number): number {
        return calculateBrzycki(weight, reps);
    },

    /**
     * Calculates 1RM using Epley formula.
     */
    calculateEpley(weight: number, reps: number): number {
        return calculateEpley(weight, reps);
    },

    /**
     * Calculates highest 1RM from an array of sets.
     */
    calculateMax1RM(
        series: Array<{ peso_utilizado?: number | null; repeticiones?: number | null }>,
        formula: OneRMFormula = 'auto'
    ): number {
        return calculateMax1RM(series, formula);
    },

    /**
     * Validates whether a set is considered an effective working set.
     */
    isEffectiveSet(set: {
        peso_utilizado?: number | null;
        repeticiones?: number | null;
        rpe?: number | null;
        tipo_serie?: string | null;
        is_warmup?: boolean | null;
    }): boolean {
        return isEffectiveSet(set);
    },

    /**
     * Aggregates effective sets across muscle groups.
     */
    aggregateEffectiveSetsByMuscle(
        exercisesWithSeries: ExerciseWithSeriesForVolume[],
        options?: AggregateOptions
    ): EffectiveSetsSummary {
        return aggregateEffectiveSetsByMuscle(exercisesWithSeries, options);
    },

    /**
     * Evaluates weekly fatigue analysis from performed workout sets.
     */
    calculateWeeklyFatigue(
        series: Array<{
            rpe?: number | null;
            peso_utilizado?: number | null;
            repeticiones?: number | null;
            is_warmup?: boolean | null;
            tipo_serie?: string | null;
        }>
    ): FatigueAnalysisResult {
        return calculateWeeklyFatigue(series);
    },

    /**
     * Fetch historical 1RM data progression for a specific exercise and user.
     * Retrieves all recorded completed sets, calculates estimated 1RM for each session,
     * groups by session date, and returns chronologically ordered progression points.
     *
     * @param userId - ID of the authenticated user.
     * @param exerciseId - ID of the target exercise.
     * @returns Service response containing 1RM progression points.
     */
    async get1RMHistory(
        userId: string,
        exerciseId: string
    ): Promise<ServiceResponse<OneRMHistoryEntry[]>> {
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
                .not('peso_utilizado', 'is', null)
                .not('repeticiones', 'is', null);

            if (error) throw error;

            // Group sets by session date (fecha_dia)
            const setsByDate = new Map<string, Array<{
                numero_serie: number;
                peso_utilizado: number;
                repeticiones: number;
                rutina_id?: string;
            }>>();

            for (const row of (data as any[]) || []) {
                const fecha = row.ejercicios_programados?.rutinas_diarias?.fecha_dia;
                const rutinaId = row.ejercicios_programados?.rutinas_diarias?.id;
                const peso = Number(row.peso_utilizado);
                const reps = Number(row.repeticiones);
                const numSerie = Number(row.numero_serie) || 1;

                if (fecha && peso > 0 && reps > 0) {
                    if (!setsByDate.has(fecha)) {
                        setsByDate.set(fecha, []);
                    }
                    setsByDate.get(fecha)!.push({
                        numero_serie: numSerie,
                        peso_utilizado: peso,
                        repeticiones: reps,
                        rutina_id: rutinaId,
                    });
                }
            }

            // For each session date, find the set with highest estimated 1RM
            const history: OneRMHistoryEntry[] = [];

            setsByDate.forEach((sets, fecha) => {
                const bestResult = getBestSetFor1RM(sets);
                if (bestResult) {
                    history.push({
                        fecha,
                        estimated1RM: bestResult.estimated1RM,
                        peso_utilizado: bestResult.set.peso_utilizado,
                        repeticiones: bestResult.set.repeticiones,
                        numero_serie: bestResult.set.numero_serie,
                        formula: bestResult.formula,
                        rutina_id: bestResult.set.rutina_id,
                    });
                }
            });

            // Sort chronologically ascending
            history.sort((a, b) => {
                const dateA = parseDateKeyAsLocalDate(a.fecha).getTime();
                const dateB = parseDateKeyAsLocalDate(b.fecha).getTime();
                return dateA - dateB;
            });

            return { data: history, error: null };
        } catch (error) {
            console.error('Error fetching 1RM history:', error);
            return { data: null, error };
        }
    },

    /**
     * Aggregates effective weekly sets grouped by primary and secondary muscle groups.
     *
     * Queries workouts and sets within the specified date window (default: last 7 days),
     * filters out warmup sets and computes distribution statistics.
     *
     * @param userId - ID of the target user.
     * @param options - Date range and weighting options.
     * @returns Service response containing the effective sets volume summary.
     */
    async getEffectiveSetsByMuscleGroup(
        userId: string,
        options: GetEffectiveSetsOptions = {}
    ): Promise<ServiceResponse<EffectiveSetsSummary>> {
        try {
            const {
                daysLookback = 7,
                startDate,
                endDate,
                secondaryWeight = 0,
            } = options;

            // Determine date bounds
            let minDateStr = startDate;
            let maxDateStr = endDate;

            if (!minDateStr) {
                const now = new Date();
                const past = new Date(now);
                past.setDate(now.getDate() - (daysLookback - 1));
                minDateStr = formatLocalDateKey(past);
            }
            if (!maxDateStr) {
                maxDateStr = formatLocalDateKey(new Date());
            }

            const { data, error } = await supabase
                .from('series')
                .select(`
                    id,
                    numero_serie,
                    peso_utilizado,
                    repeticiones,
                    rpe,
                    ejercicios_programados!inner(
                        id,
                        ejercicio:ejercicios!inner(
                            id,
                            nombre,
                            grupo_muscular_principal,
                            grupos_musculares_secundarios
                        ),
                        rutinas_diarias!inner(
                            id,
                            fecha_dia,
                            rutinas_semanales!inner(usuario_id)
                        )
                    )
                `)
                .eq('ejercicios_programados.rutinas_diarias.rutinas_semanales.usuario_id', userId)
                .not('ejercicios_programados.rutinas_diarias.fecha_dia', 'is', null)
                .gte('ejercicios_programados.rutinas_diarias.fecha_dia', minDateStr)
                .lte('ejercicios_programados.rutinas_diarias.fecha_dia', maxDateStr);

            if (error) throw error;

            // Group sets by exercise
            const exerciseMap = new Map<string, ExerciseWithSeriesForVolume>();

            for (const row of (data as any[]) || []) {
                const epId = row.ejercicios_programados?.id;
                const ejercicio = row.ejercicios_programados?.ejercicio;
                if (!epId || !ejercicio) continue;

                if (!exerciseMap.has(epId)) {
                    exerciseMap.set(epId, {
                        ejercicio: {
                            id: ejercicio.id,
                            nombre: ejercicio.nombre,
                            grupo_muscular_principal: ejercicio.grupo_muscular_principal,
                            grupos_musculares_secundarios: ejercicio.grupos_musculares_secundarios,
                        },
                        series: [],
                    });
                }

                exerciseMap.get(epId)!.series.push({
                    id: row.id,
                    numero_serie: row.numero_serie,
                    peso_utilizado: row.peso_utilizado,
                    repeticiones: row.repeticiones,
                    rpe: row.rpe,
                    tipo_serie: row.tipo_serie,
                    is_warmup: row.is_warmup,
                });
            }

            const exerciseList = Array.from(exerciseMap.values());
            const summary = aggregateEffectiveSetsByMuscle(exerciseList, { secondaryWeight });

            return { data: summary, error: null };
        } catch (error) {
            console.error('Error fetching effective sets by muscle group:', error);
            return { data: null, error };
        }
    },

    /**
     * Calculates accumulated weekly fatigue and average RPE for the user.
     *
     * Queries all recorded sets within the target window (default: last 7 days),
     * and evaluates fatigue status (Optimal, High, Overtraining).
     *
     * @param userId - ID of the target user.
     * @param options - Date range and lookback parameters.
     * @returns Service response containing the fatigue analysis result.
     */
    async getWeeklyFatigueAnalysis(
        userId: string,
        options: GetWeeklyFatigueOptions = {}
    ): Promise<ServiceResponse<FatigueAnalysisResult>> {
        try {
            const {
                daysLookback = 7,
                startDate,
                endDate,
            } = options;

            let minDateStr = startDate;
            let maxDateStr = endDate;

            if (!minDateStr) {
                const now = new Date();
                const past = new Date(now);
                past.setDate(now.getDate() - (daysLookback - 1));
                minDateStr = formatLocalDateKey(past);
            }
            if (!maxDateStr) {
                maxDateStr = formatLocalDateKey(new Date());
            }

            const { data, error } = await supabase
                .from('series')
                .select(`
                    id,
                    numero_serie,
                    peso_utilizado,
                    repeticiones,
                    rpe,
                    ejercicios_programados!inner(
                        id,
                        rutinas_diarias!inner(
                            id,
                            fecha_dia,
                            rutinas_semanales!inner(usuario_id)
                        )
                    )
                `)
                .eq('ejercicios_programados.rutinas_diarias.rutinas_semanales.usuario_id', userId)
                .not('ejercicios_programados.rutinas_diarias.fecha_dia', 'is', null)
                .gte('ejercicios_programados.rutinas_diarias.fecha_dia', minDateStr)
                .lte('ejercicios_programados.rutinas_diarias.fecha_dia', maxDateStr);

            if (error) throw error;

            const seriesList = ((data as any[]) || []).map((row) => ({
                id: row.id,
                numero_serie: row.numero_serie,
                peso_utilizado: row.peso_utilizado,
                repeticiones: row.repeticiones,
                rpe: row.rpe,
                is_warmup: row.is_warmup,
                tipo_serie: row.tipo_serie,
            }));

            const analysis = calculateWeeklyFatigue(seriesList);

            return { data: analysis, error: null };
        } catch (error) {
            console.error('Error fetching weekly fatigue analysis:', error);
            return { data: null, error };
        }
    },
};
