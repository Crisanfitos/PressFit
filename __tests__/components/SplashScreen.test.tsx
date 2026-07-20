import React from 'react';
import { render } from '@testing-library/react-native';
import SplashScreen from '../../src/screens/SplashScreen';

describe('SplashScreen Component (RNTL)', () => {
    it('renders splash screen title and branding', async () => {
        const { getByText, getByTestId } = await render(<SplashScreen />);

        expect(getByTestId('splash-screen')).toBeTruthy();
        expect(getByText('PressFit')).toBeTruthy();
        expect(getByText('Tu Progreso, Tu Poder')).toBeTruthy();
    });
});
