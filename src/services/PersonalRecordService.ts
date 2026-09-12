import { supabase } from '../lib/supabase';
import { calculate1RM } from '../utils/analyticsUtils';

export interface PersonalRecord {
    peso_maximo: number;
    repeticiones: number;
    fecha_pr: string;
    fecha_dia: string;
}

export interface ExerciseHistoryEntry {
    fecha_dia: string;
    peso_sesion: number;
    reps_totales: number;
    volumen_sesion: number;
}

export interface ExercisePRs {
    maxWeight: number;    // Best single set weight (kg)
    maxVolume: number;    // Best single set volume/tonnage (weight * reps in kg)
    max1RM: number;       // Best estimated 1RM (kg)
}

export type PRType = 'weight' | 'volume' | '1rm';

export interface BrokenPRDetail {
    type: PRType;
    previousValue: number;
    newValue: number;
    label: string;
}

export interface PRDetectionResult {
    isPR: boolean;
    brokenPRs: BrokenPRDetail[];
}

export interface ServiceResponse<T> {
    data: T | null;
    error: any | null;
}

export const PersonalRecordService = {
    /**
     * Evaluates whether a set beats historical personal records in 3 modalities:
     * 1. Max Weight (peso_maximo)
     * 2. Set Volume / Tonnage (peso * reps)
     * 3. Estimated 1RM (e1RM via calculate1RM)
     */
    checkSetForPR(
        currentSet: { weight: number | null | undefined; reps: number | null | undefined },
        historicalPRs?: ExercisePRs | null
    ): PRDetectionResult {
        const weight = Number(currentSet?.weight) || 0;
        const reps = Number(currentSet?.reps) || 0;

        // A valid set must have weight > 0 and reps > 0
        if (weight <= 0 || reps <= 0) {
            return { isPR: false, brokenPRs: [] };
        }

        const basePRs: ExercisePRs = {
            maxWeight: historicalPRs?.maxWeight ?? 0,
            maxVolume: historicalPRs?.maxVolume ?? 0,
            max1RM: historicalPRs?.max1RM ?? 0,
        };

        const currentVolume = Math.round(weight * reps * 100) / 100;
        const current1RM = calculate1RM(weight, reps, 'auto');

        const brokenPRs: BrokenPRDetail[] = [];

        // 1. Max Weight
        if (weight > basePRs.maxWeight) {
            brokenPRs.push({
                type: 'weight',
                previousValue: basePRs.maxWeight,
                newValue: weight,
                label: `¡Nuevo Peso Máximo: ${weight} kg!`,
            });
        }

        // 2. Set Volume / Tonnage
        if (currentVolume > basePRs.maxVolume) {
            brokenPRs.push({
                type: 'volume',
                previousValue: basePRs.maxVolume,
                newValue: currentVolume,
                label: `¡Nuevo Tonelaje de Serie: ${currentVolume} kg!`,
            });
        }

        // 3. Estimated 1RM
        if (current1RM > basePRs.max1RM) {
            brokenPRs.push({
                type: '1rm',
                previousValue: basePRs.max1RM,
                newValue: current1RM,
                label: `¡Nuevo 1RM Estimado: ${current1RM} kg!`,
            });
        }

        return {
            isPR: brokenPRs.length > 0,
            brokenPRs,
        };
    },

    /**
     * Fetch historical PRs (max weight, max single-set volume, max 1RM) for a specific exercise and user.
     */
    async getHistoricalPRs(
        userId: string,
        exerciseId: string
    ): Promise<ServiceResponse<ExercisePRs>> {
        try {
            const { data, error } = await supabase
                .from('series')
                .select(`
                    peso_utilizado,
                    repeticiones,
                    ejercicios_programados!inner(
                        ejercicio_id,
                        rutinas_diarias!inner(
                            rutinas_semanales!inner(usuario_id)
                        )
                    )
                `)
                .eq('ejercicios_programados.ejercicio_id', exerciseId)
                .eq('ejercicios_programados.rutinas_diarias.rutinas_semanales.usuario_id', userId)
                .not('peso_utilizado', 'is', null)
                .not('repeticiones', 'is', null);

            if (error) {
                // If query fails (e.g. In unit tests or schema cache), fallback to RPC getPersonalRecord
                const rpcRes = await this.getPersonalRecord(userId, exerciseId);
                const maxWeight = rpcRes.data?.peso_maximo || 0;
                const reps = rpcRes.data?.repeticiones || 1;
                const maxVolume = maxWeight * reps;
                const max1RM = maxWeight > 0 ? calculate1RM(maxWeight, reps, 'auto') : 0;
                return {
                    data: {
                        maxWeight,
                        maxVolume: Math.round(maxVolume * 100) / 100,
                        max1RM: Math.round(max1RM * 100) / 100,
                    },
                    error: null,
                };
            }

            let maxWeight = 0;
            let maxVolume = 0;
            let max1RM = 0;

            for (const row of (data as any[]) || []) {
                const w = Number(row.peso_utilizado) || 0;
                const r = Number(row.repeticiones) || 0;
                if (w > 0 && r > 0) {
                    if (w > maxWeight) maxWeight = w;
                    const vol = w * r;
                    if (vol > maxVolume) maxVolume = vol;
                    const est1rm = calculate1RM(w, r, 'auto');
                    if (est1rm > max1RM) max1RM = est1rm;
                }
            }

            return {
                data: {
                    maxWeight,
                    maxVolume: Math.round(maxVolume * 100) / 100,
                    max1RM: Math.round(max1RM * 100) / 100,
                },
                error: null,
            };
        } catch (error) {
            console.error('Error fetching historical PRs:', error);
            return {
                data: { maxWeight: 0, maxVolume: 0, max1RM: 0 },
                error,
            };
        }
    },

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
