/**
 * workoutService.coverage.test.ts
 *
 * Unit tests para WorkoutService usando mocks de Supabase.
 * Cubre todos los métodos y ramas de error para maximizar la cobertura.
 */

import { WorkoutService } from '../../src/services/WorkoutService';
import { supabase } from '../../src/lib/supabase';

// ─── Mock chain reutilizable ──────────────────────────────────────────────────
const mockChain: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
};

// Simular terminación de cadena para queries sin .single()/.maybeSingle()
mockChain.then = jest.fn((resolve: any) =>
    Promise.resolve({ data: [], error: null }).then(resolve)
);

jest.spyOn(supabase, 'from').mockReturnValue(mockChain);

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
    jest.clearAllMocks();
    // Restaurar comportamiento por defecto del .then
    mockChain.then = jest.fn((resolve: any) =>
        Promise.resolve({ data: [], error: null }).then(resolve)
    );
});

// ─── getWorkoutDetails ────────────────────────────────────────────────────────
describe('WorkoutService.getWorkoutDetails', () => {
    it('should return workout data with sorted exercises and series', async () => {
        const mockWorkout = {
            id: 'w-1',
            nombre_dia: 'Lunes',
            fecha_dia: '2026-01-01',
            completada: false,
            ejercicios_programados: [
                {
                    id: 'ep-2',
                    orden_ejecucion: 2,
                    series: [{ numero_serie: 2 }, { numero_serie: 1 }],
                },
                {
                    id: 'ep-1',
                    orden_ejecucion: 1,
                    series: null,
                },
            ],
        };
        mockChain.single.mockResolvedValueOnce({ data: mockWorkout, error: null });

        const res = await WorkoutService.getWorkoutDetails('w-1');

        expect(res.error).toBeNull();
        expect(res.data?.ejercicios_programados?.[0].id).toBe('ep-1'); // sorted by orden
        expect(res.data?.ejercicios_programados?.[1].series?.[0].numero_serie).toBe(1); // sorted
    });

    it('should return data when ejercicios_programados is undefined', async () => {
        mockChain.single.mockResolvedValueOnce({
            data: { id: 'w-2', completada: false },
            error: null,
        });

        const res = await WorkoutService.getWorkoutDetails('w-2');
        expect(res.error).toBeNull();
        expect(res.data?.id).toBe('w-2');
    });

    it('should return error when supabase throws', async () => {
        mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('DB Error') });

        const res = await WorkoutService.getWorkoutDetails('w-err');
        expect(res.error).not.toBeNull();
        expect(res.data).toBeNull();
    });
});

