/**
 * Set Limits and Validation Utilities (PF-314)
 *
 * Defines maximum set limits per exercise and provides validation
 * for in-situ set management in active workouts.
 */

import { SetType } from '../types/setTypes';

export const MAX_TOTAL_SETS_PER_EXERCISE = 10;
export const MAX_WARMUP_SETS_PER_EXERCISE = 4;

export interface SetLimitsConfig {
    maxTotalSets?: number;
    maxWarmupSets?: number;
}

export interface SetLimitValidationResult {
    allowed: boolean;
    reason?: string;
    totalSets: number;
    warmupSets: number;
}

/**
 * Counts sets categorized by their set type.
 */
export function countSetsByType(sets: Array<{ tipo_serie?: string | null }>): {
    total: number;
    warmup: number;
    normal: number;
    feeder: number;
    failure: number;
    drop: number;
} {
    let warmup = 0;
    let normal = 0;
    let feeder = 0;
    let failure = 0;
    let drop = 0;

    for (const s of sets) {
        const t = s.tipo_serie ? s.tipo_serie.trim().toLowerCase() : 'normal';
        if (t === 'warmup' || t === 'calentamiento') {
            warmup++;
        } else if (t === 'feeder' || t === 'aproximacion' || t === 'aproximación') {
            feeder++;
        } else if (t === 'failure' || t === 'fallo') {
            failure++;
        } else if (t === 'drop' || t === 'dropset') {
            drop++;
        } else {
            normal++;
        }
    }

    return {
        total: sets.length,
        warmup,
        normal,
        feeder,
        failure,
        drop,
    };
}

/**
 * Checks whether the total sets limit has been reached for an exercise.
 */
export function isTotalSetsLimitReached(
    currentSetsCount: number,
    maxTotal: number = MAX_TOTAL_SETS_PER_EXERCISE
): boolean {
    return currentSetsCount >= maxTotal;
}

/**
 * Checks whether the warm-up sets limit has been reached for an exercise.
 */
export function isWarmupSetsLimitReached(
    currentWarmupCount: number,
    maxWarmup: number = MAX_WARMUP_SETS_PER_EXERCISE
): boolean {
    return currentWarmupCount >= maxWarmup;
}

/**
 * Validates whether a new set (or sets) can be added to an exercise given the current set list.
 */
export function checkSetLimits(
    currentSets: Array<{ tipo_serie?: string | null }>,
    countToAdd: number = 1,
    typeToAdd: SetType = 'normal',
    config: SetLimitsConfig = {}
): SetLimitValidationResult {
    const maxTotal = config.maxTotalSets ?? MAX_TOTAL_SETS_PER_EXERCISE;
    const maxWarmup = config.maxWarmupSets ?? MAX_WARMUP_SETS_PER_EXERCISE;

    const counts = countSetsByType(currentSets);

    if (counts.total + countToAdd > maxTotal) {
        return {
            allowed: false,
            reason: `Límite total alcanzado: no puedes superar ${maxTotal} series por ejercicio.`,
            totalSets: counts.total,
            warmupSets: counts.warmup,
        };
    }

    if ((typeToAdd === 'warmup' || (typeToAdd as any) === 'calentamiento') && counts.warmup + countToAdd > maxWarmup) {
        return {
            allowed: false,
            reason: `Límite de calentamiento alcanzado: no puedes superar ${maxWarmup} series de calentamiento por ejercicio.`,
            totalSets: counts.total,
            warmupSets: counts.warmup,
        };
    }

    return {
        allowed: true,
        totalSets: counts.total,
        warmupSets: counts.warmup,
    };
}
