import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
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

    test('navigates back when pressing back button', async () => {
        const { getByTestId } = await render(
            <PresetRoutinesScreen navigation={mockNavigation} />
        );

        fireEvent.press(getByTestId('back-button'));
        expect(mockNavigation.goBack).toHaveBeenCalled();
    });
});

