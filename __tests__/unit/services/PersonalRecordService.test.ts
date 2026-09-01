import { PersonalRecordService } from '../../../src/services/PersonalRecordService';
import { supabase } from '../../../src/lib/supabase';

jest.mock('../../../src/lib/supabase', () => ({
    supabase: {
        rpc: jest.fn(),
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
});
