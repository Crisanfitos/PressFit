import { AnalyticsService } from '../../src/services/AnalyticsService';
import { supabase } from '../../src/lib/supabase';

// Mock Supabase from query builder
const mockChain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
};

mockChain.then = jest.fn((resolve: any) =>
    Promise.resolve({ data: [], error: null }).then(resolve)
);

jest.spyOn(supabase, 'from').mockReturnValue(mockChain);

describe('AnalyticsService (PF-154)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockChain.then = jest.fn((resolve: any) =>
            Promise.resolve({ data: [], error: null }).then(resolve)
        );
    });

    describe('Calculation proxies', () => {
        it('proxies calculate1RM, calculateBrzycki, calculateEpley and calculateMax1RM', () => {
            expect(AnalyticsService.calculateBrzycki(100, 5)).toBe(112.5);
            expect(AnalyticsService.calculateEpley(100, 12)).toBe(139.96);
            expect(AnalyticsService.calculate1RM(100, 5)).toBe(112.5);
            expect(AnalyticsService.calculate1RM(100, 12)).toBe(139.96);
            expect(AnalyticsService.calculateMax1RM([
                { peso_utilizado: 80, repeticiones: 10 },
                { peso_utilizado: 100, repeticiones: 5 }
            ])).toBe(112.5);
        });
    });

    describe('get1RMHistory', () => {
        it('fetches series from supabase and calculates session-wise max 1RM sorted chronologically', async () => {
            const rawSeriesData = [
                // Session 2: 2026-08-10
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
                    repeticiones: 5, // 100 * (36/32) = 112.5 (Best for this session)
                    ejercicios_programados: {
                        ejercicio_id: 'ex-1',
                        rutinas_diarias: {
                            id: 'rd-2',
                            fecha_dia: '2026-08-10',
                            rutinas_semanales: { usuario_id: 'u-1' }
                        }
                    }
                },
                // Session 1: 2026-08-01
                {
                    id: 's-1',
                    numero_serie: 1,
                    peso_utilizado: 80,
                    repeticiones: 10, // 80 * (36/27) = 106.67 (Best for this session)
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
                    repeticiones: 8, // 80 * (36/29) = 99.31
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

            // Verify chronological order (2026-08-01 first, 2026-08-10 second)
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
            mockChain.then = jest.fn((resolve: any, reject: any) =>
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
});
