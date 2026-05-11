/**
 * Unit Tests: Series (WorkoutService CRUD)
 *
 * Tests WorkoutService methods for series management using mocked Supabase.
 */

import { mockChain, resetMocks } from '../helpers/mockSupabase';
import { createMockSerie } from '../helpers/testHelpers';

jest.mock('../../src/lib/supabase', () => ({
    supabase: require('../helpers/mockSupabase').mockSupabase,
}));

import { WorkoutService } from '../../src/services/WorkoutService';

describe('Series — WorkoutService CRUD', () => {
    beforeEach(() => {
        resetMocks();
    });

    describe('addSet', () => {
        it('should create a set for an existing scheduled exercise', async () => {
            const mockScheduledEx = { id: 'ep-001' };
            const mockNewSet = createMockSerie({ id: 'serie-new', numero_serie: 1, peso_utilizado: 50, repeticiones: 10 });

            // First call: find existing ejercicio_programado
            mockChain.single.mockResolvedValueOnce({ data: mockScheduledEx, error: null });
            // Second call: insert the series
            mockChain.single.mockResolvedValueOnce({ data: mockNewSet, error: null });

            const result = await WorkoutService.addSet('workout-001', 'exercise-001', 1, 50, 10);

            expect(result.error).toBeNull();
            expect(result.data).toBeDefined();
            expect(result.data!.peso_utilizado).toBe(50);
            expect(result.data!.repeticiones).toBe(10);
            expect(result.data!.numero_serie).toBe(1);
        });

        it('should create ejercicio_programado if it does not exist, then add set', async () => {
            // First call: find exercise — not found (PGRST116)
            mockChain.single.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116', message: 'Row not found' },
            });
            // Second call: get max order
            mockChain.maybeSingle.mockResolvedValueOnce({ data: { orden_ejecucion: 3 }, error: null });
            // Third call: insert new ejercicio_programado
            mockChain.single.mockResolvedValueOnce({ data: { id: 'ep-new' }, error: null });
            // Fourth call: insert the series
            const mockSet = createMockSerie({ id: 'serie-new' });
            mockChain.single.mockResolvedValueOnce({ data: mockSet, error: null });

            const result = await WorkoutService.addSet('workout-001', 'exercise-001', 1, 60, 8);

            expect(result.error).toBeNull();
            expect(result.data).toBeDefined();
        });

        it('should handle errors gracefully', async () => {
            mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('DB Error') });

            const result = await WorkoutService.addSet('workout-001', 'exercise-001', 1, 50, 10);

            expect(result.error).toBeDefined();
            expect(result.data).toBeNull();
        });
    });

    describe('updateSet', () => {
        it('should update weight and reps', async () => {
            const updatedSet = createMockSerie({ peso_utilizado: 55, repeticiones: 12, rpe: 9 });
            mockChain.single.mockResolvedValueOnce({ data: updatedSet, error: null });

            const result = await WorkoutService.updateSet('serie-001', { weight: 55, reps: 12, rpe: 9 });

            expect(result.error).toBeNull();
            expect(result.data!.peso_utilizado).toBe(55);
            expect(result.data!.repeticiones).toBe(12);
            expect(result.data!.rpe).toBe(9);
        });

        it('should handle partial updates', async () => {
            const updatedSet = createMockSerie({ peso_utilizado: 70 });
            mockChain.single.mockResolvedValueOnce({ data: updatedSet, error: null });

            const result = await WorkoutService.updateSet('serie-001', { weight: 70 });

            expect(result.error).toBeNull();
            expect(result.data!.peso_utilizado).toBe(70);
        });

        it('should return error on failure', async () => {
            mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('Update failed') });

            const result = await WorkoutService.updateSet('serie-001', { weight: 55 });

            expect(result.error).toBeDefined();
        });
    });

    describe('deleteSet', () => {
        it('should delete a set successfully', async () => {
            mockChain.then.mockImplementationOnce((resolve: any) =>
                Promise.resolve({ error: null }).then(resolve)
            );

            const result = await WorkoutService.deleteSet('serie-001');

            expect(result.error).toBeNull();
        });

        it('should return error on failure', async () => {
            mockChain.then.mockImplementationOnce((resolve: any) =>
                Promise.resolve({ error: new Error('Delete failed') }).then(resolve)
            );

            const result = await WorkoutService.deleteSet('serie-001');

            expect(result.error).toBeDefined();
        });
    });

    describe('getSeriesForExercise', () => {
        it('should return series for a scheduled exercise', async () => {
            const mockSeries = [
                createMockSerie({ id: 's1', numero_serie: 1 }),
                createMockSerie({ id: 's2', numero_serie: 2 }),
            ];

            // First call: find ejercicio_programado
            mockChain.maybeSingle.mockResolvedValueOnce({ data: { id: 'ep-001' }, error: null });
            // Second call: get series
            mockChain.then.mockImplementationOnce((resolve: any) =>
                Promise.resolve({ data: mockSeries, error: null }).then(resolve)
            );

            const result = await WorkoutService.getSeriesForExercise('workout-001', 'exercise-001');

            expect(result.error).toBeNull();
            expect(result.data).toHaveLength(2);
        });

        it('should return empty array if exercise not scheduled', async () => {
            mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

            const result = await WorkoutService.getSeriesForExercise('workout-001', 'exercise-999');

            expect(result.error).toBeNull();
            expect(result.data).toEqual([]);
        });
    });
});
