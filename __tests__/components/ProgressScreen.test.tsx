import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProgressScreen from '../../src/screens/ProgressScreen';

describe('ProgressScreen Component (RNTL)', () => {
    const mockNavigation = { navigate: jest.fn() } as any;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders progress screen title and navigation cards including hypertrophy', async () => {
        const { getByText, getByTestId } = await render(
            <ProgressScreen navigation={mockNavigation} />
        );

        expect(getByText('Progreso')).toBeTruthy();
        expect(getByText('Progreso Mensual')).toBeTruthy();
        expect(getByText('Progreso Semanal')).toBeTruthy();
        expect(getByText('Progreso Diario')).toBeTruthy();
        expect(getByText('Volumen de Hipertrofia')).toBeTruthy();
        expect(getByTestId('progress-item-hypertrophy')).toBeTruthy();
    });

    it('navigates to HypertrophyVolume screen when hypertrophy card is pressed', async () => {
        const { getByTestId } = await render(
            <ProgressScreen navigation={mockNavigation} />
        );

        const card = getByTestId('progress-item-hypertrophy');
        fireEvent.press(card);

        expect(mockNavigation.navigate).toHaveBeenCalledWith('HypertrophyVolume');
    });
});
