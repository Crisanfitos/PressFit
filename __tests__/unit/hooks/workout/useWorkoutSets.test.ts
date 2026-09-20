import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useWorkoutSets } from '../../../../src/hooks/workout/useWorkoutSets';
import { WorkoutService } from '../../../../src/services/WorkoutService';
import { RoutineService } from '../../../../src/services/RoutineService';

jest.mock('../../../../src/services/WorkoutService', () => ({
    WorkoutService: {
        getWorkoutDetails: jest.fn(),
        getSeriesForExercise: jest.fn(),
        addSet: jest.fn(),
        updateSet: jest.fn(),
        deleteSet: jest.fn(),
        removeExerciseFromRoutine: jest.fn(),
        removeExerciseFromWorkout: jest.fn(),
        addExerciseToWorkout: jest.fn(),
        updateWeightType: jest.fn(),
        swapExerciseInWorkout: jest.fn(),
    },
}));

jest.mock('../../../../src/services/RoutineService', () => ({
    RoutineService: {
        getRoutineDayById: jest.fn(),
    },
}));

describe('useWorkoutSets', () => {
    let mockSetWorkout: jest.Mock;
    let mockOnPrefetchPRs: jest.Mock;
    let mockOnCheckPR: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSetWorkout = jest.fn();
        mockOnPrefetchPRs = jest.fn().mockResolvedValue(undefined);
        mockOnCheckPR = jest.fn().mockResolvedValue({ isPR: false, celebrationData: null });
    });

    it('loads exercises from workout details when workoutId is provided', async () => {
        (WorkoutService.getWorkoutDetails as jest.Mock).mockResolvedValue({
            data: {
                id: 'w-1',
                ejercicios_programados: [
                    {
                        id: 're-1',
                        ejercicio_id: 'ex-1',
                        ejercicio: { id: 'ex-1', titulo: 'Sentadilla' },
                        tipo_peso: 'total',
                        series: [
                            { id: 's-1', numero_serie: 1, repeticiones: 10, peso_utilizado: 100, is_completed: true },
                        ],
                    },
                ],
            },
        });

        const hook = await renderHook(() =>
            useWorkoutSets({
                workout: { id: 'w-1' },
                setWorkout: mockSetWorkout,
                mode: 'ACTIVE',
                isEditingTemplate: false,
                routineDayId: 'rd-1',
                onPrefetchPRs: mockOnPrefetchPRs,
                onCheckPR: mockOnCheckPR,
            })
        );
        await waitFor(() => expect(hook.result.current).not.toBeNull());

        await act(async () => {
            await hook.result.current.loadExercises('rd-1', 'w-1');
        });

        expect(hook.result.current.exercises).toHaveLength(1);
        expect(hook.result.current.exercises[0].titulo).toBe('Sentadilla');
        expect(hook.result.current.exercises[0].sets[0].is_completed).toBe(true);
        expect(mockOnPrefetchPRs).toHaveBeenCalled();
    });

    it('adds a set to exercise and calls WorkoutService.addSet', async () => {
        (WorkoutService.getSeriesForExercise as jest.Mock).mockResolvedValue({
            data: [{ id: 's-1', numero_serie: 1, repeticiones: 10, peso_utilizado: 100 }],
        });
        (WorkoutService.addSet as jest.Mock).mockResolvedValue({ error: null });

        const hook = await renderHook(() =>
            useWorkoutSets({
                workout: { id: 'w-1' },
                setWorkout: mockSetWorkout,
                mode: 'ACTIVE',
                isEditingTemplate: false,
                routineDayId: 'rd-1',
                onPrefetchPRs: mockOnPrefetchPRs,
                onCheckPR: mockOnCheckPR,
            })
        );
        await waitFor(() => expect(hook.result.current).not.toBeNull());

        await act(async () => {
            hook.result.current.setExercises([
                {
                    id: 'ex-1',
                    titulo: 'Sentadilla',
                    routine_exercise_id: 're-1',
                    target_sets: 3,
                    sets: [{ id: 's-1', ejercicio_programado_id: 're-1', numero_serie: 1, repeticiones: 10, peso_utilizado: 100 }],
                    is_routine: true,
                    tipo_peso: 'total',
                },
            ]);
        });

        await act(async () => {
            await hook.result.current.addSet('ex-1', 'normal');
        });

        expect(WorkoutService.addSet).toHaveBeenCalledWith('w-1', 'ex-1', 2, 100, 10);
    });

    it('updates set weight and reps', async () => {
        (WorkoutService.updateSet as jest.Mock).mockResolvedValue({ error: null });

        const hook = await renderHook(() =>
            useWorkoutSets({
                workout: { id: 'w-1' },
                setWorkout: mockSetWorkout,
                mode: 'ACTIVE',
                isEditingTemplate: false,
                routineDayId: 'rd-1',
                onPrefetchPRs: mockOnPrefetchPRs,
                onCheckPR: mockOnCheckPR,
            })
        );
        await waitFor(() => expect(hook.result.current).not.toBeNull());

        await act(async () => {
            hook.result.current.setExercises([
                {
                    id: 'ex-1',
                    titulo: 'Sentadilla',
                    routine_exercise_id: 're-1',
                    target_sets: 3,
                    sets: [{ id: 's-1', ejercicio_programado_id: 're-1', numero_serie: 1, repeticiones: 10, peso_utilizado: 100 }],
                    is_routine: true,
                    tipo_peso: 'total',
                },
            ]);
        });

        await act(async () => {
            await hook.result.current.updateSet('s-1', 'weight', 105);
        });

        expect(hook.result.current.exercises[0].sets[0].peso_utilizado).toBe(105);
        expect(WorkoutService.updateSet).toHaveBeenCalledWith('s-1', { weight: 105 });
    });

    it('toggles complete set and checks PR', async () => {
        (WorkoutService.updateSet as jest.Mock).mockResolvedValue({ error: null });
        mockOnCheckPR.mockResolvedValue({ isPR: true, celebrationData: { exerciseName: 'Sentadilla' } });

        const hook = await renderHook(() =>
            useWorkoutSets({
                workout: { id: 'w-1' },
                setWorkout: mockSetWorkout,
                mode: 'ACTIVE',
                isEditingTemplate: false,
                routineDayId: 'rd-1',
                onPrefetchPRs: mockOnPrefetchPRs,
                onCheckPR: mockOnCheckPR,
            })
        );
        await waitFor(() => expect(hook.result.current).not.toBeNull());

        await act(async () => {
            hook.result.current.setExercises([
                {
                    id: 'ex-1',
                    titulo: 'Sentadilla',
                    routine_exercise_id: 're-1',
                    target_sets: 3,
                    sets: [{ id: 's-1', ejercicio_programado_id: 're-1', numero_serie: 1, repeticiones: 10, peso_utilizado: 100 }],
                    is_routine: true,
                    tipo_peso: 'total',
                },
            ]);
        });

        await act(async () => {
            await hook.result.current.toggleCompleteSet('s-1', true);
        });

        expect(hook.result.current.exercises[0].sets[0].is_completed).toBe(true);
        expect(hook.result.current.exercises[0].sets[0].is_pr).toBe(true);
        expect(mockOnCheckPR).toHaveBeenCalled();
        expect(WorkoutService.updateSet).toHaveBeenCalledWith('s-1', {
            is_completed: true,
            completada: true,
            is_pr: true,
        });
    });

    it('deletes set and renumbers remaining sets', async () => {
        (WorkoutService.deleteSet as jest.Mock).mockResolvedValue({ error: null });
        (WorkoutService.updateSet as jest.Mock).mockResolvedValue({ error: null });

        const hook = await renderHook(() =>
            useWorkoutSets({
                workout: { id: 'w-1' },
                setWorkout: mockSetWorkout,
                mode: 'ACTIVE',
                isEditingTemplate: false,
                routineDayId: 'rd-1',
                onPrefetchPRs: mockOnPrefetchPRs,
                onCheckPR: mockOnCheckPR,
            })
        );
        await waitFor(() => expect(hook.result.current).not.toBeNull());

        await act(async () => {
            hook.result.current.setExercises([
                {
                    id: 'ex-1',
                    titulo: 'Sentadilla',
                    routine_exercise_id: 're-1',
                    target_sets: 3,
                    sets: [
                        { id: 's-1', ejercicio_programado_id: 're-1', numero_serie: 1, repeticiones: 10, peso_utilizado: 100 },
                        { id: 's-2', ejercicio_programado_id: 're-1', numero_serie: 2, repeticiones: 10, peso_utilizado: 100 },
                    ],
                    is_routine: true,
                    tipo_peso: 'total',
                },
            ]);
        });

        await act(async () => {
            await hook.result.current.deleteSet('s-1', 'ex-1');
        });

        expect(hook.result.current.exercises[0].sets).toHaveLength(1);
        expect(hook.result.current.exercises[0].sets[0].id).toBe('s-2');
        expect(hook.result.current.exercises[0].sets[0].numero_serie).toBe(1);
        expect(WorkoutService.deleteSet).toHaveBeenCalledWith('s-1');
        expect(WorkoutService.updateSet).toHaveBeenCalledWith('s-2', { numero_serie: 1 });
    });
});
