import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import SignUpScreen from '../../src/screens/SignUpScreen';
import { AuthContext } from '../../src/context/AuthContext';

describe('SignUpScreen Component (RNTL)', () => {
  const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() } as any;

  const mockSignUpWithEmail = jest.fn();
  const mockAuthContextValue = {
    signInWithEmail: jest.fn(),
    signInWithGoogle: jest.fn(),
    signUpWithEmail: mockSignUpWithEmail,
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders sign up header and input fields', async () => {
    const { getAllByText, getByText, getByTestId } = await renderSignUpScreen();

    expect(getAllByText('Crear Cuenta').length).toBeGreaterThan(0);
    expect(getByText('Únete a PressFit')).toBeTruthy();
    expect(getByTestId('signup-fullname-input')).toBeTruthy();
    expect(getByTestId('signup-email-input')).toBeTruthy();
    expect(getByTestId('signup-password-input')).toBeTruthy();
    expect(getByTestId('signup-confirmpassword-input')).toBeTruthy();
  });

  it('shows error if fields are incomplete on submit', async () => {
    const { getByTestId, findByText } = await renderSignUpScreen();

    const submitBtn = getByTestId('signup-submit-button');
    fireEvent.press(submitBtn);

    expect(await findByText('Por favor completa todos los campos')).toBeTruthy();
  });

  it('shows error if passwords do not match', async () => {
    const { getByTestId, findByText } = await renderSignUpScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('signup-fullname-input'), 'Carlos');
      fireEvent.changeText(getByTestId('signup-email-input'), 'carlos@test.com');
      fireEvent.changeText(getByTestId('signup-password-input'), '123456');
      fireEvent.changeText(getByTestId('signup-confirmpassword-input'), '654321');
    });

    await act(async () => {
      fireEvent.press(getByTestId('signup-submit-button'));
    });

    expect(await findByText('Las contraseñas no coinciden')).toBeTruthy();
  });

  it('calls signUpWithEmail when valid details are provided', async () => {
    mockSignUpWithEmail.mockResolvedValue({});
    const { getByTestId } = await renderSignUpScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('signup-fullname-input'), 'Carlos');
      fireEvent.changeText(getByTestId('signup-email-input'), 'carlos@test.com');
      fireEvent.changeText(getByTestId('signup-password-input'), '123456');
      fireEvent.changeText(getByTestId('signup-confirmpassword-input'), '123456');
    });

    await act(async () => {
      fireEvent.press(getByTestId('signup-submit-button'));
    });

    await waitFor(() => {
      expect(mockSignUpWithEmail).toHaveBeenCalledWith('carlos@test.com', '123456', 'Carlos');
    });
  });
});
