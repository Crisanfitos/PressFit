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
        const { getByText, getByTestId } = await render(
            <ExerciseCatalogScreen navigation={mockNavigation} />
        );

        expect(getByText('Catálogo de Ejercicios')).toBeTruthy();
        expect(getByText('Ocultar filtros')).toBeTruthy();
        expect(getByTestId('exercise-catalog-list')).toBeTruthy();
    });

    it('renders exercise list items when data is present in FlashList', async () => {
        mockUseExerciseController.mockReturnValue({
            exercises: [
                {
                    id: 'ex-1',
                    titulo: 'Press de Banca Plano',
                    descripcion: 'Ejercicio compuesto para pectoral',
                    musculo_principal: 'Pecho',
                    musculo_secundario: 'Tríceps',
                    categoria: 'Fuerza',
                    dificultad: 'Intermedio',
                    is_custom: false,
                },
                {
                    id: 'ex-2',
                    titulo: 'Sentadilla Trasera',
                    descripcion: 'Ejercicio compuesto para piernas',
                    musculo_principal: 'Pierna',
                    musculo_secundario: 'Glúteos',
                    categoria: 'Fuerza',
                    dificultad: 'Avanzado',
                    is_custom: true,
                },
            ] as any,
            loading: false,
            searchQuery: '',
            filters: {},
            filterOptions: { primaryMuscles: [], secondaryMuscles: [], categories: [], difficulties: [] },
            setSearchQuery: jest.fn(),
            setFilter: jest.fn(),
            clearFilters: jest.fn(),
            loadExercises: jest.fn(),
            hasActiveFilters: false,
        } as any);

        const { getByText, getByTestId } = await render(
            <ExerciseCatalogScreen navigation={mockNavigation} />
        );

        expect(getByTestId('exercise-catalog-list')).toBeTruthy();
        expect(getByText('Press de Banca Plano')).toBeTruthy();
        expect(getByText('Sentadilla Trasera')).toBeTruthy();
    });

    it('renders empty state when exercises list is empty', async () => {
        mockUseExerciseController.mockReturnValue({
            exercises: [],
            loading: false,
            searchQuery: 'inexistente',
            filters: {},
            filterOptions: { primaryMuscles: [], secondaryMuscles: [], categories: [], difficulties: [] },
            setSearchQuery: jest.fn(),
            setFilter: jest.fn(),
            clearFilters: jest.fn(),
            loadExercises: jest.fn(),
            hasActiveFilters: true,
        } as any);

        const { getByText } = await render(
            <ExerciseCatalogScreen navigation={mockNavigation} />
        );

        expect(getByText('No se encontraron ejercicios con los filtros actuales')).toBeTruthy();
    });
});

