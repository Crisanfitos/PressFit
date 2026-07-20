import React from 'react';
import { render } from '@testing-library/react-native';
import WeeklyPlanScreen from '../../src/screens/WeeklyPlanScreen';

describe('WeeklyPlanScreen Component (RNTL)', () => {
    it('renders title and placeholder description', async () => {
        const { getByText } = await render(
            <WeeklyPlanScreen navigation={{}} route={{}} />
        );

        expect(getByText('Plan Semanal')).toBeTruthy();
        expect(getByText('Esta pantalla será rediseñada')).toBeTruthy();
    });
});
