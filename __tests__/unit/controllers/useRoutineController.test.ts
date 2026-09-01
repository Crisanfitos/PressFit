import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useRoutineController } from '../../../src/controllers/useRoutineController';
import { RoutineService } from '../../../src/services/RoutineService';

jest.mock('../../../src/services/RoutineService', () => ({
    RoutineService: {
        getUserRoutines: jest.fn(),
        getWeeklyRoutineWithDays: jest.fn(),
        getWorkoutStatsForRoutineDay: jest.fn(),
        getOrCreateRoutineDay: jest.fn(),
        getActiveWorkout: jest.fn(),
        startWeeklySession: jest.fn(),
        startDailyWorkout: jest.fn(),
    },
}));

describe('useRoutineController (PF-261)', () => {
    const mockUserId = 'user-123';
    const mockRoutineId = 'routine-abc';

    const mockRoutineData = {
        id: 'routine-abc',
        nombre: 'Torso Pierna',
        activa: true,
        usuario_id: mockUserId,
        rutinas_diarias: [
            { id: 'rd-1', nombre_dia: 'Día 1 - Torso', dia_semana: 1 },
            { id: 'rd-2', nombre_dia: 'Día 2 - Pierna', dia_semana: 2 },
        ],
    };

    const mockStatsRd1 = {
        exerciseCount: 4,
        duration: 45,
        isCompleted: true,
        startTime: '2026-09-01T10:00:00.000Z',
        endTime: '2026-09-01T10:45:00.000Z',
    };

    const mockStatsRd2 = {
        exerciseCount: 5,
        duration: null,
        isCompleted: false,
        startTime: null,
        endTime: null,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});

        (RoutineService.getUserRoutines as jest.Mock).mockResolvedValue({
            data: [mockRoutineData],
            error: null,
        });
        (RoutineService.getWeeklyRoutineWithDays as jest.Mock).mockResolvedValue({
            data: mockRoutineData,
            error: null,
        });
        (RoutineService.getWorkoutStatsForRoutineDay as jest.Mock).mockImplementation((_userId, rdId) => {
            if (rdId === 'rd-1') return Promise.resolve({ data: mockStatsRd1, error: null });
            return Promise.resolve({ data: mockStatsRd2, error: null });
        });
        (RoutineService.getOrCreateRoutineDay as jest.Mock).mockResolvedValue({
            data: { id: 'rd-new', nombre_dia: 'Día Creado', dia_semana: 3 },
            error: null,
        });
        (RoutineService.getActiveWorkout as jest.Mock).mockResolvedValue({
            data: { id: 'workout-active' },
            error: null,
        });
        (RoutineService.startWeeklySession as jest.Mock).mockResolvedValue({
            data: { id: 'weekly-session-1' },
            error: null,
        });
        (RoutineService.startDailyWorkout as jest.Mock).mockResolvedValue({
            data: { id: 'daily-workout-1' },
            error: null,
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Initial State & Missing userId Handling', () => {
        it('returns default initial state and does not fetch when userId is undefined', async () => {
            const hook = await renderHook(() => useRoutineController(undefined));

            expect(hook.result.current.routines).toEqual([]);
            expect(hook.result.current.workoutStats).toEqual({});
            expect(hook.result.current.loading).toBe(true);
            expect(hook.result.current.refreshing).toBe(false);

            expect(RoutineService.getUserRoutines).not.toHaveBeenCalled();
            expect(RoutineService.getWeeklyRoutineWithDays).not.toHaveBeenCalled();
        });

        it('returns early from fetchRoutines when userId is undefined', async () => {
            const hook = await renderHook(() => useRoutineController(undefined));

            await act(async () => {
                await hook.result.current.fetchRoutines();
            });

            expect(RoutineService.getUserRoutines).not.toHaveBeenCalled();
        });
    });

    describe('fetchRoutines', () => {
        it('fetches all user routines and stats when routineId is not provided', async () => {
            const hook = await renderHook(() => useRoutineController(mockUserId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            expect(RoutineService.getUserRoutines).toHaveBeenCalledWith(mockUserId);
            expect(hook.result.current.routines).toEqual([mockRoutineData]);
            expect(hook.result.current.workoutStats).toEqual({
                'rd-1': mockStatsRd1,
                'rd-2': mockStatsRd2,
            });
        });

        it('fetches a single routine and stats when routineId is provided', async () => {
            const hook = await renderHook(() => useRoutineController(mockUserId, mockRoutineId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            expect(RoutineService.getWeeklyRoutineWithDays).toHaveBeenCalledWith(mockRoutineId);
            expect(hook.result.current.routines).toEqual([mockRoutineData]);
            expect(hook.result.current.workoutStats).toEqual({
                'rd-1': mockStatsRd1,
                'rd-2': mockStatsRd2,
            });
        });

        it('handles null data response gracefully by defaulting to empty array when routineId is provided', async () => {
            (RoutineService.getWeeklyRoutineWithDays as jest.Mock).mockResolvedValue({
                data: null,
                error: null,
            });

            const hook = await renderHook(() => useRoutineController(mockUserId, mockRoutineId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            expect(hook.result.current.routines).toEqual([]);
            expect(hook.result.current.workoutStats).toEqual({});
        });

        it('handles null data response gracefully by defaulting to empty array when routineId is not provided', async () => {
            (RoutineService.getUserRoutines as jest.Mock).mockResolvedValue({
                data: null,
                error: null,
            });

            const hook = await renderHook(() => useRoutineController(mockUserId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            expect(hook.result.current.routines).toEqual([]);
            expect(hook.result.current.workoutStats).toEqual({});
        });

        it('handles routines without rutinas_diarias without loading stats', async () => {
            const routineWithoutDays = {
                id: 'routine-empty',
                nombre: 'Vacia',
                activa: false,
                usuario_id: mockUserId,
            };
            (RoutineService.getUserRoutines as jest.Mock).mockResolvedValue({
                data: [routineWithoutDays],
                error: null,
            });

            const hook = await renderHook(() => useRoutineController(mockUserId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            expect(hook.result.current.routines).toEqual([routineWithoutDays]);
            expect(hook.result.current.workoutStats).toEqual({});
            expect(RoutineService.getWorkoutStatsForRoutineDay).not.toHaveBeenCalled();
        });

        it('catches and logs error if fetch fails without throwing exception', async () => {
            const error = new Error('Network error');
            (RoutineService.getUserRoutines as jest.Mock).mockRejectedValue(error);

            const hook = await renderHook(() => useRoutineController(mockUserId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            expect(console.error).toHaveBeenCalledWith('Error fetching routines:', error);
        });
    });

    describe('onRefresh', () => {
        it('sets refreshing state to true during refresh and false after completion', async () => {
            const hook = await renderHook(() => useRoutineController(mockUserId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            await act(async () => {
                const refreshPromise = hook.result.current.onRefresh();
                await refreshPromise;
            });

            expect(hook.result.current.refreshing).toBe(false);
            expect(RoutineService.getUserRoutines).toHaveBeenCalled();
        });
    });

    describe('handleDayPress', () => {
        const mockNavigation = {
            navigate: jest.fn(),
        };

        it('navigates to Workout screen with existing routine day and active workout', async () => {
            const hook = await renderHook(() => useRoutineController(mockUserId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            const existingDay = { id: 'rd-1', nombre_dia: 'Torso' };

            await act(async () => {
                await hook.result.current.handleDayPress(1, existingDay, mockNavigation);
            });

            expect(RoutineService.getOrCreateRoutineDay).not.toHaveBeenCalled();
            expect(RoutineService.getActiveWorkout).toHaveBeenCalledWith(mockUserId, 'rd-1');
            expect(mockNavigation.navigate).toHaveBeenCalledWith('Workout', {
                routineDayId: 'rd-1',
                routineDayName: 'Torso',
                workoutId: 'workout-active',
                isPending: true,
                dayOfWeek: 1,
            });
        });

        it('creates routine day when existingRoutineDay is null, refreshes and navigates', async () => {
            (RoutineService.getActiveWorkout as jest.Mock).mockResolvedValue({
                data: null,
                error: null,
            });

            const hook = await renderHook(() => useRoutineController(mockUserId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            await act(async () => {
                await hook.result.current.handleDayPress(3, null, mockNavigation);
            });

            expect(RoutineService.getOrCreateRoutineDay).toHaveBeenCalledWith(mockUserId, 3);
            expect(mockNavigation.navigate).toHaveBeenCalledWith('Workout', {
                routineDayId: 'rd-new',
                routineDayName: 'Día Creado',
                workoutId: undefined,
                isPending: false,
                dayOfWeek: 3,
            });
        });

        it('catches and logs error if getOrCreateRoutineDay fails', async () => {
            const dbError = new Error('Database insert failed');
            (RoutineService.getOrCreateRoutineDay as jest.Mock).mockResolvedValue({
                data: null,
                error: dbError,
            });

            const hook = await renderHook(() => useRoutineController(mockUserId));

            await waitFor(() => {
                expect(hook.result.current.loading).toBe(false);
            });

            await act(async () => {
                await hook.result.current.handleDayPress(4, null, mockNavigation);
            });

            expect(console.error).toHaveBeenCalledWith('Error handling day press:', dbError);
            expect(mockNavigation.navigate).not.toHaveBeenCalled();
        });
    });

    describe('startWeeklyPlan', () => {
        it('starts weekly plan and daily workout when today is a weekday and routineDayId is provided', async () => {
            const mockDate = new Date('2026-09-02T14:30:00.000Z'); // Wednesday
            jest.useFakeTimers();
            jest.setSystemTime(mockDate);

            const hook = await renderHook(() => useRoutineController(mockUserId));

            let success: boolean = false;
            await act(async () => {
                success = await hook.result.current.startWeeklyPlan('routine-abc', 'rd-1', 3);
            });

            expect(success).toBe(true);
            expect(RoutineService.getWeeklyRoutineWithDays).toHaveBeenCalledWith('routine-abc');
            expect(RoutineService.startWeeklySession).toHaveBeenCalledWith(
                'routine-abc',
                expect.any(String)
            );
            // Verify date passed to startWeeklySession represents Monday 2026-08-31
            const sessionDateCall = (RoutineService.startWeeklySession as jest.Mock).mock.calls[0][1];
            const parsedSessionDate = new Date(sessionDateCall);
            expect(parsedSessionDate.getDate()).toBe(31);
            expect(parsedSessionDate.getMonth()).toBe(7); // August (0-indexed)

            expect(RoutineService.startDailyWorkout).toHaveBeenCalledWith(
                'rd-1',
                expect.any(String),
                expect.any(String)
            );

            jest.useRealTimers();
        });

        it('calculates Monday correctly when today is Sunday (day 0)', async () => {
            const mockSunday = new Date('2026-09-06T18:00:00.000Z');
            jest.useFakeTimers();
            jest.setSystemTime(mockSunday);

            const hook = await renderHook(() => useRoutineController(mockUserId));

            let success: boolean = false;
            await act(async () => {
                success = await hook.result.current.startWeeklyPlan('routine-abc', '', 0);
            });

            expect(success).toBe(true);
            expect(RoutineService.startWeeklySession).toHaveBeenCalledWith(
                'routine-abc',
                expect.any(String)
            );
            const sessionDateCall = (RoutineService.startWeeklySession as jest.Mock).mock.calls[0][1];
            const parsedSessionDate = new Date(sessionDateCall);
            expect(parsedSessionDate.getDate()).toBe(31);
            expect(parsedSessionDate.getMonth()).toBe(7); // August (0-indexed)

            expect(RoutineService.startDailyWorkout).not.toHaveBeenCalled();

            jest.useRealTimers();
        });

        it('returns false and logs error when routine is not found', async () => {
            (RoutineService.getWeeklyRoutineWithDays as jest.Mock).mockResolvedValue({
                data: null,
                error: null,
            });

            const hook = await renderHook(() => useRoutineController(mockUserId));

            let success: boolean = true;
            await act(async () => {
                success = await hook.result.current.startWeeklyPlan('routine-invalid', 'rd-1', 1);
            });

            expect(success).toBe(false);
            expect(console.error).toHaveBeenCalledWith('Error starting weekly plan:', expect.any(Error));
        });

        it('returns false and logs error when startWeeklySession throws', async () => {
            (RoutineService.startWeeklySession as jest.Mock).mockRejectedValue(new Error('Session error'));

            const hook = await renderHook(() => useRoutineController(mockUserId));

            let success: boolean = true;
            await act(async () => {
                success = await hook.result.current.startWeeklyPlan('routine-abc', 'rd-1', 1);
            });

            expect(success).toBe(false);
            expect(console.error).toHaveBeenCalledWith('Error starting weekly plan:', expect.any(Error));
        });
    });

    describe('getDayStatus', () => {
        it('returns COMPLETED status when workout is completed and has endTime', async () => {
            const hook = await renderHook(() => useRoutineController(mockUserId));

            const stats = {
                exerciseCount: 5,
                duration: 60,
                isCompleted: true,
                startTime: '2026-09-01T10:00:00Z',
                endTime: '2026-09-01T11:00:00Z',
            };

            const status = hook.result.current.getDayStatus(stats, true, false);

            expect(status).toEqual({
                status: 'COMPLETED',
                label: 'Completado',
                icon: 'check-circle',
                isDisabled: true,
                action: 'none',
            });
        });

        it('returns MISSED status when day is in the past and workout was not started or ended', async () => {
            const hook = await renderHook(() => useRoutineController(mockUserId));

            const stats = {
                exerciseCount: 0,
                duration: null,
                isCompleted: false,
                startTime: null,
                endTime: null,
            };

            const status = hook.result.current.getDayStatus(stats, false, true);

            expect(status).toEqual({
                status: 'MISSED',
                label: 'No Realizado',
                icon: 'close',
                isDisabled: true,
                action: 'none',
            });
        });

        it('returns ACTIVE status when workout has started, has not ended and is not completed', async () => {
            const hook = await renderHook(() => useRoutineController(mockUserId));

            const stats = {
                exerciseCount: 3,
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
                isDisabled: false,
                action: 'continue',
            });
        });

        it('returns PENDING status by default for future or unstarted workouts', async () => {
            const hook = await renderHook(() => useRoutineController(mockUserId));

            const stats = {
                exerciseCount: 0,
                duration: null,
                isCompleted: false,
                startTime: null,
                endTime: null,
            };

            const status = hook.result.current.getDayStatus(stats, true, false);

            expect(status).toEqual({
                status: 'PENDING',
                label: 'Empezar',
                icon: 'play-arrow',
                isDisabled: false,
                action: 'start',
            });
        });

        it('handles undefined stats gracefully and returns PENDING for non-past days', async () => {
            const hook = await renderHook(() => useRoutineController(mockUserId));

            const status = hook.result.current.getDayStatus(undefined, true, false);

            expect(status).toEqual({
                status: 'PENDING',
                label: 'Empezar',
                icon: 'play-arrow',
                isDisabled: false,
                action: 'start',
            });
        });

        it('handles undefined stats gracefully and returns MISSED for past days', async () => {
            const hook = await renderHook(() => useRoutineController(mockUserId));

            const status = hook.result.current.getDayStatus(undefined, false, true);

            expect(status).toEqual({
                status: 'MISSED',
                label: 'No Realizado',
                icon: 'close',
                isDisabled: true,
                action: 'none',
            });
        });
    });
});
