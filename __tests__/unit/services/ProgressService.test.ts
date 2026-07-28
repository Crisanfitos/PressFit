import { ProgressService } from '../../../src/services/ProgressService';
import { HistoryService } from '../../../src/services/HistoryService';
import { supabase } from '../../../src/lib/supabase';

jest.mock('../../../src/lib/supabase', () => ({
    supabase: {
        from: jest.fn(),
        storage: {
            from: jest.fn(),
        },
    },
}));

jest.mock('../../../src/services/HistoryService', () => ({
    HistoryService: {
        getDailyProgress: jest.fn(),
        getWeeklyProgress: jest.fn(),
        getMonthlyProgress: jest.fn(),
        getExerciseHistory: jest.fn(),
    },
}));

describe('ProgressService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Facade methods delegation to HistoryService', () => {
        it('should delegate getDailyProgress to HistoryService', async () => {
            (HistoryService.getDailyProgress as jest.Mock).mockResolvedValue({ data: [], error: null });
            const date = new Date();
            await ProgressService.getDailyProgress('u1', date);
            expect(HistoryService.getDailyProgress).toHaveBeenCalledWith('u1', date);
        });

        it('should delegate getWeeklyProgress to HistoryService', async () => {
            (HistoryService.getWeeklyProgress as jest.Mock).mockResolvedValue({ data: [], error: null });
            await ProgressService.getWeeklyProgress('u1');
            expect(HistoryService.getWeeklyProgress).toHaveBeenCalledWith('u1');
        });

        it('should delegate getMonthlyProgress to HistoryService', async () => {
            (HistoryService.getMonthlyProgress as jest.Mock).mockResolvedValue({ data: [], error: null });
            await ProgressService.getMonthlyProgress('u1', 2026, 7);
            expect(HistoryService.getMonthlyProgress).toHaveBeenCalledWith('u1', 2026, 7);
        });

        it('should delegate getExerciseHistory to HistoryService', async () => {
            (HistoryService.getExerciseHistory as jest.Mock).mockResolvedValue({ data: [], error: null });
            await ProgressService.getExerciseHistory('u1', 'ex1');
            expect(HistoryService.getExerciseHistory).toHaveBeenCalledWith('u1', 'ex1');
        });
    });

    describe('Photo Progress Management', () => {
        it('should fetch progress photos and generate signed URLs', async () => {
            const mockPhotos = [
                { id: 'p1', usuario_id: 'u1', url_foto: 'http://supabase/fotos-progreso/u1/123.jpg' },
            ];

            const mockFromQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: mockPhotos, error: null }),
            };

            const mockStorageBucket = {
                createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: 'http://signed.url/123.jpg' }, error: null }),
            };

            (supabase.from as jest.Mock).mockReturnValue(mockFromQuery);
            (supabase.storage.from as jest.Mock).mockReturnValue(mockStorageBucket);

            const result = await ProgressService.getProgressPhotos('u1');

            expect(result.data).toBeDefined();
            expect(result.data?.[0].url_foto).toBe('http://signed.url/123.jpg');
            expect(result.error).toBeNull();
        });

        it('should handle error when fetching progress photos fails', async () => {
            const mockError = new Error('Photos error');
            const mockFromQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: null, error: mockError }),
            };

            (supabase.from as jest.Mock).mockReturnValue(mockFromQuery);

            const result = await ProgressService.getProgressPhotos('u1');

            expect(result.data).toBeNull();
            expect(result.error).toEqual(mockError);
        });

        it('should update progress photo', async () => {
            const updatedPhoto = { id: 'p1', comentario: 'Nuevo comentario' };
            const mockFromQuery = {
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: updatedPhoto, error: null }),
            };

            (supabase.from as jest.Mock).mockReturnValue(mockFromQuery);

            const result = await ProgressService.updateProgressPhoto('p1', { comentario: 'Nuevo comentario' });

            expect(result.data).toEqual(updatedPhoto);
            expect(result.error).toBeNull();
        });

        it('should delete progress photos and files from storage', async () => {
            const mockPhotos = [
                { id: 'p1', url_foto: 'http://supabase/fotos-progreso/u1/1.jpg' },
            ];

            const mockSelectQuery = {
                select: jest.fn().mockReturnThis(),
                in: jest.fn().mockResolvedValue({ data: mockPhotos, error: null }),
            };

            const mockDeleteQuery = {
                delete: jest.fn().mockReturnThis(),
                in: jest.fn().mockResolvedValue({ error: null }),
            };

            const mockStorageBucket = {
                remove: jest.fn().mockResolvedValue({ error: null }),
            };

            (supabase.from as jest.Mock)
                .mockReturnValueOnce(mockSelectQuery)
                .mockReturnValueOnce(mockDeleteQuery);
            (supabase.storage.from as jest.Mock).mockReturnValue(mockStorageBucket);

            const result = await ProgressService.deleteProgressPhotos(['p1']);

            expect(result.success).toBe(true);
            expect(result.error).toBeNull();
        });
    });
});
