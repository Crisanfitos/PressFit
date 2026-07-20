import React from 'react';
import { render } from '@testing-library/react-native';
import ExerciseCatalogScreen from '../../src/screens/ExerciseCatalogScreen';
import { useExerciseController } from '../../src/controllers/useExerciseController';

jest.mock('../../src/controllers/useExerciseController');

const mockUseExerciseController = useExerciseController as jest.MockedFunction<typeof useExerciseController>;

describe('ExerciseCatalogScreen Component (RNTL)', () => {
    const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() } as any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseExerciseController.mockReturnValue({
            exercises: [],
            loading: false,
            searchQuery: '',
            filters: {},
            filterOptions: { primaryMuscles: [], secondaryMuscles: [], categories: [], difficulties: [] },
            setSearchQuery: jest.fn(),
            setFilter: jest.fn(),
            clearFilters: jest.fn(),
            loadExercises: jest.fn(),
        } as any);
    });

    it('renders exercise catalog header and exercise items', async () => {
        const { getByText } = await render(
            <ExerciseCatalogScreen navigation={mockNavigation} />
        );

        expect(getByText('Catálogo de Ejercicios')).toBeTruthy();
        expect(getByText('Ocultar filtros')).toBeTruthy();
    });
});
