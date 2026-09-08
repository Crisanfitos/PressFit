import { WorkoutService } from '../../src/services/WorkoutService';
import { supabase } from '../../src/lib/supabase';
import { OfflineStorageService } from '../../src/services/OfflineStorageService';

// Reusable mock chain for supabase
const mockChain: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: { id: 'ep-1', ejercicio_id: 'ex-new' }, error: null }),
};

mockChain.then = jest.fn((resolve: any) =>
    Promise.resolve({ data: [], error: null }).then(resolve)
);

jest.spyOn(supabase, 'from').mockReturnValue(mockChain);

describe('WorkoutService.swapExerciseInWorkout (PF-310)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockChain.single.mockResolvedValue({
            data: { id: 'ep-1', ejercicio_id: 'ex-new', ejercicio: { id: 'ex-new', titulo: 'Sentadilla Hack' } },
            error: null,
        });
        mockChain.update.mockReturnValue(mockChain);
        mockChain.delete.mockReturnValue(mockChain);
        mockChain.insert.mockReturnValue(mockChain);
        mockChain.eq.mockReturnValue(mockChain);
        mockChain.select.mockReturnValue(mockChain);
    });

    it('should swap exercise successfully and insert new clean series', async () => {
        const spyGetCached = jest.spyOn(OfflineStorageService, 'getCachedWorkouts').mockResolvedValue({
            data: [
                {
                    id: 'w-1',
                    ejercicios_programados: [
                        { id: 'ep-1', ejercicio_id: 'ex-old', series: [{ id: 's-1' }] },
                    ],
                } as any,
            ],
            error: null,
        });
        const spySaveCached = jest.spyOn(OfflineStorageService, 'saveWorkouts').mockResolvedValue({
            data: null,
            error: null,
        });

        const res = await WorkoutService.swapExerciseInWorkout('w-1', 'ep-1', 'ex-new', 4);

        expect(res.error).toBeNull();
        expect(res.data).toBeDefined();
        expect(supabase.from).toHaveBeenCalledWith('ejercicios_programados');
        expect(mockChain.update).toHaveBeenCalledWith({ ejercicio_id: 'ex-new' });
        expect(mockChain.eq).toHaveBeenCalledWith('id', 'ep-1');

        // Series deletion
        expect(supabase.from).toHaveBeenCalledWith('series');
        expect(mockChain.delete).toHaveBeenCalled();
        expect(mockChain.eq).toHaveBeenCalledWith('ejercicio_programado_id', 'ep-1');

        // Series insertion for 4 sets
        expect(mockChain.insert).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ numero_serie: 1, ejercicio_programado_id: 'ep-1' }),
                expect.objectContaining({ numero_serie: 4, ejercicio_programado_id: 'ep-1' }),
            ])
        );

        expect(spySaveCached).toHaveBeenCalled();
        spyGetCached.mockRestore();
        spySaveCached.mockRestore();
    });

    it('should handle update error and return error object', async () => {
        mockChain.single.mockResolvedValueOnce({
            data: null,
            error: new Error('Database update error'),
        });

        const res = await WorkoutService.swapExerciseInWorkout('w-1', 'ep-1', 'ex-new', 3);

        expect(res.data).toBeNull();
        expect(res.error).toBeDefined();
    });

    it('should handle delete series error gracefully without throwing', async () => {
        mockChain.single.mockResolvedValueOnce({
            data: { id: 'ep-1', ejercicio_id: 'ex-new' },
            error: null,
        });

        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        // Mock delete to return error
        const deleteChain = {
            eq: jest.fn().mockResolvedValue({ error: new Error('Delete series failed') }),
        };
        (supabase.from as jest.Mock).mockImplementation((table: string) => {
            if (table === 'series') {
                return {
                    delete: () => deleteChain,
                    insert: () => ({ error: null }),
                };
            }
            return mockChain;
        });

        const res = await WorkoutService.swapExerciseInWorkout('w-1', 'ep-1', 'ex-new', 2);
        expect(res.data).toBeDefined();

        consoleWarnSpy.mockRestore();
        jest.spyOn(supabase, 'from').mockReturnValue(mockChain);
    });
});
