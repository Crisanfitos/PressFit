/**
 * Unit Tests: RoutineService Coverage
 *
 * Comprehensive mock-based tests for RoutineService methods.
 * Uses shared mock infrastructure.
 */

import { mockChain, mockSupabase, resetMocks } from '../helpers/mockSupabase';

jest.mock('../../src/lib/supabase', () => ({
    supabase: require('../helpers/mockSupabase').mockSupabase,
}));

import { RoutineService } from '../../src/services/RoutineService';

describe('RoutineService Coverage Suite', () => {
    beforeEach(() => { resetMocks(); });

    describe('getWeeklyRoutineWithDays', () => {
        it('should return data with sorted exercises and series', async () => {
            const mockData = {
                id: 'routine-1',
                rutinas_diarias: [{
                    nombre_dia: 'Lunes',
                    ejercicios_programados: [
                        { id: 'ex-2', orden_ejecucion: 2, series: [{ numero_serie: 2 }, { numero_serie: 1 }] },
                        { id: 'ex-1', orden_ejecucion: 1, series: null },
                    ],
                }],
            };
            mockChain.single.mockResolvedValueOnce({ data: mockData, error: null });
            const res = await RoutineService.getWeeklyRoutineWithDays('routine-1');
            expect(res.error).toBeNull();
            expect(res.data?.rutinas_diarias?.[0].ejercicios_programados?.[0].id).toBe('ex-1');
            expect(res.data?.rutinas_diarias?.[0].ejercicios_programados?.[1].series?.[0].numero_serie).toBe(1);
        });

        it('should return error if supabase throws', async () => {
            mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('DB Error') });
            const res = await RoutineService.getWeeklyRoutineWithDays('routine-1');
            expect(res.error).not.toBeNull();
            expect(res.data).toBeNull();
        });

        it('should handle undefined rutinas_diarias', async () => {
            mockChain.single.mockResolvedValueOnce({ data: { id: 'routine-1' }, error: null });
            const res = await RoutineService.getWeeklyRoutineWithDays('routine-1');
            expect(res.error).toBeNull();
            expect(res.data).toEqual({ id: 'routine-1' });
        });
    });

    describe('getUserRoutines', () => {
        it('should return routines', async () => {
            mockChain.then.mockImplementationOnce((r: any) => r({ data: [{ id: '1' }], error: null }));
            const res = await RoutineService.getUserRoutines('user-1');
            expect(res.error).toBeNull();
            expect(res.data).toHaveLength(1);
        });

        it('should return error on failure', async () => {
            mockChain.then.mockImplementationOnce((r: any) => r({ data: null, error: new Error('Err') }));
            const res = await RoutineService.getUserRoutines('user-1');
            expect(res.error).not.toBeNull();
        });
    });

    describe('getRoutineDayById', () => {
        it('should sort exercises', async () => {
            mockChain.single.mockResolvedValueOnce({
                data: { id: 'day-1', ejercicios_programados: [{ orden_ejecucion: 2 }, { orden_ejecucion: 1 }] },
                error: null,
            });
            const res = await RoutineService.getRoutineDayById('day-1');
            expect(res.data?.ejercicios_programados?.[0].orden_ejecucion).toBe(1);
        });

        it('should return error', async () => {
            mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('Err') });
            const res = await RoutineService.getRoutineDayById('day-1');
            expect(res.error).toBeDefined();
        });
    });

    describe('getRoutineDayByDate', () => {
        it('should sort exercises by date query', async () => {
            mockChain.single.mockResolvedValueOnce({
                data: { id: 'day-1', ejercicios_programados: [{ orden_ejecucion: 2 }, { orden_ejecucion: 1 }] },
                error: null,
            });
            const res = await RoutineService.getRoutineDayByDate('r-1', '2026-01-01');
            expect(res.data?.ejercicios_programados?.[0].orden_ejecucion).toBe(1);
        });

        it('should handle PGRST116 gracefully', async () => {
            mockChain.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
            const res = await RoutineService.getRoutineDayByDate('r-1', '2026-01-01');
            expect(res.data).toBeNull();
            expect(res.error).toBeNull();
        });
    });

    describe('getRoutineDayByName', () => {
        it('should return template day', async () => {
            mockChain.single.mockResolvedValueOnce({ data: { id: 'day-1' }, error: null });
            const res = await RoutineService.getRoutineDayByName('r-1', 'Lunes');
            expect(res.data).toEqual({ id: 'day-1' });
        });

        it('should handle error', async () => {
            mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('Err') });
            const res = await RoutineService.getRoutineDayByName('r-1', 'Lunes');
            expect(res.error).toBeDefined();
        });
    });

    describe('getStartOfWeek & getMondayOfCurrentWeek', () => {
        it('getMondayOfCurrentWeek returns YYYY-MM-DD', () => {
            expect(RoutineService.getMondayOfCurrentWeek()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        it('getStartOfWeek returns valid ISO string', () => {
            expect(new Date(RoutineService.getStartOfWeek()).getTime()).toBeGreaterThan(0);
        });
    });

    describe('getWorkoutStatsForRoutineDay', () => {
        it('should return stats for completed day', async () => {
            mockChain.single.mockResolvedValueOnce({ data: { nombre_dia: 'Lunes' }, error: null });
            mockChain.maybeSingle.mockResolvedValueOnce({
                data: {
                    hora_inicio: '2026-01-01T10:00:00Z',
                    hora_fin: '2026-01-01T11:00:00Z',
                    completada: true,
                    ejercicios_programados: [{ ejercicio_id: 'ex-1' }, { ejercicio_id: 'ex-2' }],
                },
                error: null,
            });
            const res = await RoutineService.getWorkoutStatsForRoutineDay('user-1', 'day-1');
            expect(res.data?.exerciseCount).toBe(2);
            expect(res.data?.duration).toBe(60);
            expect(res.data?.isCompleted).toBe(true);
        });

        it('should return empty stats when no workout found', async () => {
            mockChain.single.mockResolvedValueOnce({ data: { nombre_dia: 'Lunes' }, error: null });
            mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
            const res = await RoutineService.getWorkoutStatsForRoutineDay('user-1', 'day-1');
            expect(res.error).toBeNull();
            expect(res.data?.exerciseCount).toBe(0);
        });

        it('should return error on DB failure', async () => {
            mockChain.single.mockResolvedValueOnce({ data: { nombre_dia: 'Lunes' }, error: null });
            mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: new Error('DB Error') });
            const res = await RoutineService.getWorkoutStatsForRoutineDay('user-1', 'day-1');
            expect(res.error).not.toBeNull();
        });

        it('should ignore duration < 5 minutes', async () => {
            mockChain.single.mockResolvedValueOnce({ data: { nombre_dia: 'Lunes' }, error: null });
            mockChain.maybeSingle.mockResolvedValueOnce({
                data: {
                    hora_inicio: '2026-01-01T10:00:00Z',
                    hora_fin: '2026-01-01T10:03:00Z',
                    completada: true,
                    ejercicios_programados: [],
                },
                error: null,
            });
            const res = await RoutineService.getWorkoutStatsForRoutineDay('user-1', 'day-1');
            expect(res.data?.duration).toBeNull();
        });
    });

    describe('getActiveWorkout', () => {
        it('should return active workout', async () => {
            mockChain.single.mockResolvedValueOnce({ data: { rutina_semanal_id: 'r-1', nombre_dia: 'Lunes' }, error: null });
            mockChain.maybeSingle.mockResolvedValueOnce({ data: { id: 'prog-1' }, error: null });
            const res = await RoutineService.getActiveWorkout('user-1', 'day-1');
            expect(res.data?.id).toBe('prog-1');
        });

        it('should return error on failure', async () => {
            mockChain.single.mockResolvedValueOnce({ data: { rutina_semanal_id: 'r-1', nombre_dia: 'Lunes' }, error: null });
            mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: new Error('Err') });
            const res = await RoutineService.getActiveWorkout('user-1', 'day-1');
            expect(res.error).toBeDefined();
        });
    });

    describe('getAllWeeklyRoutines', () => {
        it('should list all routines', async () => {
            mockChain.then.mockImplementationOnce((r: any) => r({ data: [{ id: 'R1' }], error: null }));
            const res = await RoutineService.getAllWeeklyRoutines('user-1');
            expect(res.data).toHaveLength(1);
        });
    });

    describe('createWeeklyRoutine', () => {
        it('should create routine and days', async () => {
            mockChain.single.mockResolvedValueOnce({ data: { id: 'new-r' }, error: null });
            mockChain.then.mockImplementationOnce((r: any) => r({ error: null }));
            const res = await RoutineService.createWeeklyRoutine({ nombre: 'Nueva' });
            expect(res.data?.id).toBe('new-r');
        });
    });

    describe('updateWeeklyRoutine', () => {
        it('should update routine', async () => {
            mockChain.single.mockResolvedValueOnce({ data: { id: 'r-1' }, error: null });
            const res = await RoutineService.updateWeeklyRoutine('r-1', { activa: true });
            expect(res.data?.id).toBe('r-1');
        });
    });

    describe('deleteWeeklyRoutine', () => {
        it('should delete', async () => {
            mockChain.then.mockImplementationOnce((r: any) => r({ error: null }));
            const res = await RoutineService.deleteWeeklyRoutine('r-1');
            expect(res.error).toBeNull();
        });
    });

    describe('startDailyWorkout', () => {
        it('should create workout from template', async () => {
            mockChain.single.mockResolvedValueOnce({
                data: { id: 'temp-1', rutina_semanal_id: 'r-1', nombre_dia: 'Lunes', ejercicios_programados: [] },
                error: null,
            });
            mockChain.then.mockImplementationOnce((r: any) => r({ data: [], error: null }));
            mockChain.single.mockResolvedValueOnce({ data: { id: 'started-day' }, error: null });
            const res = await RoutineService.startDailyWorkout('d-1', '2026-01-01', '10:00:00');
            expect(res.data?.id).toBe('started-day');
        });
    });

    describe('startWeeklySession', () => {
        it('should set fecha_inicio', async () => {
            mockChain.single.mockResolvedValueOnce({ data: { id: 'r-1' }, error: null });
            const res = await RoutineService.startWeeklySession('r-1', '2026-01-01');
            expect(res.error).toBeNull();
        });
    });

    describe('getRoutineDayStatus', () => {
        beforeEach(() => {
            jest.spyOn(Date.prototype, 'getDay').mockReturnValue(1); // Monday
        });
        afterEach(() => { jest.restoreAllMocks(); });

        it('COMPLETED', () => {
            expect(RoutineService.getRoutineDayStatus({} as any, { isCompleted: true } as any, 1)).toBe('COMPLETED');
        });
        it('IN_PROGRESS', () => {
            expect(RoutineService.getRoutineDayStatus({} as any, { isCompleted: false, exerciseCount: 1 } as any, 1)).toBe('IN_PROGRESS');
        });
        it('PENDING for today', () => {
            expect(RoutineService.getRoutineDayStatus({} as any, null, 1)).toBe('PENDING');
        });
    });

    describe('setActiveRoutine', () => {
        it('should deactivate all and activate target', async () => {
            mockChain.then.mockImplementationOnce((r: any) => r({ data: [], error: null }));
            mockChain.single.mockResolvedValueOnce({ data: { id: 'r-target' }, error: null });
            const res = await RoutineService.setActiveRoutine('u-1', 'r-target');
            expect(res.error).toBeNull();
        });
    });

    describe('createRoutineFromTemplate', () => {
        it('should copy template structure into new routine', async () => {
            // getWeeklyRoutineWithDays for template
            mockChain.single.mockResolvedValueOnce({
                data: {
                    id: 'template-1', objetivo: 'Fuerza',
                    rutinas_diarias: [{
                        nombre_dia: 'Lunes', descripcion: 'Pecho',
                        ejercicios_programados: [{
                            ejercicio_id: 'ex-1', orden_ejecucion: 1, tipo_peso: 'total',
                            series: [{ numero_serie: 1, repeticiones: 10, peso_utilizado: 50 }],
                        }],
                    }],
                },
                error: null,
            });
            // Insert new routine
            mockChain.single.mockResolvedValueOnce({ data: { id: 'new-routine' }, error: null });
            // Insert day
            mockChain.single.mockResolvedValueOnce({ data: { id: 'new-day' }, error: null });
            // Insert exercise
            mockChain.single.mockResolvedValueOnce({ data: { id: 'new-ep' }, error: null });
            // Insert series (thenable)
            mockChain.then.mockImplementationOnce((r: any) => r({ error: null }));

            const res = await RoutineService.createRoutineFromTemplate('u-1', 'template-1', 'Copy', 'Fuerza');
            expect(res.error).toBeNull();
            expect(res.data?.id).toBe('new-routine');
        });
    });

    describe('updateRoutineDayDescription', () => {
        it('should update descripcion', async () => {
            mockChain.single.mockResolvedValueOnce({ data: { id: 'd-1', descripcion: 'Día de pecho' }, error: null });
            const res = await RoutineService.updateRoutineDayDescription('d-1', 'Día de pecho');
            expect(res.data?.descripcion).toBe('Día de pecho');
        });
    });

    describe('getWorkoutsForDateRange', () => {
        it('should query date range with multiple IDs', async () => {
            mockChain.then.mockImplementationOnce((r: any) =>
                Promise.resolve({ data: [{ id: 'd-1' }], error: null }).then(r)
            );
            const res = await RoutineService.getWorkoutsForDateRange(['r-1'], '2026-01-01', '2026-01-07');
            expect(res.data).toHaveLength(1);
        });
    });
});