// ─── createWorkout ────────────────────────────────────────────────────────────
describe('WorkoutService.createWorkout', () => {
    it('should create workout from template with exercises (no previous workout)', async () => {
        // 1. templateDay query
        mockChain.single.mockResolvedValueOnce({
            data: {
                id: 'tmpl-1',
                rutina_semanal_id: 'rs-1',
                nombre_dia: 'Lunes',
                ejercicios_programados: [
                    { ejercicio_id: 'ej-1', orden_ejecucion: 1, notas_sesion: null, tipo_peso: 'total' },
                ],
            },
            error: null,
        });

        // 2. insert new workout
        mockChain.single.mockResolvedValueOnce({ data: { id: 'new-w-1' }, error: null });

        // 3. insert ejercicios_programados -> select('id, ejercicio_id')
        mockChain.then.mockImplementationOnce((resolve: any) =>
            resolve({ data: [{ id: 'ep-new-1', ejercicio_id: 'ej-1' }], error: null })
        );

        // 4. Query for last completed workout (returns nothing)
        mockChain.then.mockImplementationOnce((resolve: any) =>
            resolve({ data: [], error: null })
        );

        // 5. getWorkoutDetails call at the end
        mockChain.single.mockResolvedValueOnce({
            data: { id: 'new-w-1', ejercicios_programados: [] },
            error: null,
        });

        const res = await WorkoutService.createWorkout('user-1', 'tmpl-1');
        expect(res.error).toBeNull();
    });

    it('should create workout with no exercises in template', async () => {
        // 1. templateDay with no exercises
        mockChain.single.mockResolvedValueOnce({
            data: {
                id: 'tmpl-empty',
                rutina_semanal_id: 'rs-1',
                nombre_dia: 'Martes',
                ejercicios_programados: [],
            },
            error: null,
        });

        // 2. insert new workout
        mockChain.single.mockResolvedValueOnce({ data: { id: 'new-w-2' }, error: null });

        // 3. getWorkoutDetails
        mockChain.single.mockResolvedValueOnce({
            data: { id: 'new-w-2', ejercicios_programados: [] },
            error: null,
        });

        const res = await WorkoutService.createWorkout('user-1', 'tmpl-empty');
        expect(res.error).toBeNull();
        expect(res.data?.id).toBe('new-w-2');
    });

    it('should copy series from last completed workout when it exists', async () => {
        // 1. templateDay
        mockChain.single.mockResolvedValueOnce({
            data: {
                id: 'tmpl-1',
                rutina_semanal_id: 'rs-1',
                nombre_dia: 'Miercoles',
                ejercicios_programados: [
                    { ejercicio_id: 'ej-1', orden_ejecucion: 1, notas_sesion: null, tipo_peso: 'total' },
                ],
            },
            error: null,
        });

        // 2. insert new workout
        mockChain.single.mockResolvedValueOnce({ data: { id: 'new-w-3' }, error: null });

        // 3. insert ejercicios_programados
        mockChain.then.mockImplementationOnce((resolve: any) =>
            resolve({ data: [{ id: 'ep-new-1', ejercicio_id: 'ej-1' }], error: null })
        );

        // 4. Last completed workout with series
        mockChain.then.mockImplementationOnce((resolve: any) =>
            resolve({
                data: [{
                    id: 'old-w-1',
                    ejercicios_programados: [{
                        ejercicio_id: 'ej-1',
                        series: [
                            { numero_serie: 1, peso_utilizado: 80, repeticiones: 10, rpe: 8 },
                            { numero_serie: 2, peso_utilizado: 85, repeticiones: 8, rpe: 9 },
                        ],
                    }],
                }],
                error: null,
            })
        );

        // 5. insert copied series
        mockChain.then.mockImplementationOnce((resolve: any) =>
            resolve({ data: [], error: null })
        );

        // 6. getWorkoutDetails
        mockChain.single.mockResolvedValueOnce({
            data: { id: 'new-w-3', ejercicios_programados: [] },
            error: null,
        });

        const res = await WorkoutService.createWorkout('user-1', 'tmpl-1');
        expect(res.error).toBeNull();
    });

    it('should handle error fetching template day', async () => {
        mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('Template Error') });

        const res = await WorkoutService.createWorkout('user-1', 'bad-tmpl');
        expect(res.error).not.toBeNull();
        expect(res.data).toBeNull();
    });

    it('should handle error inserting new workout', async () => {
        mockChain.single.mockResolvedValueOnce({
            data: {
                id: 'tmpl-1',
                rutina_semanal_id: 'rs-1',
                nombre_dia: 'Jueves',
                ejercicios_programados: [],
            },
            error: null,
        });
        mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('Insert Error') });

        const res = await WorkoutService.createWorkout('user-1', 'tmpl-1');
        expect(res.error).not.toBeNull();
    });
});

// ─── completeWorkout ──────────────────────────────────────────────────────────
describe('WorkoutService.completeWorkout', () => {
    it('should mark workout as completed', async () => {
        mockChain.single.mockResolvedValueOnce({
            data: { id: 'w-1', completada: true },
            error: null,
        });

        const res = await WorkoutService.completeWorkout('w-1');
        expect(res.error).toBeNull();
        expect(res.data?.completada).toBe(true);
    });

    it('should return error when completing fails', async () => {
        mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('Complete Error') });

        const res = await WorkoutService.completeWorkout('w-err');
        expect(res.error).not.toBeNull();
        expect(res.data).toBeNull();
    });

    it('should accept optional durationMinutes parameter', async () => {
        mockChain.single.mockResolvedValueOnce({ data: { id: 'w-2', completada: true }, error: null });

        const res = await WorkoutService.completeWorkout('w-2', 45);
        expect(res.error).toBeNull();
    });
});

