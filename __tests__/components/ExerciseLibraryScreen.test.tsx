import React from 'react';
import { render } from '@testing-library/react-native';
import ExerciseLibraryScreen from '../../src/screens/ExerciseLibraryScreen';
import { useExerciseController } from '../../src/controllers/useExerciseController';

jest.mock('../../src/controllers/useExerciseController');

const mockUseExerciseController = useExerciseController as jest.MockedFunction<typeof useExerciseController>;

describe('ExerciseLibraryScreen Component (RNTL)', () => {
    const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() } as any;
    const mockRoute = { params: {} } as any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseExerciseController.mockReturnValue({
            exercises: [
                { id: 'ex-1', titulo: 'Sentadilla', grupo_muscular: 'pierna', equipo: 'barra' },
            ],
            loading: false,
            searchQuery: '',
            filters: {},
            filterOptions: { primaryMuscles: [], secondaryMuscles: [], categories: [], difficulties: [] },
            selectedCategory: 'todos',
            selectedExercises: [],
            setSearchQuery: jest.fn(),
            setSelectedCategory: jest.fn(),
            toggleExerciseSelection: jest.fn(),
            clearSelection: jest.fn(),
            loadExercises: jest.fn(),
        } as any);
    });

    it('renders exercise library title and exercise items', async () => {
        const { getByText } = await render(
            <ExerciseLibraryScreen navigation={mockNavigation} route={mockRoute} />
        );

        expect(getByText('Biblioteca de Ejercicios')).toBeTruthy();
        expect(getByText('Sentadilla')).toBeTruthy();
    });
});
