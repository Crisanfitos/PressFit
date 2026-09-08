import {
    getHypertrophyThresholds,
    classifyHypertrophyVolume,
    calculateHypertrophyProgress,
    assessMuscleHypertrophy,
    normalizeMuscleKey,
    DEFAULT_HYPERTROPHY_THRESHOLDS,
    GENERIC_HYPERTROPHY_THRESHOLDS,
} from '../../../src/utils/hypertrophyLandmarks';

describe('hypertrophyLandmarks Utility', () => {
    describe('normalizeMuscleKey', () => {
        it('normalizes accents and whitespace to lowercase', () => {
            expect(normalizeMuscleKey('  Pecho  ')).toBe('pecho');
            expect(normalizeMuscleKey('Cuádriceps')).toBe('cuadriceps');
            expect(normalizeMuscleKey('Glúteos')).toBe('gluteos');
            expect(normalizeMuscleKey('BÍCEPS')).toBe('biceps');
            expect(normalizeMuscleKey('')).toBe('');
        });
    });

    describe('getHypertrophyThresholds', () => {
        it('returns specific thresholds for known muscles', () => {
            const chest = getHypertrophyThresholds('Pecho');
            expect(chest).toEqual(DEFAULT_HYPERTROPHY_THRESHOLDS.pecho);
            expect(chest.mev).toBe(10);
            expect(chest.mrv).toBe(22);

            const back = getHypertrophyThresholds('Espalda');
            expect(back).toEqual(DEFAULT_HYPERTROPHY_THRESHOLDS.espalda);
            expect(back.mev).toBe(12);

            const quads = getHypertrophyThresholds('Cuádriceps');
            expect(quads.mrv).toBe(20);
        });

        it('returns generic thresholds for unlisted or custom muscle groups', () => {
            const custom = getHypertrophyThresholds('MúsculoDesconocidoXYZ');
            expect(custom).toEqual(GENERIC_HYPERTROPHY_THRESHOLDS);
        });
    });

    describe('classifyHypertrophyVolume', () => {
        const thresholds = { mv: 6, mev: 10, mavMin: 12, mavMax: 20, mrv: 22 };

        it('classifies below_mv when sets < mv', () => {
            const result = classifyHypertrophyVolume(4, thresholds);
            expect(result.status).toBe('below_mv');
            expect(result.color).toBe('#64748B');
        });

        it('classifies maintenance when mv <= sets < mev', () => {
            const result = classifyHypertrophyVolume(8, thresholds);
            expect(result.status).toBe('maintenance');
            expect(result.color).toBe('#3B82F6');
        });

        it('classifies optimal when mev <= sets <= mavMax', () => {
            const result1 = classifyHypertrophyVolume(10, thresholds);
            expect(result1.status).toBe('optimal');
            expect(result1.color).toBe('#10B981');

            const result2 = classifyHypertrophyVolume(16, thresholds);
            expect(result2.status).toBe('optimal');
            expect(result2.color).toBe('#10B981');

            const result3 = classifyHypertrophyVolume(20, thresholds);
            expect(result3.status).toBe('optimal');
        });

        it('classifies warning when mavMax < sets <= mrv', () => {
            const result = classifyHypertrophyVolume(21, thresholds);
            expect(result.status).toBe('warning');
            expect(result.color).toBe('#F59E0B');

            const resultMRV = classifyHypertrophyVolume(22, thresholds);
            expect(resultMRV.status).toBe('warning');
        });

        it('classifies overtraining when sets > mrv', () => {
            const result = classifyHypertrophyVolume(24, thresholds);
            expect(result.status).toBe('overtraining');
            expect(result.color).toBe('#EF4444');
        });

        it('handles zero or negative sets safely', () => {
            const result = classifyHypertrophyVolume(-5, thresholds);
            expect(result.status).toBe('below_mv');
        });
    });

    describe('calculateHypertrophyProgress', () => {
        const thresholds = { mv: 6, mev: 10, mavMin: 12, mavMax: 20, mrv: 20 };

        it('calculates percentage bounded between 0 and 100', () => {
            expect(calculateHypertrophyProgress(0, thresholds)).toBe(0);
            expect(calculateHypertrophyProgress(10, thresholds)).toBeGreaterThan(0);
            expect(calculateHypertrophyProgress(50, thresholds)).toBe(100);
        });
    });

    describe('assessMuscleHypertrophy', () => {
        it('returns comprehensive assessment object', () => {
            const assessment = assessMuscleHypertrophy('Pecho', 14);
            expect(assessment.muscle).toBe('Pecho');
            expect(assessment.effectiveSets).toBe(14);
            expect(assessment.status).toBe('optimal');
            expect(assessment.statusColor).toBe('#10B981');
            expect(assessment.thresholds).toBeDefined();
            expect(assessment.progressPercentage).toBeGreaterThan(0);
        });
    });
});
