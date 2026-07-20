import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import LoginScreen from '../../src/screens/LoginScreen';
import { AuthContext } from '../../src/context/AuthContext';

describe('LoginScreen Component (RNTL)', () => {
    const mockNavigation = { navigate: jest.fn() } as any;
    const mockSignInWithEmail = jest.fn();
    const mockSignInWithGoogle = jest.fn();

    const mockAuthContextValue = {
        signInWithEmail: mockSignInWithEmail,
        signInWithGoogle: mockSignInWithGoogle,
        signUpWithEmail: jest.fn(),
        signOut: jest.fn(),
        user: null,
        session: null,
        loading: false,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

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

    it('shows error message if fields are empty on login press', async () => {
        const { getByText, findByText } = await renderLoginScreen();

        fireEvent.press(getByText('Iniciar Sesión'));
        expect(await findByText('Por favor completa todos los campos')).toBeTruthy();
        expect(mockSignInWithEmail).not.toHaveBeenCalled();
    });
});
