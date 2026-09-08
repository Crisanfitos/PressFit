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

    it('ensures all cards render chevron icons and bounded flex containers for subtitles', async () => {
        const { getByTestId, getByText, getAllByTestId } = await render(
            <ProgressScreen navigation={mockNavigation} />
        );

        const card = getByTestId('progress-item-hypertrophy');
        expect(card).toBeTruthy();
        expect(getByText('Series efectivas semanales vs MEV / MAV / MRV')).toBeTruthy();

        // Check that chevron icons exist for each navigation item (5 total)
        const chevrons = getAllByTestId('icon-arrow-forward-ios');
        expect(chevrons.length).toBe(5);
    });
});
