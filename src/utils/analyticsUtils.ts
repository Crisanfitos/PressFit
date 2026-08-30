/**
 * Utility functions and pure algorithms for athletic analytics and metrics calculation.
 *
 * Implements:
 * 1. 1RM (One Repetition Maximum) estimation using Brzycki and Epley formulas.
 * 2. Effective Sets Aggregation per Muscle Group with warmup exclusions and distribution stats.
 *
 * @module utils/analyticsUtils
 */

export type OneRMFormula = 'auto' | 'brzycki' | 'epley';

export interface OneRMBestSetResult<T = unknown> {
    set: T;
    estimated1RM: number;
    formula: 'brzycki' | 'epley';
}

export interface MuscleVolumeDistribution {
    grupo_muscular: string;
    series_efectivas: number;
    porcentaje: number;
}

export interface EffectiveSetsSummary {
    totalSeriesEfectivas: number;
    porGrupoMuscular: Record<string, number>;
    distribucion: MuscleVolumeDistribution[];
}

export interface ExerciseWithSeriesForVolume {
    ejercicio: {
        id?: string;
        nombre?: string;
        grupo_muscular_principal: string;
        grupos_musculares_secundarios?: string[] | null;
    };
    series: Array<{
        id?: string;
        numero_serie?: number;
        peso_utilizado?: number | null;
        repeticiones?: number | null;
        rpe?: number | null;
        tipo_serie?: string | null;
        is_warmup?: boolean | null;
        [key: string]: any;
    }>;
}

export interface AggregateOptions {
    /**
     * Weight multiplier applied to secondary muscle groups.
     * Default: 0 (only primary muscle receives sets) or 0.5 when secondary engagement is enabled.
     */
    secondaryWeight?: number;
}

/**
 * Determines whether a given set qualifies as an effective working set.
 *
 * An effective set is a non-warmup set performed with valid repetitions and load/intensity.
 *
 * @param set - Set record with reps, weight, RPE and metadata.
 * @returns True if the set is effective, false if it is a warmup or invalid.
 */
export function isEffectiveSet(set: {
    peso_utilizado?: number | null;
    repeticiones?: number | null;
    rpe?: number | null;
    tipo_serie?: string | null;
    is_warmup?: boolean | null;
}): boolean {
    if (!set || typeof set !== 'object') {
        return false;
    }

    // Explicit warmup indicators
    if (set.is_warmup === true) {
        return false;
    }
    const tipo = typeof set.tipo_serie === 'string' ? set.tipo_serie.trim().toLowerCase() : '';
    if (tipo === 'calentamiento' || tipo === 'warmup' || tipo === 'warm_up') {
        return false;
    }

    const reps = Number(set.repeticiones);
    if (isNaN(reps) || reps <= 0) {
        return false;
    }

    const weight = Number(set.peso_utilizado);
    if (isNaN(weight) || weight < 0) {
        return false;
    }

    // Sub-threshold intensity (explicitly low RPE warmups < 5 when RPE is recorded)
    if (typeof set.rpe === 'number' && !isNaN(set.rpe) && set.rpe > 0 && set.rpe < 5) {
        return false;
    }

    return true;
}

/**
 * Calculates estimated 1RM using the Brzycki formula:
 * 1RM = Weight * (36 / (37 - Reps))
 *
 * Most accurate for low-to-medium repetition ranges (Reps <= 10).
 *
 * @param weight - Weight lifted in kg/lbs.
 * @param reps - Repetitions performed.
 * @returns Estimated 1RM rounded to 2 decimal places, or 0 if inputs are invalid.
 */
export function calculateBrzycki(weight: number, reps: number): number {
    if (typeof weight !== 'number' || typeof reps !== 'number' || isNaN(weight) || isNaN(reps)) {
        return 0;
    }
    if (weight <= 0 || reps <= 0) {
        return 0;
    }
    if (reps === 1) {
        return Math.round(weight * 100) / 100;
    }
    // Avoid division by zero or negative values when reps >= 37
    if (reps >= 37) {
        return calculateEpley(weight, reps);
    }

    const estimated = weight * (36 / (37 - reps));
    return Math.round(estimated * 100) / 100;
}

/**
 * Calculates estimated 1RM using the Epley formula:
 * 1RM = Weight * (1 + 0.0333 * Reps)
 *
 * Preferred for higher repetition ranges (Reps > 10).
 *
 * @param weight - Weight lifted in kg/lbs.
 * @param reps - Repetitions performed.
 * @returns Estimated 1RM rounded to 2 decimal places, or 0 if inputs are invalid.
 */
export function calculateEpley(weight: number, reps: number): number {
    if (typeof weight !== 'number' || typeof reps !== 'number' || isNaN(weight) || isNaN(reps)) {
        return 0;
    }
    if (weight <= 0 || reps <= 0) {
        return 0;
    }
    if (reps === 1) {
        return Math.round(weight * 100) / 100;
    }

    const estimated = weight * (1 + 0.0333 * reps);
    return Math.round(estimated * 100) / 100;
}

/**
 * Unified 1RM estimation engine.
 *
 * Automatically selects the optimal formula based on reps:
 * - Reps <= 10: Brzycki
 * - Reps > 10: Epley
 * Or allows explicitly specifying 'brzycki' or 'epley'.
 *
 * @param weight - Weight lifted.
 * @param reps - Repetitions completed.
 * @param formula - Calculation strategy ('auto' | 'brzycki' | 'epley'). Defaults to 'auto'.
 * @returns Estimated 1RM.
 */
