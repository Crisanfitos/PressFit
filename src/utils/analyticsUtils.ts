/**
 * Utility functions and pure algorithms for athletic analytics and metrics calculation.
 *
 * Implements 1RM (One Repetition Maximum) estimation using the validated
 * Brzycki and Epley mathematical models.
 *
 * @module utils/analyticsUtils
 */

export type OneRMFormula = 'auto' | 'brzycki' | 'epley';

export interface OneRMBestSetResult<T = unknown> {
    set: T;
    estimated1RM: number;
    formula: 'brzycki' | 'epley';
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
