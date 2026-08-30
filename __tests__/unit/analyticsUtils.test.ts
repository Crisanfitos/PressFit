import {
    calculateBrzycki,
    calculateEpley,
    calculate1RM,
    calculateMax1RM,
    getBestSetFor1RM,
} from '../../src/utils/analyticsUtils';

describe('analyticsUtils - 1RM Calculation Engine (PF-154)', () => {
    describe('calculateBrzycki', () => {
        it('returns exact weight when reps is 1', () => {
            expect(calculateBrzycki(100, 1)).toBe(100);
            expect(calculateBrzycki(75.5, 1)).toBe(75.5);
        });

        it('calculates 1RM correctly for typical low reps (<= 10)', () => {
            // Formula: 100 * (36 / (37 - 5)) = 100 * (36 / 32) = 112.5
            expect(calculateBrzycki(100, 5)).toBe(112.5);
            // 80 * (36 / (37 - 10)) = 80 * (36 / 27) = 80 * 1.3333... = 106.67
            expect(calculateBrzycki(80, 10)).toBe(106.67);
        });

        it('handles boundary reps (reps >= 37) by safely falling back to Epley', () => {
            const result = calculateBrzycki(50, 37);
            expect(result).toBeGreaterThan(0);
            // Epley for 50kg, 37 reps: 50 * (1 + 0.0333 * 37) = 50 * (1 + 1.2321) = 111.61
            expect(result).toBe(111.61);
        });

        it('returns 0 for invalid, 0, or negative inputs', () => {
            expect(calculateBrzycki(0, 5)).toBe(0);
            expect(calculateBrzycki(-50, 5)).toBe(0);
            expect(calculateBrzycki(100, 0)).toBe(0);
            expect(calculateBrzycki(100, -3)).toBe(0);
            expect(calculateBrzycki(NaN, 5)).toBe(0);
            expect(calculateBrzycki(100, NaN)).toBe(0);
            expect(calculateBrzycki(undefined as any, 5)).toBe(0);
        });
    });

    describe('calculateEpley', () => {
        it('returns exact weight when reps is 1', () => {
            expect(calculateEpley(100, 1)).toBe(100);
            expect(calculateEpley(82.5, 1)).toBe(82.5);
        });

        it('calculates 1RM correctly for higher repetition ranges (> 10)', () => {
            // Formula: 100 * (1 + 0.0333 * 12) = 100 * (1 + 0.3996) = 139.96
            expect(calculateEpley(100, 12)).toBe(139.96);
            // 60 * (1 + 0.0333 * 15) = 60 * (1 + 0.4995) = 60 * 1.4995 = 89.97
            expect(calculateEpley(60, 15)).toBe(89.97);
        });

        it('returns 0 for invalid, 0, or negative inputs', () => {
            expect(calculateEpley(0, 10)).toBe(0);
            expect(calculateEpley(-80, 10)).toBe(0);
            expect(calculateEpley(100, 0)).toBe(0);
            expect(calculateEpley(100, -5)).toBe(0);
            expect(calculateEpley(NaN, 10)).toBe(0);
            expect(calculateEpley(100, NaN)).toBe(0);
        });
    });

    describe('calculate1RM (Unified selector)', () => {
        it('defaults to auto: uses Brzycki for reps <= 10 and Epley for reps > 10', () => {
            const brzyckiVal = calculateBrzycki(100, 8);
            const epleyVal = calculateEpley(100, 12);

            expect(calculate1RM(100, 8, 'auto')).toBe(brzyckiVal);
            expect(calculate1RM(100, 8)).toBe(brzyckiVal); // default is auto

            expect(calculate1RM(100, 12, 'auto')).toBe(epleyVal);
            expect(calculate1RM(100, 12)).toBe(epleyVal);
        });

        it('respects explicit formula override', () => {
            const epleyFor5Reps = calculateEpley(100, 5);
            const brzyckiFor12Reps = calculateBrzycki(100, 12);

            expect(calculate1RM(100, 5, 'epley')).toBe(epleyFor5Reps);
            expect(calculate1RM(100, 12, 'brzycki')).toBe(brzyckiFor12Reps);
        });

        it('returns 0 for invalid inputs', () => {
            expect(calculate1RM(-10, 5)).toBe(0);
            expect(calculate1RM(50, -2)).toBe(0);
            expect(calculate1RM(NaN, 5)).toBe(0);
        });

        it('returns exact weight for 1 rep regardless of formula', () => {
            expect(calculate1RM(120, 1, 'auto')).toBe(120);
            expect(calculate1RM(120, 1, 'brzycki')).toBe(120);
            expect(calculate1RM(120, 1, 'epley')).toBe(120);
        });
    });

    describe('calculateMax1RM', () => {
        it('finds the maximum 1RM from an array of sets', () => {
            const series = [
                { peso_utilizado: 80, repeticiones: 10 }, // 106.67
                { peso_utilizado: 90, repeticiones: 6 },  // 90 * (36/31) = 104.52
                { peso_utilizado: 100, repeticiones: 5 }, // 112.50 (Max)
                { peso_utilizado: 70, repeticiones: 12 }, // 70 * (1 + 0.0333 * 12) = 97.97
            ];

            expect(calculateMax1RM(series)).toBe(112.5);
        });

        it('handles null / undefined / empty arrays gracefully', () => {
            expect(calculateMax1RM([])).toBe(0);
            expect(calculateMax1RM(null as any)).toBe(0);
            expect(calculateMax1RM([{ peso_utilizado: null, repeticiones: null }])).toBe(0);
            expect(calculateMax1RM([{ peso_utilizado: 0, repeticiones: 0 }])).toBe(0);
        });
    });

    describe('getBestSetFor1RM', () => {
        it('identifies the exact set producing the highest 1RM and identifies formula used', () => {
            const set1 = { id: 's1', numero_serie: 1, peso_utilizado: 80, repeticiones: 8 }; // Brzycki: 99.31
            const set2 = { id: 's2', numero_serie: 2, peso_utilizado: 100, repeticiones: 6 }; // Brzycki: 116.13
            const set3 = { id: 's3', numero_serie: 3, peso_utilizado: 75, repeticiones: 15 }; // Epley: 112.46

            const result = getBestSetFor1RM([set1, set2, set3]);
            expect(result).not.toBeNull();
            expect(result?.set.id).toBe('s2');
            expect(result?.estimated1RM).toBe(116.13);
            expect(result?.formula).toBe('brzycki');
        });

        it('returns formula epley when the best set has reps > 10', () => {
            const set1 = { id: 's1', numero_serie: 1, peso_utilizado: 60, repeticiones: 5 };
            const set2 = { id: 's2', numero_serie: 2, peso_utilizado: 100, repeticiones: 12 };

            const result = getBestSetFor1RM([set1, set2]);
            expect(result).not.toBeNull();
            expect(result?.set.id).toBe('s2');
            expect(result?.formula).toBe('epley');
            expect(result?.estimated1RM).toBe(139.96);
        });

        it('returns null for empty or invalid list of sets', () => {
            expect(getBestSetFor1RM([])).toBeNull();
            expect(getBestSetFor1RM(null as any)).toBeNull();
            expect(getBestSetFor1RM([{ peso_utilizado: 0, repeticiones: 0 }])).toBeNull();
        });
    });
});
