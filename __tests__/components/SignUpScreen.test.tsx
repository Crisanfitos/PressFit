import React from 'react';
import { render } from '@testing-library/react-native';
import SignUpScreen from '../../src/screens/SignUpScreen';
import { AuthContext } from '../../src/context/AuthContext';

describe('SignUpScreen Component (RNTL)', () => {
    const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() } as any;

    const mockAuthContextValue = {
        signInWithEmail: jest.fn(),
        signInWithGoogle: jest.fn(),
        signUpWithEmail: jest.fn(),
        signOut: jest.fn(),
        user: null,
        session: null,
        loading: false,
    };

    const renderSignUpScreen = async () => {
        return render(
            <AuthContext.Provider value={mockAuthContextValue}>
                <SignUpScreen navigation={mockNavigation} />
            </AuthContext.Provider>
        );
    };

    it('renders sign up header and input fields', async () => {
        const { getAllByText, getByText, getByPlaceholderText } = await renderSignUpScreen();

        expect(getAllByText('Crear Cuenta').length).toBeGreaterThan(0);
        expect(getByText('Únete a PressFit')).toBeTruthy();
        expect(getByPlaceholderText('Tu nombre')).toBeTruthy();
        expect(getByPlaceholderText('tu@correo.com')).toBeTruthy();
        expect(getByPlaceholderText('Mínimo 6 caracteres')).toBeTruthy();
        expect(getByPlaceholderText('Repite tu contraseña')).toBeTruthy();
    });
});
