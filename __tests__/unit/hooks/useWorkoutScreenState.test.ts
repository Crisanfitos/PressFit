import { renderHook, act } from '@testing-library/react-native';
import { useWorkoutScreenState } from '../../../src/components/workout/useWorkoutScreenState';

jest.mock('../../../src/services/HapticService', () => ({
  HapticService: {
    selection: jest.fn(),
  },
}));

jest.mock('../../../src/services/TimerNotificationService', () => ({
  checkActiveRestTimer: jest.fn().mockResolvedValue({ active: false }),
  saveActiveWorkoutParams: jest.fn().mockResolvedValue(undefined),
  getActiveWorkoutParams: jest.fn().mockResolvedValue(null),
  clearActiveWorkoutParams: jest.fn().mockResolvedValue(undefined),
}));

describe('useWorkoutScreenState Hook (PF-331)', () => {
  const mockUpdateSet = jest.fn().mockResolvedValue(undefined);
  const mockAddSets = jest.fn().mockResolvedValue(undefined);
  const mockReloadExercises = jest.fn();
  const mockNavigation = {
    navigate: jest.fn(),
    addListener: jest.fn().mockReturnValue(jest.fn()),
  };

  const mockExercises = [
    {
      id: 'ex-bench',
      routine_exercise_id: 're-bench',
      titulo: 'Press de Banca',
      sets: [
        { id: 'set-1', numero_serie: 1, peso_utilizado: 50, repeticiones: 10 },
        { id: 'set-2', numero_serie: 2, peso_utilizado: 50, repeticiones: 10 },
        { id: 'set-3', numero_serie: 3, peso_utilizado: 50, repeticiones: 8 },
      ],
    },
    {
      id: 'ex-squat',
      routine_exercise_id: 're-squat',
      titulo: 'Sentadilla',
      sets: [
        { id: 'set-4', numero_serie: 1, peso_utilizado: 80, repeticiones: 8 },
        { id: 'set-5', numero_serie: 2, peso_utilizado: 80, repeticiones: 8 },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupHook = async () => {
    const hook = renderHook(() =>
      useWorkoutScreenState({
        controllerLoading: false,
        mode: 'PREVIEW',
        exercises: mockExercises,
        addSets: mockAddSets,
        updateSet: mockUpdateSet,
        reloadExercises: mockReloadExercises,
        navigation: mockNavigation,
      })
    );
    return hook;
  };

  it('handleOpenPlateCalculator sets activePlateExerciseId when exerciseId is passed directly', async () => {
    const hook = await setupHook();

    await act(async () => {
      hook.result.current.handleOpenPlateCalculator(60, 'set-1', 'ex-bench');
    });

    expect(hook.result.current.plateCalculatorVisible).toBe(true);
    expect(hook.result.current.plateCalculatorWeight).toBe(60);
    expect(hook.result.current.activePlateSetId).toBe('set-1');
    expect(hook.result.current.activePlateExerciseId).toBe('ex-bench');
  });

  it('handleOpenPlateCalculator infers activePlateExerciseId from setId when exerciseId is not passed', async () => {
    const hook = await setupHook();

    await act(async () => {
      hook.result.current.handleOpenPlateCalculator(80, 'set-4');
    });

    expect(hook.result.current.plateCalculatorVisible).toBe(true);
    expect(hook.result.current.plateCalculatorWeight).toBe(80);
    expect(hook.result.current.activePlateSetId).toBe('set-4');
    expect(hook.result.current.activePlateExerciseId).toBe('ex-squat');
  });

  it('handleApplyPlateCalculatorWeight applies weight to ALL sets of the selected exercise', async () => {
    const hook = await setupHook();

    await act(async () => {
      hook.result.current.handleOpenPlateCalculator(60, 'set-1', 'ex-bench');
    });

    await act(async () => {
      await hook.result.current.handleApplyPlateCalculatorWeight(75);
    });

    // ex-bench has 3 sets: set-1, set-2, set-3
    expect(mockUpdateSet).toHaveBeenCalledTimes(3);
    expect(mockUpdateSet).toHaveBeenCalledWith('set-1', 'weight', '75');
    expect(mockUpdateSet).toHaveBeenCalledWith('set-2', 'weight', '75');
    expect(mockUpdateSet).toHaveBeenCalledWith('set-3', 'weight', '75');

    // Modal state reset
    expect(hook.result.current.plateCalculatorVisible).toBe(false);
    expect(hook.result.current.activePlateSetId).toBeNull();
    expect(hook.result.current.activePlateExerciseId).toBeNull();
  });

  it('handleApplyPlateCalculatorWeight applies weight to ALL sets when opened from set button without exerciseId', async () => {
    const hook = await setupHook();

    await act(async () => {
      hook.result.current.handleOpenPlateCalculator(80, 'set-5');
    });

    await act(async () => {
      await hook.result.current.handleApplyPlateCalculatorWeight(90);
    });

    // ex-squat has 2 sets: set-4, set-5
    expect(mockUpdateSet).toHaveBeenCalledTimes(2);
    expect(mockUpdateSet).toHaveBeenCalledWith('set-4', 'weight', '90');
    expect(mockUpdateSet).toHaveBeenCalledWith('set-5', 'weight', '90');

    expect(hook.result.current.plateCalculatorVisible).toBe(false);
    expect(hook.result.current.activePlateSetId).toBeNull();
    expect(hook.result.current.activePlateExerciseId).toBeNull();
  });
});
