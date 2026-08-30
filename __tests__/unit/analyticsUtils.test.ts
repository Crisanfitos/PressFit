import {
    calculateBrzycki,
    calculateEpley,
    calculate1RM,
    calculateMax1RM,
    getBestSetFor1RM,
    isEffectiveSet,
    aggregateEffectiveSetsByMuscle,
} from '../../src/utils/analyticsUtils';

describe('analyticsUtils - 1RM Calculation Engine & Effective Sets Aggregator (PF-154 & PF-155)', () => {
    describe('calculateBrzycki', () => {
        it('returns exact weight when reps is 1', () => {
            expect(calculateBrzycki(100, 1)).toBe(100);
            expect(calculateBrzycki(75.5, 1)).toBe(75.5);
        });

        it('calculates 1RM correctly for typical low reps (<= 10)', () => {
            expect(calculateBrzycki(100, 5)).toBe(112.5);
            expect(calculateBrzycki(80, 10)).toBe(106.67);
        });

        it('handles boundary reps (reps >= 37) by safely falling back to Epley', () => {
            const result = calculateBrzycki(50, 37);
            expect(result).toBeGreaterThan(0);
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
            expect(calculateEpley(100, 12)).toBe(139.96);
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
            expect(calculate1RM(100, 8)).toBe(brzyckiVal);

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
                { peso_utilizado: 80, repeticiones: 10 },
                { peso_utilizado: 90, repeticiones: 6 },
                { peso_utilizado: 100, repeticiones: 5 },
                { peso_utilizado: 70, repeticiones: 12 },
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
            const set1 = { id: 's1', numero_serie: 1, peso_utilizado: 80, repeticiones: 8 };
            const set2 = { id: 's2', numero_serie: 2, peso_utilizado: 100, repeticiones: 6 };
            const set3 = { id: 's3', numero_serie: 3, peso_utilizado: 75, repeticiones: 15 };

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

    describe('isEffectiveSet (PF-155)', () => {
        it('returns true for normal working sets with weight and reps', () => {
            expect(isEffectiveSet({ peso_utilizado: 80, repeticiones: 10 })).toBe(true);
            expect(isEffectiveSet({ peso_utilizado: 100, repeticiones: 5, rpe: 8 })).toBe(true);
            expect(isEffectiveSet({ peso_utilizado: 0, repeticiones: 15 })).toBe(true); // bodyweight
        });

        it('excludes warmup sets explicitly marked via is_warmup or tipo_serie', () => {
            expect(isEffectiveSet({ peso_utilizado: 40, repeticiones: 15, is_warmup: true })).toBe(false);
            expect(isEffectiveSet({ peso_utilizado: 50, repeticiones: 12, tipo_serie: 'calentamiento' })).toBe(false);
            expect(isEffectiveSet({ peso_utilizado: 50, repeticiones: 12, tipo_serie: 'warmup' })).toBe(false);
            expect(isEffectiveSet({ peso_utilizado: 50, repeticiones: 12, tipo_serie: 'Warm_Up' })).toBe(false);
        });

        it('excludes sets with invalid reps or negative weights', () => {
            expect(isEffectiveSet({ peso_utilizado: 50, repeticiones: 0 })).toBe(false);
            expect(isEffectiveSet({ peso_utilizado: 50, repeticiones: -5 })).toBe(false);
            expect(isEffectiveSet({ peso_utilizado: -20, repeticiones: 10 })).toBe(false);
            expect(isEffectiveSet(null as any)).toBe(false);
            expect(isEffectiveSet(undefined as any)).toBe(false);
        });

        it('excludes explicit low RPE warmups (RPE < 5)', () => {
            expect(isEffectiveSet({ peso_utilizado: 60, repeticiones: 10, rpe: 4 })).toBe(false);
            expect(isEffectiveSet({ peso_utilizado: 60, repeticiones: 10, rpe: 5 })).toBe(true);
            expect(isEffectiveSet({ peso_utilizado: 60, repeticiones: 10, rpe: 8.5 })).toBe(true);
        });
    });

    describe('aggregateEffectiveSetsByMuscle (PF-155)', () => {
        it('aggregates effective sets across multiple exercises correctly (Pecho, Espalda, Piernas)', () => {
            const exerciseData = [
                // Bench Press: 4 sets (1 warmup, 3 effective) -> Pecho
                {
                    ejercicio: {
                        nombre: 'Press Banca',
                        grupo_muscular_principal: 'Pecho',
                        grupos_musculares_secundarios: ['Tríceps', 'Hombros'],
                    },
                    series: [
                        { peso_utilizado: 40, repeticiones: 15, is_warmup: true },
                        { peso_utilizado: 80, repeticiones: 10 },
                        { peso_utilizado: 85, repeticiones: 8 },
                        { peso_utilizado: 90, repeticiones: 6 },
                    ],
                },
                // Pull-ups: 4 effective sets -> Espalda
                {
                    ejercicio: {
                        nombre: 'Dominadas',
                        grupo_muscular_principal: 'Espalda',
                        grupos_musculares_secundarios: ['Bíceps'],
                    },
                    series: [
                        { peso_utilizado: 0, repeticiones: 10 },
                        { peso_utilizado: 0, repeticiones: 8 },
                        { peso_utilizado: 0, repeticiones: 8 },
                        { peso_utilizado: 0, repeticiones: 6 },
                    ],
                },
                // Squat: 5 sets (1 warmup with rpe 4, 4 effective) -> Piernas
                {
                    ejercicio: {
                        nombre: 'Sentadilla Trasera',
                        grupo_muscular_principal: 'Piernas',
                        grupos_musculares_secundarios: ['Glúteos'],
                    },
                    series: [
                        { peso_utilizado: 60, repeticiones: 10, rpe: 4 }, // warmup excluded
                        { peso_utilizado: 100, repeticiones: 8, rpe: 7 },
                        { peso_utilizado: 110, repeticiones: 6, rpe: 8 },
                        { peso_utilizado: 115, repeticiones: 5, rpe: 9 },
                        { peso_utilizado: 120, repeticiones: 3, rpe: 9.5 },
                    ],
                },
            ];

            const result = aggregateEffectiveSetsByMuscle(exerciseData);

            expect(result.totalSeriesEfectivas).toBe(11); // 3 Pecho + 4 Espalda + 4 Piernas
            expect(result.porGrupoMuscular['Pecho']).toBe(3);
            expect(result.porGrupoMuscular['Espalda']).toBe(4);
            expect(result.porGrupoMuscular['Piernas']).toBe(4);

            // Verify distribution list
            expect(result.distribucion).toHaveLength(3);
            expect(result.distribucion[0].series_efectivas).toBe(4);
            expect(result.distribucion[1].series_efectivas).toBe(4);
            expect(result.distribucion[2].series_efectivas).toBe(3);
            expect(result.distribucion[2].grupo_muscular).toBe('Pecho');
            expect(result.distribucion[2].porcentaje).toBe(27.3); // 3 / 11 = 27.27%
        });

        it('supports secondary muscle weighting when secondaryWeight > 0', () => {
            const exerciseData = [
                {
                    ejercicio: {
                        nombre: 'Press Banca',
                        grupo_muscular_principal: 'Pecho',
                        grupos_musculares_secundarios: ['Tríceps', 'Hombros'],
                    },
                    series: [
                        { peso_utilizado: 80, repeticiones: 10 },
                        { peso_utilizado: 80, repeticiones: 10 },
                    ],
                },
            ];

            const result = aggregateEffectiveSetsByMuscle(exerciseData, { secondaryWeight: 0.5 });

            expect(result.porGrupoMuscular['Pecho']).toBe(2);
            expect(result.porGrupoMuscular['Tríceps']).toBe(1); // 2 * 0.5
            expect(result.porGrupoMuscular['Hombros']).toBe(1); // 2 * 0.5
            expect(result.totalSeriesEfectivas).toBe(4); // 2 + 1 + 1
        });

        it('handles empty or malformed exercise lists cleanly', () => {
            const emptyResult = aggregateEffectiveSetsByMuscle([]);
            expect(emptyResult.totalSeriesEfectivas).toBe(0);
            expect(emptyResult.porGrupoMuscular).toEqual({});
            expect(emptyResult.distribucion).toEqual([]);

            const nullResult = aggregateEffectiveSetsByMuscle(null as any);
            expect(nullResult.totalSeriesEfectivas).toBe(0);
        });
    });
});
