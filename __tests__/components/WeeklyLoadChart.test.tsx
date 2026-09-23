import React from 'react';
import { render } from '@testing-library/react-native';
import i18n from '../../src/i18n';
import { WeeklyLoadChart } from '../../src/components/history/WeeklyLoadChart';
import type { DailyLoadBar } from '../../src/utils/progressHighlights';

describe('WeeklyLoadChart Component (PF-401)', () => {
    const mockBars: DailyLoadBar[] = [
        { dayIndex: 0, label: 'L', tonnageKg: 1000, workouts: 1 },
        { dayIndex: 1, label: 'M', tonnageKg: 2000, workouts: 1 },
        { dayIndex: 2, label: 'X', tonnageKg: 0, workouts: 0 },
        { dayIndex: 3, label: 'J', tonnageKg: 1500, workouts: 1 },
        { dayIndex: 4, label: 'V', tonnageKg: 0, workouts: 0 },
        { dayIndex: 5, label: 'S', tonnageKg: 2500, workouts: 1 },
        { dayIndex: 6, label: 'D', tonnageKg: 0, workouts: 0 },
    ];

    beforeEach(async () => {
        await i18n.changeLanguage('es');
    });

    it('renders translated titles and average calculation in Spanish', async () => {
        const { getByText, getByTestId } = await render(<WeeklyLoadChart bars={mockBars} />);

        expect(getByText('Carga semanal')).toBeTruthy();
        expect(getByText('Tonelaje movido por día (kg)')).toBeTruthy();
        // Total = 7000 / 7 = 1000 kg/día
        expect(getByText('Promedio: 1000 kg/día')).toBeTruthy();
        expect(getByTestId('progress-load-chart-bar-5')).toBeTruthy();
    });

    it('switches to English and renders translated titles and average', async () => {
        await i18n.changeLanguage('en');

        const { getByText } = await render(<WeeklyLoadChart bars={mockBars} />);

        expect(getByText('Weekly Load')).toBeTruthy();
        expect(getByText('Tonnage moved per day (kg)')).toBeTruthy();
        expect(getByText('Average: 1000 kg/day')).toBeTruthy();
    });
});
