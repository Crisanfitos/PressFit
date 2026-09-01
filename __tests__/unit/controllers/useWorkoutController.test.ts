import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useWorkoutController } from '../../../src/controllers/useWorkoutController';
import { WorkoutService } from '../../../src/services/WorkoutService';
import { RoutineService } from '../../../src/services/RoutineService';

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

describe('useWorkoutController (PF-257)', () => {
    let mockAlert: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;
    let getDaySpy: jest.SpyInstance;

    const mockExercise = {
        id: 'ex-1',
        nombre: 'Press Banca',
        titulo: 'Press Banca',
        grupo_muscular: 'Pecho',
    };

    const getMockWorkoutWithExercises = (horaInicio?: string) => ({
        id: 'w-1',
        completada: false,
        hora_inicio: horaInicio || new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
        ejercicios_programados: [
            {
                id: 're-1',
                ejercicio: mockExercise,
                tipo_peso: 'total',
                series: [
                    { id: 's-1', ejercicio_programado_id: 're-1', numero_serie: 1, repeticiones: 10, peso_utilizado: 50 },
                ],
            },
        ],
    });

    const mockRoutineDay = {
        id: 'rd-1',
        nombre_dia: 'Día de Pecho',
        ejercicios_programados: [
            {
                id: 're-template-1',
                ejercicio: mockExercise,
                tipo_peso: 'mancuernas',
                series: [
                    { id: 'st-1', ejercicio_programado_id: 're-template-1', numero_serie: 1, repeticiones: 12, peso_utilizado: 22 },
                ],
            },
        ],
    };

    beforeAll(() => {
        mockAlert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterAll(() => {
        mockAlert.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    beforeEach(() => {
        jest.clearAllMocks();

        // Fix getDay to 3 (Wednesday, adjustDay = 2)
        getDaySpy = jest.spyOn(Date.prototype, 'getDay').mockReturnValue(3);

        (WorkoutService.getWorkoutDetails as jest.Mock).mockImplementation(() =>
            Promise.resolve({
                data: JSON.parse(JSON.stringify(getMockWorkoutWithExercises())),
                error: null,
            })
        );
        (RoutineService.getRoutineDayById as jest.Mock).mockImplementation(() =>
            Promise.resolve({
                data: JSON.parse(JSON.stringify(mockRoutineDay)),
                error: null,
            })
        );
        (RoutineService.getWorkoutStatsForRoutineDay as jest.Mock).mockResolvedValue({
            data: { exerciseCount: 0 },
            error: null,
        });
        (RoutineService.getActiveWorkout as jest.Mock).mockResolvedValue({
            data: null,
            error: null,
        });
        (WorkoutService.getLastCompletedWorkoutForDay as jest.Mock).mockResolvedValue({
            data: null,
            error: null,
        });
        (WorkoutService.getSeriesForExercise as jest.Mock).mockResolvedValue({
            data: [{ id: 's-1', repeticiones: 10, peso_utilizado: 50, numero_serie: 1 }],
            error: null,
        });
    });

    afterEach(() => {
        getDaySpy.mockRestore();
    });

    describe('Initialization & Modes', () => {
        it('initializes in PREVIEW mode when today has no active workout and no initialWorkoutId', async () => {
            const hook = await renderHook(() =>
                useWorkoutController(null, 'rd-1', 'u-1', 3) // Wednesday = today
            );

            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            expect(hook.result.current.mode).toBe('PREVIEW');
            expect(RoutineService.getActiveWorkout).toHaveBeenCalledWith('u-1', 'rd-1');
            expect(RoutineService.getRoutineDayById).toHaveBeenCalledWith('rd-1');
            expect(hook.result.current.exercises).toHaveLength(1);
            expect(hook.result.current.exercises[0].titulo).toBe('Press Banca');
            expect(hook.result.current.exercises[0].tipo_peso).toBe('mancuernas');
        });

        it('initializes in ACTIVE mode when today has an active workout found via RoutineService', async () => {
            (RoutineService.getActiveWorkout as jest.Mock).mockResolvedValue({
                data: { id: 'w-active' },
                error: null,
            });
            const twentyMinAgo = new Date(Date.now() - 1200 * 1000).toISOString();
            (WorkoutService.getWorkoutDetails as jest.Mock).mockResolvedValue({
                data: {
                    ...getMockWorkoutWithExercises(),
                    id: 'w-active',
                    hora_inicio: twentyMinAgo,
                },
                error: null,
            });

            const hook = await renderHook(() =>
                useWorkoutController(null, 'rd-1', 'u-1', 3)
            );

            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            expect(hook.result.current.mode).toBe('ACTIVE');
            expect(hook.result.current.workout?.id).toBe('w-active');
            expect(hook.result.current.timer).toBeGreaterThanOrEqual(1199);
        });

        it('initializes in ACTIVE mode when initialWorkoutId is provided for today', async () => {
            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3)
            );

            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            expect(hook.result.current.mode).toBe('ACTIVE');
            expect(hook.result.current.workout?.id).toBe('w-1');
            expect(WorkoutService.getWorkoutDetails).toHaveBeenCalledWith('w-1');
        });

        it('auto-completes workout and transitions to VIEW if workout started > 3 hours ago (>10800s)', async () => {
            (WorkoutService.completeWorkout as jest.Mock).mockResolvedValue({ error: null });
            const fiveHoursAgo = new Date(Date.now() - 18000 * 1000).toISOString();
            (WorkoutService.getWorkoutDetails as jest.Mock)
                .mockResolvedValueOnce({
                    data: {
                        ...getMockWorkoutWithExercises(),
                        id: 'w-old',
                        hora_inicio: fiveHoursAgo,
                        completada: false,
                    },
                    error: null,
                })
                .mockResolvedValueOnce({
                    data: {
                        ...getMockWorkoutWithExercises(),
                        id: 'w-old',
                        hora_inicio: fiveHoursAgo,
                        completada: true,
                    },
                    error: null,
                });

            const hook = await renderHook(() =>
                useWorkoutController('w-old', 'rd-1', 'u-1', 3)
            );

            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            expect(WorkoutService.completeWorkout).toHaveBeenCalledWith('w-old', expect.any(Number));
            expect(hook.result.current.mode).toBe('VIEW');
        });

        it('initializes in VIEW mode when target day is completed workout today', async () => {
            (WorkoutService.getWorkoutDetails as jest.Mock).mockResolvedValue({
                data: {
                    ...getMockWorkoutWithExercises(),
                    id: 'w-done',
                    completada: true,
                },
                error: null,
            });

            const hook = await renderHook(() =>
                useWorkoutController('w-done', 'rd-1', 'u-1', 3)
            );

            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            expect(hook.result.current.mode).toBe('VIEW');
        });

        it('initializes in VIEW mode for a past day with initialWorkoutId', async () => {
            const hook = await renderHook(() =>
                useWorkoutController('w-past', 'rd-1', 'u-1', 1) // dayOfWeek 1 = Monday (past relative to Wednesday)
            );

            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            expect(hook.result.current.mode).toBe('VIEW');
            expect(WorkoutService.getWorkoutDetails).toHaveBeenCalledWith('w-past');
        });

        it('initializes in VIEW mode for a past day with workout stats without initialWorkoutId', async () => {
            (RoutineService.getWorkoutStatsForRoutineDay as jest.Mock).mockResolvedValue({
                data: { exerciseCount: 3 },
                error: null,
            });

            const hook = await renderHook(() =>
                useWorkoutController(null, 'rd-1', 'u-1', 1) // past day
            );

            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            expect(hook.result.current.mode).toBe('VIEW');
        });

        it('initializes in MISSED mode for a past day with no exercises in stats', async () => {
            (RoutineService.getWorkoutStatsForRoutineDay as jest.Mock).mockResolvedValue({
                data: { exerciseCount: 0 },
                error: null,
            });
            (WorkoutService.getLastCompletedWorkoutForDay as jest.Mock).mockResolvedValue({
                data: {
                    id: 'w-last',
                    ejercicios_programados: [
                        {
                            ejercicio_id: 'ex-1',
                            series: [{ numero_serie: 1, repeticiones: 8, peso_utilizado: 45 }],
                        },
                    ],
                },
                error: null,
            });

            const hook = await renderHook(() =>
                useWorkoutController(null, 'rd-1', 'u-1', 1) // past day
            );

            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            expect(hook.result.current.mode).toBe('MISSED');
            expect(WorkoutService.getLastCompletedWorkoutForDay).toHaveBeenCalledWith('u-1', 'rd-1');
            expect(hook.result.current.previousWorkout).toBeDefined();
        });

        it('initializes in PENDING mode for a future day', async () => {
            const hook = await renderHook(() =>
                useWorkoutController(null, 'rd-1', 'u-1', 5) // dayOfWeek 5 = Friday (future relative to Wednesday)
            );

            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            expect(hook.result.current.mode).toBe('PENDING');
            expect(RoutineService.getRoutineDayById).toHaveBeenCalledWith('rd-1');
        });

        it('reconciles ghost sets from previous workout when loading template day', async () => {
            (RoutineService.getActiveWorkout as jest.Mock).mockResolvedValue({ data: null, error: null });
            (WorkoutService.getLastCompletedWorkoutForDay as jest.Mock).mockResolvedValue({
                data: {
                    id: 'w-ghost-source',
                    ejercicios_programados: [
                        {
                            ejercicio_id: 'ex-1',
                            series: [
                                { id: 'prev-s1', numero_serie: 1, repeticiones: 10, peso_utilizado: 70 },
                            ],
                        },
                    ],
                },
                error: null,
            });

            const hook = await renderHook(() =>
                useWorkoutController(null, 'rd-1', 'u-1', 1) // past day, missed
            );

            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            expect(hook.result.current.exercises[0].sets[0]).toMatchObject({
                id: 'prev-s1',
                fromPrevious: true,
                peso_utilizado: 70,
            });
        });

        it('catches and logs error if initWorkout fails', async () => {
            (WorkoutService.getWorkoutDetails as jest.Mock).mockRejectedValue(new Error('Network Crash'));

            const hook = await renderHook(() =>
                useWorkoutController('w-fail', 'rd-1', 'u-1', 3)
            );

            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Error initializing workout:',
                expect.any(Error)
            );
        });
    });

    describe('Timer operations', () => {
        it('unmounts cleanly and stops timer', async () => {
            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3)
            );

            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            expect(() => hook.unmount()).not.toThrow();
        });
    });

    describe('startWorkout', () => {
        it('starts a new daily workout with ghost source from previous workout', async () => {
            (WorkoutService.getLastCompletedWorkoutForDay as jest.Mock).mockResolvedValue({
                data: { id: 'prev-w', ejercicios_programados: [] },
                error: null,
            });
            (RoutineService.startDailyWorkout as jest.Mock).mockResolvedValue({
                data: { id: 'w-new' },
                error: null,
            });
            (WorkoutService.getWorkoutDetails as jest.Mock).mockResolvedValue({
                data: { ...getMockWorkoutWithExercises(), id: 'w-new' },
                error: null,
            });

            const hook = await renderHook(() =>
                useWorkoutController(null, 'rd-1', 'u-1', 3)
            );
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            await act(async () => {
                await hook.result.current.startWorkout();
            });

            expect(RoutineService.startDailyWorkout).toHaveBeenCalledWith(
                'rd-1',
                expect.any(String),
                expect.any(String)
            );
            expect(hook.result.current.workout?.id).toBe('w-new');
            expect(hook.result.current.mode).toBe('ACTIVE');
        });

        it('falls back to template day as ghost source when no previous workout exists', async () => {
            (WorkoutService.getLastCompletedWorkoutForDay as jest.Mock).mockResolvedValue({
                data: null,
                error: null,
            });
            (RoutineService.getRoutineDayById as jest.Mock).mockResolvedValue({
                data: mockRoutineDay,
                error: null,
            });
            (RoutineService.startDailyWorkout as jest.Mock).mockResolvedValue({
                data: { id: 'w-new-2' },
                error: null,
            });
            (WorkoutService.getWorkoutDetails as jest.Mock).mockResolvedValue({
                data: { ...getMockWorkoutWithExercises(), id: 'w-new-2' },
                error: null,
            });

            const hook = await renderHook(() =>
                useWorkoutController(null, 'rd-1', 'u-1', 3)
            );
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            await act(async () => {
                await hook.result.current.startWorkout();
            });

            expect(RoutineService.getRoutineDayById).toHaveBeenCalledWith('rd-1');
            expect(hook.result.current.workout?.id).toBe('w-new-2');
        });

        it('handles startDailyWorkout failure gracefully', async () => {
            (RoutineService.startDailyWorkout as jest.Mock).mockResolvedValue({
                data: null,
                error: new Error('Cannot start workout'),
            });

            const hook = await renderHook(() =>
                useWorkoutController(null, 'rd-1', 'u-1', 3)
            );
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            await act(async () => {
                await hook.result.current.startWorkout();
            });

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Error starting workout:',
                expect.any(Error)
            );
        });
    });

    describe('addSet and addSets', () => {
        it('adds a single set via addSet by delegating to addSets', async () => {
            (WorkoutService.getSeriesForExercise as jest.Mock).mockResolvedValue({
                data: [
                    { id: 's-1', repeticiones: 10, peso_utilizado: 60, numero_serie: 1 },
                ],
                error: null,
            });
            (WorkoutService.addSet as jest.Mock).mockResolvedValue({
                data: { id: 's-2' },
                error: null,
            });

            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3)
            );
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            await act(async () => {
                await hook.result.current.addSet('ex-1');
            });

            expect(WorkoutService.addSet).toHaveBeenCalledWith('w-1', 'ex-1', 2, 60, 10);
            expect(WorkoutService.getSeriesForExercise).toHaveBeenCalledWith('w-1', 'ex-1');
        });

        it('adds multiple sets via addSets', async () => {
            (WorkoutService.getSeriesForExercise as jest.Mock).mockResolvedValue({
                data: [],
                error: null,
            });
            (WorkoutService.addSet as jest.Mock).mockResolvedValue({ error: null });

            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3)
            );
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            await act(async () => {
                await hook.result.current.addSets('ex-1', 3);
            });

            expect(WorkoutService.addSet).toHaveBeenCalledTimes(3);
            expect(WorkoutService.addSet).toHaveBeenNthCalledWith(1, 'w-1', 'ex-1', 1, 0, 0);
            expect(WorkoutService.addSet).toHaveBeenNthCalledWith(2, 'w-1', 'ex-1', 2, 0, 0);
            expect(WorkoutService.addSet).toHaveBeenNthCalledWith(3, 'w-1', 'ex-1', 3, 0, 0);
        });

        it('does nothing if mode is VIEW and isEditingTemplate is false', async () => {
            (WorkoutService.getWorkoutDetails as jest.Mock).mockResolvedValue({
                data: { ...getMockWorkoutWithExercises(), completada: true },
                error: null,
            });

            const hook = await renderHook(() =>
                useWorkoutController('w-done', 'rd-1', 'u-1', 3, false)
            );
            await waitFor(() => expect(hook.result.current.mode).toBe('VIEW'));

            await act(async () => {
                await hook.result.current.addSet('ex-1');
            });

            expect(WorkoutService.addSet).not.toHaveBeenCalled();
        });

        it('allows addSet if mode is VIEW but isEditingTemplate is true', async () => {
            (WorkoutService.getWorkoutDetails as jest.Mock).mockResolvedValue({
                data: { ...getMockWorkoutWithExercises(), completada: true },
                error: null,
            });
            (WorkoutService.getSeriesForExercise as jest.Mock).mockResolvedValue({
                data: [],
                error: null,
            });
            (WorkoutService.addSet as jest.Mock).mockResolvedValue({ error: null });

            const hook = await renderHook(() =>
                useWorkoutController('w-done', 'rd-1', 'u-1', 3, true) // isEditingTemplate: true
            );
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            await act(async () => {
                await hook.result.current.addSet('ex-1');
            });

            expect(WorkoutService.addSet).toHaveBeenCalled();
        });

        it('does nothing if exerciseId is not in the exercises list', async () => {
            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3)
            );
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            await act(async () => {
                await hook.result.current.addSet('non-existent-exercise');
            });

            expect(WorkoutService.addSet).not.toHaveBeenCalled();
        });

        it('shows Alert when addSets throws', async () => {
            (WorkoutService.getSeriesForExercise as jest.Mock).mockRejectedValue(new Error('Add Set Fail'));

            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3)
            );
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            await act(async () => {
                await hook.result.current.addSet('ex-1');
            });

            expect(mockAlert).toHaveBeenCalledWith('Error Add Sets', expect.any(String));
        });
    });

    describe('updateSet', () => {
        it('optimistically updates weight and calls WorkoutService.updateSet', async () => {
            (WorkoutService.updateSet as jest.Mock).mockResolvedValue({ error: null });

            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3)
            );
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            await act(async () => {
                await hook.result.current.updateSet('s-1', 'weight', 85);
            });

            expect(hook.result.current.exercises[0].sets[0].peso_utilizado).toBe(85);
            expect(WorkoutService.updateSet).toHaveBeenCalledWith('s-1', { weight: 85 });
        });

        it('optimistically updates reps and maps to repeticiones', async () => {
            (WorkoutService.updateSet as jest.Mock).mockResolvedValue({ error: null });

            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3)
            );
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            await act(async () => {
                await hook.result.current.updateSet('s-1', 'reps', 15);
            });

            expect(hook.result.current.exercises[0].sets[0].repeticiones).toBe(15);
            expect(WorkoutService.updateSet).toHaveBeenCalledWith('s-1', { reps: 15 });
        });

        it('sends null if value is empty string', async () => {
            (WorkoutService.updateSet as jest.Mock).mockResolvedValue({ error: null });

            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3)
            );
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            await act(async () => {
                await hook.result.current.updateSet('s-1', 'weight', '');
            });

            expect(WorkoutService.updateSet).toHaveBeenCalledWith('s-1', { weight: null });
        });

        it('catches and logs error when updateSet service fails', async () => {
            (WorkoutService.updateSet as jest.Mock).mockRejectedValue(new Error('Update failed'));

            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3)
            );
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            await act(async () => {
                await hook.result.current.updateSet('s-1', 'weight', 90);
            });

            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to update set', expect.any(Error));
        });

        it('does nothing when mode is not editable', async () => {
            (WorkoutService.getWorkoutDetails as jest.Mock).mockResolvedValue({
                data: { ...getMockWorkoutWithExercises(), completada: true },
                error: null,
            });

            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3, false)
            );
            await waitFor(() => expect(hook.result.current.mode).toBe('VIEW'));

            await act(async () => {
                await hook.result.current.updateSet('s-1', 'weight', 100);
            });

            expect(WorkoutService.updateSet).not.toHaveBeenCalled();
        });
    });

    describe('deleteSet', () => {
        it('optimistically deletes set and calls WorkoutService.deleteSet', async () => {
            (WorkoutService.deleteSet as jest.Mock).mockResolvedValue({ error: null });

            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3)
            );
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            await act(async () => {
                await hook.result.current.deleteSet('s-1', 'ex-1');
            });

            expect(hook.result.current.exercises[0].sets).toHaveLength(0);
            expect(WorkoutService.deleteSet).toHaveBeenCalledWith('s-1');
        });

        it('rolls back exercises via loadExercises if deleteSet fails', async () => {
            (WorkoutService.deleteSet as jest.Mock).mockRejectedValue(new Error('Delete DB Error'));

            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3)
            );
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            (WorkoutService.getWorkoutDetails as jest.Mock).mockClear();
            await act(async () => {
                await hook.result.current.deleteSet('s-1', 'ex-1');
            });

            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to delete set', expect.any(Error));
            expect(WorkoutService.getWorkoutDetails).toHaveBeenCalledTimes(1);
        });

        it('does nothing when mode is not editable', async () => {
            (WorkoutService.getWorkoutDetails as jest.Mock).mockResolvedValue({
                data: { ...getMockWorkoutWithExercises(), completada: true },
                error: null,
            });

            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3, false)
            );
            await waitFor(() => expect(hook.result.current.mode).toBe('VIEW'));

            await act(async () => {
                await hook.result.current.deleteSet('s-1', 'ex-1');
            });

            expect(WorkoutService.deleteSet).not.toHaveBeenCalled();
        });
    });

    describe('removeExercise', () => {
        it('removes exercise from routine when routineExerciseId is provided', async () => {
            (WorkoutService.removeExerciseFromRoutine as jest.Mock).mockResolvedValue({ error: null });

            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3)
            );
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            await act(async () => {
                await hook.result.current.removeExercise('ex-1', 're-1');
            });

            expect(hook.result.current.exercises).toHaveLength(0);
            expect(WorkoutService.removeExerciseFromRoutine).toHaveBeenCalledWith('re-1');
        });

        it('removes exercise from workout when routineExerciseId is empty', async () => {
            (WorkoutService.removeExerciseFromWorkout as jest.Mock).mockResolvedValue({ error: null });

            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3)
            );
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            await act(async () => {
                await hook.result.current.removeExercise('ex-1', '');
            });

            expect(hook.result.current.exercises).toHaveLength(0);
            expect(WorkoutService.removeExerciseFromWorkout).toHaveBeenCalledWith('w-1', 'ex-1');
        });

        it('rolls back via loadExercises if remove fails', async () => {
            (WorkoutService.removeExerciseFromRoutine as jest.Mock).mockRejectedValue(new Error('Remove error'));

            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3)
            );
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            (WorkoutService.getWorkoutDetails as jest.Mock).mockClear();
            await act(async () => {
                await hook.result.current.removeExercise('ex-1', 're-1');
            });

            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to remove exercise', expect.any(Error));
            expect(WorkoutService.getWorkoutDetails).toHaveBeenCalledTimes(1);
        });

        it('does nothing if mode is not ACTIVE or PREVIEW', async () => {
            (WorkoutService.getWorkoutDetails as jest.Mock).mockResolvedValue({
                data: { ...getMockWorkoutWithExercises(), completada: true },
                error: null,
            });

            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3)
            );
            await waitFor(() => expect(hook.result.current.mode).toBe('VIEW'));

            await act(async () => {
                await hook.result.current.removeExercise('ex-1', 're-1');
            });

            expect(WorkoutService.removeExerciseFromRoutine).not.toHaveBeenCalled();
        });
    });

    describe('addExercise', () => {
        it('adds an exercise to workout and reloads exercises', async () => {
            (WorkoutService.addExerciseToWorkout as jest.Mock).mockResolvedValue({ error: null });

            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3)
            );
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            (WorkoutService.getWorkoutDetails as jest.Mock).mockClear();
            await act(async () => {
                await hook.result.current.addExercise('ex-2');
            });

            expect(WorkoutService.addExerciseToWorkout).toHaveBeenCalledWith('w-1', 'ex-2');
            expect(WorkoutService.getWorkoutDetails).toHaveBeenCalledTimes(1);
        });

        it('catches and logs error when addExercise fails', async () => {
            (WorkoutService.addExerciseToWorkout as jest.Mock).mockRejectedValue(new Error('Add Ex Fail'));

            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3)
            );
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            await act(async () => {
                await hook.result.current.addExercise('ex-2');
            });

            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to add exercise', expect.any(Error));
        });

        it('does nothing when mode is not ACTIVE or PREVIEW', async () => {
            (WorkoutService.getWorkoutDetails as jest.Mock).mockResolvedValue({
                data: { ...getMockWorkoutWithExercises(), completada: true },
                error: null,
            });

            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3)
            );
            await waitFor(() => expect(hook.result.current.mode).toBe('VIEW'));

            await act(async () => {
                await hook.result.current.addExercise('ex-2');
            });

            expect(WorkoutService.addExerciseToWorkout).not.toHaveBeenCalled();
        });
    });

    describe('updateWeightType', () => {
        it('optimistically updates tipo_peso and calls WorkoutService.updateWeightType', async () => {
            (WorkoutService.updateWeightType as jest.Mock).mockResolvedValue({ error: null });

            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3)
            );
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            await act(async () => {
                await hook.result.current.updateWeightType('re-1', 'ex-1', 'mancuernas');
            });

            expect(hook.result.current.exercises[0].tipo_peso).toBe('mancuernas');
            expect(WorkoutService.updateWeightType).toHaveBeenCalledWith('re-1', 'mancuernas');
        });

        it('rolls back via loadExercises when updateWeightType fails', async () => {
            (WorkoutService.updateWeightType as jest.Mock).mockRejectedValue(new Error('Weight type fail'));

            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3)
            );
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            (WorkoutService.getWorkoutDetails as jest.Mock).mockClear();
            await act(async () => {
                await hook.result.current.updateWeightType('re-1', 'ex-1', 'mancuernas');
            });

            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to update weight type', expect.any(Error));
            expect(WorkoutService.getWorkoutDetails).toHaveBeenCalledTimes(1);
        });

        it('does nothing if not editable', async () => {
            (WorkoutService.getWorkoutDetails as jest.Mock).mockResolvedValue({
                data: { ...getMockWorkoutWithExercises(), completada: true },
                error: null,
            });

            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3, false)
            );
            await waitFor(() => expect(hook.result.current.mode).toBe('VIEW'));

            await act(async () => {
                await hook.result.current.updateWeightType('re-1', 'ex-1', 'mancuernas');
            });

            expect(WorkoutService.updateWeightType).not.toHaveBeenCalled();
        });
    });

    describe('finishWorkout', () => {
        it('completes workout with calculated duration in minutes and stops timer', async () => {
            (WorkoutService.completeWorkout as jest.Mock).mockResolvedValue({ error: null });

            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3)
            );
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            let success = false;
            await act(async () => {
                success = await hook.result.current.finishWorkout();
            });

            expect(success).toBe(true);
            expect(WorkoutService.completeWorkout).toHaveBeenCalledWith('w-1', expect.any(Number));
        });

        it('returns false if completeWorkout fails', async () => {
            (WorkoutService.completeWorkout as jest.Mock).mockRejectedValue(new Error('Complete fail'));

            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3)
            );
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            let success = true;
            await act(async () => {
                success = await hook.result.current.finishWorkout();
            });

            expect(success).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to finish workout', expect.any(Error));
        });

        it('returns false if mode is not ACTIVE', async () => {
            (WorkoutService.getWorkoutDetails as jest.Mock).mockResolvedValue({
                data: { ...getMockWorkoutWithExercises(), completada: true },
                error: null,
            });

            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3)
            );
            await waitFor(() => expect(hook.result.current.mode).toBe('VIEW'));

            let success = true;
            await act(async () => {
                success = await hook.result.current.finishWorkout();
            });

            expect(success).toBe(false);
            expect(WorkoutService.completeWorkout).not.toHaveBeenCalled();
        });
    });

    describe('loadSeriesForExercise and reloadExercises', () => {
        it('loads series for a single exercise and updates state', async () => {
            (WorkoutService.getSeriesForExercise as jest.Mock).mockResolvedValue({
                data: [
                    { id: 's-new-1', repeticiones: 12, peso_utilizado: 55, numero_serie: 1 },
                ],
                error: null,
            });

            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3)
            );
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            await act(async () => {
                await hook.result.current.loadSeriesForExercise('w-1', 'ex-1');
            });

            expect(WorkoutService.getSeriesForExercise).toHaveBeenCalledWith('w-1', 'ex-1');
            expect(hook.result.current.exercises[0].sets).toHaveLength(1);
            expect(hook.result.current.exercises[0].sets[0].id).toBe('s-new-1');
        });

        it('reloads all exercises via reloadExercises', async () => {
            const hook = await renderHook(() =>
                useWorkoutController('w-1', 'rd-1', 'u-1', 3)
            );
            await waitFor(() => expect(hook.result.current.loading).toBe(false));

            (WorkoutService.getWorkoutDetails as jest.Mock).mockClear();
            await act(async () => {
                await hook.result.current.reloadExercises();
            });

            expect(WorkoutService.getWorkoutDetails).toHaveBeenCalledTimes(1);
        });
    });
});
