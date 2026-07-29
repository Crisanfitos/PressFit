import { ProgressService } from '../../../src/services/ProgressService';
import { HistoryService } from '../../../src/services/HistoryService';
import { supabase } from '../../../src/lib/supabase';

jest.mock('../../../src/services/HistoryService', () => ({
    HistoryService: {
        getDailyProgress: jest.fn(),
        getWeeklyProgress: jest.fn(),
        getMonthlyProgress: jest.fn(),
        getExerciseHistory: jest.fn(),
    },
}));

jest.mock('../../../src/lib/supabase', () => ({
    supabase: {
        from: jest.fn(),
        storage: {
            from: jest.fn(),
        },
    },
}));

describe('ProgressService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ----------------------------------------------------------------
    // HistoryService Facade Methods
    // ----------------------------------------------------------------
    describe('HistoryService facade methods', () => {
        it('should delegate getDailyProgress to HistoryService', async () => {
            const date = new Date('2026-07-29');
            (HistoryService.getDailyProgress as jest.Mock).mockResolvedValueOnce({ data: [], error: null });

            const result = await ProgressService.getDailyProgress('user_123', date);

            expect(HistoryService.getDailyProgress).toHaveBeenCalledWith('user_123', date);
            expect(result).toEqual({ data: [], error: null });
        });

        it('should delegate getWeeklyProgress to HistoryService', async () => {
            (HistoryService.getWeeklyProgress as jest.Mock).mockResolvedValueOnce({ data: [], error: null });

            const result = await ProgressService.getWeeklyProgress('user_123');

            expect(HistoryService.getWeeklyProgress).toHaveBeenCalledWith('user_123');
            expect(result).toEqual({ data: [], error: null });
        });

        it('should delegate getMonthlyProgress to HistoryService', async () => {
            (HistoryService.getMonthlyProgress as jest.Mock).mockResolvedValueOnce({ data: [], error: null });

            const result = await ProgressService.getMonthlyProgress('user_123', 2026, 7);

            expect(HistoryService.getMonthlyProgress).toHaveBeenCalledWith('user_123', 2026, 7);
            expect(result).toEqual({ data: [], error: null });
        });

        it('should delegate getExerciseHistory to HistoryService', async () => {
            (HistoryService.getExerciseHistory as jest.Mock).mockResolvedValueOnce({ data: [], error: null });

            const result = await ProgressService.getExerciseHistory('user_123', 'ex_456');

            expect(HistoryService.getExerciseHistory).toHaveBeenCalledWith('user_123', 'ex_456');
            expect(result).toEqual({ data: [], error: null });
        });
    });

    // ----------------------------------------------------------------
    // getProgressPhotos
    // ----------------------------------------------------------------
    describe('getProgressPhotos', () => {
        it('should fetch progress photos and convert url_foto to signed URLs', async () => {
            const mockPhotos = [
                { id: 'photo_1', url_foto: 'https://supa.storage/fotos-progreso/user_123/pic1.jpg' },
                { id: 'photo_2', url_foto: 'https://supa.storage/fotos-progreso/user_123/pic2.jpg' },
            ];

            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: mockPhotos, error: null }),
            };
            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            const mockStorageFrom = {
                createSignedUrl: jest.fn()
                    .mockResolvedValueOnce({ data: { signedUrl: 'https://signed.url/pic1.jpg' }, error: null })
                    .mockResolvedValueOnce({ data: { signedUrl: 'https://signed.url/pic2.jpg' }, error: null }),
            };
            (supabase.storage.from as jest.Mock).mockReturnValue(mockStorageFrom);

            const res = await ProgressService.getProgressPhotos('user_123');

            expect(supabase.from).toHaveBeenCalledWith('fotos_progreso');
            expect(mockQuery.eq).toHaveBeenCalledWith('usuario_id', 'user_123');
            expect(res.data).toEqual([
                { id: 'photo_1', url_foto: 'https://signed.url/pic1.jpg' },
                { id: 'photo_2', url_foto: 'https://signed.url/pic2.jpg' },
            ]);
            expect(res.error).toBeNull();
        });

        it('should fallback to original photo url if signed URL generation fails', async () => {
            const mockPhotos = [
                { id: 'photo_1', url_foto: 'https://supa.storage/fotos-progreso/user_123/pic1.jpg' },
            ];

            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: mockPhotos, error: null }),
            };
            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            const mockStorageFrom = {
                createSignedUrl: jest.fn().mockResolvedValueOnce({ data: null, error: new Error('Signed URL error') }),
            };
            (supabase.storage.from as jest.Mock).mockReturnValue(mockStorageFrom);

            const res = await ProgressService.getProgressPhotos('user_123');

            expect(res.data).toEqual(mockPhotos);
        });

        it('should handle DB fetch error gracefully and return { data: null, error }', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
            };
            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            const res = await ProgressService.getProgressPhotos('user_123');

            expect(res.data).toBeNull();
            expect(res.error).toEqual(new Error('DB Error'));
            consoleSpy.mockRestore();
        });
    });

    // ----------------------------------------------------------------
    // uploadProgressPhoto
    // ----------------------------------------------------------------
    describe('uploadProgressPhoto', () => {
        it('should fetch blob, upload ArrayBuffer to storage, insert record and return record with signed URL', async () => {
            const mockBlob = new Blob(['fake_image']);
            global.fetch = jest.fn().mockResolvedValueOnce({
                blob: jest.fn().mockResolvedValueOnce(mockBlob),
            } as any);

            const mockArrayBuffer = new ArrayBuffer(8);
            global.Response = jest.fn().mockImplementation(() => ({
                arrayBuffer: jest.fn().mockResolvedValueOnce(mockArrayBuffer),
            })) as any;

            const mockStorageFrom = {
                upload: jest.fn().mockResolvedValueOnce({ error: null }),
                getPublicUrl: jest.fn().mockReturnValueOnce({ data: { publicUrl: 'https://public.url/img.jpg' } }),
                createSignedUrl: jest.fn().mockResolvedValueOnce({ data: { signedUrl: 'https://signed.url/img.jpg' } }),
            };
            (supabase.storage.from as jest.Mock).mockReturnValue(mockStorageFrom);

            const insertedPhoto = {
                id: 'new_photo_1',
                usuario_id: 'user_123',
                url_foto: 'https://public.url/img.jpg',
                comentario: 'Front double bicep',
                created_at: '2026-07-29T10:00:00.000Z',
            };

            const mockQuery = {
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValueOnce({ data: insertedPhoto, error: null }),
            };
            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            const date = new Date('2026-07-29T10:00:00.000Z');
            const res = await ProgressService.uploadProgressPhoto('user_123', 'file:///path/to/pic.jpg', date, 'Front double bicep');

            expect(mockStorageFrom.upload).toHaveBeenCalledWith(
                expect.stringMatching(/^user_123\/\d+\.jpg$/),
                mockArrayBuffer,
                { contentType: 'image/jpg', upsert: true }
            );
            expect(mockQuery.insert).toHaveBeenCalledWith({
                usuario_id: 'user_123',
                url_foto: 'https://public.url/img.jpg',
                comentario: 'Front double bicep',
                created_at: '2026-07-29T10:00:00.000Z',
            });
            expect(res.data).toEqual({
                ...insertedPhoto,
                url_foto: 'https://signed.url/img.jpg',
            });
            expect(res.error).toBeNull();
        });

        it('should handle upload error and return { data: null, error }', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            global.fetch = jest.fn().mockResolvedValueOnce({
                blob: jest.fn().mockResolvedValueOnce(new Blob()),
            } as any);

            const mockStorageFrom = {
                upload: jest.fn().mockResolvedValueOnce({ error: new Error('Storage Quota Exceeded') }),
            };
            (supabase.storage.from as jest.Mock).mockReturnValue(mockStorageFrom);

            const res = await ProgressService.uploadProgressPhoto('user_123', 'file:///path/to/pic.jpg', null, 'Comment');

            expect(res.data).toBeNull();
            expect(res.error).toEqual(new Error('Storage Quota Exceeded'));
            consoleSpy.mockRestore();
        });
    });

    // ----------------------------------------------------------------
    // updateProgressPhoto
    // ----------------------------------------------------------------
    describe('updateProgressPhoto', () => {
        it('should update progress photo record and return data', async () => {
            const updatedRecord = { id: 'photo_1', comentario: 'Updated comment' };
            const mockQuery = {
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValueOnce({ data: updatedRecord, error: null }),
            };
            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            const res = await ProgressService.updateProgressPhoto('photo_1', { comentario: 'Updated comment' });

            expect(supabase.from).toHaveBeenCalledWith('fotos_progreso');
            expect(mockQuery.update).toHaveBeenCalledWith({ comentario: 'Updated comment' });
            expect(mockQuery.eq).toHaveBeenCalledWith('id', 'photo_1');
            expect(res.data).toEqual(updatedRecord);
            expect(res.error).toBeNull();
        });

        it('should handle update error and return { data: null, error }', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const mockQuery = {
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValueOnce({ data: null, error: new Error('Update failed') }),
            };
            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            const res = await ProgressService.updateProgressPhoto('photo_1', { comentario: 'Error' });

            expect(res.data).toBeNull();
            expect(res.error).toEqual(new Error('Update failed'));
            consoleSpy.mockRestore();
        });
    });

    // ----------------------------------------------------------------
    // deleteProgressPhotos
    // ----------------------------------------------------------------
    describe('deleteProgressPhotos', () => {
        it('should fetch records, remove storage files, delete DB records and return success true', async () => {
            const mockPhotos = [
                { id: 'photo_1', url_foto: 'https://supa.storage/fotos-progreso/user_123/p1.jpg' },
                { id: 'photo_2', url_foto: 'https://supa.storage/fotos-progreso/user_123/p2.jpg' },
            ];

            const mockSelectQuery = {
                select: jest.fn().mockReturnThis(),
                in: jest.fn().mockResolvedValueOnce({ data: mockPhotos, error: null }),
            };

            const mockDeleteQuery = {
                delete: jest.fn().mockReturnThis(),
                in: jest.fn().mockResolvedValueOnce({ error: null }),
            };

            (supabase.from as jest.Mock)
                .mockReturnValueOnce(mockSelectQuery)
                .mockReturnValueOnce(mockDeleteQuery);

            const mockStorageFrom = {
                remove: jest.fn().mockResolvedValueOnce({ error: null }),
            };
            (supabase.storage.from as jest.Mock).mockReturnValue(mockStorageFrom);

            const res = await ProgressService.deleteProgressPhotos(['photo_1', 'photo_2']);

            expect(mockSelectQuery.in).toHaveBeenCalledWith('id', ['photo_1', 'photo_2']);
            expect(mockStorageFrom.remove).toHaveBeenCalledWith(['user_123/p1.jpg', 'user_123/p2.jpg']);
            expect(mockDeleteQuery.in).toHaveBeenCalledWith('id', ['photo_1', 'photo_2']);
            expect(res).toEqual({ success: true, error: null });
        });

        it('should warn on storage error but continue DB delete', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
            const mockPhotos = [
                { id: 'photo_1', url_foto: 'https://supa.storage/fotos-progreso/user_123/p1.jpg' },
            ];

            const mockSelectQuery = {
                select: jest.fn().mockReturnThis(),
                in: jest.fn().mockResolvedValueOnce({ data: mockPhotos, error: null }),
            };

            const mockDeleteQuery = {
                delete: jest.fn().mockReturnThis(),
                in: jest.fn().mockResolvedValueOnce({ error: null }),
            };

            (supabase.from as jest.Mock)
                .mockReturnValueOnce(mockSelectQuery)
                .mockReturnValueOnce(mockDeleteQuery);

            const mockStorageFrom = {
                remove: jest.fn().mockResolvedValueOnce({ error: new Error('Storage file missing') }),
            };
            (supabase.storage.from as jest.Mock).mockReturnValue(mockStorageFrom);

            const res = await ProgressService.deleteProgressPhotos(['photo_1']);

            expect(consoleSpy).toHaveBeenCalledWith('Error deleting from storage:', expect.any(Error));
            expect(res).toEqual({ success: true, error: null });
            consoleSpy.mockRestore();
        });

        it('should handle DB fetch error gracefully and return { success: false, error }', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const mockSelectQuery = {
                select: jest.fn().mockReturnThis(),
                in: jest.fn().mockResolvedValueOnce({ data: null, error: new Error('Fetch failed') }),
            };
            (supabase.from as jest.Mock).mockReturnValue(mockSelectQuery);

            const res = await ProgressService.deleteProgressPhotos(['photo_1']);

            expect(res).toEqual({ success: false, error: new Error('Fetch failed') });
            consoleSpy.mockRestore();
        });
    });
});