export function calculate1RM(
    weight: number,
    reps: number,
    formula: OneRMFormula = 'auto'
): number {
    if (typeof weight !== 'number' || typeof reps !== 'number' || isNaN(weight) || isNaN(reps)) {
        return 0;
    }
    if (weight <= 0 || reps <= 0) {
        return 0;
    }
    if (reps === 1) {
        return Math.round(weight * 100) / 100;
    }

    switch (formula) {
        case 'brzycki':
            return calculateBrzycki(weight, reps);
        case 'epley':
            return calculateEpley(weight, reps);
        case 'auto':
        default:
            return reps <= 10 ? calculateBrzycki(weight, reps) : calculateEpley(weight, reps);
    }
}

/**
 * Calculates the maximum estimated 1RM across an array of sets.
 *
 * @param series - List of sets with weight and reps.
 * @param formula - Formula to apply ('auto' | 'brzycki' | 'epley').
 * @returns The highest 1RM found across all sets, or 0 if empty/invalid.
 */
export function calculateMax1RM(
    series: Array<{ peso_utilizado?: number | null; repeticiones?: number | null }>,
    formula: OneRMFormula = 'auto'
): number {
    if (!Array.isArray(series) || series.length === 0) {
        return 0;
    }

    let max1RM = 0;
    for (const set of series) {
        const weight = set?.peso_utilizado ?? 0;
        const reps = set?.repeticiones ?? 0;
        if (weight > 0 && reps > 0) {
            const current1RM = calculate1RM(weight, reps, formula);
            if (current1RM > max1RM) {
                max1RM = current1RM;
            }
        }
    }

    return max1RM;
}

/**
 * Finds the specific set that yields the highest estimated 1RM.
 *
 * @param series - List of sets with weight and reps.
 * @returns Object containing the best set, its estimated 1RM, and the formula used, or null if none found.
 */
export function getBestSetFor1RM<T extends { peso_utilizado?: number | null; repeticiones?: number | null }>(
    series: T[]
): OneRMBestSetResult<T> | null {
    if (!Array.isArray(series) || series.length === 0) {
        return null;
    }

    let bestResult: OneRMBestSetResult<T> | null = null;

    for (const set of series) {
        const weight = set?.peso_utilizado ?? 0;
        const reps = set?.repeticiones ?? 0;
        if (weight > 0 && reps > 0) {
            const formulaUsed: 'brzycki' | 'epley' = reps <= 10 ? 'brzycki' : 'epley';
            const est1RM = calculate1RM(weight, reps, 'auto');
            if (!bestResult || est1RM > bestResult.estimated1RM) {
                bestResult = {
                    set,
                    estimated1RM: est1RM,
                    formula: formulaUsed,
                };
            }
        }
    }

    return bestResult;
}

/**
 * Aggregates effective workout sets across muscle groups.
 *
 * Excludes warmups, maps primary and secondary muscle groups according to weights,
 * and produces structured totals and percentage distributions.
 *
 * @param exercisesWithSeries - List of exercises with their performed sets.
 * @param options - Aggregation options (e.g. secondaryWeight).
 * @returns Summary containing total effective sets, breakdown by muscle, and sorted distribution.
 */
export function aggregateEffectiveSetsByMuscle(
    exercisesWithSeries: ExerciseWithSeriesForVolume[],
    options: AggregateOptions = {}
): EffectiveSetsSummary {
    const { secondaryWeight = 0 } = options;
    const totals: Record<string, number> = {};

    if (!Array.isArray(exercisesWithSeries) || exercisesWithSeries.length === 0) {
        return {
            totalSeriesEfectivas: 0,
            porGrupoMuscular: {},
            distribucion: [],
        };
    }

    for (const item of exercisesWithSeries) {
        const { ejercicio, series } = item;
        if (!ejercicio || !Array.isArray(series) || series.length === 0) {
            continue;
        }

        const effectiveSets = series.filter(isEffectiveSet);
        const effectiveCount = effectiveSets.length;
        if (effectiveCount === 0) {
            continue;
        }

        // Primary Muscle Group
        const primary = (ejercicio.grupo_muscular_principal || 'Otros').trim();
        totals[primary] = (totals[primary] || 0) + effectiveCount;

        // Secondary Muscle Groups (if weighted)
        if (secondaryWeight > 0 && Array.isArray(ejercicio.grupos_musculares_secundarios)) {
            for (const sec of ejercicio.grupos_musculares_secundarios) {
                const secGroup = (sec || '').trim();
                if (secGroup && secGroup !== primary) {
                    totals[secGroup] = (totals[secGroup] || 0) + (effectiveCount * secondaryWeight);
                }
            }
        }
    }

    // Round values to 1 decimal place and calculate total
    let grandTotal = 0;
    const cleanMap: Record<string, number> = {};

    for (const [group, count] of Object.entries(totals)) {
        const roundedCount = Math.round(count * 10) / 10;
        if (roundedCount > 0) {
            cleanMap[group] = roundedCount;
            grandTotal += roundedCount;
        }
    }

    grandTotal = Math.round(grandTotal * 10) / 10;

    // Generate distribution array sorted descending by effective sets
    const distribucion: MuscleVolumeDistribution[] = Object.entries(cleanMap)
        .map(([grupo_muscular, series_efectivas]) => ({
            grupo_muscular,
            series_efectivas,
            porcentaje: grandTotal > 0 ? Math.round((series_efectivas / grandTotal) * 1000) / 10 : 0,
        }))
        .sort((a, b) => b.series_efectivas - a.series_efectivas);

    return {
        totalSeriesEfectivas: grandTotal,
        porGrupoMuscular: cleanMap,
        distribucion,
    };
}
