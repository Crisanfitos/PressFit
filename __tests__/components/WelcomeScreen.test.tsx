import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import WelcomeScreen from '../../src/screens/WelcomeScreen';

describe('WelcomeScreen Integration (RNTL)', () => {
    const mockNavigation = {
        navigate: jest.fn(),
    } as any;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders application branding and call-to-action buttons', async () => {
        const { getByText } = await render(
            <WelcomeScreen navigation={mockNavigation} />
        );

        expect(getByText('PressFit')).toBeTruthy();
        expect(getByText('Tu aplicación de seguimiento de entrenamientos y progreso físico')).toBeTruthy();
        expect(getByText('Iniciar Sesión')).toBeTruthy();
        expect(getByText('Crear Cuenta')).toBeTruthy();
    });

    it('navigates to LoginScreen when "Iniciar Sesión" is pressed', async () => {
        const { getByText } = await render(
            <WelcomeScreen navigation={mockNavigation} />
        );

        fireEvent.press(getByText('Iniciar Sesión'));

        expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
    });

    it('navigates to SignUpScreen when "Crear Cuenta" is pressed', async () => {
        const { getByText } = await render(
            <WelcomeScreen navigation={mockNavigation} />
        );

        fireEvent.press(getByText('Crear Cuenta'));

        expect(mockNavigation.navigate).toHaveBeenCalledWith('SignUp');
    });
});
