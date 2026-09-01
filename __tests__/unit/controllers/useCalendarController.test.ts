import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useCalendarController } from '../../../src/controllers/useCalendarController';
import { RoutineService } from '../../../src/services/RoutineService';

jest.mock('../../../src/services/RoutineService', () => ({
    RoutineService: {
        getUserRoutines: jest.fn(),
        getWeeklyRoutineWithDays: jest.fn(),
        getWorkoutsForDateRange: jest.fn(),
    },
}));

describe('useCalendarController (PF-258)', () => {
    const mockUserId = 'user-123';
    const mockRoutineId = 'routine-456';

    const mockRoutineTemplate = {
        id: 'routine-456',
        nombre: 'Rutina Fuerza',
        rutinas_diarias: [
            { id: 'rd-1', nombre_dia: 'Lunes', dia_semana: 1 },
            { id: 'rd-2', nombre_dia: 'Miércoles', dia_semana: 3 },
            { id: 'rd-3', nombre_dia: 'Viernes', dia_semana: 5 },
        ],
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (RoutineService.getUserRoutines as jest.Mock).mockResolvedValue({
            data: [mockRoutineTemplate],
            error: null,
        });
        (RoutineService.getWeeklyRoutineWithDays as jest.Mock).mockResolvedValue({
            data: mockRoutineTemplate,
            error: null,
        });
        (RoutineService.getWorkoutsForDateRange as jest.Mock).mockResolvedValue({
            data: [],
            error: null,
        });
    });

    describe('Initialization & Range Generation', () => {
        it('does not initialize or fetch templates if userId is undefined', async () => {
            const hook = await renderHook(() => useCalendarController(undefined));

            expect(hook.result.current.loading).toBe(true);
            expect(hook.result.current.calendarDays).toEqual([]);
            expect(RoutineService.getUserRoutines).not.toHaveBeenCalled();
            expect(RoutineService.getWeeklyRoutineWithDays).not.toHaveBeenCalled();
        });

        it('initializes with default week range (-1 to 3) and loads user routines', async () => {
            const hook = await renderHook(() => useCalendarController(mockUserId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            expect(RoutineService.getUserRoutines).toHaveBeenCalledWith(mockUserId);
            // Default range: min -1, max 3 => 5 weeks total.
            // Each week has 1 'week-header' + 7 'day' items = 8 items per week.
            // 5 * 8 = 40 items
            expect(hook.result.current.calendarDays.length).toBe(40);

            const headers = hook.result.current.calendarDays.filter((d) => d.type === 'week-header');
            expect(headers.length).toBe(5);

            const days = hook.result.current.calendarDays.filter((d) => d.type === 'day');
            expect(days.length).toBe(35);

            // Current week should have isCurrentWeek = true
            const currentWeekHeader = headers.find((h) => h.isCurrentWeek);
            expect(currentWeekHeader).toBeDefined();
            expect(currentWeekHeader?.weekOffset).toBe(0);

            // Verify today is found and todayIndex is set
            expect(hook.result.current.todayIndex).toBeGreaterThan(-1);
            const todayDay = hook.result.current.calendarDays[hook.result.current.todayIndex];
            expect(todayDay.isToday).toBe(true);
            expect(todayDay.type).toBe('day');
        });

        it('handles Sunday as current day when computing Monday of the week', async () => {
            const getDaySpy = jest.spyOn(Date.prototype, 'getDay').mockReturnValue(0); // Sunday

            const hook = await renderHook(() => useCalendarController(mockUserId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            expect(hook.result.current.calendarDays.length).toBe(40);
            getDaySpy.mockRestore();
        });

        it('handles week headers that cross different months', async () => {
            // Mock Date to February 26, 2026 (Thursday) so the week crosses Feb to Mar
            const fixedDate = new Date(2026, 1, 26, 12, 0, 0); // Feb 26, 2026
            const originalDate = global.Date;

            // Spy on new Date() without breaking prototype
            const dateSpy = jest.spyOn(global, 'Date').mockImplementation(((...args: any[]) => {
                if (args.length === 0) {
                    return new originalDate(fixedDate.getTime());
                }
                return new (originalDate as any)(...args);
            }) as any);

            const hook = await renderHook(() => useCalendarController(mockUserId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            const headers = hook.result.current.calendarDays.filter((d) => d.type === 'week-header');
            // One of the headers must span Feb and Mar
            const crossingHeader = headers.find((h) => h.label?.includes('Feb') && h.label?.includes('Mar'));
            expect(crossingHeader).toBeDefined();

            dateSpy.mockRestore();
        });

        it('loads specific routine template when routineId is provided', async () => {
            const hook = await renderHook(() => useCalendarController(mockUserId, mockRoutineId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            expect(RoutineService.getWeeklyRoutineWithDays).toHaveBeenCalledWith(mockRoutineId);
            expect(RoutineService.getUserRoutines).not.toHaveBeenCalled();
            expect(hook.result.current.routineTemplates).toEqual([mockRoutineTemplate]);
        });

        it('handles null data when fetching routine template with routineId', async () => {
            (RoutineService.getWeeklyRoutineWithDays as jest.Mock).mockResolvedValueOnce({
                data: null,
                error: null,
            });

            const hook = await renderHook(() => useCalendarController(mockUserId, mockRoutineId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            expect(hook.result.current.routineTemplates).toEqual([]);
        });

        it('handles null data when fetching user routines', async () => {
            (RoutineService.getUserRoutines as jest.Mock).mockResolvedValueOnce({
                data: null,
                error: null,
            });

            const hook = await renderHook(() => useCalendarController(mockUserId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            expect(hook.result.current.routineTemplates).toEqual([]);
        });

        it('catches and logs error if fetchRoutineTemplates fails', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            (RoutineService.getUserRoutines as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

            const hook = await renderHook(() => useCalendarController(mockUserId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            expect(consoleSpy).toHaveBeenCalledWith('Error fetching routine templates:', expect.any(Error));
            expect(hook.result.current.routineTemplates).toEqual([]);
            consoleSpy.mockRestore();
        });

        it('catches and logs error if initialize throws', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            (RoutineService.getUserRoutines as jest.Mock).mockResolvedValueOnce({
                data: [mockRoutineTemplate],
            });
            (RoutineService.getWorkoutsForDateRange as jest.Mock).mockRejectedValueOnce(new Error('Range error'));

            const hook = await renderHook(() => useCalendarController(mockUserId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            expect(consoleSpy).toHaveBeenCalledWith('Error initializing calendar:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe('fetchStatsForRange and Workout Deduplication', () => {
        it('returns empty stats if templates array is empty', async () => {
            (RoutineService.getUserRoutines as jest.Mock).mockResolvedValueOnce({
                data: [],
                error: null,
            });

            const hook = await renderHook(() => useCalendarController(mockUserId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            expect(RoutineService.getWorkoutsForDateRange).not.toHaveBeenCalled();
            expect(hook.result.current.workoutStats).toEqual({});
        });

        it('parses and stores workout stats for date range with durations >= 5 minutes', async () => {
            const workouts = [
                {
                    id: 'w-1',
                    fecha_dia: '2026-09-01',
                    ejercicios_programados: [{ id: 'e-1' }, { id: 'e-2' }],
                    completada: true,
                    hora_inicio: '2026-09-01T10:00:00Z',
                    hora_fin: '2026-09-01T10:45:00Z', // 45 minutes
                },
                {
                    id: 'w-2',
                    fecha_dia: '2026-09-02',
                    ejercicios_programados: [{ id: 'e-3' }],
                    completada: true,
                    hora_inicio: '2026-09-02T10:00:00Z',
                    hora_fin: '2026-09-02T10:03:00Z', // 3 minutes (< 5 => duration: null)
                },
                {
                    id: 'w-3',
                    fecha_dia: '2026-09-03',
                    ejercicios_programados: null, // tests optional exercises array
                    completada: false,
                    hora_inicio: '2026-09-03T12:00:00Z',
                    hora_fin: null,
                },
            ];

            (RoutineService.getWorkoutsForDateRange as jest.Mock).mockResolvedValueOnce({
                data: workouts,
                error: null,
            });

            const hook = await renderHook(() => useCalendarController(mockUserId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            const stats = hook.result.current.workoutStats;
            expect(stats['2026-09-01']).toEqual({
                workoutId: 'w-1',
                exerciseCount: 2,
                duration: 45,
                isCompleted: true,
                startTime: '2026-09-01T10:00:00Z',
                endTime: '2026-09-01T10:45:00Z',
            });

            expect(stats['2026-09-02']).toEqual({
                workoutId: 'w-2',
                exerciseCount: 1,
                duration: null, // under 5 min threshold
                isCompleted: true,
                startTime: '2026-09-02T10:00:00Z',
                endTime: '2026-09-02T10:03:00Z',
            });

            expect(stats['2026-09-03']).toEqual({
                workoutId: 'w-3',
                exerciseCount: 0,
                duration: null,
                isCompleted: false,
                startTime: '2026-09-03T12:00:00Z',
                endTime: null,
            });
        });

        it('deduplicates workouts on the same day by prioritizing completed workouts', async () => {
            const workouts = [
                {
                    id: 'w-completed',
                    fecha_dia: '2026-09-01',
                    ejercicios_programados: [{ id: 'e-1' }],
                    completada: true,
                    hora_inicio: '2026-09-01T08:00:00Z',
                    hora_fin: '2026-09-01T09:00:00Z',
                },
                {
                    id: 'w-incomplete',
                    fecha_dia: '2026-09-01',
                    ejercicios_programados: [],
                    completada: false,
                    hora_inicio: '2026-09-01T14:00:00Z',
                    hora_fin: null,
                },
            ];

            (RoutineService.getWorkoutsForDateRange as jest.Mock).mockResolvedValueOnce({
                data: workouts,
                error: null,
            });

            const hook = await renderHook(() => useCalendarController(mockUserId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            // Completed workout must not be overwritten by incomplete workout
            expect(hook.result.current.workoutStats['2026-09-01'].workoutId).toBe('w-completed');
        });

        it('overwrites previous incomplete workout if completed workout arrives later for the same date', async () => {
            const workouts = [
                {
                    id: 'w-incomplete-first',
                    fecha_dia: '2026-09-01',
                    ejercicios_programados: [],
                    completada: false,
                    hora_inicio: '2026-09-01T08:00:00Z',
                    hora_fin: null,
                },
                {
                    id: 'w-completed-second',
                    fecha_dia: '2026-09-01',
                    ejercicios_programados: [{ id: 'e-1' }],
                    completada: true,
                    hora_inicio: '2026-09-01T18:00:00Z',
                    hora_fin: '2026-09-01T19:00:00Z',
                },
            ];

            (RoutineService.getWorkoutsForDateRange as jest.Mock).mockResolvedValueOnce({
                data: workouts,
                error: null,
            });

            const hook = await renderHook(() => useCalendarController(mockUserId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            expect(hook.result.current.workoutStats['2026-09-01'].workoutId).toBe('w-completed-second');
        });
    });

    describe('Pagination: loadPreviousWeeks and loadNextWeeks', () => {
        it('expands range backward with loadPreviousWeeks and fetches stats', async () => {
            const hook = await renderHook(() => useCalendarController(mockUserId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            expect(hook.result.current.calendarDays.length).toBe(40);

            (RoutineService.getWorkoutsForDateRange as jest.Mock).mockResolvedValue({
                data: [
                    {
                        id: 'w-prev-1',
                        fecha_dia: '2026-08-15',
                        ejercicios_programados: [],
                        completada: true,
                    },
                ],
                error: null,
            });

            await act(async () => {
                await hook.result.current.loadPreviousWeeks(2);
            });

            // min was -1, expanded by -2 => min is -3 (7 weeks total = 7 * 8 = 56 items)
            expect(hook.result.current.calendarDays.length).toBe(56);
            expect(hook.result.current.loadingMore).toBe(false);
            expect(hook.result.current.workoutStats['2026-08-15']).toBeDefined();
        });

        it('expands range forward with loadNextWeeks and fetches stats', async () => {
            const hook = await renderHook(() => useCalendarController(mockUserId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            expect(hook.result.current.calendarDays.length).toBe(40);

            (RoutineService.getWorkoutsForDateRange as jest.Mock).mockResolvedValue({
                data: [
                    {
                        id: 'w-next-1',
                        fecha_dia: '2026-10-01',
                        ejercicios_programados: [],
                        completada: false,
                    },
                ],
                error: null,
            });

            await act(async () => {
                await hook.result.current.loadNextWeeks(3);
            });

            // max was 3, expanded by +3 => max is 6 (8 weeks total = 8 * 8 = 64 items)
            expect(hook.result.current.calendarDays.length).toBe(64);
            expect(hook.result.current.loadingMore).toBe(false);
            expect(hook.result.current.workoutStats['2026-10-01']).toBeDefined();
        });

        it('ensures loadingMore is reset to false even if loadPreviousWeeks encounters an error', async () => {
            const hook = await renderHook(() => useCalendarController(mockUserId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            (RoutineService.getWorkoutsForDateRange as jest.Mock).mockRejectedValueOnce(new Error('Pagination fetch error'));

            await expect(
                act(async () => {
                    await hook.result.current.loadPreviousWeeks(1);
                })
            ).rejects.toThrow('Pagination fetch error');

            expect(hook.result.current.loadingMore).toBe(false);
        });
    });

    describe('Refresh: onRefresh and refreshData', () => {
        it('triggers onRefresh setting refreshing true and reloading data', async () => {
            const hook = await renderHook(() => useCalendarController(mockUserId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            expect(hook.result.current.refreshing).toBe(false);

            await act(async () => {
                await hook.result.current.onRefresh();
            });

            expect(hook.result.current.refreshing).toBe(false);
            expect(RoutineService.getUserRoutines).toHaveBeenCalledTimes(2);
        });

        it('refreshData(true) executes silent refresh without toggling loading', async () => {
            const hook = await renderHook(() => useCalendarController(mockUserId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            await act(async () => {
                await hook.result.current.refreshData(true);
            });

            expect(hook.result.current.loading).toBe(false);
            expect(RoutineService.getUserRoutines).toHaveBeenCalledTimes(2);
        });

        it('refreshData(false) executes non-silent refresh with loading state', async () => {
            const hook = await renderHook(() => useCalendarController(mockUserId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            await act(async () => {
                await hook.result.current.refreshData(false);
            });

            expect(hook.result.current.loading).toBe(false);
            expect(RoutineService.getUserRoutines).toHaveBeenCalledTimes(2);
        });
    });

    describe('getRoutineDayForName', () => {
        it('resolves routine and routineDay when matching nombre_dia is found', async () => {
            const hook = await renderHook(() => useCalendarController(mockUserId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            const result = hook.result.current.getRoutineDayForName('Miércoles');
            expect(result).not.toBeNull();
            expect(result?.routine.id).toBe('routine-456');
            expect(result?.routineDay.nombre_dia).toBe('Miércoles');
            expect(result?.routineDay.dia_semana).toBe(3);
        });

        it('returns null if day name is not found in templates', async () => {
            const hook = await renderHook(() => useCalendarController(mockUserId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            const result = hook.result.current.getRoutineDayForName('Domingo');
            expect(result).toBeNull();
        });

        it('ignores routines without rutinas_diarias defined', async () => {
            (RoutineService.getUserRoutines as jest.Mock).mockResolvedValueOnce({
                data: [
                    { id: 'routine-empty' }, // no rutinas_diarias
                    mockRoutineTemplate,
                ],
            });

            const hook = await renderHook(() => useCalendarController(mockUserId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            const result = hook.result.current.getRoutineDayForName('Lunes');
            expect(result?.routineDay.id).toBe('rd-1');
        });
    });

    describe('getDayStatus', () => {
        it('returns MISSED when stats is undefined and day is in the past', async () => {
            const hook = await renderHook(() => useCalendarController(mockUserId));
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            const status = hook.result.current.getDayStatus(undefined, false, true);
            expect(status).toEqual({
                status: 'MISSED',
                label: 'No Realizado',
                icon: 'close',
                color: 'error',
            });
        });

        it('returns PENDING when stats is undefined and day is not in the past', async () => {
            const hook = await renderHook(() => useCalendarController(mockUserId));
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            const status = hook.result.current.getDayStatus(undefined, false, false);
            expect(status).toEqual({
                status: 'PENDING',
                label: 'Empezar',
                icon: 'play-arrow',
                color: 'primary',
            });
        });

        it('returns COMPLETED when stats.isCompleted is true', async () => {
            const hook = await renderHook(() => useCalendarController(mockUserId));
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            const stats = {
                workoutId: 'w-1',
                exerciseCount: 3,
                duration: 50,
                isCompleted: true,
                startTime: '2026-09-01T10:00:00Z',
                endTime: '2026-09-01T10:50:00Z',
            };

            const status = hook.result.current.getDayStatus(stats, false, true);
            expect(status).toEqual({
                status: 'COMPLETED',
                label: 'Completado',
                icon: 'check-circle',
                color: 'success',
            });
        });

        it('returns ACTIVE when workout has started but not ended and is not completed', async () => {
            const hook = await renderHook(() => useCalendarController(mockUserId));
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            const stats = {
                workoutId: 'w-active',
                exerciseCount: 2,
                duration: null,
                isCompleted: false,
                startTime: '2026-09-01T10:00:00Z',
                endTime: null,
            };

            const status = hook.result.current.getDayStatus(stats, true, false);
            expect(status).toEqual({
                status: 'ACTIVE',
                label: 'Continuar',
                icon: 'play-circle-filled',
                color: 'warning',
            });
        });

        it('returns MISSED when workout is not completed, has ended, and day is in the past', async () => {
            const hook = await renderHook(() => useCalendarController(mockUserId));
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            const stats = {
                workoutId: 'w-unfinished',
                exerciseCount: 1,
                duration: null,
                isCompleted: false,
                startTime: '2026-08-30T10:00:00Z',
                endTime: '2026-08-30T10:15:00Z',
            };

            const status = hook.result.current.getDayStatus(stats, false, true);
            expect(status).toEqual({
                status: 'MISSED',
                label: 'No Realizado',
                icon: 'close',
                color: 'error',
            });
        });

        it('returns PENDING when workout has both start/end times but isCompleted is false and day is not past', async () => {
            const hook = await renderHook(() => useCalendarController(mockUserId));
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            const stats = {
                workoutId: 'w-reset',
                exerciseCount: 1,
                duration: null,
                isCompleted: false,
                startTime: '2026-09-01T10:00:00Z',
                endTime: '2026-09-01T10:15:00Z',
            };

            const status = hook.result.current.getDayStatus(stats, true, false);
            expect(status).toEqual({
                status: 'PENDING',
                label: 'Empezar',
                icon: 'play-arrow',
                color: 'primary',
            });
        });
    });
});