// ─── getSeriesForExercise ─────────────────────────────────────────────────────
describe('WorkoutService.getSeriesForExercise', () => {
    it('should return series for a scheduled exercise', async () => {
        // 1. Find scheduled exercise
        mockChain.maybeSingle.mockResolvedValueOnce({ data: { id: 'ep-1' }, error: null });

        // 2. Fetch series
        mockChain.then.mockImplementationOnce((resolve: any) =>
            resolve({ data: [{ id: 's-1', numero_serie: 1 }], error: null })
        );

        const res = await WorkoutService.getSeriesForExercise('w-1', 'ej-1');
        expect(res.error).toBeNull();
        expect(res.data).toHaveLength(1);
    });

    it('should return empty array if no scheduled exercise found', async () => {
        mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

        const res = await WorkoutService.getSeriesForExercise('w-1', 'ej-missing');
        expect(res.error).toBeNull();
        expect(res.data).toEqual([]);
    });

    it('should return error if finding scheduled exercise fails', async () => {
        mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: new Error('Find Error') });

        const res = await WorkoutService.getSeriesForExercise('w-1', 'ej-1');
        expect(res.error).not.toBeNull();
        expect(res.data).toBeNull();
    });

    it('should return error if fetching series fails', async () => {
        mockChain.maybeSingle.mockResolvedValueOnce({ data: { id: 'ep-1' }, error: null });

        mockChain.then.mockImplementationOnce((resolve: any) =>
            resolve({ data: null, error: new Error('Series Error') })
        );

        const res = await WorkoutService.getSeriesForExercise('w-1', 'ej-1');
        expect(res.error).not.toBeNull();
    });
});

// ─── addSet ───────────────────────────────────────────────────────────────────
describe('WorkoutService.addSet', () => {
    it('should add a set to an existing scheduled exercise', async () => {
        mockChain.single.mockResolvedValueOnce({ data: { id: 'ep-1' }, error: null });
        mockChain.single.mockResolvedValueOnce({
            data: { id: 's-new', numero_serie: 1, peso_utilizado: 50, repeticiones: 10 },
            error: null,
        });

        const res = await WorkoutService.addSet('w-1', 'ej-1', 1, 50, 10);
        expect(res.error).toBeNull();
        expect(res.data?.id).toBe('s-new');
    });

    it('should create scheduled exercise when not found (PGRST116) and add set', async () => {
        mockChain.single.mockResolvedValueOnce({
            data: null,
            error: { code: 'PGRST116', message: 'Not found' },
        });
        mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
        mockChain.single.mockResolvedValueOnce({ data: { id: 'ep-new' }, error: null });
        mockChain.single.mockResolvedValueOnce({ data: { id: 's-new', numero_serie: 1 }, error: null });

        const res = await WorkoutService.addSet('w-1', 'ej-new', 1, 70, 8);
        expect(res.error).toBeNull();
        expect(res.data?.id).toBe('s-new');
    });

    it('should use existing max order when creating new scheduled exercise', async () => {
        mockChain.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
        mockChain.maybeSingle.mockResolvedValueOnce({ data: { orden_ejecucion: 3 }, error: null });
        mockChain.single.mockResolvedValueOnce({ data: { id: 'ep-new-2' }, error: null });
        mockChain.single.mockResolvedValueOnce({ data: { id: 's-new-2' }, error: null });

        const res = await WorkoutService.addSet('w-1', 'ej-new-2', 1, 60, 12);
        expect(res.error).toBeNull();
    });

    it('should throw if find error is not PGRST116', async () => {
        mockChain.single.mockResolvedValueOnce({
            data: null,
            error: { code: 'OTHER_ERROR', message: 'Fatal DB Error' },
        });

        const res = await WorkoutService.addSet('w-1', 'ej-1', 1, 50, 10);
        expect(res.error).not.toBeNull();
    });

    it('should handle error when creating scheduled exercise fails', async () => {
        mockChain.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
        mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
        mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('Create EP Error') });

        const res = await WorkoutService.addSet('w-1', 'ej-1', 1, 50, 10);
        expect(res.error).not.toBeNull();
    });

    it('should handle error inserting the set', async () => {
        mockChain.single.mockResolvedValueOnce({ data: { id: 'ep-1' }, error: null });
        mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('Insert Set Error') });

        const res = await WorkoutService.addSet('w-1', 'ej-1', 1, 50, 10);
        expect(res.error).not.toBeNull();
    });
});

