import { HistoryService } from '../../../src/services/HistoryService';
import { supabase } from '../../../src/lib/supabase';

jest.mock('../../../src/lib/supabase', () => ({
    supabase: {
        from: jest.fn(),
    },
}));

describe('HistoryService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getDailyProgress', () => {
        it('should return daily progress routines for a user and date', async () => {
            const mockData = [
                {
                    id: 'r1',
                    fecha_dia: '2026-07-28',
                    hora_fin: '2026-07-28T10:00:00Z',
                    ejercicios_programados: [],
                },
            ];

            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                not: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
            };

            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            const result = await HistoryService.getDailyProgress('user-1', new Date('2026-07-28'));

            expect(supabase.from).toHaveBeenCalledWith('rutinas_diarias');
            expect(result.data).toEqual(mockData);
            expect(result.error).toBeNull();
        });

        it('should handle error when fetching daily progress fails', async () => {
            const mockError = new Error('Database connection failed');
            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                not: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: null, error: mockError }),
            };

            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            const result = await HistoryService.getDailyProgress('user-1', new Date('2026-07-28'));

            expect(result.data).toBeNull();
            expect(result.error).toEqual(mockError);
        });
    });

    describe('getWeeklyProgress', () => {
        it('should return weekly routines for the user', async () => {
            const mockData = [{ id: 'w1', fecha_dia: '2026-07-28' }];

            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                gte: jest.fn().mockReturnThis(),
                not: jest.fn().mockResolvedValue({ data: mockData, error: null }),
            };

            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            const result = await HistoryService.getWeeklyProgress('user-1');

            expect(supabase.from).toHaveBeenCalledWith('rutinas_diarias');
            expect(result.data).toEqual(mockData);
            expect(result.error).toBeNull();
        });

        it('should return error if fetching weekly progress fails', async () => {
            const mockError = new Error('Fetch failed');

            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                gte: jest.fn().mockReturnThis(),
                not: jest.fn().mockResolvedValue({ data: null, error: mockError }),
            };

            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            const result = await HistoryService.getWeeklyProgress('user-1');

            expect(result.data).toBeNull();
            expect(result.error).toEqual(mockError);
        });
    });

    describe('getMonthlyProgress', () => {
        it('should return monthly routines for specified year and month', async () => {
            const mockData = [{ id: 'm1', fecha_dia: '2026-07-15' }];

            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                gte: jest.fn().mockReturnThis(),
                lte: jest.fn().mockReturnThis(),
                not: jest.fn().mockResolvedValue({ data: mockData, error: null }),
            };

            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            const result = await HistoryService.getMonthlyProgress('user-1', 2026, 6);

            expect(supabase.from).toHaveBeenCalledWith('rutinas_diarias');
            expect(result.data).toEqual(mockData);
            expect(result.error).toBeNull();
        });

        it('should fallback to current date if year and month are null', async () => {
            const mockData = [{ id: 'm1' }];

            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                gte: jest.fn().mockReturnThis(),
                lte: jest.fn().mockReturnThis(),
                not: jest.fn().mockResolvedValue({ data: mockData, error: null }),
            };

            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            const result = await HistoryService.getMonthlyProgress('user-1');

            expect(result.data).toEqual(mockData);
            expect(result.error).toBeNull();
        });

        it('should return error if monthly progress fetch fails', async () => {
            const mockError = new Error('Monthly fetch error');

            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                gte: jest.fn().mockReturnThis(),
                lte: jest.fn().mockReturnThis(),
                not: jest.fn().mockResolvedValue({ data: null, error: mockError }),
            };

            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            const result = await HistoryService.getMonthlyProgress('user-1', 2026, 6);

            expect(result.data).toBeNull();
            expect(result.error).toEqual(mockError);
        });
    });

    describe('getExerciseHistory', () => {
        it('should return historical series for a specific exercise and user', async () => {
            const mockData = [{ id: 's1', peso_utilizado: 80, repeticiones: 10 }];

            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
            };

            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            const result = await HistoryService.getExerciseHistory('user-1', 'ex-123');

            expect(supabase.from).toHaveBeenCalledWith('series');
            expect(result.data).toEqual(mockData);
            expect(result.error).toBeNull();
        });

        it('should handle error when fetching exercise history fails', async () => {
            const mockError = new Error('Error getting series');

            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: null, error: mockError }),
            };

            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            const result = await HistoryService.getExerciseHistory('user-1', 'ex-123');

            expect(result.data).toBeNull();
            expect(result.error).toEqual(mockError);
        });
    });
});
