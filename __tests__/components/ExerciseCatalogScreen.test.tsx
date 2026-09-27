import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import ExerciseCatalogScreen from '../../src/screens/ExerciseCatalogScreen';
import { useExerciseController } from '../../src/controllers/useExerciseController';
import i18n from '../../src/i18n';

jest.mock('../../src/controllers/useExerciseController');

const mockUseExerciseController = useExerciseController as jest.MockedFunction<typeof useExerciseController>;

describe('ExerciseCatalogScreen Component (RNTL)', () => {
    const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() } as any;

    beforeEach(async () => {
        jest.clearAllMocks();
        await act(async () => {
            await i18n.changeLanguage('es');
        });
        mockUseExerciseController.mockReturnValue({
            exercises: [],
            loading: false,
            searchQuery: '',
            filters: {},
            filterOptions: {
                primaryMuscles: ['Pecho', 'Espalda'],
                secondaryMuscles: ['Tríceps'],
                categories: ['Fuerza'],
                difficulties: ['Intermedio'],
            },
            setSearchQuery: jest.fn(),
            setFilter: jest.fn(),
            clearFilter: jest.fn(),
            clearAllFilters: jest.fn(),
            loadExercises: jest.fn(),
            hasActiveFilters: false,
        } as any);
    });

    afterEach(async () => {
        await act(async () => {
            await i18n.changeLanguage('es');
        });
    });

    it('renders header, search bar, and DOES NOT render redundant Show filters button (PF-411)', async () => {
        const { getByText, queryByText, getByTestId } = await render(
            <ExerciseCatalogScreen navigation={mockNavigation} />
        );

        expect(getByText('Catálogo de Ejercicios')).toBeTruthy();
        // El botón independiente Show filters / Ocultar filtros ya no debe existir
        expect(queryByText('Ocultar filtros')).toBeNull();
        expect(queryByText('Mostrar filtros')).toBeNull();
        expect(queryByText('Show filters')).toBeNull();
        expect(queryByText('Hide filters')).toBeNull();

        // El botón de filtro en la barra de búsqueda sí existe
        expect(getByTestId('exercise-search-tune-button')).toBeTruthy();
        expect(getByTestId('exercise-catalog-list')).toBeTruthy();
    });

    it('toggles filters visibility when pressing the search bar tune button (PF-411)', async () => {
        const { getByTestId, queryByText } = await render(
            <ExerciseCatalogScreen navigation={mockNavigation} />
        );

        // Inicialmente los filtros están visibles (showFilters = true)
        expect(queryByText('Músculo Principal')).toBeTruthy();

        // Presionar tune button para ocultar filtros
        const tuneBtn = getByTestId('exercise-search-tune-button');
        await act(async () => {
            fireEvent.press(tuneBtn);
        });

        // Ahora los filtros están ocultos
        expect(queryByText('Músculo Principal')).toBeNull();

        // Presionar de nuevo para volver a mostrar
        await act(async () => {
            fireEvent.press(tuneBtn);
        });
        expect(queryByText('Músculo Principal')).toBeTruthy();
    });

    it('renders translated BentoBar metrics and filter chips in ES and EN (PF-411)', async () => {
        // En español
        const { getByText, rerender } = await render(
            <ExerciseCatalogScreen navigation={mockNavigation} />
        );

        expect(getByText('TOTAL')).toBeTruthy();
        expect(getByText('Ejercicios')).toBeTruthy();
        expect(getByText('RÉCORDS')).toBeTruthy();
        expect(getByText('Registrados')).toBeTruthy();
        expect(getByText('GRUPOS')).toBeTruthy();
        expect(getByText('Guiadas')).toBeTruthy();
        expect(getByText('Músculo Principal')).toBeTruthy();
        expect(getByText('Pecho')).toBeTruthy();
        expect(getByText('Espalda')).toBeTruthy();

        // Cambiar a inglés
        await act(async () => {
            await i18n.changeLanguage('en');
        });

        await rerender(<ExerciseCatalogScreen navigation={mockNavigation} />);

        expect(getByText('TOTAL')).toBeTruthy();
        expect(getByText('Exercises')).toBeTruthy();
        expect(getByText('RECORDS')).toBeTruthy();
        expect(getByText('Recorded')).toBeTruthy();
        expect(getByText('GROUPS')).toBeTruthy();
        expect(getByText('Guided')).toBeTruthy();
        expect(getByText('Primary Muscle')).toBeTruthy();
        expect(getByText('Chest')).toBeTruthy();
        expect(getByText('Back')).toBeTruthy();
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
            clearFilter: jest.fn(),
            clearAllFilters: jest.fn(),
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
            clearFilter: jest.fn(),
            clearAllFilters: jest.fn(),
            loadExercises: jest.fn(),
            hasActiveFilters: true,
        } as any);

        const { getByText } = await render(
            <ExerciseCatalogScreen navigation={mockNavigation} />
        );

        expect(getByText('No se encontraron ejercicios con los filtros actuales')).toBeTruthy();
    });
});
