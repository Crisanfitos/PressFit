import React from 'react';
import { render } from '@testing-library/react-native';
import WorkoutScreen from '../../src/screens/WorkoutScreen';
import { useWorkoutController } from '../../src/controllers/useWorkoutController';

jest.mock('../../src/controllers/useWorkoutController');

const mockUseWorkoutController = useWorkoutController as jest.MockedFunction<typeof useWorkoutController>;

describe('WorkoutScreen Component (RNTL)', () => {
    const mockNavigation = {
        goBack: jest.fn(),
        navigate: jest.fn(),
        addListener: jest.fn(() => jest.fn()),
    } as any;
    const mockRoute = {
        params: {
            routineDayId: 'day-1',
            dayName: 'Pecho y Tríceps',
            dayOfWeek: 1,
        },
    } as any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseWorkoutController.mockReturnValue({
            workout: { id: 'w-101', fecha: '2026-01-01' },
            exercises: [
                {
                    id: 'ex-item-1',
                    titulo: 'Press de Banca',
                    tipo_peso: 'total',
                    series: [{ id: 's1', numero_serie: 1, peso: 80, repeticiones: 8, tipo_peso: 'total' }],
                },
            ],
            loading: false,
            mode: 'ACTIVE',
            previousWorkout: null,
            startWorkout: jest.fn(),
            addSet: jest.fn(),
            addSets: jest.fn(),
            updateSet: jest.fn(),
            deleteSet: jest.fn(),
            removeExercise: jest.fn(),
            finishWorkout: jest.fn(),
            updateWeightType: jest.fn(),
            loadSeriesForExercise: jest.fn(),
            reloadExercises: jest.fn(),
        } as any);
    });

    it('renders workout screen title and exercise name', async () => {
        const { getByText } = await render(
            <WorkoutScreen navigation={mockNavigation} route={mockRoute} />
        );

        expect(getByText('Pecho y Tríceps')).toBeTruthy();
        expect(getByText('Press de Banca')).toBeTruthy();
    });

    it('displays finalizar entrenamiento button', async () => {
        const { getByText } = await render(
            <WorkoutScreen navigation={mockNavigation} route={mockRoute} />
        );

        expect(getByText('Finalizar Entrenamiento')).toBeTruthy();
    });
});
