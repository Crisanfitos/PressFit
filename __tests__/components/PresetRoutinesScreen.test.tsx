import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PresetRoutinesScreen } from '../../src/screens/PresetRoutinesScreen';

jest.mock('../../src/context/AuthContext', () => ({
    useAuth: () => ({ user: { id: 'test-user-id' } }),
}));

const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
};

describe('PresetRoutinesScreen Component (RNTL)', () => {
    test('renders screen header, category filters, and routine cards', async () => {
        const { getByText, getByTestId } = await render(
            <PresetRoutinesScreen navigation={mockNavigation} />
        );

        expect(getByText('Plantillas Prémium')).toBeTruthy();
        expect(getByText('Biblioteca de Rutinas')).toBeTruthy();
        expect(getByTestId('filter-category-Todas')).toBeTruthy();
        expect(getByTestId('filter-category-Hipertrofia')).toBeTruthy();
        expect(getByTestId('filter-days-0')).toBeTruthy();
    });

    test('filters routines when tapping category filter chips', async () => {
        const { getByTestId, getByText } = await render(
            <PresetRoutinesScreen navigation={mockNavigation} />
        );

        fireEvent.press(getByTestId('filter-category-Hipertrofia'));
        expect(getByText('Push / Pull / Legs (PPL) 6 Días')).toBeTruthy();
    });

    test('renders preset-routines-list and indexed routine cards', async () => {
        const { getByTestId } = await render(
            <PresetRoutinesScreen navigation={mockNavigation} />
        );

        expect(getByTestId('preset-routines-list')).toBeTruthy();
        expect(getByTestId('preset-routine-card-0')).toBeTruthy();
    });

    test('opens detail modal with preset-routine-import-button when card is pressed', async () => {
        const { getByTestId } = await render(
            <PresetRoutinesScreen navigation={mockNavigation} />
        );

        fireEvent.press(getByTestId('preset-routine-card-0'));
        await waitFor(() => {
            expect(getByTestId('preset-routine-import-button')).toBeTruthy();
        });
    });

    test('navigates back when pressing back button', async () => {
        const { getByTestId } = await render(
            <PresetRoutinesScreen navigation={mockNavigation} />
        );

        fireEvent.press(getByTestId('back-button'));
        expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    test('navigates to RoutineEditor when pressing create from scratch button or blank routine tile', async () => {
        const { getByTestId } = await render(
            <PresetRoutinesScreen navigation={mockNavigation} />
        );

        fireEvent.press(getByTestId('create-routine-from-scratch-button'));
        expect(mockNavigation.navigate).toHaveBeenCalledWith('RoutineEditor');

        fireEvent.press(getByTestId('create-blank-routine-tile'));
        expect(mockNavigation.navigate).toHaveBeenCalledWith('RoutineEditor');
    });
});

