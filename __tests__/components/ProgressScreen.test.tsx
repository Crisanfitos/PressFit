import React from 'react';
import { render } from '@testing-library/react-native';
import ProgressScreen from '../../src/screens/ProgressScreen';

describe('ProgressScreen Component (RNTL)', () => {
    const mockNavigation = { navigate: jest.fn() } as any;

    it('renders progress screen title and navigation cards', async () => {
        const { getByText } = await render(
            <ProgressScreen navigation={mockNavigation} />
        );

        expect(getByText('Progreso')).toBeTruthy();
        expect(getByText('Progreso Mensual')).toBeTruthy();
        expect(getByText('Progreso Semanal')).toBeTruthy();
        expect(getByText('Progreso Diario')).toBeTruthy();
    });
});