// ─── updateSet ────────────────────────────────────────────────────────────────
describe('WorkoutService.updateSet', () => {
    it('should update weight and reps', async () => {
        mockChain.single.mockResolvedValueOnce({
            data: { id: 's-1', peso_utilizado: 90, repeticiones: 6 },
            error: null,
        });

        const res = await WorkoutService.updateSet('s-1', { weight: 90, reps: 6 });
        expect(res.error).toBeNull();
        expect(res.data?.peso_utilizado).toBe(90);
    });

    it('should update rpe and descanso_segundos', async () => {
        mockChain.single.mockResolvedValueOnce({
            data: { id: 's-1', rpe: 9, descanso_segundos: 90 },
            error: null,
        });

        const res = await WorkoutService.updateSet('s-1', { rpe: 9, descanso_segundos: 90 });
        expect(res.error).toBeNull();
    });

    it('should update with empty updates object (no-op)', async () => {
        mockChain.single.mockResolvedValueOnce({ data: { id: 's-1' }, error: null });

        const res = await WorkoutService.updateSet('s-1', {});
        expect(res.error).toBeNull();
    });

    it('should return error if update fails', async () => {
        mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('Update Error') });

        const res = await WorkoutService.updateSet('s-err', { weight: 50 });
        expect(res.error).not.toBeNull();
        expect(res.data).toBeNull();
    });
});

// ─── deleteSet ────────────────────────────────────────────────────────────────
describe('WorkoutService.deleteSet', () => {
    it('should delete a set successfully', async () => {
        mockChain.then.mockImplementationOnce((resolve: any) =>
            resolve({ error: null })
        );

        const res = await WorkoutService.deleteSet('s-1');
        expect(res.error).toBeNull();
    });

    it('should return error if delete fails', async () => {
        mockChain.then.mockImplementationOnce((resolve: any) =>
            resolve({ error: new Error('Delete Error') })
        );

        const res = await WorkoutService.deleteSet('s-err');
        expect(res.error).not.toBeNull();
    });
});

// ─── removeExerciseFromRoutine ────────────────────────────────────────────────
describe('WorkoutService.removeExerciseFromRoutine', () => {
    it('should remove exercise from routine successfully', async () => {
        mockChain.then.mockImplementationOnce((resolve: any) =>
            resolve({ error: null })
        );

        const res = await WorkoutService.removeExerciseFromRoutine('ep-1');
        expect(res.error).toBeNull();
    });

    it('should return error if remove fails', async () => {
        mockChain.then.mockImplementationOnce((resolve: any) =>
            resolve({ error: new Error('Remove Error') })
        );

        const res = await WorkoutService.removeExerciseFromRoutine('ep-err');
        expect(res.error).not.toBeNull();
    });
});

