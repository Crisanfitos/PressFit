import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useWorkoutMode } from '../../../../src/hooks/workout/useWorkoutMode';
import { WorkoutService } from '../../../../src/services/WorkoutService';
import { RoutineService } from '../../../../src/services/RoutineService';
import { clearActiveWorkoutParams, saveActiveWorkoutParams } from '../../../../src/services/TimerNotificationService';

jest.mock('../../../../src/services/WorkoutService', () => ({
    WorkoutService: {
        getWorkoutDetails: jest.fn(),
        completeWorkout: jest.fn(),
        getLastCompletedWorkoutForDay: jest.fn(),
    },
}));

jest.mock('../../../../src/services/RoutineService', () => ({
    RoutineService: {
        getRoutineDayById: jest.fn(),
        getWorkoutStatsForRoutineDay: jest.fn(),
        getActiveWorkout: jest.fn(),
        startDailyWorkout: jest.fn(),
    },
}));

jest.mock('../../../../src/services/TimerNotificationService', () => ({
    clearActiveWorkoutParams: jest.fn(),
    saveActiveWorkoutParams: jest.fn(),
}));

describe('useWorkoutMode', () => {
    let mockLoadExercises: jest.Mock;
    let mockSetTimer: jest.Mock;
    let mockSetIsTimerRunning: jest.Mock;
    let mockStopTimer: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockLoadExercises = jest.fn().mockResolvedValue(undefined);
        mockSetTimer = jest.fn();
        mockSetIsTimerRunning = jest.fn();
        mockStopTimer = jest.fn();
    });

    it('initializes in PREVIEW mode when today has no active workout', async () => {
        const getDaySpy = jest.spyOn(Date.prototype, 'getDay').mockReturnValue(3);
        (RoutineService.getActiveWorkout as jest.Mock).mockResolvedValue({ data: null });

        const hook = await renderHook(() =>
            useWorkoutMode({
                initialWorkoutId: null,
                routineDayId: 'rd-1',
                userId: 'u-1',
                dayOfWeek: 3,
                isEditingTemplate: false,
                loadExercises: mockLoadExercises,
                timer: 0,
                setTimer: mockSetTimer,
                setIsTimerRunning: mockSetIsTimerRunning,
                stopTimer: mockStopTimer,
            })
        );
        await waitFor(() => expect(hook.result.current).not.toBeNull());

        await act(async () => {
            await hook.result.current.initWorkout();
        });

        expect(hook.result.current.mode).toBe('PREVIEW');
        expect(mockLoadExercises).toHaveBeenCalledWith('rd-1', null);
        getDaySpy.mockRestore();
    });

    it('initializes in VIEW mode for past day with workout id', async () => {
        const getDaySpy = jest.spyOn(Date.prototype, 'getDay').mockReturnValue(3);
        (WorkoutService.getWorkoutDetails as jest.Mock).mockResolvedValue({
            data: { id: 'w-1', completada: true },
        });

        const hook = await renderHook(() =>
            useWorkoutMode({
                initialWorkoutId: 'w-1',
                routineDayId: 'rd-1',
                userId: 'u-1',
                dayOfWeek: 1,
                isEditingTemplate: false,
                loadExercises: mockLoadExercises,
                timer: 0,
                setTimer: mockSetTimer,
                setIsTimerRunning: mockSetIsTimerRunning,
                stopTimer: mockStopTimer,
            })
        );
        await waitFor(() => expect(hook.result.current).not.toBeNull());

        await act(async () => {
            await hook.result.current.initWorkout();
        });

        expect(hook.result.current.mode).toBe('VIEW');
        expect(hook.result.current.workout).toEqual({ id: 'w-1', completada: true });
        getDaySpy.mockRestore();
    });

    it('starts workout successfully and updates state to ACTIVE', async () => {
        const getDaySpy = jest.spyOn(Date.prototype, 'getDay').mockReturnValue(3);
        (WorkoutService.getLastCompletedWorkoutForDay as jest.Mock).mockResolvedValue({ data: null });
        (RoutineService.getRoutineDayById as jest.Mock).mockResolvedValue({ data: { id: 'rd-1' } });
        (RoutineService.startDailyWorkout as jest.Mock).mockResolvedValue({ data: { id: 'w-new' } });
        (WorkoutService.getWorkoutDetails as jest.Mock).mockResolvedValue({
            data: { id: 'w-new', nombre_dia: 'Pecho' },
        });

        const hook = await renderHook(() =>
            useWorkoutMode({
                initialWorkoutId: null,
                routineDayId: 'rd-1',
                userId: 'u-1',
                dayOfWeek: 3,
                isEditingTemplate: false,
                loadExercises: mockLoadExercises,
                timer: 0,
                setTimer: mockSetTimer,
                setIsTimerRunning: mockSetIsTimerRunning,
                stopTimer: mockStopTimer,
            })
        );
        await waitFor(() => expect(hook.result.current).not.toBeNull());

        await act(async () => {
            await hook.result.current.startWorkout();
        });

        expect(hook.result.current.mode).toBe('ACTIVE');
        expect(hook.result.current.workout).toEqual({ id: 'w-new', nombre_dia: 'Pecho' });
        expect(saveActiveWorkoutParams).toHaveBeenCalled();
        expect(mockSetIsTimerRunning).toHaveBeenCalledWith(true);
        getDaySpy.mockRestore();
    });

    it('finishes workout and clears active workout params', async () => {
        const getDaySpy = jest.spyOn(Date.prototype, 'getDay').mockReturnValue(3);
        (WorkoutService.completeWorkout as jest.Mock).mockResolvedValue({ error: null });
        (WorkoutService.getWorkoutDetails as jest.Mock).mockResolvedValue({
            data: { id: 'w-1', completada: false },
        });

        const hook = await renderHook(() =>
            useWorkoutMode({
                initialWorkoutId: 'w-1',
                routineDayId: 'rd-1',
                userId: 'u-1',
                dayOfWeek: 3,
                isEditingTemplate: false,
                loadExercises: mockLoadExercises,
                timer: 180,
                setTimer: mockSetTimer,
                setIsTimerRunning: mockSetIsTimerRunning,
                stopTimer: mockStopTimer,
            })
        );
        await waitFor(() => expect(hook.result.current).not.toBeNull());

        await act(async () => {
            await hook.result.current.initWorkout();
        });

        let finished: boolean = false;
        await act(async () => {
            finished = await hook.result.current.finishWorkout();
        });

        expect(finished).toBe(true);
        expect(mockStopTimer).toHaveBeenCalled();
        expect(WorkoutService.completeWorkout).toHaveBeenCalledWith('w-1', 3);
        expect(clearActiveWorkoutParams).toHaveBeenCalled();
        getDaySpy.mockRestore();
    });
});
