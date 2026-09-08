import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SwapExerciseScreen } from '../../src/screens/SwapExerciseScreen';
import { useExerciseController } from '../../src/controllers/useExerciseController';
import { WorkoutService } from '../../src/services/WorkoutService';

jest.mock('../../src/controllers/useExerciseController');
jest.mock('../../src/services/WorkoutService');

const mockUseExerciseController = useExerciseController as jest.MockedFunction<typeof useExerciseController>;

describe('SwapExerciseScreen Component (RNTL) (PF-310)', () => {
    const mockNavigation = {
        navigate: jest.fn(),
        goBack: jest.fn(),
    } as any;

    const mockRoute = {
        params: {
            workoutId: 'w-100',
            routineDayId: 'rd-100',
            oldExercise: {
                id: 'ex-old',
                titulo: 'Press Banca Plano',
                routine_exercise_id: 're-100',
                target_sets: 3,
                grupo_muscular: 'Pecho',
                sets: [{ id: 's-1' }, { id: 's-2' }, { id: 's-3' }],
            },
        },
    } as any;

    const mockExercises = [
        { id: 'ex-old', titulo: 'Press Banca Plano', musculos_primarios: ['Pecho'], dificultad: 'Media' },
        { id: 'ex-new-1', titulo: 'Press Inclinado con Mancuernas', musculos_primarios: ['Pecho'], dificultad: 'Media' },
        { id: 'ex-new-2', titulo: 'Fondos en Paralelas', musculos_primarios: ['Pecho', 'Tríceps'], dificultad: 'Avanzada' },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseExerciseController.mockReturnValue({
            exercises: mockExercises,
            loading: false,
            searchQuery: '',
            filters: { primaryMuscle: null, secondaryMuscle: null, category: null, difficulty: null },
            filterOptions: { primaryMuscles: ['Pecho', 'Espalda'], secondaryMuscles: [], categories: [], difficulties: [] },
            setSearchQuery: jest.fn(),
            setFilter: jest.fn(),
            clearFilter: jest.fn(),
            clearAllFilters: jest.fn(),
            hasActiveFilters: false,
            refetchExercises: jest.fn(),
        } as any);

        (WorkoutService.swapExerciseInWorkout as jest.Mock).mockResolvedValue({
            data: { id: 're-100', ejercicio_id: 'ex-new-1' },
            error: null,
        });
    });

    it('renders header, sticky current exercise card and candidate list', async () => {
        const { getByTestId, getAllByText, getByText } = await render(
            <SwapExerciseScreen navigation={mockNavigation} route={mockRoute} />
        );

        expect(getByTestId('swap-exercise-screen')).toBeTruthy();
        expect(getByTestId('swap-exercise-current-card')).toBeTruthy();
        expect(getAllByText('Press Banca Plano').length).toBeGreaterThanOrEqual(1);
        expect(getByText('Paso 1 de 2: Seleccionar nuevo')).toBeTruthy();
        expect(getByText('Press Inclinado con Mancuernas')).toBeTruthy();
        expect(getByText('Fondos en Paralelas')).toBeTruthy();
    });

    it('navigates back when back button is pressed on step 1', async () => {
        const { getByTestId } = await render(
            <SwapExerciseScreen navigation={mockNavigation} route={mockRoute} />
        );

        fireEvent.press(getByTestId('swap-exercise-back-button'));
        expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
    });

    it('enables continue button when selecting a new candidate exercise and transitions to step 2', async () => {
        const { getByTestId, getByText } = await render(
            <SwapExerciseScreen navigation={mockNavigation} route={mockRoute} />
        );

        // Select candidate
        fireEvent.press(getByTestId('swap-candidate-ex-new-1'));

        // Wait for selection to update and button to enable
        await waitFor(() => {
            expect(getByText('Seleccionado:')).toBeTruthy();
        });

        // Press Continue button
        fireEvent.press(getByTestId('swap-exercise-continue-button'));

        // Should now be on step 2
        await waitFor(() => {
            expect(getByTestId('swap-exercise-step-2')).toBeTruthy();
            expect(getByTestId('swap-exercise-comparison-card')).toBeTruthy();
            expect(getByText('Paso 2 de 2: Revisar y ajustar')).toBeTruthy();
            expect(getByText('Comparativa de Ejercicios')).toBeTruthy();
        });
    });

    it('allows adjusting sets count with increment and decrement buttons on step 2', async () => {
        const { getByTestId, getByText } = await render(
            <SwapExerciseScreen navigation={mockNavigation} route={mockRoute} />
        );

        // Select candidate and proceed to step 2
        fireEvent.press(getByTestId('swap-candidate-ex-new-1'));
        await waitFor(() => {
            expect(getByText('Seleccionado:')).toBeTruthy();
        });

        fireEvent.press(getByTestId('swap-exercise-continue-button'));

        // Wait for step 2 to mount
        await waitFor(() => {
            expect(getByTestId('swap-exercise-step-2')).toBeTruthy();
        });

        // Initial sets count should be 3
        expect(getByTestId('swap-exercise-sets-count').props.children).toBe(3);

        // Increment
        fireEvent.press(getByTestId('swap-exercise-sets-increment'));
        await waitFor(() => {
            expect(getByTestId('swap-exercise-sets-count').props.children).toBe(4);
        });

        // Decrement
        fireEvent.press(getByTestId('swap-exercise-sets-decrement'));
        await waitFor(() => {
            expect(getByTestId('swap-exercise-sets-count').props.children).toBe(3);
        });
    });

    it('calls WorkoutService.swapExerciseInWorkout and navigates back when finalizing swap', async () => {
        const { getByTestId, getByText } = await render(
            <SwapExerciseScreen navigation={mockNavigation} route={mockRoute} />
        );

        // Select candidate and proceed to step 2
        fireEvent.press(getByTestId('swap-candidate-ex-new-1'));
        await waitFor(() => {
            expect(getByText('Seleccionado:')).toBeTruthy();
        });

        fireEvent.press(getByTestId('swap-exercise-continue-button'));

        // Wait for step 2 to mount
        await waitFor(() => {
            expect(getByTestId('swap-exercise-step-2')).toBeTruthy();
        });

        // Adjust sets count to 4
        fireEvent.press(getByTestId('swap-exercise-sets-increment'));
        await waitFor(() => {
            expect(getByTestId('swap-exercise-sets-count').props.children).toBe(4);
        });

        // Press Finalize
        fireEvent.press(getByTestId('swap-exercise-finish-button'));

        await waitFor(() => {
            expect(WorkoutService.swapExerciseInWorkout).toHaveBeenCalledWith(
                'w-100',
                're-100',
                'ex-new-1',
                4
            );
            expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
        });
    });
});
