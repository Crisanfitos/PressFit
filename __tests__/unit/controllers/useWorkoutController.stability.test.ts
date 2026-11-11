import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useState } from 'react';
import { useWorkoutController } from '../../../src/controllers/useWorkoutController';
import { useWorkoutScreenState } from '../../../src/components/workout/useWorkoutScreenState';
import { WorkoutService } from '../../../src/services/WorkoutService';
import { RoutineService } from '../../../src/services/RoutineService';
import { PersonalRecordService } from '../../../src/services/PersonalRecordService';
import { HapticService } from '../../../src/services/HapticService';

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
        setCompleted: jest.fn(),
        prCelebration: jest.fn(),
        success: jest.fn(),
        light: jest.fn(),
    },
}));

jest.mock('../../../src/services/TimerNotificationService', () => ({
    checkActiveRestTimer: jest.fn().mockResolvedValue({ active: false }),
    saveActiveWorkoutParams: jest.fn().mockResolvedValue(undefined),
    getActiveWorkoutParams: jest.fn().mockResolvedValue(null),
    clearActiveWorkoutParams: jest.fn().mockResolvedValue(undefined),
}));

describe('Empirical Verification: Callback & Controller Reference Stability (Challenger M1)', () => {
    let getDaySpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        getDaySpy = jest.spyOn(Date.prototype, 'getDay').mockReturnValue(3);

        (WorkoutService.getWorkoutDetails as jest.Mock).mockResolvedValue({
            data: {
                id: 'w-1',
                completada: false,
                hora_inicio: new Date().toISOString(),
                ejercicios_programados: [
                    {
                        id: 're-1',
                        ejercicio: { id: 'ex-1', titulo: 'Bench Press' },
                        series: [{ id: 's-1', numero_serie: 1, repeticiones: 10, peso_utilizado: 60 }],
                    },
                ],
            },
            error: null,
        });

        (WorkoutService.getLastCompletedWorkoutForDay as jest.Mock).mockResolvedValue({
            data: null,
            error: null,
        });

        (WorkoutService.getSeriesForExercise as jest.Mock).mockResolvedValue({
            data: [{ id: 's-1', numero_serie: 1, repeticiones: 10, peso_utilizado: 60 }],
            error: null,
        });

        (RoutineService.getRoutineDayById as jest.Mock).mockResolvedValue({
            data: { id: 'rd-1', nombre_dia: 'Test Day', ejercicios_programados: [] },
            error: null,
        });

        (RoutineService.getActiveWorkout as jest.Mock).mockResolvedValue({
            data: null,
            error: null,
        });
    });

    afterEach(() => {
        getDaySpy.mockRestore();
    });

    it('VERIFIED: useWorkoutScreenState callbacks remain referentially stable across parent re-renders', async () => {
        const mockUpdateSet = jest.fn().mockResolvedValue(undefined);
        const mockAddSets = jest.fn().mockResolvedValue(undefined);
        const mockReloadExercises = jest.fn();
        const mockNavigation = { navigate: jest.fn(), addListener: jest.fn().mockReturnValue(jest.fn()) };

        const exercises = [
            { id: 'ex-1', routine_exercise_id: 're-1', titulo: 'Bench Press', sets: [{ id: 's-1', peso_utilizado: 60, repeticiones: 10 }] },
        ];

        const useTestHook = () => {
            const [tick, setTick] = useState(0);
            const state = useWorkoutScreenState({
                controllerLoading: false,
                mode: 'ACTIVE',
                exercises,
                addSets: mockAddSets,
                updateSet: mockUpdateSet,
                reloadExercises: mockReloadExercises,
                navigation: mockNavigation,
            });
            return { state, triggerRerender: () => setTick((t) => t + 1) };
        };

        const hook = await renderHook(() => useTestHook());
        const firstState = hook.result.current.state;

        await act(async () => {
            hook.result.current.triggerRerender();
        });

        const secondState = hook.result.current.state;

        // Callback references are stable across re-renders
        expect(secondState.handleOpenPlateCalculator).toBe(firstState.handleOpenPlateCalculator);
        expect(secondState.handleClosePlateCalculator).toBe(firstState.handleClosePlateCalculator);
        expect(secondState.handleStartRestTimer).toBe(firstState.handleStartRestTimer);
        expect(secondState.handleRestTimerDismiss).toBe(firstState.handleRestTimerDismiss);
        expect(secondState.toggleExerciseCollapsed).toBe(firstState.toggleExerciseCollapsed);
        expect(secondState.handleConfirmAddSets).toBe(firstState.handleConfirmAddSets);
        expect(secondState.handleRestTimerStop).toBe(firstState.handleRestTimerStop);
        expect(secondState.handleApplyPlateCalculatorWeight).toBe(firstState.handleApplyPlateCalculatorWeight);
        expect(secondState).toBe(firstState);
    });

    it('VERIFIED: useWorkoutController return value is referentially stable across parent re-renders when inputs are unchanged', async () => {
        let renderCount = 0;

        const useTestHook = () => {
            const [tick, setTick] = useState(0);
            renderCount++;
            const controller = useWorkoutController('w-1', 'rd-1', 'u-1', 3);
            return {
                controller,
                triggerRerender: () => setTick((t) => t + 1),
            };
        };

        const hook = await renderHook(() => useTestHook());

        await waitFor(() => expect(hook.result.current.controller.loading).toBe(false));

        const countAfterInit = renderCount;
        const firstController = hook.result.current.controller;

        // Simulate a parent re-render with identical inputs
        await act(async () => {
            hook.result.current.triggerRerender();
        });

        const secondController = hook.result.current.controller;

        expect(renderCount).toBeGreaterThan(countAfterInit);

        // EMPIRICAL VERIFICATION: When inputs do not change, useWorkoutController preserves
        // true referential equality across parent re-renders. All underlying callbacks from
        // useWorkoutSets and useWorkoutMode are wrapped in useCallback with stable dependencies.
        expect(Object.is(firstController, secondController)).toBe(true);
        expect(Object.is(firstController.addSet, secondController.addSet)).toBe(true);
        expect(Object.is(firstController.updateSet, secondController.updateSet)).toBe(true);
        expect(Object.is(firstController.deleteSet, secondController.deleteSet)).toBe(true);
        expect(firstController).toBe(secondController);
    });

    it('STRESS TEST: exercisesRef in useWorkoutScreenState avoids stale closure when exercises list updates', async () => {
        const mockUpdateSet = jest.fn().mockResolvedValue(undefined);
        const mockAddSets = jest.fn().mockResolvedValue(undefined);
        const mockReloadExercises = jest.fn();
        const mockNavigation = { navigate: jest.fn(), addListener: jest.fn().mockReturnValue(jest.fn()) };

        const initialExercises = [
            { id: 'ex-1', routine_exercise_id: 're-1', titulo: 'Bench Press', sets: [{ id: 's-1', peso_utilizado: 60, repeticiones: 10 }] },
        ];

        const updatedExercises = [
            { id: 'ex-1', routine_exercise_id: 're-1', titulo: 'Bench Press', sets: [{ id: 's-1', peso_utilizado: 60, repeticiones: 10 }] },
            { id: 'ex-2', routine_exercise_id: 're-2', titulo: 'Squat', sets: [{ id: 's-2', peso_utilizado: 100, repeticiones: 5 }] },
        ];

        const useTestHook = () => {
            const [exerciseList, setExerciseList] = useState(initialExercises);
            const state = useWorkoutScreenState({
                controllerLoading: false,
                mode: 'ACTIVE',
                exercises: exerciseList,
                addSets: mockAddSets,
                updateSet: mockUpdateSet,
                reloadExercises: mockReloadExercises,
                navigation: mockNavigation,
            });
            return { state, updateList: () => setExerciseList(updatedExercises) };
        };

        const hook = await renderHook(() => useTestHook());

        // Call handleOpenPlateCalculator before list update
        await act(async () => {
            hook.result.current.state.handleOpenPlateCalculator(60, 's-1');
        });
        expect(hook.result.current.state.activePlateExerciseId).toBe('ex-1');

        // Update exercises list
        await act(async () => {
            hook.result.current.updateList();
        });

        // Call handleOpenPlateCalculator for new exercise set s-2
        // If exercisesRef were stale, s-2 would not be found and activePlateExerciseId would be null
        await act(async () => {
            hook.result.current.state.handleOpenPlateCalculator(100, 's-2');
        });

        // Successfully finds ex-2 through exercisesRef without stale closure
        expect(hook.result.current.state.activePlateExerciseId).toBe('ex-2');
    });

    it('STRESS TEST: mutation sequence (updateSet -> toggleCompleteSet) delivers fresh state to PR checker without stale closure', async () => {
        const checkSetForPRSpy = jest.spyOn(PersonalRecordService, 'checkSetForPR');

        const hook = await renderHook(() => useWorkoutController('w-1', 'rd-1', 'u-1', 3));

        await waitFor(() => expect(hook.result.current.loading).toBe(false));

        const initialUpdateSet = hook.result.current.updateSet;
        const initialToggleCompleteSet = hook.result.current.toggleCompleteSet;
        const initialAddSet = hook.result.current.addSet;
        const initialDeleteSet = hook.result.current.deleteSet;
        const initialFinishWorkout = hook.result.current.finishWorkout;

        // Verify initial state: 60kg, 10 reps
        expect(hook.result.current.exercises[0].sets[0].peso_utilizado).toBe(60);
        expect(hook.result.current.exercises[0].sets[0].repeticiones).toBe(10);

        // Mutate set s-1: update weight to 105 and reps to 8
        await act(async () => {
            await hook.result.current.updateSet('s-1', 'weight', 105);
        });
        await act(async () => {
            await hook.result.current.updateSet('s-1', 'reps', 8);
        });

        expect(hook.result.current.exercises[0].sets[0].peso_utilizado).toBe(105);
        expect(hook.result.current.exercises[0].sets[0].repeticiones).toBe(8);

        // Complete the set: toggleCompleteSet should pass fresh 105kg & 8 reps to PR checker via exercisesRef
        await act(async () => {
            await hook.result.current.toggleCompleteSet('s-1', true);
        });

        expect(checkSetForPRSpy).toHaveBeenCalledWith(
            { weight: 105, reps: 8 },
            expect.anything()
        );

        // Assert all action callbacks remain strictly referentially identical across mutations
        expect(hook.result.current.updateSet).toBe(initialUpdateSet);
        expect(hook.result.current.toggleCompleteSet).toBe(initialToggleCompleteSet);
        expect(hook.result.current.addSet).toBe(initialAddSet);
        expect(hook.result.current.deleteSet).toBe(initialDeleteSet);
        expect(hook.result.current.finishWorkout).toBe(initialFinishWorkout);
    });

    it('STRESS TEST: deleteSet preserves freshly updated values on sibling sets and avoids stale closure during renumbering', async () => {
        (WorkoutService.getWorkoutDetails as jest.Mock).mockResolvedValue({
            data: {
                id: 'w-1',
                completada: false,
                hora_inicio: new Date().toISOString(),
                ejercicios_programados: [
                    {
                        id: 're-1',
                        ejercicio: { id: 'ex-1', titulo: 'Bench Press' },
                        series: [
                            { id: 's-1', numero_serie: 1, repeticiones: 10, peso_utilizado: 60 },
                            { id: 's-2', numero_serie: 2, repeticiones: 10, peso_utilizado: 70 },
                            { id: 's-3', numero_serie: 3, repeticiones: 10, peso_utilizado: 80 },
                        ],
                    },
                ],
            },
            error: null,
        });

        const hook = await renderHook(() => useWorkoutController('w-1', 'rd-1', 'u-1', 3));
        await waitFor(() => expect(hook.result.current.loading).toBe(false));

        const initialDeleteSet = hook.result.current.deleteSet;
        const initialUpdateSet = hook.result.current.updateSet;

        // Mutate set s-2 weight from 70 to 75
        await act(async () => {
            await hook.result.current.updateSet('s-2', 'weight', 75);
        });

        expect(hook.result.current.exercises[0].sets[1].peso_utilizado).toBe(75);

        // Delete set s-1
        await act(async () => {
            await hook.result.current.deleteSet('s-1', 'ex-1');
        });

        // Verify remaining sets: s-2 is now numero_serie 1 with updated 75kg preserved
        const remainingSets = hook.result.current.exercises[0].sets;
        expect(remainingSets).toHaveLength(2);
        expect(remainingSets[0].id).toBe('s-2');
        expect(remainingSets[0].numero_serie).toBe(1);
        expect(remainingSets[0].peso_utilizado).toBe(75);
        expect(remainingSets[1].id).toBe('s-3');
        expect(remainingSets[1].numero_serie).toBe(2);
        expect(remainingSets[1].peso_utilizado).toBe(80);

        // Delete set s-3 as well
        await act(async () => {
            await hook.result.current.deleteSet('s-3', 'ex-1');
        });

        const finalSets = hook.result.current.exercises[0].sets;
        expect(finalSets).toHaveLength(1);
        expect(finalSets[0].id).toBe('s-2');
        expect(finalSets[0].numero_serie).toBe(1);
        expect(finalSets[0].peso_utilizado).toBe(75);

        // Callback references preserved
        expect(hook.result.current.deleteSet).toBe(initialDeleteSet);
        expect(hook.result.current.updateSet).toBe(initialUpdateSet);
    });

    it('STRESS TEST: rapid consecutive field mutations on updateSet are applied atomically without stale state dropping', async () => {
        const hook = await renderHook(() => useWorkoutController('w-1', 'rd-1', 'u-1', 3));
        await waitFor(() => expect(hook.result.current.loading).toBe(false));

        // Rapid consecutive updates in a single tick
        await act(async () => {
            hook.result.current.updateSet('s-1', 'weight', 95);
            hook.result.current.updateSet('s-1', 'reps', 12);
            hook.result.current.updateSet('s-1', 'rpe', 8.5);
            hook.result.current.updateSet('s-1', 'setType', 'warmup');
        });

        const set = hook.result.current.exercises[0].sets[0];
        expect(set.peso_utilizado).toBe(95);
        expect(set.repeticiones).toBe(12);
        expect(set.rpe).toBe(8.5);
        expect(set.tipo_serie).toBe('warmup');
    });

    it('STRESS TEST: finishWorkout captures current elapsed timer via timerRef without stale 0-second closure', async () => {
        const completeWorkoutSpy = jest.spyOn(WorkoutService, 'completeWorkout').mockResolvedValue({
            data: { id: 'w-1', completada: true } as any,
            error: null,
        });

        // Set hora_inicio to 300 seconds (5 minutes) ago
        const fiveMinutesAgo = new Date(Date.now() - 300 * 1000).toISOString();
        (WorkoutService.getWorkoutDetails as jest.Mock).mockResolvedValue({
            data: {
                id: 'w-1',
                completada: false,
                hora_inicio: fiveMinutesAgo,
                ejercicios_programados: [
                    {
                        id: 're-1',
                        ejercicio: { id: 'ex-1', titulo: 'Bench Press' },
                        series: [{ id: 's-1', numero_serie: 1, repeticiones: 10, peso_utilizado: 60 }],
                    },
                ],
            },
            error: null,
        });

        const hook = await renderHook(() => useWorkoutController('w-1', 'rd-1', 'u-1', 3));
        await waitFor(() => expect(hook.result.current.loading).toBe(false));

        // Timer should be initialized to ~300s
        expect(hook.result.current.timer).toBeGreaterThanOrEqual(299);

        // Call finishWorkout
        let result: boolean = false;
        await act(async () => {
            result = await hook.result.current.finishWorkout();
        });

        expect(result).toBe(true);
        // Duration should be at least 5 minutes, NOT 0 from a stale initial closure
        const calledDuration = completeWorkoutSpy.mock.calls[0][1];
        expect(calledDuration).toBeGreaterThanOrEqual(5);
    });

    it('STRESS TEST: addSet flow updates series and preserves all callback identities', async () => {
        (WorkoutService.getWorkoutDetails as jest.Mock).mockResolvedValue({
            data: {
                id: 'w-1',
                completada: false,
                hora_inicio: new Date().toISOString(),
                ejercicios_programados: [
                    {
                        id: 're-1',
                        ejercicio: { id: 'ex-1', titulo: 'Bench Press' },
                        series: [{ id: 's-1', numero_serie: 1, repeticiones: 10, peso_utilizado: 60 }],
                    },
                ],
            },
            error: null,
        });

        (WorkoutService.getSeriesForExercise as jest.Mock)
            .mockResolvedValueOnce({
                data: [{ id: 's-1', numero_serie: 1, repeticiones: 10, peso_utilizado: 60 }],
                error: null,
            })
            .mockResolvedValueOnce({
                data: [
                    { id: 's-1', numero_serie: 1, repeticiones: 10, peso_utilizado: 60 },
                    { id: 's-2', numero_serie: 2, repeticiones: 10, peso_utilizado: 60, tipo_serie: 'normal' },
                ],
                error: null,
            });

        (WorkoutService.addSet as jest.Mock).mockResolvedValue({
            data: { id: 's-2', numero_serie: 2 },
            error: null,
        });

        const hook = await renderHook(() => useWorkoutController('w-1', 'rd-1', 'u-1', 3));
        await waitFor(() => expect(hook.result.current.loading).toBe(false));

        const initialAddSet = hook.result.current.addSet;
        const initialUpdateSet = hook.result.current.updateSet;
        const initialDeleteSet = hook.result.current.deleteSet;

        await act(async () => {
            await hook.result.current.addSet('ex-1');
        });

        expect(WorkoutService.addSet).toHaveBeenCalledWith('w-1', 'ex-1', 2, 60, 10);
        expect(hook.result.current.exercises[0].sets).toHaveLength(2);

        // Callbacks remain strictly stable
        expect(hook.result.current.addSet).toBe(initialAddSet);
        expect(hook.result.current.updateSet).toBe(initialUpdateSet);
        expect(hook.result.current.deleteSet).toBe(initialDeleteSet);
    });
});