// ─── getLastCompletedWorkoutForDay ────────────────────────────────────────────
describe('WorkoutService.getLastCompletedWorkoutForDay', () => {
    it('should return last completed workout', async () => {
        mockChain.single.mockResolvedValueOnce({
            data: { nombre_dia: 'Lunes', rutina_semanal_id: 'rs-1' },
            error: null,
        });
        mockChain.maybeSingle.mockResolvedValueOnce({
            data: { id: 'old-w-1', completada: true },
            error: null,
        });

        const res = await WorkoutService.getLastCompletedWorkoutForDay('user-1', 'tmpl-day-1');
        expect(res.error).toBeNull();
        expect(res.data?.id).toBe('old-w-1');
    });

    it('should return null when template day is not found', async () => {
        mockChain.single.mockResolvedValueOnce({ data: null, error: null });

        const res = await WorkoutService.getLastCompletedWorkoutForDay('user-1', 'tmpl-missing');
        expect(res.data).toBeNull();
        expect(res.error).toBe('Template not found');
    });

    it('should return error if DB query fails', async () => {
        mockChain.single.mockResolvedValueOnce({
            data: { nombre_dia: 'Lunes', rutina_semanal_id: 'rs-1' },
            error: null,
        });
        mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: new Error('Query Error') });

        const res = await WorkoutService.getLastCompletedWorkoutForDay('user-1', 'tmpl-day-1');
        expect(res.error).not.toBeNull();
    });
});

// ─── addExerciseToWorkout ─────────────────────────────────────────────────────
describe('WorkoutService.addExerciseToWorkout', () => {
    it('should add exercise with next order when exercises exist', async () => {
        mockChain.maybeSingle.mockResolvedValueOnce({ data: { orden_ejecucion: 2 }, error: null });
        mockChain.single.mockResolvedValueOnce({
            data: { id: 'ep-3', orden_ejecucion: 3 },
            error: null,
        });

        const res = await WorkoutService.addExerciseToWorkout('w-1', 'ej-3');
        expect(res.error).toBeNull();
        expect(res.data?.id).toBe('ep-3');
    });

    it('should add exercise with order 1 when no exercises exist', async () => {
        mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
        mockChain.single.mockResolvedValueOnce({ data: { id: 'ep-1', orden_ejecucion: 1 }, error: null });

        const res = await WorkoutService.addExerciseToWorkout('w-1', 'ej-1');
        expect(res.error).toBeNull();
    });

    it('should return error if insert fails', async () => {
        mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
        mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('Insert EP Error') });

        const res = await WorkoutService.addExerciseToWorkout('w-1', 'ej-1');
        expect(res.error).not.toBeNull();
    });
});

// ─── removeExerciseFromWorkout ────────────────────────────────────────────────
describe('WorkoutService.removeExerciseFromWorkout', () => {
    it('should remove exercise from workout successfully', async () => {
        mockChain.then.mockImplementationOnce((resolve: any) =>
            resolve({ error: null })
        );

        const res = await WorkoutService.removeExerciseFromWorkout('w-1', 'ej-1');
        expect(res.error).toBeNull();
    });

    it('should return error if remove fails', async () => {
        mockChain.then.mockImplementationOnce((resolve: any) =>
            resolve({ error: new Error('Remove EW Error') })
        );

        const res = await WorkoutService.removeExerciseFromWorkout('w-1', 'ej-err');
        expect(res.error).not.toBeNull();
    });
});

