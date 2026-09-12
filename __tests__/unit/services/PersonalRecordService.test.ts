import { PersonalRecordService } from '../../../src/services/PersonalRecordService';
import { supabase } from '../../../src/lib/supabase';

jest.mock('../../../src/lib/supabase', () => ({
    supabase: {
        rpc: jest.fn(),
        from: jest.fn(),
    },
}));

describe('PersonalRecordService (PF-263)', () => {
    const mockUserId = 'user-123';
    const mockExerciseId = 'ex-456';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('getPersonalRecord', () => {
        it('fetches personal record successfully when RPC returns an array with a row', async () => {
            const mockRecord = {
                peso_maximo: 120,
                repeticiones: 5,
                fecha_pr: '2026-08-15',
                fecha_dia: '2026-08-15',
            };

            (supabase.rpc as jest.Mock).mockResolvedValue({
                data: [mockRecord],
                error: null,
            });

            const response = await PersonalRecordService.getPersonalRecord(mockUserId, mockExerciseId);

            expect(supabase.rpc).toHaveBeenCalledWith('get_personal_record', {
                p_usuario_id: mockUserId,
                p_ejercicio_id: mockExerciseId,
            });
            expect(response).toEqual({
                data: mockRecord,
                error: null,
            });
            expect(console.error).not.toHaveBeenCalled();
        });

        it('returns null data when RPC returns an empty array', async () => {
            (supabase.rpc as jest.Mock).mockResolvedValue({
                data: [],
                error: null,
            });

            const response = await PersonalRecordService.getPersonalRecord(mockUserId, mockExerciseId);

            expect(supabase.rpc).toHaveBeenCalledWith('get_personal_record', {
                p_usuario_id: mockUserId,
                p_ejercicio_id: mockExerciseId,
            });
            expect(response).toEqual({
                data: null,
                error: null,
            });
        });

        it('returns null data when RPC returns null or non-array data', async () => {
            (supabase.rpc as jest.Mock).mockResolvedValue({
                data: null,
                error: null,
            });

            const response = await PersonalRecordService.getPersonalRecord(mockUserId, mockExerciseId);

            expect(response).toEqual({
                data: null,
                error: null,
            });
        });

        it('handles error response from supabase.rpc and returns { data: null, error }', async () => {
            const rpcError = { message: 'Database error', code: '42P01' };

            (supabase.rpc as jest.Mock).mockResolvedValue({
                data: null,
                error: rpcError,
            });

            const response = await PersonalRecordService.getPersonalRecord(mockUserId, mockExerciseId);

            expect(supabase.rpc).toHaveBeenCalledWith('get_personal_record', {
                p_usuario_id: mockUserId,
                p_ejercicio_id: mockExerciseId,
            });
            expect(response).toEqual({
                data: null,
                error: rpcError,
            });
            expect(console.error).toHaveBeenCalledWith('Error fetching personal record:', rpcError);
        });

        it('catches thrown exception and returns { data: null, error }', async () => {
            const thrownError = new Error('Network failure');

            (supabase.rpc as jest.Mock).mockRejectedValue(thrownError);

            const response = await PersonalRecordService.getPersonalRecord(mockUserId, mockExerciseId);

            expect(response).toEqual({
                data: null,
                error: thrownError,
            });
            expect(console.error).toHaveBeenCalledWith('Error fetching personal record:', thrownError);
        });
    });

    describe('getExerciseHistory', () => {
        it('fetches exercise history successfully when RPC returns entries', async () => {
            const mockHistory = [
                {
                    fecha_dia: '2026-08-20',
                    peso_sesion: 100,
                    reps_totales: 25,
                    volumen_sesion: 2500,
                },
                {
                    fecha_dia: '2026-08-27',
                    peso_sesion: 105,
                    reps_totales: 24,
                    volumen_sesion: 2520,
                },
            ];

            (supabase.rpc as jest.Mock).mockResolvedValue({
                data: mockHistory,
                error: null,
            });

            const response = await PersonalRecordService.getExerciseHistory(mockUserId, mockExerciseId);

            expect(supabase.rpc).toHaveBeenCalledWith('get_exercise_history', {
                p_usuario_id: mockUserId,
                p_ejercicio_id: mockExerciseId,
            });
            expect(response).toEqual({
                data: mockHistory,
                error: null,
            });
            expect(console.error).not.toHaveBeenCalled();
        });

        it('returns empty array when RPC returns null data without error', async () => {
            (supabase.rpc as jest.Mock).mockResolvedValue({
                data: null,
                error: null,
            });

            const response = await PersonalRecordService.getExerciseHistory(mockUserId, mockExerciseId);

            expect(response).toEqual({
                data: [],
                error: null,
            });
        });

        it('handles error response from supabase.rpc and returns { data: null, error }', async () => {
            const rpcError = { message: 'Function does not exist', code: '42883' };

            (supabase.rpc as jest.Mock).mockResolvedValue({
                data: null,
                error: rpcError,
            });

            const response = await PersonalRecordService.getExerciseHistory(mockUserId, mockExerciseId);

            expect(supabase.rpc).toHaveBeenCalledWith('get_exercise_history', {
                p_usuario_id: mockUserId,
                p_ejercicio_id: mockExerciseId,
            });
            expect(response).toEqual({
                data: null,
                error: rpcError,
            });
            expect(console.error).toHaveBeenCalledWith('Error fetching exercise history:', rpcError);
        });

        it('catches thrown exception and returns { data: null, error }', async () => {
            const thrownError = new Error('Connection refused');

            (supabase.rpc as jest.Mock).mockRejectedValue(thrownError);

            const response = await PersonalRecordService.getExerciseHistory(mockUserId, mockExerciseId);

            expect(response).toEqual({
                data: null,
                error: thrownError,
            });
            expect(console.error).toHaveBeenCalledWith('Error fetching exercise history:', thrownError);
        });
    });

    describe('checkSetForPR (PF-318)', () => {
        const sampleHistoricalPRs = {
            maxWeight: 100,
            maxVolume: 1000,
            max1RM: 115,
        };

        it('returns isPR: false if weight is 0 or negative', () => {
            const result = PersonalRecordService.checkSetForPR({ weight: 0, reps: 10 }, sampleHistoricalPRs);
            expect(result).toEqual({ isPR: false, brokenPRs: [] });

            const resultNegative = PersonalRecordService.checkSetForPR({ weight: -5, reps: 10 }, sampleHistoricalPRs);
            expect(resultNegative).toEqual({ isPR: false, brokenPRs: [] });
        });

        it('returns isPR: false if reps is 0 or negative', () => {
            const result = PersonalRecordService.checkSetForPR({ weight: 120, reps: 0 }, sampleHistoricalPRs);
            expect(result).toEqual({ isPR: false, brokenPRs: [] });

            const resultNegative = PersonalRecordService.checkSetForPR({ weight: 120, reps: -2 }, sampleHistoricalPRs);
            expect(resultNegative).toEqual({ isPR: false, brokenPRs: [] });
        });

        it('returns isPR: false if set does not beat any historical marks', () => {
            // 90kg x 8: weight=90 (<=100), volume=720 (<=1000), 1RM=~114 (<=115)
            const result = PersonalRecordService.checkSetForPR({ weight: 90, reps: 8 }, sampleHistoricalPRs);
            expect(result.isPR).toBe(false);
            expect(result.brokenPRs).toHaveLength(0);
        });

        it('detects max weight PR when set weight exceeds historical mark', () => {
            // 105kg x 1: weight=105 (>100), volume=105 (<=1000), 1RM=105 (<=115)
            const result = PersonalRecordService.checkSetForPR({ weight: 105, reps: 1 }, sampleHistoricalPRs);
            expect(result.isPR).toBe(true);
            expect(result.brokenPRs).toHaveLength(1);
            expect(result.brokenPRs[0].type).toBe('weight');
            expect(result.brokenPRs[0].newValue).toBe(105);
            expect(result.brokenPRs[0].previousValue).toBe(100);
        });

        it('detects set volume PR when weight * reps exceeds historical mark', () => {
            // 80kg x 15: weight=80 (<=100), volume=1200 (>1000)
            const result = PersonalRecordService.checkSetForPR({ weight: 80, reps: 15 }, sampleHistoricalPRs);
            expect(result.isPR).toBe(true);
            const volumePR = result.brokenPRs.find((p) => p.type === 'volume');
            expect(volumePR).toBeDefined();
            expect(volumePR?.newValue).toBe(1200);
            expect(volumePR?.previousValue).toBe(1000);
        });

        it('detects 1RM PR when estimated 1RM exceeds historical mark', () => {
            // 100kg x 6: 1RM epley is ~120 (>115), volume=600 (<=1000), weight=100 (<=100)
            const result = PersonalRecordService.checkSetForPR({ weight: 100, reps: 6 }, sampleHistoricalPRs);
            expect(result.isPR).toBe(true);
            const oneRmPR = result.brokenPRs.find((p) => p.type === '1rm');
            expect(oneRmPR).toBeDefined();
            expect(oneRmPR!.newValue).toBeGreaterThan(115);
        });

        it('detects all 3 PR modalities when a heavier set with high reps is performed', () => {
            // 110kg x 12: beats weight (110 > 100), volume (1320 > 1000), 1RM (> 115)
            const result = PersonalRecordService.checkSetForPR({ weight: 110, reps: 12 }, sampleHistoricalPRs);
            expect(result.isPR).toBe(true);
            expect(result.brokenPRs).toHaveLength(3);
            const types = result.brokenPRs.map((b) => b.type);
            expect(types).toContain('weight');
            expect(types).toContain('volume');
            expect(types).toContain('1rm');
        });

        it('defaults to 0 baseline when historicalPRs is null or undefined', () => {
            const result = PersonalRecordService.checkSetForPR({ weight: 50, reps: 5 }, null);
            expect(result.isPR).toBe(true);
            expect(result.brokenPRs.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('getHistoricalPRs (PF-318)', () => {
        it('calculates historical PRs correctly from series query', async () => {
            const mockRows = [
                { peso_utilizado: 80, repeticiones: 10 },
                { peso_utilizado: 100, repeticiones: 3 },
                { peso_utilizado: 90, repeticiones: 8 },
            ];

            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                not: jest.fn().mockReturnThis(),
            };
            (mockQuery.not as jest.Mock).mockReturnValueOnce(mockQuery);
            (mockQuery.not as jest.Mock).mockResolvedValueOnce({
                data: mockRows,
                error: null,
            });

            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            const res = await PersonalRecordService.getHistoricalPRs(mockUserId, mockExerciseId);

            expect(res.error).toBeNull();
            expect(res.data?.maxWeight).toBe(100);
            expect(res.data?.maxVolume).toBe(800); // 80 * 10
            expect(res.data?.max1RM).toBeGreaterThan(100);
        });

        it('falls back to getPersonalRecord RPC if series query errors', async () => {
            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                not: jest.fn().mockReturnThis(),
            };
            (mockQuery.not as jest.Mock).mockReturnValueOnce(mockQuery);
            (mockQuery.not as jest.Mock).mockResolvedValueOnce({
                data: null,
                error: { message: 'relation does not exist' },
            });

            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            (supabase.rpc as jest.Mock).mockResolvedValue({
                data: [{ peso_maximo: 95, repeticiones: 5 }],
                error: null,
            });

            const res = await PersonalRecordService.getHistoricalPRs(mockUserId, mockExerciseId);

            expect(res.error).toBeNull();
            expect(res.data?.maxWeight).toBe(95);
            expect(res.data?.maxVolume).toBe(475);
            expect(res.data?.max1RM).toBeGreaterThan(95);
        });

        it('returns zeroes defensively if an exception is caught', async () => {
            (supabase.from as jest.Mock).mockImplementation(() => {
                throw new Error('Database disconnected');
            });

            const res = await PersonalRecordService.getHistoricalPRs(mockUserId, mockExerciseId);

            expect(res.data).toEqual({ maxWeight: 0, maxVolume: 0, max1RM: 0 });
            expect(res.error).toBeDefined();
        });
    });
});
