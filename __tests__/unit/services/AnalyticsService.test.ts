import { AnalyticsService } from '../../../src/services/AnalyticsService';
import { supabase } from '../../../src/lib/supabase';

jest.mock('../../../src/lib/supabase', () => ({
    supabase: {
        rpc: jest.fn(),
        from: jest.fn(),
    },
}));

describe('AnalyticsService (M2 Backend Offloading & Fallback Integration)', () => {
    const mockUserId = 'user-uuid-1';
    const mockExerciseId = 'exercise-uuid-2';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('get1RMHistory', () => {
        it('fetches 1RM progression via get_exercise_1rm_history RPC fast-path', async () => {
            const mockRpcRows = [
                {
                    fecha: '2026-10-01',
                    estimated1RM: 112.5,
                    peso_utilizado: 100,
                    repeticiones: 5,
                    numero_serie: 1,
                    formula: 'brzycki',
                    rutina_id: 'rd-1',
                },
                {
                    fecha: '2026-10-05',
                    estimated1RM: 120.0,
                    peso_utilizado: 105,
                    repeticiones: 5,
                    numero_serie: 2,
                    formula: 'brzycki',
                    rutina_id: 'rd-2',
                },
            ];

            (supabase.rpc as jest.Mock).mockResolvedValue({
                data: mockRpcRows,
                error: null,
            });

            const result = await AnalyticsService.get1RMHistory(mockUserId, mockExerciseId);

            expect(supabase.rpc).toHaveBeenCalledWith('get_exercise_1rm_history', {
                p_usuario_id: mockUserId,
                p_ejercicio_id: mockExerciseId,
            });
            expect(result.error).toBeNull();
            expect(result.data).toHaveLength(2);
            expect(result.data![0]).toEqual({
                fecha: '2026-10-01',
                estimated1RM: 112.5,
                peso_utilizado: 100,
                repeticiones: 5,
                numero_serie: 1,
                formula: 'brzycki',
                rutina_id: 'rd-1',
            });
            expect(result.data![1].estimated1RM).toBe(120.0);
        });

        it('falls back to client-side calculation when RPC returns an error', async () => {
            (supabase.rpc as jest.Mock).mockResolvedValue({
                data: null,
                error: { message: 'function get_exercise_1rm_history does not exist' },
            });

            const mockDbRows = [
                {
                    id: 's-1',
                    numero_serie: 1,
                    peso_utilizado: 100,
                    repeticiones: 5,
                    ejercicios_programados: {
                        ejercicio_id: mockExerciseId,
                        rutinas_diarias: {
                            id: 'rd-1',
                            fecha_dia: '2026-10-01',
                            rutinas_semanales: { usuario_id: mockUserId },
                        },
                    },
                },
            ];

            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                not: jest.fn().mockReturnThis(),
            };
            (mockQuery.not as jest.Mock).mockReturnValueOnce(mockQuery);
            (mockQuery.not as jest.Mock).mockReturnValueOnce(mockQuery);
            (mockQuery.not as jest.Mock).mockResolvedValueOnce({
                data: mockDbRows,
                error: null,
            });

            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            const result = await AnalyticsService.get1RMHistory(mockUserId, mockExerciseId);

            expect(result.error).toBeNull();
            expect(result.data).toHaveLength(1);
            expect(result.data![0].fecha).toBe('2026-10-01');
            expect(result.data![0].peso_utilizado).toBe(100);
            expect(result.data![0].estimated1RM).toBe(112.5);
        });

        it('handles unexpected exceptions gracefully and returns error in ServiceResponse', async () => {
            (supabase.rpc as jest.Mock).mockRejectedValue(new Error('Network offline'));
            (supabase.from as jest.Mock).mockImplementation(() => {
                throw new Error('Fallback failed');
            });

            const result = await AnalyticsService.get1RMHistory(mockUserId, mockExerciseId);

            expect(result.data).toBeNull();
            expect(result.error).toBeDefined();
        });
    });

    describe('getWeeklyFatigueAnalysis', () => {
        it('fetches athletic fatigue metrics via get_weekly_fatigue_analysis RPC fast-path', async () => {
            const mockAnalysis = {
                averageRPE: 8.2,
                fatigueLevel: 'alto',
                totalSeriesCount: 15,
                rpeSeriesCount: 12,
                highIntensityCount: 4,
                statusLabel: 'Alto',
                statusColor: '#F59E0B',
                recommendation: 'Fatiga acumulada moderada-alta. Monitorea tu recuperación.',
            };

            (supabase.rpc as jest.Mock).mockResolvedValue({
                data: mockAnalysis,
                error: null,
            });

            const result = await AnalyticsService.getWeeklyFatigueAnalysis(mockUserId, {
                startDate: '2026-10-01',
                endDate: '2026-10-07',
            });

            expect(supabase.rpc).toHaveBeenCalledWith('get_weekly_fatigue_analysis', {
                p_usuario_id: mockUserId,
                p_start_date: '2026-10-01',
                p_end_date: '2026-10-07',
            });
            expect(result.error).toBeNull();
            expect(result.data).toEqual(mockAnalysis);
        });

        it('falls back to client-side calculation when RPC fails', async () => {
            (supabase.rpc as jest.Mock).mockResolvedValue({
                data: null,
                error: { message: 'function get_weekly_fatigue_analysis does not exist' },
            });

            const mockDbRows = [
                {
                    id: 's-1',
                    numero_serie: 1,
                    peso_utilizado: 80,
                    repeticiones: 10,
                    rpe: 7,
                    is_warmup: false,
                    tipo_serie: 'normal',
                },
            ];

            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                not: jest.fn().mockReturnThis(),
                gte: jest.fn().mockReturnThis(),
                lte: jest.fn().mockResolvedValue({
                    data: mockDbRows,
                    error: null,
                }),
            };

            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            const result = await AnalyticsService.getWeeklyFatigueAnalysis(mockUserId, {
                startDate: '2026-10-01',
                endDate: '2026-10-07',
            });

            expect(result.error).toBeNull();
            expect(result.data?.averageRPE).toBe(7);
            expect(result.data?.fatigueLevel).toBe('optimo');
        });

        it('handles exceptions and returns null data with error', async () => {
            (supabase.rpc as jest.Mock).mockRejectedValue(new Error('Fatal error'));
            (supabase.from as jest.Mock).mockImplementation(() => {
                throw new Error('Database crash');
            });

            const result = await AnalyticsService.getWeeklyFatigueAnalysis(mockUserId);

            expect(result.data).toBeNull();
            expect(result.error).toBeDefined();
        });
    });

    describe('Calculation & Utility proxies', () => {
        it('proxies 1RM calculations', () => {
            expect(AnalyticsService.calculate1RM(100, 1)).toBe(100);
            expect(AnalyticsService.calculateBrzycki(100, 5)).toBe(112.5);
            expect(AnalyticsService.calculateEpley(100, 12)).toBe(139.96);
        });
    });
});
