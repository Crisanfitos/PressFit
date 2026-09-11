import {
    MAX_TOTAL_SETS_PER_EXERCISE,
    MAX_WARMUP_SETS_PER_EXERCISE,
    countSetsByType,
    isTotalSetsLimitReached,
    isWarmupSetsLimitReached,
    checkSetLimits,
} from '../../../src/utils/setLimits';

describe('setLimits utility (PF-314)', () => {
    it('defines expected default limits', () => {
        expect(MAX_TOTAL_SETS_PER_EXERCISE).toBe(10);
        expect(MAX_WARMUP_SETS_PER_EXERCISE).toBe(4);
    });

    describe('countSetsByType', () => {
        it('correctly counts various set types including default normal and spanish variants', () => {
            const sets = [
                { tipo_serie: 'normal' },
                { tipo_serie: undefined },
                { tipo_serie: 'warmup' },
                { tipo_serie: 'calentamiento' },
                { tipo_serie: 'feeder' },
                { tipo_serie: 'aproximacion' },
                { tipo_serie: 'failure' },
                { tipo_serie: 'drop' },
            ];

            const counts = countSetsByType(sets);
            expect(counts.total).toBe(8);
            expect(counts.normal).toBe(2);
            expect(counts.warmup).toBe(2);
            expect(counts.feeder).toBe(2);
            expect(counts.failure).toBe(1);
            expect(counts.drop).toBe(1);
        });

        it('handles empty sets array', () => {
            const counts = countSetsByType([]);
            expect(counts.total).toBe(0);
            expect(counts.warmup).toBe(0);
            expect(counts.normal).toBe(0);
        });
    });

    describe('isTotalSetsLimitReached', () => {
        it('returns false when count is below limit', () => {
            expect(isTotalSetsLimitReached(0)).toBe(false);
            expect(isTotalSetsLimitReached(9)).toBe(false);
        });

        it('returns true when count meets or exceeds limit', () => {
            expect(isTotalSetsLimitReached(10)).toBe(true);
            expect(isTotalSetsLimitReached(12)).toBe(true);
        });

        it('supports custom maximum limit', () => {
            expect(isTotalSetsLimitReached(5, 5)).toBe(true);
            expect(isTotalSetsLimitReached(4, 5)).toBe(false);
        });
    });

    describe('isWarmupSetsLimitReached', () => {
        it('returns false when count is below warmup limit', () => {
            expect(isWarmupSetsLimitReached(0)).toBe(false);
            expect(isWarmupSetsLimitReached(3)).toBe(false);
        });

        it('returns true when count meets or exceeds warmup limit', () => {
            expect(isWarmupSetsLimitReached(4)).toBe(true);
            expect(isWarmupSetsLimitReached(5)).toBe(true);
        });

        it('supports custom warmup limit', () => {
            expect(isWarmupSetsLimitReached(2, 2)).toBe(true);
            expect(isWarmupSetsLimitReached(1, 2)).toBe(false);
        });
    });

    describe('checkSetLimits', () => {
        it('allows adding sets when within limits', () => {
            const currentSets = [
                { tipo_serie: 'warmup' },
                { tipo_serie: 'normal' },
                { tipo_serie: 'normal' },
            ];

            const result = checkSetLimits(currentSets, 1, 'normal');
            expect(result.allowed).toBe(true);
            expect(result.totalSets).toBe(3);
            expect(result.warmupSets).toBe(1);
            expect(result.reason).toBeUndefined();
        });

        it('rejects adding sets when exceeding total limit', () => {
            const currentSets = Array.from({ length: 10 }, () => ({ tipo_serie: 'normal' }));

            const result = checkSetLimits(currentSets, 1, 'normal');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Límite total alcanzado');
            expect(result.totalSets).toBe(10);
        });

        it('rejects adding multiple sets when countToAdd causes total to exceed limit', () => {
            const currentSets = Array.from({ length: 9 }, () => ({ tipo_serie: 'normal' }));

            const result = checkSetLimits(currentSets, 2, 'normal');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Límite total alcanzado');
        });

        it('rejects adding warmup sets when exceeding warmup limit', () => {
            const currentSets = [
                { tipo_serie: 'warmup' },
                { tipo_serie: 'warmup' },
                { tipo_serie: 'warmup' },
                { tipo_serie: 'warmup' },
                { tipo_serie: 'normal' },
            ];

            const result = checkSetLimits(currentSets, 1, 'warmup');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Límite de calentamiento alcanzado');
            expect(result.warmupSets).toBe(4);
        });

        it('allows adding normal sets even when warmup limit is already reached as long as total limit is not exceeded', () => {
            const currentSets = [
                { tipo_serie: 'warmup' },
                { tipo_serie: 'warmup' },
                { tipo_serie: 'warmup' },
                { tipo_serie: 'warmup' },
            ];

            const result = checkSetLimits(currentSets, 1, 'normal');
            expect(result.allowed).toBe(true);
        });

        it('supports custom limits configuration', () => {
            const currentSets = [{ tipo_serie: 'warmup' }];
            const result = checkSetLimits(currentSets, 1, 'warmup', { maxWarmupSets: 1 });
            expect(result.allowed).toBe(false);
        });
    });
});
