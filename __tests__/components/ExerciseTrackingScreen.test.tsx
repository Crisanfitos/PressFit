import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ExerciseTrackingScreen from '../../src/screens/ExerciseTrackingScreen';
import { ExerciseService } from '../../src/services/ExerciseService';
import { AuthContext } from '../../src/context/AuthContext';
import i18n from '../../src/i18n';

jest.mock('../../src/services/ExerciseService');

const MOCK_EXERCISES = [
    { id: 'ex-1', titulo: 'Press de Banca', musculos_primarios: 'Pectoral' },
    { id: 'ex-2', titulo: 'Sentadilla', musculos_primarios: 'Cuádriceps' },
    { id: 'ex-3', titulo: 'Press Militar', musculos_primarios: ['Deltoides'] },
];

describe('ExerciseTrackingScreen Component - PF-394 M3 Redesign', () => {
    const mockNavigation = {
        navigate: jest.fn(),
        goBack: jest.fn(),
        addListener: jest.fn(() => jest.fn()),
    } as any;

    const renderScreen = async () =>
        await render(
            <AuthContext.Provider value={{ user: { id: 'user-1' } } as any}>
                <ExerciseTrackingScreen navigation={mockNavigation} />
            </AuthContext.Provider>
        );

    beforeEach(async () => {
        jest.clearAllMocks();
        await i18n.changeLanguage('es');
        (ExerciseService.getUserExercisesWithProgress as jest.Mock).mockResolvedValue({
            data: MOCK_EXERCISES,
            error: null,
        });
    });

    afterEach(async () => {
        await i18n.changeLanguage('es');
    });

    it('renders the exercise tracking screen container', async () => {
        const { getByTestId } = await renderScreen();
        await waitFor(() => {
            expect(getByTestId('exercise-tracking-screen')).toBeTruthy();
        });
    });

    it('renders header title text', async () => {
        const { getByText } = await renderScreen();
        await waitFor(() => {
            expect(getByText('Progreso por Ejercicio')).toBeTruthy();
        });
    });

    it('renders search input field', async () => {
        const { getByTestId } = await renderScreen();
        await waitFor(() => {
            expect(getByTestId('exercise-tracking-search-input')).toBeTruthy();
        });
    });

    it('renders exercises in the list after loading', async () => {
        const { getByText } = await renderScreen();
        await waitFor(() => {
            expect(getByText('Press de Banca')).toBeTruthy();
            expect(getByText('Sentadilla')).toBeTruthy();
            expect(getByText('Press Militar')).toBeTruthy();
        });
    });

    it('renders muscle group subtitle on exercise cards', async () => {
        const { getByText } = await renderScreen();
        await waitFor(() => {
            expect(getByText('Pectoral')).toBeTruthy();
        });
    });

    it('navigates back when back button is pressed', async () => {
        const { getByTestId } = await renderScreen();
        await waitFor(() => getByTestId('exercise-tracking-back-button'));
        fireEvent.press(getByTestId('exercise-tracking-back-button'));
        expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
    });

    it('navigates to ExerciseProgressDetail on item press', async () => {
        const { getByTestId } = await renderScreen();
        await waitFor(() => getByTestId('exercise-tracking-item-0'));
        fireEvent.press(getByTestId('exercise-tracking-item-0'));
        expect(mockNavigation.navigate).toHaveBeenCalledWith('ExerciseProgressDetail', {
            exerciseId: 'ex-1',
        });
    });

    it('filters exercises by search query', async () => {
        const { getByTestId, getByText, queryByText } = await renderScreen();
        await waitFor(() => getByText('Press de Banca'));
        fireEvent.changeText(getByTestId('exercise-tracking-search-input'), 'Sentadilla');
        await waitFor(() => {
            expect(getByText('Sentadilla')).toBeTruthy();
            expect(queryByText('Press de Banca')).toBeNull();
        });
    });

    it('shows clear search button when query is non-empty', async () => {
        const { getByTestId } = await renderScreen();
        await waitFor(() => getByTestId('exercise-tracking-search-input'));
        fireEvent.changeText(getByTestId('exercise-tracking-search-input'), 'Press');
        await waitFor(() => {
            expect(getByTestId('exercise-tracking-clear-search')).toBeTruthy();
        });
    });

    it('clears search query when clear button is pressed', async () => {
        const { getByTestId, getByText } = await renderScreen();
        await waitFor(() => getByTestId('exercise-tracking-search-input'));
        fireEvent.changeText(getByTestId('exercise-tracking-search-input'), 'Sentadilla');
        await waitFor(() => getByTestId('exercise-tracking-clear-search'));
        fireEvent.press(getByTestId('exercise-tracking-clear-search'));
        await waitFor(() => {
            expect(getByText('Press de Banca')).toBeTruthy();
        });
    });

    it('shows empty state when no exercises match search', async () => {
        const { getByTestId, getByText } = await renderScreen();
        await waitFor(() => getByText('Press de Banca'));
        fireEvent.changeText(getByTestId('exercise-tracking-search-input'), 'ejercicio_inexistente_xyz');
        await waitFor(() => {
            expect(getByTestId('exercise-tracking-empty')).toBeTruthy();
        });
    });

    it('shows empty state when user has no exercises', async () => {
        (ExerciseService.getUserExercisesWithProgress as jest.Mock).mockResolvedValue({
            data: [],
            error: null,
        });
        const { getByTestId } = await renderScreen();
        await waitFor(() => {
            expect(getByTestId('exercise-tracking-empty')).toBeTruthy();
        });
    });

    it('switches to English and translates title, counter, search placeholder, and muscle groups (PF-405)', async () => {
        await i18n.changeLanguage('en');
        const { getByText, getByPlaceholderText } = await renderScreen();
        await waitFor(() => {
            expect(getByText('Exercise Progress')).toBeTruthy();
            expect(getByText('3 exercises')).toBeTruthy();
            expect(getByPlaceholderText('Search exercise...')).toBeTruthy();
            expect(getByText('Chest')).toBeTruthy();
            expect(getByText('Quadriceps')).toBeTruthy();
            expect(getByText('Deltoids')).toBeTruthy();
        });
    });
});

