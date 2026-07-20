import React from 'react';
import { render } from '@testing-library/react-native';
import LoginScreen from '../../src/screens/LoginScreen';
import { AuthContext } from '../../src/context/AuthContext';

describe('LoginScreen Component (RNTL)', () => {
    const mockNavigation = { navigate: jest.fn() } as any;

    const mockAuthContextValue = {
        signInWithEmail: jest.fn(),
        signInWithGoogle: jest.fn(),
        signUpWithEmail: jest.fn(),
        signOut: jest.fn(),
        user: null,
        session: null,
        loading: false,
    };

    const renderLoginScreen = async () => {
        return render(
            <AuthContext.Provider value={mockAuthContextValue}>
                <LoginScreen navigation={mockNavigation} />
            </AuthContext.Provider>
        );
    };

    it('renders login screen elements and title', async () => {
        const { getByText, getByPlaceholderText } = await renderLoginScreen();

        expect(getByText('PressFit')).toBeTruthy();
        expect(getByText('Tu Progreso, Tu Poder')).toBeTruthy();
        expect(getByPlaceholderText('tu@correo.com')).toBeTruthy();
        expect(getByPlaceholderText('Ingresa tu contraseña')).toBeTruthy();
    });
});
