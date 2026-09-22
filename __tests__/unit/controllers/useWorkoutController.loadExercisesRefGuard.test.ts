import { renderHook, waitFor } from '@testing-library/react-native';
import { useWorkoutController } from '../../../src/controllers/useWorkoutController';
import { WorkoutService } from '../../../src/services/WorkoutService';
import { RoutineService } from '../../../src/services/RoutineService';

jest.mock('../../../src/hooks/workout/useWorkoutSets', () => ({
    useWorkoutSets: () => ({
        exercises: [],
        setExercises: jest.fn(),
        previousWorkout: null,
        setPreviousWorkout: jest.fn(),
        loadExercises: null,
        loadSeriesForExercise: jest.fn(),
        addSet: jest.fn(),
        addSets: jest.fn(),
        updateSet: jest.fn(),
        toggleCompleteSet: jest.fn(),
        updateSetType: jest.fn(),
        deleteSet: jest.fn(),
        removeExercise: jest.fn(),
        addExercise: jest.fn(),
        updateWeightType: jest.fn(),
        swapExercise: jest.fn(),
        reloadExercises: jest.fn(),
    }),
}));

jest.mock('../../../src/services/WorkoutService', () => ({
    WorkoutService: {
        getWorkoutDetails: jest.fn(),
        createWorkout: jest.fn(),
        completeWorkout: jest.fn(),
        getSeriesForExercise: jest.fn(),
        addSet: jest.fn(),
        updateSet: jest.fn(),
        deleteSet: jest.fn(),
        removeExerciseFromRoutine: jest.fn(),
        getLastCompletedWorkoutForDay: jest.fn(),
        addExerciseToWorkout: jest.fn(),
        removeExerciseFromWorkout: jest.fn(),
        getExerciseHistory: jest.fn(),
        updateWeightType: jest.fn(),
    },
}));

jest.mock('../../../src/services/RoutineService', () => ({
    RoutineService: {
        getRoutineDayById: jest.fn(),
        getWorkoutStatsForRoutineDay: jest.fn(),
        getActiveWorkout: jest.fn(),
        startDailyWorkout: jest.fn(),
    },
}));

jest.mock('../../../src/services/PersonalRecordService', () => ({
    PersonalRecordService: {
        getHistoricalPRs: jest.fn().mockResolvedValue({
            data: { maxWeight: 80, maxVolume: 800, max1RM: 100 },
            error: null,
        }),
        checkSetForPR: jest.fn().mockReturnValue({ isPR: false, brokenPRs: [] }),
    },
}));

jest.mock('../../../src/services/HapticService', () => ({
    HapticService: {
        selection: jest.fn(),
        prCelebration: jest.fn(),
        success: jest.fn(),
        light: jest.fn(),
    },
}));

describe('useWorkoutController.loadExercisesRefGuard (PF-373)', () => {
    let getDaySpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        getDaySpy = jest.spyOn(Date.prototype, 'getDay').mockReturnValue(3);
        (RoutineService.getActiveWorkout as jest.Mock).mockResolvedValue({
            data: null,
            error: null,
        });
        (RoutineService.getWorkoutStatsForRoutineDay as jest.Mock).mockResolvedValue({
            data: { exerciseCount: 0 },
            error: null,
        });
    });

    afterEach(() => {
        getDaySpy.mockRestore();
    });

    it('does not delegate loadExercises when the internal ref is not yet bound (falsy guard branch)', async () => {
        const hook = await renderHook(() => useWorkoutController(null, 'rd-1', 'u-1', 5));
        await waitFor(() => expect(hook.result.current.loading).toBe(false));

        expect(WorkoutService.getWorkoutDetails).not.toHaveBeenCalled();
        expect(RoutineService.getRoutineDayById).not.toHaveBeenCalled();
        expect(hook.result.current.mode).toBe('PENDING');
    });
});