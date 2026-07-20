import React from 'react';
import { render } from '@testing-library/react-native';
import WeeklyRoutinesScreen from '../../src/screens/WeeklyRoutinesScreen';

describe('WeeklyRoutinesScreen Component (RNTL)', () => {
    it('renders title and placeholder text', async () => {
        const { getByText } = await render(
            <WeeklyRoutinesScreen navigation={{}} />
        );

        expect(getByText('Rutinas Semanales')).toBeTruthy();
        expect(getByText('Esta pantalla será rediseñada')).toBeTruthy();
    });
});
