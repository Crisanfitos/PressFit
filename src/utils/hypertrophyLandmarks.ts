/**
 * Hypertrophy Landmarks and Volume Assessment Utility.
 *
 * Implements scientific hypertrophy volume landmarks based on Renaissance Periodization
 * and sports science literature (Dr. Mike Israetel et al.):
 * - MV (Maintenance Volume): Minimum volume needed to maintain current muscle mass.
 * - MEV (Minimum Effective Volume): Minimum volume that triggers muscle hypertrophy.
 * - MAV (Maximum Adaptive Volume): Optimal range where the best hypertrophic adaptations occur.
 * - MRV (Maximum Recoverable Volume): Upper limit beyond which recovery is impaired, leading to overreaching.
 *
 * @module utils/hypertrophyLandmarks
 */

export interface HypertrophyThresholds {
    mv: number;
    mev: number;
    mavMin: number;
    mavMax: number;
    mrv: number;
}

export type HypertrophyStatus =
    | 'below_mv'
    | 'maintenance'
    | 'optimal'
    | 'warning'
    | 'overtraining';

export interface HypertrophyClassification {
    status: HypertrophyStatus;
    labelKey: string;
    labelDefault: string;
    color: string;
    descriptionKey: string;
    descriptionDefault: string;
}

export interface MuscleHypertrophyAssessment {
    muscle: string;
    effectiveSets: number;
    thresholds: HypertrophyThresholds;
    status: HypertrophyStatus;
    statusLabel: string;
    statusColor: string;
    statusDescription: string;
    progressPercentage: number;
}

/**
 * Standard weekly volume thresholds (sets/week) by muscle group.
 */
export const DEFAULT_HYPERTROPHY_THRESHOLDS: Record<string, HypertrophyThresholds> = {
    pecho: { mv: 6, mev: 10, mavMin: 12, mavMax: 20, mrv: 22 },
    chest: { mv: 6, mev: 10, mavMin: 12, mavMax: 20, mrv: 22 },
    espalda: { mv: 8, mev: 12, mavMin: 14, mavMax: 22, mrv: 25 },
    back: { mv: 8, mev: 12, mavMin: 14, mavMax: 22, mrv: 25 },
    piernas: { mv: 6, mev: 8, mavMin: 12, mavMax: 20, mrv: 22 },
    legs: { mv: 6, mev: 8, mavMin: 12, mavMax: 20, mrv: 22 },
    cuadriceps: { mv: 6, mev: 8, mavMin: 12, mavMax: 18, mrv: 20 },
    quadriceps: { mv: 6, mev: 8, mavMin: 12, mavMax: 18, mrv: 20 },
    isquiotibiales: { mv: 4, mev: 6, mavMin: 10, mavMax: 16, mrv: 18 },
    hamstrings: { mv: 4, mev: 6, mavMin: 10, mavMax: 16, mrv: 18 },
    gluteos: { mv: 0, mev: 4, mavMin: 8, mavMax: 16, mrv: 18 },
    glutes: { mv: 0, mev: 4, mavMin: 8, mavMax: 16, mrv: 18 },
    gemelos: { mv: 6, mev: 8, mavMin: 12, mavMax: 16, mrv: 20 },
    calves: { mv: 6, mev: 8, mavMin: 12, mavMax: 16, mrv: 20 },
    hombros: { mv: 6, mev: 8, mavMin: 12, mavMax: 20, mrv: 22 },
    shoulders: { mv: 6, mev: 8, mavMin: 12, mavMax: 20, mrv: 22 },
    brazos: { mv: 6, mev: 8, mavMin: 12, mavMax: 18, mrv: 20 },
    arms: { mv: 6, mev: 8, mavMin: 12, mavMax: 18, mrv: 20 },
    biceps: { mv: 4, mev: 6, mavMin: 10, mavMax: 16, mrv: 18 },
    triceps: { mv: 4, mev: 6, mavMin: 10, mavMax: 16, mrv: 18 },
    abdomen: { mv: 0, mev: 4, mavMin: 8, mavMax: 14, mrv: 16 },
    core: { mv: 0, mev: 4, mavMin: 8, mavMax: 14, mrv: 16 },
};

/**
 * Generic fallback thresholds for unlisted or custom muscle groups.
 */