// ─── getExerciseHistory ───────────────────────────────────────────────────────
describe('WorkoutService.getExerciseHistory', () => {
    it('should return sorted history with tipo_peso', async () => {
        const mockData = [
            {
                id: 's-2',
                numero_serie: 1,
                peso_utilizado: 90,
                repeticiones: 6,
                rpe: 9,
                ejercicios_programados: {
                    ejercicio_id: 'ej-1',
                    tipo_peso: 'mancuernas',
                    rutinas_diarias: {
                        id: 'w-2',
                        fecha_dia: '2026-01-08',
                        rutinas_semanales: { usuario_id: 'user-1' },
                    },
                },
            },
            {
                id: 's-1',
                numero_serie: 1,
                peso_utilizado: 80,
                repeticiones: 8,
                rpe: 7,
                ejercicios_programados: {
                    ejercicio_id: 'ej-1',
                    tipo_peso: 'mancuernas',
                    rutinas_diarias: {
                        id: 'w-1',
                        fecha_dia: '2026-01-01',
                        rutinas_semanales: { usuario_id: 'user-1' },
                    },
                },
            },
        ];

        mockChain.then.mockImplementationOnce((resolve: any) =>
            resolve({ data: mockData, error: null })
        );

        const res = await WorkoutService.getExerciseHistory('user-1', 'ej-1');
        expect(res.error).toBeNull();
        expect(res.data).toHaveLength(2);
        // Sorted by date ascending
        expect(res.data?.[0].fecha).toBe('2026-01-01');
        expect(res.data?.[1].fecha).toBe('2026-01-08');
        expect(res.data?.[0].tipo_peso).toBe('mancuernas');
    });

    it('should filter out rows without fecha_dia', async () => {
        const mockData = [
            {
                id: 's-1',
                numero_serie: 1,
                peso_utilizado: 80,
                repeticiones: 8,
                rpe: null,
                ejercicios_programados: {
                    ejercicio_id: 'ej-1',
                    tipo_peso: 'total',
                    rutinas_diarias: {
                        id: 'w-1',
                        fecha_dia: null,
                        rutinas_semanales: { usuario_id: 'user-1' },
                    },
                },
            },
        ];

        mockChain.then.mockImplementationOnce((resolve: any) =>
            resolve({ data: mockData, error: null })
        );

        const res = await WorkoutService.getExerciseHistory('user-1', 'ej-1');
        expect(res.error).toBeNull();
        expect(res.data).toHaveLength(0);
    });

    it('should default tipo_peso to "total" when not set', async () => {
        const mockData = [
            {
                id: 's-1',
                numero_serie: 1,
                peso_utilizado: 100,
                repeticiones: 5,
                rpe: 10,
                ejercicios_programados: {
                    ejercicio_id: 'ej-1',
                    tipo_peso: null,
                    rutinas_diarias: {
                        id: 'w-1',
                        fecha_dia: '2026-02-01',
                        rutinas_semanales: { usuario_id: 'user-1' },
                    },
                },
            },
        ];

        mockChain.then.mockImplementationOnce((resolve: any) =>
            resolve({ data: mockData, error: null })
        );

        const res = await WorkoutService.getExerciseHistory('user-1', 'ej-1');
        expect(res.data?.[0].tipo_peso).toBe('total');
    });

    it('should return error if DB query fails', async () => {
        mockChain.then.mockImplementationOnce((resolve: any) =>
            resolve({ data: null, error: new Error('History Error') })
        );

        const res = await WorkoutService.getExerciseHistory('user-1', 'ej-1');
        expect(res.error).not.toBeNull();
        expect(res.data).toBeNull();
    });

    it('should return empty array when data is null', async () => {
        mockChain.then.mockImplementationOnce((resolve: any) =>
            resolve({ data: null, error: null })
        );

        const res = await WorkoutService.getExerciseHistory('user-1', 'ej-1');
        expect(res.error).toBeNull();
        expect(res.data).toHaveLength(0);
    });
});

// ─── updateWeightType ─────────────────────────────────────────────────────────
describe('WorkoutService.updateWeightType', () => {
    it('should update weight type to mancuernas', async () => {
        mockChain.single.mockResolvedValueOnce({
            data: { id: 'ep-1', tipo_peso: 'mancuernas' },
            error: null,
        });

        const res = await WorkoutService.updateWeightType('ep-1', 'mancuernas');
        expect(res.error).toBeNull();
        expect(res.data?.tipo_peso).toBe('mancuernas');
    });

    it('should update weight type to total', async () => {
        mockChain.single.mockResolvedValueOnce({
            data: { id: 'ep-2', tipo_peso: 'total' },
            error: null,
        });

        const res = await WorkoutService.updateWeightType('ep-2', 'total');
        expect(res.error).toBeNull();
    });

    it('should return error if update fails', async () => {
        mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('Update WT Error') });

        const res = await WorkoutService.updateWeightType('ep-err', 'total');
        expect(res.error).not.toBeNull();
        expect(res.data).toBeNull();
    });
});
