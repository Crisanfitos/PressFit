/**
 * Unit Tests: ExerciseService
 *
 * Tests ExerciseService methods with mocked Supabase.
 */

import { mockChain, mockSupabase, resetMocks } from '../helpers/mockSupabase';
import { createMockExercise } from '../helpers/testHelpers';

jest.mock('../../src/lib/supabase', () => ({
    supabase: require('../helpers/mockSupabase').mockSupabase,
}));

import { ExerciseService } from '../../src/services/ExerciseService';

describe('ExerciseService', () => {
    beforeEach(() => {
        resetMocks();
    });

    describe('getExercises', () => {
        it('should return a sorted list of exercises', async () => {
            const exercises = [
                createMockExercise({ id: 'e1', titulo: 'Curl Bíceps' }),
                createMockExercise({ id: 'e2', titulo: 'Press Banca' }),
            ];
            mockChain.then.mockImplementationOnce((resolve: any) =>
                Promise.resolve({ data: exercises, error: null }).then(resolve)
            );

            const result = await ExerciseService.getExercises();

            expect(result.error).toBeNull();
            expect(result.data).toHaveLength(2);
            expect(result.data![0].titulo).toBe('Curl Bíceps');
        });

        it('should return error on failure', async () => {
            mockChain.then.mockImplementationOnce((resolve: any) =>
                Promise.resolve({ data: null, error: new Error('DB Error') }).then(resolve)
            );

            const result = await ExerciseService.getExercises();

            expect(result.error).toBeDefined();
            expect(result.data).toBeNull();
        });
    });

    describe('getExerciseById', () => {
        it('should return a single exercise', async () => {
            const exercise = createMockExercise({ id: 'e1' });
            mockChain.single.mockResolvedValueOnce({ data: exercise, error: null });

            const result = await ExerciseService.getExerciseById('e1');

            expect(result.error).toBeNull();
            expect(result.data!.id).toBe('e1');
            expect(result.data!.titulo).toBe('Press Banca');
        });

        it('should return error if not found', async () => {
            mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('Not found') });

            const result = await ExerciseService.getExerciseById('nonexistent');

            expect(result.error).toBeDefined();
            expect(result.data).toBeNull();
        });
    });

    describe('addExercisesToRoutineDay', () => {
        it('should add exercises starting from the correct order index', async () => {
            // First call: get current max order
            mockChain.then.mockImplementationOnce((resolve: any) =>
                Promise.resolve({ data: [{ orden_ejecucion: 2 }], error: null }).then(resolve)
            );
            // Second call: insert exercises
            const insertedExercises = [
                { id: 'ep-new-1', ejercicio_id: 'e1', orden_ejecucion: 3 },
                { id: 'ep-new-2', ejercicio_id: 'e2', orden_ejecucion: 4 },
            ];
            mockChain.then.mockImplementationOnce((resolve: any) =>
                Promise.resolve({ data: insertedExercises, error: null }).then(resolve)
            );

            const result = await ExerciseService.addExercisesToRoutineDay('user-1', 'day-001', ['e1', 'e2']);

            expect(result.error).toBeNull();
            expect(result.data).toHaveLength(2);
        });

        it('should start at order 1 when no existing exercises', async () => {
            // First call: no exercises yet
            mockChain.then.mockImplementationOnce((resolve: any) =>
                Promise.resolve({ data: [], error: null }).then(resolve)
            );
            // Second call: insert
            mockChain.then.mockImplementationOnce((resolve: any) =>
                Promise.resolve({ data: [{ id: 'ep-1', orden_ejecucion: 1 }], error: null }).then(resolve)
            );

            const result = await ExerciseService.addExercisesToRoutineDay('user-1', 'day-001', ['e1']);

            expect(result.error).toBeNull();
            expect(result.data).toHaveLength(1);
        });

        it('should return error on failure', async () => {
            mockChain.then.mockImplementationOnce((resolve: any) =>
                Promise.resolve({ data: [], error: null }).then(resolve)
            );
            mockChain.then.mockImplementationOnce((resolve: any) =>
                Promise.resolve({ data: null, error: new Error('Insert failed') }).then(resolve)
            );

            const result = await ExerciseService.addExercisesToRoutineDay('user-1', 'day-001', ['e1']);

            expect(result.error).toBeDefined();
        });
    });

    describe('getPersonalNote', () => {
        it('should return note content', async () => {
            mockChain.single.mockResolvedValueOnce({
                data: { contenido_nota: 'Agarre prono' },
                error: null,
            });

            const result = await ExerciseService.getPersonalNote('user-1', 'e1');

            expect(result.error).toBeNull();
            expect(result.data).toBe('Agarre prono');
        });

        it('should return null when no note exists (PGRST116)', async () => {
            mockChain.single.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116', message: 'Row not found' },
            });

            const result = await ExerciseService.getPersonalNote('user-1', 'e1');

            expect(result.error).toBeNull();
            expect(result.data).toBeNull();
        });
    });

    describe('savePersonalNote', () => {
        it('should upsert a personal note', async () => {
            const savedNote = { id: 'note-1', contenido_nota: 'Codos pegados' };
            mockChain.single.mockResolvedValueOnce({ data: savedNote, error: null });

            const result = await ExerciseService.savePersonalNote('user-1', 'e1', 'Codos pegados');

            expect(result.error).toBeNull();
            expect(result.data).toBeDefined();
        });
    });
});