export const GENERIC_HYPERTROPHY_THRESHOLDS: HypertrophyThresholds = {
    mv: 6,
    mev: 10,
    mavMin: 12,
    mavMax: 20,
    mrv: 22,
};

/**
 * Normalizes a muscle string (lowercase, remove accents) to match standard keys.
 */
export function normalizeMuscleKey(muscle: string): string {
    if (!muscle) return '';
    return muscle
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

/**
 * Retrieves the hypertrophy landmarks for a given muscle group name.
 */
export function getHypertrophyThresholds(muscle: string): HypertrophyThresholds {
    const key = normalizeMuscleKey(muscle);
    return DEFAULT_HYPERTROPHY_THRESHOLDS[key] || GENERIC_HYPERTROPHY_THRESHOLDS;
}

/**
 * Classifies an effective weekly volume against specific thresholds.
 */
export function classifyHypertrophyVolume(
    effectiveSets: number,
    thresholds: HypertrophyThresholds
): HypertrophyClassification {
    const count = Math.max(0, effectiveSets || 0);

    if (count < thresholds.mv) {
        return {
            status: 'below_mv',
            labelKey: 'hypertrophy.statusBelowMV',
            labelDefault: 'Bajo Mantenimiento (< MV)',
            color: '#64748B', // Slate 500
            descriptionKey: 'hypertrophy.descBelowMV',
            descriptionDefault: 'Volumen insuficiente para mantener la masa muscular a largo plazo.',
        };
    }

    if (count < thresholds.mev) {
        return {
            status: 'maintenance',
            labelKey: 'hypertrophy.statusMaintenance',
            labelDefault: 'Mantenimiento (MV)',
            color: '#3B82F6', // Blue 500
            descriptionKey: 'hypertrophy.descMaintenance',
            descriptionDefault: 'Volumen adecuado para mantener masa muscular sin generar nuevo crecimiento significativo.',
        };
    }

    if (count <= thresholds.mavMax) {
        return {
            status: 'optimal',
            labelKey: 'hypertrophy.statusOptimal',
            labelDefault: 'Óptimo / Hipertrofia (MAV)',
            color: '#10B981', // Emerald 500
            descriptionKey: 'hypertrophy.descOptimal',
            descriptionDefault: 'Rango óptimo para maximizar las adaptaciones y ganancia de masa muscular.',
        };
    }

    if (count <= thresholds.mrv) {
        return {
            status: 'warning',
            labelKey: 'hypertrophy.statusWarning',
            labelDefault: 'Volumen Alto (Cerca de MRV)',
            color: '#F59E0B', // Amber 500
            descriptionKey: 'hypertrophy.descWarning',
            descriptionDefault: 'Volumen muy alto. Estás al límite de tu capacidad de recuperación.',
        };
    }

    return {
        status: 'overtraining',
        labelKey: 'hypertrophy.statusOvertraining',
        labelDefault: 'Sobreentrenamiento (> MRV)',
        color: '#EF4444', // Red 500
        descriptionKey: 'hypertrophy.descOvertraining',
        descriptionDefault: 'Has superado el volumen máximo recuperable. Riesgo alto de lesión y estancamiento.',
    };
}

/**
 * Calculates a 0-100 progress value for visual progress bars based on MRV.
 */
export function calculateHypertrophyProgress(
    effectiveSets: number,
    thresholds: HypertrophyThresholds
): number {
    const count = Math.max(0, effectiveSets || 0);
    const maxReference = thresholds.mrv > 0 ? thresholds.mrv * 1.15 : 25;
    const pct = Math.round((count / maxReference) * 100);
    return Math.min(100, Math.max(0, pct));
}

/**
 * Produces a full muscle hypertrophy assessment.
 */
export function assessMuscleHypertrophy(
    muscle: string,
    effectiveSets: number
): MuscleHypertrophyAssessment {
    const thresholds = getHypertrophyThresholds(muscle);
    const classification = classifyHypertrophyVolume(effectiveSets, thresholds);
    const progressPercentage = calculateHypertrophyProgress(effectiveSets, thresholds);

    return {
        muscle,
        effectiveSets,
        thresholds,
        status: classification.status,
        statusLabel: classification.labelDefault,
        statusColor: classification.color,
        statusDescription: classification.descriptionDefault,
        progressPercentage,
    };
}
