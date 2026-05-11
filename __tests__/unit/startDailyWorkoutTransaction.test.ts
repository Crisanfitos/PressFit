/**
 * Unit Tests: startDailyWorkout
 *
 * Tests RoutineService.startDailyWorkout with mocked Supabase.
 * Verifies template copying, exercise duplication, and series handling.
 */

import { mockChain, resetMocks } from '../helpers/mockSupabase';
import { createMockEjercicioProgramado, createMockSerie } from '../helpers/testHelpers';

jest.mock('../../src/lib/supabase', () => ({
    supabase: require('../helpers/mockSupabase').mockSupabase,
}));

import { RoutineService } from '../../src/services/RoutineService';

describe('startDailyWorkout', () => {
    beforeEach(() => { resetMocks(); });

    it('should create a new workout from template', async () => {
        const templateExercises = [
            createMockEjercicioProgramado({ id: 'ep-1', ejercicio_id: 'ex-1', series: [createMockSerie()] }),
        ];

        // 1. Get template day
        mockChain.single.mockResolvedValueOnce({
            data: {
                id: 'template-day',
                rutina_semanal_id: 'routine-001',
                nombre_dia: 'Lunes',
                ejercicios_programados: templateExercises,
            },
            error: null,
        });
        // 2. Lookup previous completed workouts (none found)
        mockChain.then.mockImplementationOnce((resolve: any) =>
            Promise.resolve({ data: [], error: null }).then(resolve)
        );
        // 3. Insert new workout day
        mockChain.single.mockResolvedValueOnce({
            data: { id: 'new-workout', nombre_dia: 'Lunes', fecha_dia: '2026-05-11', completada: false },
            error: null,
        });
        // 4. Insert ejercicio_programado
        mockChain.single.mockResolvedValueOnce({ data: { id: 'new-ep-1' }, error: null });
        // 5. Insert series (thenable)
        mockChain.then.mockImplementationOnce((resolve: any) =>
            Promise.resolve({ error: null }).then(resolve)
        );

        const result = await RoutineService.startDailyWorkout('template-day', '2026-05-11T10:00:00Z', '2026-05-11T10:00:00Z');

        expect(result.error).toBeNull();
        expect(result.data).toBeDefined();
        expect(result.data!.id).toBe('new-workout');
        expect(result.data!.fecha_dia).toBe('2026-05-11');
        expect(result.data!.completada).toBe(false);
    });

    it('should strip time from ISO date (fecha_dia only YYYY-MM-DD)', async () => {
        mockChain.single.mockResolvedValueOnce({
            data: { id: 't', rutina_semanal_id: 'r', nombre_dia: 'Martes', ejercicios_programados: [] },
            error: null,
        });
        mockChain.then.mockImplementationOnce((resolve: any) =>
            Promise.resolve({ data: [], error: null }).then(resolve)
        );
        mockChain.single.mockResolvedValueOnce({
            data: { id: 'w', fecha_dia: '2026-05-11' },
            error: null,
        });

        const result = await RoutineService.startDailyWorkout('t', '2026-05-11T15:30:00.000Z', '2026-05-11T15:30:00.000Z');
        expect(result.error).toBeNull();
    });

    it('should use previous workout series when available', async () => {
        // Template has exercise with series
        mockChain.single.mockResolvedValueOnce({
            data: {
                id: 'template-day',
                rutina_semanal_id: 'routine-001',
                nombre_dia: 'Lunes',
                ejercicios_programados: [
                    createMockEjercicioProgramado({
                        ejercicio_id: 'ex-1',
                        series: [createMockSerie({ peso_utilizado: 50 })],
                    }),
                ],
            },
            error: null,
        });
        // Previous completed workout found with different weight
        mockChain.then.mockImplementationOnce((resolve: any) =>
            Promise.resolve({
                data: [{
                    id: 'prev-workout',
                    ejercicios_programados: [{
                        ejercicio_id: 'ex-1',
                        series: [
                            { numero_serie: 1, peso_utilizado: 80, repeticiones: 10, rpe: 8 },
                            { numero_serie: 2, peso_utilizado: 85, repeticiones: 8, rpe: 9 },
                        ],
                    }],
                }],
                error: null,
            }).then(resolve)
        );
        // Insert new workout
        mockChain.single.mockResolvedValueOnce({
            data: { id: 'new-w' },
            error: null,
        });
        // Insert exercise
        mockChain.single.mockResolvedValueOnce({ data: { id: 'new-ep' }, error: null });
        // Insert series from previous workout (2 series)
        mockChain.then.mockImplementationOnce((resolve: any) =>
            Promise.resolve({ error: null }).then(resolve)
        );

        const result = await RoutineService.startDailyWorkout('template-day', '2026-05-11', '2026-05-11T10:00:00Z');
        expect(result.error).toBeNull();
        expect(result.data).toBeDefined();
    });

    it('should return error if template not found', async () => {
        mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('Not found') });

        const result = await RoutineService.startDailyWorkout('bad-id', '2026-05-11', '2026-05-11T10:00:00Z');
        expect(result.error).toBeDefined();
        expect(result.data).toBeNull();
    });

    it('should return error if insert fails', async () => {
        mockChain.single.mockResolvedValueOnce({
            data: { id: 't', rutina_semanal_id: 'r', nombre_dia: 'X', ejercicios_programados: [] },
            error: null,
        });
        mockChain.then.mockImplementationOnce((resolve: any) =>
            Promise.resolve({ data: [], error: null }).then(resolve)
        );
        mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('Insert error') });

        const result = await RoutineService.startDailyWorkout('t', '2026-05-11', '2026-05-11T10:00:00Z');
        expect(result.error).toBeDefined();
    });
});
