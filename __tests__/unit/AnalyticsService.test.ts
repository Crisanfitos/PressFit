import { AnalyticsService } from '../../src/services/AnalyticsService';
import { supabase } from '../../src/lib/supabase';

// Mock Supabase from query builder
const mockChain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
};

mockChain.then = jest.fn((resolve: any) =>
    Promise.resolve({ data: [], error: null }).then(resolve)
);

jest.spyOn(supabase, 'from').mockReturnValue(mockChain);

describe('AnalyticsService (PF-154, PF-155, PF-157)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockChain.then = jest.fn((resolve: any) =>
            Promise.resolve({ data: [], error: null }).then(resolve)
        );
    });

    describe('Calculation & Utility proxies', () => {
        it('proxies calculate1RM, calculateBrzycki, calculateEpley, calculateMax1RM and isEffectiveSet', () => {
            expect(AnalyticsService.calculateBrzycki(100, 5)).toBe(112.5);
            expect(AnalyticsService.calculateEpley(100, 12)).toBe(139.96);
            expect(AnalyticsService.calculate1RM(100, 5)).toBe(112.5);
            expect(AnalyticsService.calculate1RM(100, 12)).toBe(139.96);
            expect(AnalyticsService.calculateMax1RM([
                { peso_utilizado: 80, repeticiones: 10 },
                { peso_utilizado: 100, repeticiones: 5 }
            ])).toBe(112.5);
            expect(AnalyticsService.isEffectiveSet({ peso_utilizado: 80, repeticiones: 8 })).toBe(true);
            expect(AnalyticsService.isEffectiveSet({ peso_utilizado: 80, repeticiones: 8, is_warmup: true })).toBe(false);
        });

        it('proxies aggregateEffectiveSetsByMuscle', () => {
            const summary = AnalyticsService.aggregateEffectiveSetsByMuscle([
                {
                    ejercicio: { grupo_muscular_principal: 'Pecho' },
                    series: [{ peso_utilizado: 100, repeticiones: 5 }]
                }
            ]);
            expect(summary.totalSeriesEfectivas).toBe(1);
            expect(summary.porGrupoMuscular['Pecho']).toBe(1);
        });

        it('proxies calculateWeeklyFatigue (PF-157)', () => {
            const result = AnalyticsService.calculateWeeklyFatigue([
                { peso_utilizado: 80, repeticiones: 10, rpe: 7 }
            ]);
            expect(result.fatigueLevel).toBe('optimo');
            expect(result.averageRPE).toBe(7);
        });
    });

    describe('get1RMHistory', () => {
        it('fetches series from supabase and calculates session-wise max 1RM sorted chronologically', async () => {
            const rawSeriesData = [
                {
                    id: 's-3',
                    numero_serie: 1,
                    peso_utilizado: 90,
                    repeticiones: 5,
                    ejercicios_programados: {
                        ejercicio_id: 'ex-1',
                        rutinas_diarias: {
                            id: 'rd-2',
                            fecha_dia: '2026-08-10',
                            rutinas_semanales: { usuario_id: 'u-1' }
                        }
                    }
                },
                {
                    id: 's-4',
                    numero_serie: 2,
                    peso_utilizado: 100,
                    repeticiones: 5,
                    ejercicios_programados: {
                        ejercicio_id: 'ex-1',
                        rutinas_diarias: {
                            id: 'rd-2',
                            fecha_dia: '2026-08-10',
                            rutinas_semanales: { usuario_id: 'u-1' }
                        }
                    }
                },
                {
                    id: 's-1',
                    numero_serie: 1,
                    peso_utilizado: 80,
                    repeticiones: 10,
                    ejercicios_programados: {
                        ejercicio_id: 'ex-1',
                        rutinas_diarias: {
                            id: 'rd-1',
                            fecha_dia: '2026-08-01',
                            rutinas_semanales: { usuario_id: 'u-1' }
                        }
                    }
                },
                {
                    id: 's-2',
                    numero_serie: 2,
                    peso_utilizado: 80,
                    repeticiones: 8,
                    ejercicios_programados: {
                        ejercicio_id: 'ex-1',
                        rutinas_diarias: {
                            id: 'rd-1',
                            fecha_dia: '2026-08-01',
                            rutinas_semanales: { usuario_id: 'u-1' }
                        }
                    }
                },
            ];

            mockChain.then = jest.fn((resolve: any) =>
                Promise.resolve({ data: rawSeriesData, error: null }).then(resolve)
            );

            const result = await AnalyticsService.get1RMHistory('u-1', 'ex-1');

            expect(result.error).toBeNull();
            expect(result.data).toHaveLength(2);

            expect(result.data![0].fecha).toBe('2026-08-01');
            expect(result.data![0].estimated1RM).toBe(106.67);
            expect(result.data![0].peso_utilizado).toBe(80);
            expect(result.data![0].repeticiones).toBe(10);
            expect(result.data![0].formula).toBe('brzycki');
            expect(result.data![0].rutina_id).toBe('rd-1');

            expect(result.data![1].fecha).toBe('2026-08-10');
            expect(result.data![1].estimated1RM).toBe(112.5);
            expect(result.data![1].peso_utilizado).toBe(100);
            expect(result.data![1].repeticiones).toBe(5);
            expect(result.data![1].rutina_id).toBe('rd-2');
        });

        it('returns empty array when no series are recorded for the exercise', async () => {
            mockChain.then = jest.fn((resolve: any) =>
                Promise.resolve({ data: [], error: null }).then(resolve)
            );

            const result = await AnalyticsService.get1RMHistory('u-1', 'ex-none');

            expect(result.error).toBeNull();
            expect(result.data).toEqual([]);
        });

        it('handles null data or query errors gracefully', async () => {
            const dbError = new Error('Database connection failed');
            mockChain.then = jest.fn((resolve: any) =>
                Promise.resolve({ data: null, error: dbError }).then(resolve)
            );

            const result = await AnalyticsService.get1RMHistory('u-1', 'ex-1');

            expect(result.data).toBeNull();
            expect(result.error).toBe(dbError);
        });

        it('handles unexpected exceptions and returns ServiceResponse with error', async () => {
            mockChain.then = jest.fn(() => {
                throw new Error('Unexpected network failure');
            });

            const result = await AnalyticsService.get1RMHistory('u-1', 'ex-1');

            expect(result.data).toBeNull();
            expect(result.error).toBeDefined();
        });
    });

    describe('getEffectiveSetsByMuscleGroup (PF-155)', () => {
        it('queries database with date filters and aggregates effective sets by muscle group', async () => {
            const rawSets = [
                {
                    id: 's-1',
                    numero_serie: 1,
                    peso_utilizado: 40,
                    repeticiones: 15,
                    is_warmup: true,
                    ejercicios_programados: {
                        id: 'ep-1',
                        ejercicio: {
                            id: 'ex-1',
                            nombre: 'Press Banca',
                            grupo_muscular_principal: 'Pecho',
                            grupos_musculares_secundarios: ['Tríceps'],
                        },
                        rutinas_diarias: {
                            id: 'rd-1',
                            fecha_dia: '2026-08-25',
                            rutinas_semanales: { usuario_id: 'u-1' }
                        }
                    }
                },
                {
                    id: 's-2',
                    numero_serie: 2,
                    peso_utilizado: 80,
                    repeticiones: 10,
                    ejercicios_programados: {
                        id: 'ep-1',
                        ejercicio: {
                            id: 'ex-1',
                            nombre: 'Press Banca',
                            grupo_muscular_principal: 'Pecho',
                            grupos_musculares_secundarios: ['Tríceps'],
                        },
                        rutinas_diarias: {
                            id: 'rd-1',
                            fecha_dia: '2026-08-25',
                            rutinas_semanales: { usuario_id: 'u-1' }
                        }
                    }
                },
                {
                    id: 's-3',
                    numero_serie: 3,
                    peso_utilizado: 85,
                    repeticiones: 8,
                    ejercicios_programados: {
                        id: 'ep-1',
                        ejercicio: {
                            id: 'ex-1',
                            nombre: 'Press Banca',
                            grupo_muscular_principal: 'Pecho',
                            grupos_musculares_secundarios: ['Tríceps'],
                        },
                        rutinas_diarias: {
                            id: 'rd-1',
                            fecha_dia: '2026-08-25',
                            rutinas_semanales: { usuario_id: 'u-1' }
                        }
                    }
                },
            ];

            mockChain.then = jest.fn((resolve: any) =>
                Promise.resolve({ data: rawSets, error: null }).then(resolve)
            );

            const result = await AnalyticsService.getEffectiveSetsByMuscleGroup('u-1', {
                startDate: '2026-08-20',
                endDate: '2026-08-28',
            });

            expect(result.error).toBeNull();
            expect(result.data).toBeDefined();
            expect(result.data!.totalSeriesEfectivas).toBe(2);
            expect(result.data!.porGrupoMuscular['Pecho']).toBe(2);
        });

        it('handles DB error gracefully', async () => {
            const dbError = new Error('Query error');
            mockChain.then = jest.fn((resolve: any) =>
                Promise.resolve({ data: null, error: dbError }).then(resolve)
            );

            const result = await AnalyticsService.getEffectiveSetsByMuscleGroup('u-1');

            expect(result.data).toBeNull();
            expect(result.error).toBe(dbError);
        });
    });

    describe('getWeeklyFatigueAnalysis (PF-157)', () => {
        it('queries database for weekly sets and computes fatigue metrics', async () => {
            const rawSeries = [
                {
                    id: 's-1',
                    numero_serie: 1,
                    peso_utilizado: 80,
                    repeticiones: 10,
                    rpe: 7.5,
                    ejercicios_programados: {
                        id: 'ep-1',
                        rutinas_diarias: {
                            id: 'rd-1',
                            fecha_dia: '2026-08-26',
                            rutinas_semanales: { usuario_id: 'u-1' }
                        }
                    }
                },
                {
                    id: 's-2',
                    numero_serie: 2,
                    peso_utilizado: 85,
                    repeticiones: 8,
                    rpe: 8,
                    ejercicios_programados: {
                        id: 'ep-1',
                        rutinas_diarias: {
                            id: 'rd-1',
                            fecha_dia: '2026-08-26',
                            rutinas_semanales: { usuario_id: 'u-1' }
                        }
                    }
                },
            ];

            mockChain.then = jest.fn((resolve: any) =>
                Promise.resolve({ data: rawSeries, error: null }).then(resolve)
            );

            const result = await AnalyticsService.getWeeklyFatigueAnalysis('u-1');

            expect(result.error).toBeNull();
            expect(result.data).toBeDefined();
            expect(result.data!.averageRPE).toBe(7.8);
            expect(result.data!.fatigueLevel).toBe('alto');
            expect(result.data!.statusLabel).toBe('Alto');
            expect(result.data!.statusColor).toBe('#F59E0B');
            expect(result.data!.rpeSeriesCount).toBe(2);
        });

        it('handles DB error gracefully', async () => {
            const dbError = new Error('Database query error');
            mockChain.then = jest.fn((resolve: any) =>
                Promise.resolve({ data: null, error: dbError }).then(resolve)
            );

            const result = await AnalyticsService.getWeeklyFatigueAnalysis('u-1');

            expect(result.data).toBeNull();
            expect(result.error).toBe(dbError);
        });
    });
});
