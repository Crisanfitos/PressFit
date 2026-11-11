import { AnalyticsService } from '../../../src/services/AnalyticsService';
import { PersonalRecordService } from '../../../src/services/PersonalRecordService';
import { DailyWorkoutService } from '../../../src/services/DailyWorkoutService';
import {
    calculate1RM,
    calculateBrzycki,
    calculateEpley,
    calculateWeeklyFatigue,
    isEffectiveSet,
} from '../../../src/utils/analyticsUtils';
import { supabase } from '../../../src/lib/supabase';

jest.mock('../../../src/lib/supabase', () => ({
    supabase: {
        rpc: jest.fn(),
        from: jest.fn(),
    },
}));

describe('Empirical Verification: Milestone 2 Math, Boundaries, RPE Thresholds & Fallbacks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // =========================================================================
    // 1. 1RM FORMULA FIDELITY & BOUNDARY TESTS
    // =========================================================================
    describe('1. 1RM Mathematical Fidelity & Boundaries', () => {
        it('boundary: weights <= 0 and reps <= 0 return 0 across all formulas', () => {
            const invalidPairs = [
                { w: 0, r: 0 },
                { w: -10, r: 5 },
                { w: 100, r: 0 },
                { w: 100, r: -3 },
                { w: -50, r: -5 },
                { w: NaN, r: 10 },
                { w: 100, r: NaN },
            ];

            for (const { w, r } of invalidPairs) {
                expect(calculate1RM(w, r, 'auto')).toBe(0);
                expect(calculateBrzycki(w, r)).toBe(0);
                expect(calculateEpley(w, r)).toBe(0);
                expect(AnalyticsService.calculate1RM(w, r)).toBe(0);
            }
        });

        it('boundary: reps = 1 returns exact weight rounded to 2 decimals', () => {
            expect(calculate1RM(100, 1, 'auto')).toBe(100);
            expect(calculate1RM(87.555, 1, 'auto')).toBe(87.56);
            expect(calculateBrzycki(142.5, 1)).toBe(142.5);
            expect(calculateEpley(142.5, 1)).toBe(142.5);
        });

        it('boundary: reps = 10 correctly applies Brzycki formula in auto mode', () => {
            // Brzycki: 100 * (36 / (37 - 10)) = 100 * (36 / 27) = 133.3333... -> 133.33
            const autoResult = calculate1RM(100, 10, 'auto');
            const brzyckiResult = calculateBrzycki(100, 10);
            expect(autoResult).toBe(133.33);
            expect(brzyckiResult).toBe(133.33);
            expect(autoResult).toBe(brzyckiResult);
        });

        it('boundary: reps = 11 correctly switches to Epley formula in auto mode', () => {
            // Epley: 100 * (1 + 0.0333 * 11) = 100 * (1 + 0.3663) = 136.63
            const autoResult = calculate1RM(100, 11, 'auto');
            const epleyResult = calculateEpley(100, 11);
            expect(autoResult).toBe(136.63);
            expect(epleyResult).toBe(136.63);
            expect(autoResult).toBe(epleyResult);
        });

        it('boundary: reps = 36 evaluates without error', () => {
            // In auto mode (reps > 10): Epley is used
            // 100 * (1 + 0.0333 * 36) = 100 * (1 + 1.1988) = 219.88
            const autoResult = calculate1RM(100, 36, 'auto');
            expect(autoResult).toBe(219.88);

            // In Brzycki: 100 * (36 / (37 - 36)) = 100 * 36 = 3600
            expect(calculateBrzycki(100, 36)).toBe(3600);
        });

        it('boundary: reps = 37 (singularity prevention) safely falls back to Epley in Brzycki', () => {
            // 37 - 37 = 0 would cause division by zero in raw Brzycki.
            // calculateBrzycki specifically falls back to calculateEpley for reps >= 37
            const brzyckiResult = calculateBrzycki(100, 37);
            const epleyResult = calculateEpley(100, 37);

            // 100 * (1 + 0.0333 * 37) = 100 * 2.2321 = 223.21
            expect(epleyResult).toBe(223.21);
            expect(brzyckiResult).toBe(223.21);
            expect(calculate1RM(100, 37, 'auto')).toBe(223.21);
            expect(Number.isFinite(brzyckiResult)).toBe(true);
        });

        it('boundary: reps > 37 (reps = 50, 100) evaluates stably via Epley', () => {
            // reps = 50: 100 * (1 + 0.0333 * 50) = 100 * 2.665 = 266.5
            expect(calculate1RM(100, 50, 'auto')).toBe(266.5);
            expect(calculateBrzycki(100, 50)).toBe(266.5);
            // reps = 100: 100 * (1 + 0.0333 * 100) = 100 * 4.33 = 433
            expect(calculate1RM(100, 100, 'auto')).toBe(433);
        });

        it('adversarial fuzz: 5,000 random inputs yield finite non-negative numbers and strict monotonic growth', () => {
            for (let i = 0; i < 5000; i++) {
                const randomWeight = Math.round((Math.random() * 400 - 50) * 100) / 100; // -50 to 350
                const randomReps = Math.floor(Math.random() * 120 - 10); // -10 to 110

                const val = calculate1RM(randomWeight, randomReps, 'auto');
                expect(Number.isFinite(val)).toBe(true);
                expect(isNaN(val)).toBe(false);

                if (randomWeight <= 0 || randomReps <= 0) {
                    expect(val).toBe(0);
                } else {
                    expect(val).toBeGreaterThan(0);
                }
            }

            // Monotonicity verification for fixed weight across reps 1 to 50
            const weight = 100;
            let previous1RM = 0;
            for (let reps = 1; reps <= 50; reps++) {
                const current1RM = calculate1RM(weight, reps, 'auto');
                expect(current1RM).toBeGreaterThan(previous1RM);
                previous1RM = current1RM;
            }

            // Monotonicity verification for fixed reps across weights 10kg to 300kg
            const reps = 8;
            let prev1RMForWeight = 0;
            for (let w = 10; w <= 300; w += 5) {
                const current1RM = calculate1RM(w, reps, 'auto');
                expect(current1RM).toBeGreaterThan(prev1RMForWeight);
                prev1RMForWeight = current1RM;
            }
        });
    });

    // =========================================================================
    // 2. RPE TRAFFIC LIGHT THRESHOLDS & ATHLETIC READINESS
    // =========================================================================
    describe('2. Weekly Fatigue & RPE Traffic Light Thresholds', () => {
        it('returns "sin_datos" when series array is empty or has no RPE', () => {
            expect(calculateWeeklyFatigue([])).toMatchObject({
                averageRPE: 0,
                fatigueLevel: 'sin_datos',
                statusLabel: 'Sin Datos',
                statusColor: '#6B7280',
            });

            const noRPESeries = [
                { peso_utilizado: 100, repeticiones: 5 },
                { peso_utilizado: 80, repeticiones: 8, rpe: null },
            ];
            expect(calculateWeeklyFatigue(noRPESeries)).toMatchObject({
                fatigueLevel: 'sin_datos',
                rpeSeriesCount: 0,
            });
        });

        it('optimal zone: average RPE < 7.5 returns "optimo" and green (#10B981)', () => {
            // Average RPE = 7.0
            const series = [
                { peso_utilizado: 100, repeticiones: 5, rpe: 7 },
                { peso_utilizado: 100, repeticiones: 5, rpe: 7 },
            ];
            const result = calculateWeeklyFatigue(series);
            expect(result.averageRPE).toBe(7.0);
            expect(result.fatigueLevel).toBe('optimo');
            expect(result.statusLabel).toBe('Óptimo');
            expect(result.statusColor).toBe('#10B981');
        });

        it('high fatigue threshold: average RPE = 7.5 triggers "alto" and amber (#F59E0B)', () => {
            // Average RPE = 7.5 boundary
            const series = [
                { peso_utilizado: 100, repeticiones: 5, rpe: 7.5 },
                { peso_utilizado: 100, repeticiones: 5, rpe: 7.5 },
            ];
            const result = calculateWeeklyFatigue(series);
            expect(result.averageRPE).toBe(7.5);
            expect(result.fatigueLevel).toBe('alto');
            expect(result.statusLabel).toBe('Alto');
            expect(result.statusColor).toBe('#F59E0B');
        });

        it('high fatigue secondary trigger: rpeSeriesCount >= 8 and highIntensityCount >= 4 triggers "alto" even if avg RPE < 7.5', () => {
            // 4 sets at RPE 9 (high intensity) and 4 sets at RPE 5.5
            // Avg RPE = (4*9 + 4*5.5) / 8 = (36 + 22) / 8 = 58 / 8 = 7.25 (< 7.5!)
            const series = [
                { peso_utilizado: 100, repeticiones: 5, rpe: 9 },
                { peso_utilizado: 100, repeticiones: 5, rpe: 9 },
                { peso_utilizado: 100, repeticiones: 5, rpe: 9 },
                { peso_utilizado: 100, repeticiones: 5, rpe: 9 },
                { peso_utilizado: 100, repeticiones: 5, rpe: 5.5 },
                { peso_utilizado: 100, repeticiones: 5, rpe: 5.5 },
                { peso_utilizado: 100, repeticiones: 5, rpe: 5.5 },
                { peso_utilizado: 100, repeticiones: 5, rpe: 5.5 },
            ];
            const result = calculateWeeklyFatigue(series);
            expect(result.averageRPE).toBe(7.3); // rounded
            expect(result.rpeSeriesCount).toBe(8);
            expect(result.highIntensityCount).toBe(4);
            expect(result.fatigueLevel).toBe('alto');
            expect(result.statusColor).toBe('#F59E0B');
        });

        it('overtraining threshold: average RPE > 8.7 triggers "sobreentrenamiento" and red (#EF4444)', () => {
            // Average RPE = 8.8
            const series = [
                { peso_utilizado: 100, repeticiones: 5, rpe: 8.8 },
                { peso_utilizado: 100, repeticiones: 5, rpe: 8.8 },
            ];
            const result = calculateWeeklyFatigue(series);
            expect(result.averageRPE).toBe(8.8);
            expect(result.fatigueLevel).toBe('sobreentrenamiento');
            expect(result.statusLabel).toBe('Sobreentrenamiento');
            expect(result.statusColor).toBe('#EF4444');
        });

        it('overtraining secondary trigger: rpeSeriesCount >= 10 and highIntensity ratio >= 0.6 triggers "sobreentrenamiento"', () => {
            // 6 sets at RPE 9 and 4 sets at RPE 8
            // Avg RPE = (6*9 + 4*8) / 10 = (54 + 32) / 10 = 8.6 (<= 8.7!)
            // Ratio high intensity: 6 / 10 = 0.6 (>= 0.6)
            const series = [
                ...Array(6).fill({ peso_utilizado: 100, repeticiones: 5, rpe: 9 }),
                ...Array(4).fill({ peso_utilizado: 100, repeticiones: 5, rpe: 8 }),
            ];
            const result = calculateWeeklyFatigue(series);
            expect(result.averageRPE).toBe(8.6);
            expect(result.rpeSeriesCount).toBe(10);
            expect(result.highIntensityCount).toBe(6);
            expect(result.fatigueLevel).toBe('sobreentrenamiento');
            expect(result.statusColor).toBe('#EF4444');
        });

        it('warmup sets (tipo_serie="warmup" or is_warmup=true) are excluded from fatigue calculation', () => {
            const series = [
                { peso_utilizado: 40, repeticiones: 15, tipo_serie: 'warmup', rpe: 9 }, // warmups excluded
                { peso_utilizado: 50, repeticiones: 12, is_warmup: true, rpe: 9 },       // warmups excluded
                { peso_utilizado: 100, repeticiones: 5, tipo_serie: 'normal', rpe: 7 },
            ];
            const result = calculateWeeklyFatigue(series);
            expect(result.totalSeriesCount).toBe(1);
            expect(result.rpeSeriesCount).toBe(1);
            expect(result.highIntensityCount).toBe(0);
            expect(result.averageRPE).toBe(7.0);
            expect(result.fatigueLevel).toBe('optimo');
        });
    });

    // =========================================================================
    // 3. SERVICE RESILIENCE & FALLBACK PATHWAYS
    // =========================================================================
    describe('3. Service Resilience & Fallback Pathways', () => {
        const mockUserId = 'user-001';
        const mockExerciseId = 'exercise-999';

        describe('AnalyticsService.get1RMHistory', () => {
            it('fast path: correctly extracts RPC results when RPC is available', async () => {
                const rpcData = [
                    {
                        fecha: '2026-10-01',
                        estimated1RM: '120.00',
                        peso_utilizado: '100',
                        repeticiones: 6,
                        numero_serie: 2,
                        formula: 'brzycki',
                        rutina_id: 'r-1',
                    },
                ];
                (supabase.rpc as jest.Mock).mockResolvedValue({ data: rpcData, error: null });

                const res = await AnalyticsService.get1RMHistory(mockUserId, mockExerciseId);
                expect(res.error).toBeNull();
                expect(res.data).toHaveLength(1);
                expect(res.data![0].estimated1RM).toBe(120);
                expect(res.data![0].formula).toBe('brzycki');
            });

            it('fallback path: activates client fallback when RPC returns database error', async () => {
                (supabase.rpc as jest.Mock).mockResolvedValue({
                    data: null,
                    error: { message: 'RPC not found', code: '42883' },
                });

                const mockDbRows = [
                    {
                        id: 's-1',
                        numero_serie: 1,
                        peso_utilizado: 90,
                        repeticiones: 5,
                        ejercicios_programados: {
                            ejercicio_id: mockExerciseId,
                            rutinas_diarias: {
                                id: 'rd-1',
                                fecha_dia: '2026-10-02',
                                rutinas_semanales: { usuario_id: mockUserId },
                            },
                        },
                    },
                ];

                const queryMock = {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    not: jest.fn().mockReturnThis(),
                };
                (queryMock.not as jest.Mock).mockReturnValueOnce(queryMock);
                (queryMock.not as jest.Mock).mockReturnValueOnce(queryMock);
                (queryMock.not as jest.Mock).mockResolvedValueOnce({ data: mockDbRows, error: null });
                (supabase.from as jest.Mock).mockReturnValue(queryMock);

                const res = await AnalyticsService.get1RMHistory(mockUserId, mockExerciseId);
                expect(res.error).toBeNull();
                expect(res.data).toHaveLength(1);
                expect(res.data![0].fecha).toBe('2026-10-02');
                expect(res.data![0].peso_utilizado).toBe(90);
                // 90 * (36 / 32) = 101.25
                expect(res.data![0].estimated1RM).toBe(101.25);
            });

            it('fallback path: handles network rejection without throwing unhandled exception', async () => {
                (supabase.rpc as jest.Mock).mockRejectedValue(new Error('Network offline'));
                (supabase.from as jest.Mock).mockImplementation(() => {
                    throw new Error('Fallback also offline');
                });

                const res = await AnalyticsService.get1RMHistory(mockUserId, mockExerciseId);
                expect(res.data).toBeNull();
                expect(res.error).toBeDefined();
            });

            it('chronological ordering: fallback sorts multiple sessions ascending by date', async () => {
                (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: { message: 'offline' } });

                const mockDbRows = [
                    {
                        numero_serie: 1,
                        peso_utilizado: 100,
                        repeticiones: 5,
                        ejercicios_programados: {
                            rutinas_diarias: { fecha_dia: '2026-10-05', id: 'd2' },
                        },
                    },
                    {
                        numero_serie: 1,
                        peso_utilizado: 80,
                        repeticiones: 5,
                        ejercicios_programados: {
                            rutinas_diarias: { fecha_dia: '2026-10-01', id: 'd1' },
                        },
                    },
                ];

                const queryMock = {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    not: jest.fn().mockReturnThis(),
                };
                (queryMock.not as jest.Mock).mockReturnValueOnce(queryMock);
                (queryMock.not as jest.Mock).mockReturnValueOnce(queryMock);
                (queryMock.not as jest.Mock).mockResolvedValueOnce({ data: mockDbRows, error: null });
                (supabase.from as jest.Mock).mockReturnValue(queryMock);

                const res = await AnalyticsService.get1RMHistory(mockUserId, mockExerciseId);
                expect(res.data).toHaveLength(2);
                expect(res.data![0].fecha).toBe('2026-10-01');
                expect(res.data![1].fecha).toBe('2026-10-05');
            });
        });

        describe('PersonalRecordService.getHistoricalPRs', () => {
            it('fast path: parses get_exercise_prs RPC response', async () => {
                (supabase.rpc as jest.Mock).mockResolvedValue({
                    data: { maxWeight: 140, maxVolume: 1200, max1RM: 165.2 },
                    error: null,
                });

                const res = await PersonalRecordService.getHistoricalPRs(mockUserId, mockExerciseId);
                expect(res.error).toBeNull();
                expect(res.data).toEqual({
                    maxWeight: 140,
                    maxVolume: 1200,
                    max1RM: 165.2,
                });
            });

            it('fallback path: calculates PRs on client when RPC is unavailable', async () => {
                (supabase.rpc as jest.Mock).mockResolvedValue({
                    data: null,
                    error: { message: 'function not found' },
                });

                const mockSeries = [
                    { peso_utilizado: 100, repeticiones: 5 },  // vol: 500, 1rm: 112.5
                    { peso_utilizado: 120, repeticiones: 1 },  // vol: 120, 1rm: 120, maxWeight: 120
                    { peso_utilizado: 80, repeticiones: 12 },  // vol: 960 (maxVolume), 1rm: 111.97
                ];

                const queryMock = {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    not: jest.fn().mockReturnThis(),
                };
                (queryMock.not as jest.Mock).mockReturnValueOnce(queryMock);
                (queryMock.not as jest.Mock).mockResolvedValueOnce({ data: mockSeries, error: null });
                (supabase.from as jest.Mock).mockReturnValue(queryMock);

                const res = await PersonalRecordService.getHistoricalPRs(mockUserId, mockExerciseId);
                expect(res.error).toBeNull();
                expect(res.data?.maxWeight).toBe(120);
                expect(res.data?.maxVolume).toBe(960);
                expect(res.data?.max1RM).toBe(120);
            });

            it('empty table: returns zeroed PR structure when no sets exist', async () => {
                (supabase.rpc as jest.Mock).mockResolvedValue({
                    data: { maxWeight: 0, maxVolume: 0, max1RM: 0 },
                    error: null,
                });

                const res = await PersonalRecordService.getHistoricalPRs(mockUserId, mockExerciseId);
                expect(res.data).toEqual({ maxWeight: 0, maxVolume: 0, max1RM: 0 });
            });
        });

        describe('DailyWorkoutService.startDailyWorkout', () => {
            it('fast path: instantiates workout day via start_daily_workout RPC', async () => {
                const mockCreatedDay = {
                    id: 'routine-day-100',
                    rutina_semanal_id: 'weekly-1',
                    nombre_dia: 'Lunes Torso',
                    fecha_dia: '2026-10-06',
                    completada: false,
                };

                (supabase.rpc as jest.Mock).mockResolvedValue({
                    data: mockCreatedDay,
                    error: null,
                });

                // Mock getRoutineDayById secondary query
                const queryMock = {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({
                        data: { ...mockCreatedDay, ejercicios_programados: [] },
                        error: null,
                    }),
                };
                (supabase.from as jest.Mock).mockReturnValue(queryMock);

                const res = await DailyWorkoutService.startDailyWorkout(
                    'template-1',
                    '2026-10-06',
                    '2026-10-06T10:00:00Z'
                );

                expect(supabase.rpc).toHaveBeenCalledWith('start_daily_workout', {
                    p_template_day_id: 'template-1',
                    p_workout_date: '2026-10-06',
                    p_start_time: '2026-10-06T10:00:00Z',
                });
                expect(res.error).toBeNull();
                expect(res.data?.id).toBe('routine-day-100');
            });

            it('fallback path: falls back to client instantiation if RPC fails', async () => {
                (supabase.rpc as jest.Mock).mockResolvedValue({
                    data: null,
                    error: { message: 'start_daily_workout RPC error' },
                });

                // Mock template day lookup in fallback
                const queryMock = {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({
                        data: null,
                        error: { message: 'Template not found' },
                    }),
                };
                (supabase.from as jest.Mock).mockReturnValue(queryMock);

                const res = await DailyWorkoutService.startDailyWorkout(
                    'template-missing',
                    '2026-10-06',
                    '2026-10-06T10:00:00Z'
                );

                expect(res.data).toBeNull();
                expect(res.error).toBeDefined();
            });
        });
    });
});
