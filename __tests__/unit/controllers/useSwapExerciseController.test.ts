import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useSwapExerciseController, OldExerciseData } from '../../../src/controllers/useSwapExerciseController';
import { WorkoutService } from '../../../src/services/WorkoutService';
import { Exercise } from '../../../src/controllers/useExerciseController';

jest.mock('../../../src/services/WorkoutService', () => ({
    WorkoutService: {
        swapExerciseInWorkout: jest.fn(),
    },
}));

jest.mock('../../../src/controllers/useExerciseController', () => ({
    useExerciseController: jest.fn(() => ({
        exercises: [
            {
                id: 'cand-1',
                titulo: 'Press Militar',
                musculos_primarios: ['Hombro'],
                categoria: 'Fuerza',
            },
            {
                id: 'cand-2',
                titulo: 'Elevaciones Laterales',
                musculos_primarios: ['Hombro'],
                categoria: 'Hipertrofia',
            },
        ],
        loading: false,
        searchQuery: '',
        setSearchQuery: jest.fn(),
        filters: { categoria: null, musculo: null, dificultad: null },
        setFilter: jest.fn(),
        clearFilter: jest.fn(),
        filterOptions: { categorias: [], musculos: [], dificultades: [] },
    })),
}));

jest.spyOn(Alert, 'alert');

