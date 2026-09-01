import { renderHook, act } from '@testing-library/react-native';
import { useExerciseController, Exercise } from '../../../src/controllers/useExerciseController';
import { useExerciseDetailController } from '../../../src/controllers/useExerciseDetailController';
import { ExerciseService } from '../../../src/services/ExerciseService';

jest.mock('../../../src/services/ExerciseService', () => ({
    ExerciseService: {
        getExercises: jest.fn(),
        getExerciseById: jest.fn(),
        addExercisesToRoutineDay: jest.fn(),
        createCustomExercise: jest.fn(),
    },
}));

describe('useExerciseController & useExerciseDetailController (PF-262)', () => {
    const mockRoutineDayId = 'rd-123';
    const mockUserId = 'user-456';

    const mockExercises: Exercise[] = [
        {
            id: 'ex-1',
            titulo: 'Press de Banca',
            musculos_primarios: ['Pecho'],
            musculos_secundarios: 'Tríceps, Hombro',
            categoria: 'Fuerza',
            dificultad: 'Intermedio',
            descripcion: 'Press plano con barra',
        },
        {
            id: 'ex-2',
            titulo: 'Sentadilla Trasera',
            musculos_primarios: 'Cuádriceps, Glúteo',
            musculos_secundarios: ['Isquiotibiales', 'Core'],
            categoria: 'Fuerza',
            dificultad: 'Avanzado',
            descripcion: 'Sentadilla con barra alta',
        },
        {
            id: 'ex-3',
            titulo: 'Dominadas Pronas',
            musculos_primarios: 'Espalda, Dorsal',
            musculos_secundarios: 'Bíceps',
            categoria: 'Calistenia',
            dificultad: 'Intermedio',
            descripcion: 'Dominadas agarre prono',
        },
        {
            id: 'ex-4',
            titulo: 'Aperturas con Mancuernas',
            musculos_primarios: 'Pecho',
            musculos_secundarios: undefined,
            categoria: 'Hipertrofia',
            dificultad: 'Principiante',
            descripcion: 'Aperturas en banco plano',
        },
        {
            id: 'ex-5',
            titulo: 'Ejercicio Sin Metadatos',
            musculos_primarios: undefined,
            musculos_secundarios: undefined,
            categoria: undefined,
            dificultad: undefined,
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});

        (ExerciseService.getExercises as jest.Mock).mockResolvedValue({
            data: mockExercises,
            error: null,
        });
        (ExerciseService.getExerciseById as jest.Mock).mockResolvedValue({
            data: mockExercises[0],
            error: null,
        });
        (ExerciseService.addExercisesToRoutineDay as jest.Mock).mockResolvedValue({
            data: { success: true },
            error: null,
        });
        (ExerciseService.createCustomExercise as jest.Mock).mockResolvedValue({
            data: { id: 'ex-custom-1', titulo: 'Fondos en Paralelas' },
            error: null,
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('useExerciseController - Initial Fetch & State', () => {
        it('fetches exercises on mount and sets loading state properly', async () => {
            const hook = await renderHook(() => useExerciseController(mockRoutineDayId, mockUserId));

            expect(hook.result.current.loading).toBe(false);
            expect(ExerciseService.getExercises).toHaveBeenCalledTimes(1);
            expect(hook.result.current.exercises.length).toBe(5);
            // Verify alphabetical sort by titulo
            expect(hook.result.current.exercises[0].titulo).toBe('Aperturas con Mancuernas');
            expect(hook.result.current.exercises[1].titulo).toBe('Dominadas Pronas');
        });

        it('handles null data response gracefully by defaulting to empty array', async () => {
            (ExerciseService.getExercises as jest.Mock).mockResolvedValue({
                data: null,
                error: null,
            });

            const hook = await renderHook(() => useExerciseController(mockRoutineDayId, mockUserId));

            expect(hook.result.current.loading).toBe(false);
            expect(hook.result.current.exercises).toEqual([]);
        });

        it('catches and logs error if fetch fails without throwing exception', async () => {
            const fetchError = new Error('Network timeout');
            (ExerciseService.getExercises as jest.Mock).mockRejectedValue(fetchError);

            const hook = await renderHook(() => useExerciseController(mockRoutineDayId, mockUserId));

            expect(hook.result.current.loading).toBe(false);
            expect(console.error).toHaveBeenCalledWith('Error fetching exercises:', fetchError);
            expect(hook.result.current.exercises).toEqual([]);
        });

        it('re-fetches exercises when refetchExercises is called', async () => {
            const hook = await renderHook(() => useExerciseController(mockRoutineDayId, mockUserId));

            expect(hook.result.current.loading).toBe(false);

            await act(async () => {
                await hook.result.current.refetchExercises();
            });

            expect(ExerciseService.getExercises).toHaveBeenCalledTimes(2);
        });
    });

    describe('useExerciseController - filterOptions & Parsing Utilities', () => {
        it('extracts unique, trimmed, sorted filter options across array and comma-separated formats', async () => {
            const hook = await renderHook(() => useExerciseController(mockRoutineDayId, mockUserId));

            const { filterOptions } = hook.result.current;

            // Primary muscles extracted from array and strings
            expect(filterOptions.primaryMuscles).toEqual(['Cuádriceps', 'Dorsal', 'Espalda', 'Glúteo', 'Pecho']);
            // Secondary muscles extracted from array and strings
            expect(filterOptions.secondaryMuscles).toEqual(['Bíceps', 'Core', 'Hombro', 'Isquiotibiales', 'Tríceps']);
            // Categories extracted and sorted
            expect(filterOptions.categories).toEqual(['Calistenia', 'Fuerza', 'Hipertrofia']);
            // Difficulties extracted and sorted
            expect(filterOptions.difficulties).toEqual(['Avanzado', 'Intermedio', 'Principiante']);
        });
    });

    describe('useExerciseController - Search & Multi-Dimensional AND Filtering', () => {
        it('filters exercises by search query case-insensitively', async () => {
            const hook = await renderHook(() => useExerciseController(mockRoutineDayId, mockUserId));

            await act(async () => {
                hook.result.current.setSearchQuery('bAnCa');
            });

            expect(hook.result.current.exercises.length).toBe(1);
            expect(hook.result.current.exercises[0].titulo).toBe('Press de Banca');
        });

        it('filters exercises by primaryMuscle matching array and comma-separated values', async () => {
            const hook = await renderHook(() => useExerciseController(mockRoutineDayId, mockUserId));

            // Filter for 'Pecho' -> should match Press de Banca (array) and Aperturas con Mancuernas (string)
            await act(async () => {
                hook.result.current.setFilter('primaryMuscle', 'Pecho');
            });

            expect(hook.result.current.exercises.length).toBe(2);
            expect(hook.result.current.exercises.map((e) => e.titulo)).toEqual([
                'Aperturas con Mancuernas',
                'Press de Banca',
            ]);

            // Filter for 'Dorsal' -> matches Dominadas Pronas (comma string: 'Espalda, Dorsal')
            await act(async () => {
                hook.result.current.setFilter('primaryMuscle', 'Dorsal');
            });

            expect(hook.result.current.exercises.length).toBe(1);
            expect(hook.result.current.exercises[0].titulo).toBe('Dominadas Pronas');
        });

        it('filters exercises by secondaryMuscle matching array and comma-separated values', async () => {
            const hook = await renderHook(() => useExerciseController(mockRoutineDayId, mockUserId));

            await act(async () => {
                hook.result.current.setFilter('secondaryMuscle', 'Hombro');
            });

            expect(hook.result.current.exercises.length).toBe(1);
            expect(hook.result.current.exercises[0].titulo).toBe('Press de Banca');

            await act(async () => {
                hook.result.current.setFilter('secondaryMuscle', 'Core');
            });

            expect(hook.result.current.exercises.length).toBe(1);
            expect(hook.result.current.exercises[0].titulo).toBe('Sentadilla Trasera');
        });

        it('filters exercises by category and difficulty', async () => {
            const hook = await renderHook(() => useExerciseController(mockRoutineDayId, mockUserId));

            await act(async () => {
                hook.result.current.setFilter('category', 'Fuerza');
            });

            expect(hook.result.current.exercises.length).toBe(2);

            await act(async () => {
                hook.result.current.setFilter('difficulty', 'Avanzado');
            });

            expect(hook.result.current.exercises.length).toBe(1);
            expect(hook.result.current.exercises[0].titulo).toBe('Sentadilla Trasera');
        });

        it('combines text search with multiple filters using AND logic', async () => {
            const hook = await renderHook(() => useExerciseController(mockRoutineDayId, mockUserId));

            await act(async () => {
                hook.result.current.setSearchQuery('press');
                hook.result.current.setFilter('primaryMuscle', 'Pecho');
                hook.result.current.setFilter('secondaryMuscle', 'Tríceps');
                hook.result.current.setFilter('category', 'Fuerza');
                hook.result.current.setFilter('difficulty', 'Intermedio');
            });

            expect(hook.result.current.exercises.length).toBe(1);
            expect(hook.result.current.exercises[0].titulo).toBe('Press de Banca');

            // Add conflicting filter
            await act(async () => {
                hook.result.current.setFilter('difficulty', 'Principiante');
            });

            expect(hook.result.current.exercises.length).toBe(0);
        });
    });

    describe('useExerciseController - Filter Manipulation & State Helpers', () => {
        it('manages filter state with setFilter, clearFilter, and clearAllFilters', async () => {
            const hook = await renderHook(() => useExerciseController(mockRoutineDayId, mockUserId));

            expect(hook.result.current.hasActiveFilters).toBe(false);

            await act(async () => {
                hook.result.current.setFilter('primaryMuscle', 'Espalda');
                hook.result.current.setFilter('category', 'Calistenia');
            });

            expect(hook.result.current.hasActiveFilters).toBe(true);
            expect(hook.result.current.filters.primaryMuscle).toBe('Espalda');
            expect(hook.result.current.filters.category).toBe('Calistenia');

            await act(async () => {
                hook.result.current.clearFilter('primaryMuscle');
            });

            expect(hook.result.current.filters.primaryMuscle).toBeNull();
            expect(hook.result.current.filters.category).toBe('Calistenia');
            expect(hook.result.current.hasActiveFilters).toBe(true);

            await act(async () => {
                hook.result.current.clearAllFilters();
            });

            expect(hook.result.current.hasActiveFilters).toBe(false);
            expect(hook.result.current.filters).toEqual({
                primaryMuscle: null,
                secondaryMuscle: null,
                category: null,
                difficulty: null,
            });
        });
    });

    describe('useExerciseController - Selection Management', () => {
        it('toggles exercise selection and clears selection', async () => {
            const hook = await renderHook(() => useExerciseController(mockRoutineDayId, mockUserId));

            expect(hook.result.current.selectedExercises).toEqual([]);

            // Toggle select ex-1
            await act(async () => {
                hook.result.current.toggleSelection('ex-1');
            });
            expect(hook.result.current.selectedExercises).toEqual(['ex-1']);

            // Toggle select ex-2
            await act(async () => {
                hook.result.current.toggleSelection('ex-2');
            });
            expect(hook.result.current.selectedExercises).toEqual(['ex-1', 'ex-2']);

            // Toggle unselect ex-1
            await act(async () => {
                hook.result.current.toggleSelection('ex-1');
            });
            expect(hook.result.current.selectedExercises).toEqual(['ex-2']);

            // Clear selection
            await act(async () => {
                hook.result.current.clearSelection();
            });
            expect(hook.result.current.selectedExercises).toEqual([]);
        });

        it('returns false from saveSelection if selection is empty or routineDayId/userId missing', async () => {
            // Case 1: Empty selection
            const hook1 = await renderHook(() => useExerciseController(mockRoutineDayId, mockUserId));

            let res1: boolean = true;
            await act(async () => {
                res1 = await hook1.result.current.saveSelection();
            });
            expect(res1).toBe(false);
            expect(ExerciseService.addExercisesToRoutineDay).not.toHaveBeenCalled();

            // Case 2: Missing routineDayId
            const hook2 = await renderHook(() => useExerciseController(undefined, mockUserId));

            await act(async () => {
                hook2.result.current.toggleSelection('ex-1');
            });

            let res2: boolean = true;
            await act(async () => {
                res2 = await hook2.result.current.saveSelection();
            });
            expect(res2).toBe(false);
            expect(ExerciseService.addExercisesToRoutineDay).not.toHaveBeenCalled();

            // Case 3: Missing userId
            const hook3 = await renderHook(() => useExerciseController(mockRoutineDayId, undefined));

            await act(async () => {
                hook3.result.current.toggleSelection('ex-1');
            });

            let res3: boolean = true;
            await act(async () => {
                res3 = await hook3.result.current.saveSelection();
            });
            expect(res3).toBe(false);
            expect(ExerciseService.addExercisesToRoutineDay).not.toHaveBeenCalled();
        });

        it('saves selection successfully and updates saving state', async () => {
            const hook = await renderHook(() => useExerciseController(mockRoutineDayId, mockUserId));

            await act(async () => {
                hook.result.current.toggleSelection('ex-1');
                hook.result.current.toggleSelection('ex-3');
            });

            let result: boolean = false;
            await act(async () => {
                result = await hook.result.current.saveSelection();
            });

            expect(result).toBe(true);
            expect(ExerciseService.addExercisesToRoutineDay).toHaveBeenCalledWith(
                mockUserId,
                mockRoutineDayId,
                ['ex-1', 'ex-3']
            );
            expect(hook.result.current.saving).toBe(false);
        });

        it('returns false and logs error when ExerciseService.addExercisesToRoutineDay returns error or throws', async () => {
            const dbError = new Error('Insert failed');
            (ExerciseService.addExercisesToRoutineDay as jest.Mock).mockResolvedValue({
                data: null,
                error: dbError,
            });

            const hook = await renderHook(() => useExerciseController(mockRoutineDayId, mockUserId));

            await act(async () => {
                hook.result.current.toggleSelection('ex-1');
            });

            let result: boolean = true;
            await act(async () => {
                result = await hook.result.current.saveSelection();
            });

            expect(result).toBe(false);
            expect(console.error).toHaveBeenCalledWith('Error saving selection:', dbError);
            expect(hook.result.current.saving).toBe(false);
        });
    });

    describe('useExerciseController - Custom Exercise Creation', () => {
        it('creates custom exercise, reloads exercises and returns created data', async () => {
            const hook = await renderHook(() => useExerciseController(mockRoutineDayId, mockUserId));

            const customInput = {
                titulo: 'Fondos en Paralelas',
                musculos_primarios: 'Pecho, Tríceps',
                categoria: 'Calistenia',
            };

            let response: any;
            await act(async () => {
                response = await hook.result.current.createCustomExercise(customInput);
            });

            expect(ExerciseService.createCustomExercise).toHaveBeenCalledWith(customInput);
            expect(ExerciseService.getExercises).toHaveBeenCalledTimes(2); // Initial mount + reload
            expect(response).toEqual({
                data: { id: 'ex-custom-1', titulo: 'Fondos en Paralelas' },
                error: null,
            });
            expect(hook.result.current.saving).toBe(false);
        });

        it('catches and logs error when custom exercise creation fails', async () => {
            const customError = new Error('Validation error');
            (ExerciseService.createCustomExercise as jest.Mock).mockResolvedValue({
                data: null,
                error: customError,
            });

            const hook = await renderHook(() => useExerciseController(mockRoutineDayId, mockUserId));

            let response: any;
            await act(async () => {
                response = await hook.result.current.createCustomExercise({ titulo: 'Fail' });
            });

            expect(response).toEqual({
                data: null,
                error: customError,
            });
            expect(console.error).toHaveBeenCalledWith('Error creating custom exercise:', customError);
            expect(hook.result.current.saving).toBe(false);
        });
    });

    describe('useExerciseDetailController', () => {
        it('does not load and sets loading false when exerciseId is undefined', async () => {
            const hook = await renderHook(() => useExerciseDetailController(undefined));

            expect(hook.result.current.exercise).toBeNull();
            expect(hook.result.current.loading).toBe(false);
            expect(ExerciseService.getExerciseById).not.toHaveBeenCalled();
        });

        it('fetches exercise details when exerciseId is provided', async () => {
            const hook = await renderHook(() => useExerciseDetailController('ex-1'));

            expect(ExerciseService.getExerciseById).toHaveBeenCalledWith('ex-1');
            expect(hook.result.current.exercise).toEqual(mockExercises[0]);
            expect(hook.result.current.loading).toBe(false);
        });

        it('handles null data response from getExerciseById gracefully', async () => {
            (ExerciseService.getExerciseById as jest.Mock).mockResolvedValue({
                data: null,
                error: null,
            });

            const hook = await renderHook(() => useExerciseDetailController('ex-invalid'));

            expect(hook.result.current.exercise).toBeNull();
            expect(hook.result.current.loading).toBe(false);
        });
    });
});
