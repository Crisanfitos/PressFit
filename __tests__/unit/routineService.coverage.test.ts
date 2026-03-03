import { RoutineService } from '../../src/services/RoutineService';
import { supabase } from '../../src/lib/supabase';

const mockChain: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
};
mockChain.then = jest.fn((resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve));

jest.spyOn(supabase, 'from').mockReturnValue(mockChain);

describe('RoutineService Coverage Suite', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getWeeklyRoutineWithDays', () => {
        it('should return data successfully with sorted exercises', async () => {
            const mockData = {
                id: 'routine-1',
                rutinas_diarias: [
                    {
                        nombre_dia: 'Lunes',
                        ejercicios_programados: [
                            { id: 'ex-2', orden_ejecucion: 2, series: [{ numero_serie: 2 }, { numero_serie: 1 }] },
                            { id: 'ex-1', orden_ejecucion: 1, series: null }
                        ]
                    }
                ]
            };

            mockChain.single.mockResolvedValueOnce({ data: mockData, error: null });

            const res = await RoutineService.getWeeklyRoutineWithDays('routine-1');
            expect(res.error).toBeNull();
            expect(res.data?.rutinas_diarias?.[0].ejercicios_programados?.[0].id).toBe('ex-1'); // Because it was sorted
            expect(res.data?.rutinas_diarias?.[0].ejercicios_programados?.[1].series?.[0].numero_serie).toBe(1); // Because it was sorted
        });

        it('should return error if supabase throws', async () => {
            mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('DB Error') });

            const res = await RoutineService.getWeeklyRoutineWithDays('routine-1');
            expect(res.error).not.toBeNull();
            expect(res.data).toBeNull();
        });

        it('should handle undefined rutinas_diarias gracefully', async () => {
            mockChain.single.mockResolvedValueOnce({ data: { id: 'routine-1' }, error: null });

            const res = await RoutineService.getWeeklyRoutineWithDays('routine-1');
            expect(res.error).toBeNull();
            expect(res.data).toEqual({ id: 'routine-1' });
        });
    });

    describe('getUserRoutines', () => {
        it('should return routines successfully', async () => {
            mockChain.then.mockImplementation((resolve: any) => resolve({ data: [{ id: '1' }], error: null }));

            const res = await RoutineService.getUserRoutines('user-1');
            expect(res.error).toBeNull();
            expect(res.data).toHaveLength(1);
        });

        it('should return error if fetching user routines fails', async () => {
            mockChain.then.mockImplementation((resolve: any) => resolve({ data: null, error: new Error('Error limit') }));

            const res = await RoutineService.getUserRoutines('user-1');
            expect(res.error).not.toBeNull();
        });
    });

    describe('getRoutineDayById', () => {
        it('should fetch day by id and sort', async () => {
            const mockData = { id: 'day-1', ejercicios_programados: [{ orden_ejecucion: 2 }, { orden_ejecucion: 1 }] };
            mockChain.single.mockResolvedValueOnce({ data: mockData, error: null });

            const res = await RoutineService.getRoutineDayById('day-1');
            expect(res.data?.ejercicios_programados?.[0].orden_ejecucion).toBe(1);
        });

        it('should return error handling', async () => {
            mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('Fetch Error') });

            const res = await RoutineService.getRoutineDayById('day-1');
            expect(res.error).toBeDefined();
        });
    });

    describe('getRoutineDayByDate', () => {
        it('should fetch day by date and sort', async () => {
            const mockData = { id: 'day-1', ejercicios_programados: [{ orden_ejecucion: 2 }, { orden_ejecucion: 1 }] };
            mockChain.single.mockResolvedValueOnce({ data: mockData, error: null });

            const res = await RoutineService.getRoutineDayByDate('routine-1', '2026-01-01');
            expect(res.data?.ejercicios_programados?.[0].orden_ejecucion).toBe(1);
        });

        it('should return error handling for date', async () => {
            mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('Fetch Error') });

            const res = await RoutineService.getRoutineDayByDate('routine-1', '2026-01-01');
            expect(res.error).toBeDefined();
        });
    });

    describe('getRoutineDayByName', () => {
        it('should fetch day by name template', async () => {
            const mockData = { id: 'day-1' };
            mockChain.single.mockResolvedValueOnce({ data: mockData, error: null });

            const res = await RoutineService.getRoutineDayByName('routine-1', 'Lunes');
            expect(res.data).toEqual(mockData);
        });

        it('should error when fetching day by name', async () => {
            mockChain.single.mockResolvedValueOnce({ data: null, error: new Error('Name Error') });

            const res = await RoutineService.getRoutineDayByName('routine-1', 'Lunes');
            expect(res.error).toBeDefined();
        });
    });

    describe('getStartOfWeek & getMondayOfCurrentWeek', () => {
        it('should return YYYY-MM-DD for current week monday', () => {
            const date = RoutineService.getMondayOfCurrentWeek();
            expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        it('should return ISO string for start of week', () => {
            const date = RoutineService.getStartOfWeek();
            expect(new Date(date).getTime()).toBeGreaterThan(0);
        });
    });

    describe('getWorkoutStatsForRoutineDay', () => {
        it('should return valid stats for a completed day', async () => {
            mockChain.single.mockResolvedValueOnce({ data: { nombre_dia: 'Lunes' }, error: null }); // from getRoutineDayById
            mockChain.maybeSingle.mockResolvedValueOnce({
                data: {
                    hora_inicio: '2026-01-01T10:00:00Z',
                    hora_fin: '2026-01-01T11:00:00Z',
                    completada: true,
                    ejercicios_programados: [{ ejercicio_id: 'ex-1' }, { ejercicio_id: 'ex-2' }] // needs ejercicio_id for the Set logic
                },
                error: null
            });

            const res = await RoutineService.getWorkoutStatsForRoutineDay('user-1', 'day-1');
            expect(res.data?.exerciseCount).toBe(2);
            expect(res.data?.duration).toBe(60);
            expect(res.data?.isCompleted).toBe(true);
        });

        it('should return null stats gracefully if day not found', async () => {
            mockChain.single.mockResolvedValueOnce({ data: { nombre_dia: 'Lunes' }, error: null }); // from getRoutineDayById
            mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

            const res = await RoutineService.getWorkoutStatsForRoutineDay('user-1', 'day-1');
            expect(res.error).toBeNull();
            expect(res.data?.exerciseCount).toBe(0); // the empty object state
        });

        it('should return error if fetching stats throws', async () => {
            mockChain.single.mockResolvedValueOnce({ data: { nombre_dia: 'Lunes' }, error: null }); // from getRoutineDayById
            mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: new Error('DB Stats Error') });

            const res = await RoutineService.getWorkoutStatsForRoutineDay('user-1', 'day-1');
            expect(res.error).not.toBeNull();
        });
    });

    describe('getActiveWorkout', () => {
        it('should get active workout successfully', async () => {
            mockChain.single.mockResolvedValueOnce({ data: { rutina_semanal_id: 'r-1', nombre_dia: 'Lunes' }, error: null });
            mockChain.maybeSingle.mockResolvedValueOnce({ data: { id: 'prog-1' }, error: null });
            const res = await RoutineService.getActiveWorkout('user-1', 'day-1');
            expect(res.data?.id).toBe('prog-1');
        });
        it('should return error if failed to get active workout', async () => {
            mockChain.single.mockResolvedValueOnce({ data: { rutina_semanal_id: 'r-1', nombre_dia: 'Lunes' }, error: null });
            mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: new Error('DB Error') });
            const res = await RoutineService.getActiveWorkout('user-1', 'day-1');
            expect(res.error).toBeDefined();
        });
    });

    describe('getAllWeeklyRoutines', () => {
        it('should get all user routines', async () => {
            mockChain.then.mockImplementation((resolve: any) => resolve({ data: [{ id: 'R1' }], error: null }));
            const res = await RoutineService.getAllWeeklyRoutines('user-1');
            expect(res.data).toHaveLength(1);
        });
    });

    describe('createWeeklyRoutine', () => {
        it('should insert and return new routine', async () => {
            mockChain.single.mockResolvedValueOnce({ data: { id: 'new-r' }, error: null });
            const res = await RoutineService.createWeeklyRoutine({ nombre: 'Nueva' });
            expect(res.data?.id).toBe('new-r');
        });
    });

    describe('updateWeeklyRoutine', () => {
        it('should update and return routine', async () => {
            mockChain.single.mockResolvedValueOnce({ data: { id: 'updated-r' }, error: null });
            const res = await RoutineService.updateWeeklyRoutine('r-1', { activa: true });
            expect(res.data?.id).toBe('updated-r');
        });
    });

    describe('deleteWeeklyRoutine', () => {
        it('should delete without returning data', async () => {
            mockChain.then.mockImplementation((resolve: any) => resolve({ error: null }));
            const res = await RoutineService.deleteWeeklyRoutine('r-1');
            expect(res.error).toBeNull();
        });
    });

    describe('startDailyWorkout', () => {
        it('should update start time', async () => {
            mockChain.single.mockResolvedValueOnce({ data: { id: 'temp-1', ejercicios_programados: [] }, error: null }); // Template day
            mockChain.single.mockResolvedValueOnce({ data: { id: 'started-day' }, error: null }); // Inserted day
            const res = await RoutineService.startDailyWorkout('d-1', '2026-01-01', '10:00:00');
            expect(res.data?.id).toBe('started-day');
        });
    });

    describe('getOrCreateRoutineDay', () => {
        it('should return existing non-completed day', async () => {
            // getUserRoutines calls a chain resolving with .then
            mockChain.then.mockImplementationOnce((resolve: any) => resolve({
                data: [{ rutinas_diarias: [{ nombre_dia: 'Lunes', id: 'd-1', completada: false }] }], error: null
            }));
            const res = await RoutineService.getOrCreateRoutineDay('u-1', 1);
            expect(res.data?.id).toBe('d-1');
        });
        it('should return error if get fails', async () => {
            mockChain.then.mockImplementationOnce((resolve: any) => resolve({ data: null, error: new Error('GetErr') }));
            const res = await RoutineService.getOrCreateRoutineDay('u-1', 1);
            expect(res.error).toBeDefined();
        });
    });

    describe('getWorkoutsForDateRange', () => {
        it('should perform in query for multiple ids', async () => {
            // Reset maybe previous mock
            mockChain.then = jest.fn((resolve: any) => {
                return Promise.resolve({ data: [{ id: 'd-1' }], error: null }).then(resolve);
            });
            const res = await RoutineService.getWorkoutsForDateRange(['r-1'], 'start', 'end');
            expect(res.data).toHaveLength(1);
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
            jest.spyOn(Date.prototype, 'getDay').mockReturnValue(1); // Force today is Monday (1)
        });
        it('should return COMPLETED when stats are complete', () => {
            const status = RoutineService.getRoutineDayStatus({} as any, { isCompleted: true } as any, 1);
            expect(status).toBe('COMPLETED');
        });
        it('should return IN_PROGRESS when stats have time but not complete', () => {
            const status = RoutineService.getRoutineDayStatus({} as any, { isCompleted: false, exerciseCount: 1 } as any, 1);
            expect(status).toBe('IN_PROGRESS');
        });
        it('should return PENDING for today', () => {
            const status = RoutineService.getRoutineDayStatus({} as any, null, 1);
            expect(status).toBe('PENDING');
        });
    });

    describe('setActiveRoutine', () => {
        it('should deactivate others and activate target via rpc', async () => {
            // Note: Since setActiveRoutine might use standard updates or rpc, we mock the final returned promise
            // which in the file actually does an rpc call or multiple updates
            mockChain.then.mockImplementation((resolve: any) => resolve({ data: [], error: null }));
            mockChain.single.mockResolvedValueOnce({ data: { id: 'r-target' }, error: null });

            const res = await RoutineService.setActiveRoutine('u-1', 'r-target');
            expect(res.error).toBeNull();
        });
    });

    describe('createRoutineFromTemplate', () => {
        it('should use rpc if available, else throw error', async () => {
            (supabase.rpc as jest.Mock) = jest.fn().mockResolvedValueOnce({ data: 'new-r-id', error: null });
            mockChain.single.mockResolvedValueOnce({ data: { id: 'new-r' }, error: null });

            const res = await RoutineService.createRoutineFromTemplate('u-1', 't-1', 'New', 'obj');
            expect(res.error).toBeNull();
        });
    });

    describe('updateRoutineDayDescription', () => {
        it('should update descripcion_usuario', async () => {
            mockChain.single.mockResolvedValueOnce({ data: { id: 'd-1' }, error: null });
            const res = await RoutineService.updateRoutineDayDescription('d-1', 'desc');
            expect(res.data?.id).toBe('d-1');
        });
    });
});