describe('useSwapExerciseController (PF-367)', () => {
    const mockNavigation = {
        goBack: jest.fn(),
    };

    const mockOldExercise: OldExerciseData = {
        id: 'ex-old-1',
        titulo: 'Press de Banca',
        routine_exercise_id: 're-123',
        target_sets: 4,
        sets: [{ id: 's1' }, { id: 's2' }, { id: 's3' }, { id: 's4' }],
    };

    const mockCandidate: Exercise = {
        id: 'cand-1',
        titulo: 'Press Militar',
        musculos_primarios: ['Hombro'],
        categoria: 'Fuerza',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Initial sets count calculation', () => {
        it('calculates sets from oldExercise.sets.length', async () => {
            const hook = await renderHook(() =>
                useSwapExerciseController({
                    workoutId: 'w-1',
                    oldExercise: mockOldExercise,
                    navigation: mockNavigation,
                })
            );

            expect(hook.result.current.initialSetsCount).toBe(4);
            expect(hook.result.current.setsCount).toBe(4);
        });

        it('falls back to oldExercise.series.length if sets is missing', async () => {
            const exerciseWithSeries: OldExerciseData = {
                id: 'ex-2',
                titulo: 'Remo',
                routine_exercise_id: 're-2',
                series: [{ id: 's1' }, { id: 's2' }],
            };

            const hook = await renderHook(() =>
                useSwapExerciseController({
                    workoutId: 'w-1',
                    oldExercise: exerciseWithSeries,
                    navigation: mockNavigation,
                })
            );

            expect(hook.result.current.initialSetsCount).toBe(2);
            expect(hook.result.current.setsCount).toBe(2);
        });

        it('falls back to oldExercise.target_sets if sets and series are missing', async () => {
            const exerciseWithTarget: OldExerciseData = {
                id: 'ex-3',
                titulo: 'Curl',
                routine_exercise_id: 're-3',
                target_sets: 5,
            };

            const hook = await renderHook(() =>
                useSwapExerciseController({
                    workoutId: 'w-1',
                    oldExercise: exerciseWithTarget,
                    navigation: mockNavigation,
                })
            );

            expect(hook.result.current.initialSetsCount).toBe(5);
        });

        it('defaults to 3 if all sets properties are missing', async () => {
            const minimalExercise: OldExerciseData = {
                id: 'ex-4',
                titulo: 'Extensiones',
                routine_exercise_id: 're-4',
            };

            const hook = await renderHook(() =>
                useSwapExerciseController({
                    workoutId: 'w-1',
                    oldExercise: minimalExercise,
                    navigation: mockNavigation,
                })
            );

            expect(hook.result.current.initialSetsCount).toBe(3);
        });

        it('clamps sets count between 1 and 10', async () => {
            const highSetsExercise: OldExerciseData = {
                id: 'ex-5',
                titulo: 'Sentadilla',
                routine_exercise_id: 're-5',
                target_sets: 25,
            };

            const hook = await renderHook(() =>
                useSwapExerciseController({
                    workoutId: 'w-1',
                    oldExercise: highSetsExercise,
                    navigation: mockNavigation,
                })
            );

            expect(hook.result.current.initialSetsCount).toBe(10);
        });
    });

    describe('Candidate selection & step transitions', () => {
        it('selects and toggles candidate exercise', async () => {
            const hook = await renderHook(() =>
                useSwapExerciseController({
                    workoutId: 'w-1',
                    oldExercise: mockOldExercise,
                    navigation: mockNavigation,
                })
            );

            expect(hook.result.current.selectedCandidate).toBeNull();

            await act(async () => {
                hook.result.current.handleSelectExercise(mockCandidate);
            });
            expect(hook.result.current.selectedCandidate?.id).toBe('cand-1');

            // Unselect if same exercise clicked
            await act(async () => {
                hook.result.current.handleSelectExercise(mockCandidate);
            });
            expect(hook.result.current.selectedCandidate).toBeNull();
        });

        it('does not transition to step 2 if no candidate is selected', async () => {
            const hook = await renderHook(() =>
                useSwapExerciseController({
                    workoutId: 'w-1',
                    oldExercise: mockOldExercise,
                    navigation: mockNavigation,
                })
            );

            await act(async () => {
                hook.result.current.handleContinueToStep2();
            });
            expect(hook.result.current.step).toBe(1);
        });

        it('transitions to step 2 when candidate is selected and handleContinueToStep2 is called', async () => {
            const hook = await renderHook(() =>
                useSwapExerciseController({
                    workoutId: 'w-1',
                    oldExercise: mockOldExercise,
                    navigation: mockNavigation,
                })
            );

            await act(async () => {
                hook.result.current.handleSelectExercise(mockCandidate);
            });

            await act(async () => {
                hook.result.current.handleContinueToStep2();
            });

            expect(hook.result.current.step).toBe(2);
        });

        it('handles back button navigation in step 2 (returns to step 1)', async () => {
            const hook = await renderHook(() =>
                useSwapExerciseController({
                    workoutId: 'w-1',
                    oldExercise: mockOldExercise,
                    navigation: mockNavigation,
                })
            );

            await act(async () => {
                hook.result.current.handleSelectExercise(mockCandidate);
            });
            await act(async () => {
                hook.result.current.handleContinueToStep2();
            });
            expect(hook.result.current.step).toBe(2);

            await act(async () => {
                hook.result.current.handleBack();
            });
            expect(hook.result.current.step).toBe(1);
            expect(mockNavigation.goBack).not.toHaveBeenCalled();
        });

        it('calls navigation.goBack() when handleBack is called in step 1', async () => {
            const hook = await renderHook(() =>
                useSwapExerciseController({
                    workoutId: 'w-1',
                    oldExercise: mockOldExercise,
                    navigation: mockNavigation,
                })
            );

            expect(hook.result.current.step).toBe(1);
            await act(async () => {
                hook.result.current.handleBack();
            });
            expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
        });
    });

    describe('Sets increment and decrement', () => {
        it('increments and decrements sets count within limits (1..10)', async () => {
            const hook = await renderHook(() =>
                useSwapExerciseController({
                    workoutId: 'w-1',
                    oldExercise: { ...mockOldExercise, target_sets: 9, sets: undefined },
                    navigation: mockNavigation,
                })
            );

            expect(hook.result.current.setsCount).toBe(9);

            await act(async () => {
                hook.result.current.handleIncrementSets();
            });
            expect(hook.result.current.setsCount).toBe(10);

            // Cannot exceed 10
            await act(async () => {
                hook.result.current.handleIncrementSets();
            });
            expect(hook.result.current.setsCount).toBe(10);

            await act(async () => {
                hook.result.current.handleDecrementSets();
            });
            expect(hook.result.current.setsCount).toBe(9);
        });

        it('does not decrement below 1', async () => {
            const hook = await renderHook(() =>
                useSwapExerciseController({
                    workoutId: 'w-1',
                    oldExercise: { ...mockOldExercise, target_sets: 1, sets: undefined },
                    navigation: mockNavigation,
                })
            );

            expect(hook.result.current.setsCount).toBe(1);

            await act(async () => {
                hook.result.current.handleDecrementSets();
            });
            expect(hook.result.current.setsCount).toBe(1);
        });
    });

    describe('handleFinalizeSwap', () => {
        it('alerts error if required data is missing', async () => {
            const hook = await renderHook(() =>
                useSwapExerciseController({
                    workoutId: '',
                    oldExercise: mockOldExercise,
                    navigation: mockNavigation,
                })
            );

            await act(async () => {
                await hook.result.current.handleFinalizeSwap();
            });

            expect(Alert.alert).toHaveBeenCalled();
            expect(WorkoutService.swapExerciseInWorkout).not.toHaveBeenCalled();
        });

        it('successfully executes swap and navigates back', async () => {
            (WorkoutService.swapExerciseInWorkout as jest.Mock).mockResolvedValueOnce({
                data: { success: true },
                error: null,
            });

            const hook = await renderHook(() =>
                useSwapExerciseController({
                    workoutId: 'workout-99',
                    oldExercise: mockOldExercise,
                    navigation: mockNavigation,
                })
            );

            await act(async () => {
                hook.result.current.handleSelectExercise(mockCandidate);
            });

            await act(async () => {
                await hook.result.current.handleFinalizeSwap();
            });

            expect(WorkoutService.swapExerciseInWorkout).toHaveBeenCalledWith(
                'workout-99',
                're-123',
                'cand-1',
                4
            );
            expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
        });

        it('displays error alert when swapExerciseInWorkout returns an error', async () => {
            (WorkoutService.swapExerciseInWorkout as jest.Mock).mockResolvedValueOnce({
                data: null,
                error: { message: 'Database error' },
            });

            const hook = await renderHook(() =>
                useSwapExerciseController({
                    workoutId: 'workout-99',
                    oldExercise: mockOldExercise,
                    navigation: mockNavigation,
                })
            );

            await act(async () => {
                hook.result.current.handleSelectExercise(mockCandidate);
            });

            await act(async () => {
                await hook.result.current.handleFinalizeSwap();
            });

            expect(WorkoutService.swapExerciseInWorkout).toHaveBeenCalled();
            expect(Alert.alert).toHaveBeenCalled();
            expect(mockNavigation.goBack).not.toHaveBeenCalled();
            expect(hook.result.current.isSubmitting).toBe(false);
        });

        it('handles unexpected exceptions and displays error alert', async () => {
            (WorkoutService.swapExerciseInWorkout as jest.Mock).mockRejectedValueOnce(
                new Error('Network failure')
            );

            const hook = await renderHook(() =>
                useSwapExerciseController({
                    workoutId: 'workout-99',
                    oldExercise: mockOldExercise,
                    navigation: mockNavigation,
                })
            );

            await act(async () => {
                hook.result.current.handleSelectExercise(mockCandidate);
            });

            await act(async () => {
                await hook.result.current.handleFinalizeSwap();
            });

            expect(Alert.alert).toHaveBeenCalled();
            expect(hook.result.current.isSubmitting).toBe(false);
        });
    });
});
