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

  it('configures defensive keyboard properties on password and confirm password inputs (PF-BUG-060)', async () => {
    const { getByTestId } = await renderSignUpScreen();
    const passwordInput = getByTestId('signup-password-input');
    const confirmPasswordInput = getByTestId('signup-confirmpassword-input');
    const passwordToggle = getByTestId('signup-password-toggle');
    const confirmPasswordToggle = getByTestId('signup-confirmpassword-toggle');

    // Initial state
    expect(passwordInput.props.secureTextEntry).toBe(true);
    expect(passwordInput.props.autoCorrect).toBe(false);
    expect(passwordInput.props.autoCapitalize).toBe('none');
    expect(passwordInput.props.spellCheck).toBe(false);
    expect(passwordInput.props.textContentType).toBe('password');
    expect(passwordInput.props.autoComplete).toBe('password');

    expect(confirmPasswordInput.props.secureTextEntry).toBe(true);
    expect(confirmPasswordInput.props.autoCorrect).toBe(false);
    expect(confirmPasswordInput.props.autoCapitalize).toBe('none');
    expect(confirmPasswordInput.props.spellCheck).toBe(false);
    expect(confirmPasswordInput.props.textContentType).toBe('password');
    expect(confirmPasswordInput.props.autoComplete).toBe('password');

    // Toggle both inputs to visible
    await act(async () => {
      fireEvent.press(passwordToggle);
      fireEvent.press(confirmPasswordToggle);
    });

    const updatedPasswordInput = getByTestId('signup-password-input');
    const updatedConfirmPasswordInput = getByTestId('signup-confirmpassword-input');

    // Visible state: secureTextEntry is false, defensive keyboard properties remain
    expect(updatedPasswordInput.props.secureTextEntry).toBe(false);
    expect(updatedPasswordInput.props.autoCorrect).toBe(false);
    expect(updatedPasswordInput.props.autoCapitalize).toBe('none');
    expect(updatedPasswordInput.props.spellCheck).toBe(false);
    expect(updatedPasswordInput.props.textContentType).toBe('password');
    expect(updatedPasswordInput.props.autoComplete).toBe('password');

    expect(updatedConfirmPasswordInput.props.secureTextEntry).toBe(false);
    expect(updatedConfirmPasswordInput.props.autoCorrect).toBe(false);
    expect(updatedConfirmPasswordInput.props.autoCapitalize).toBe('none');
    expect(updatedConfirmPasswordInput.props.spellCheck).toBe(false);
    expect(updatedConfirmPasswordInput.props.textContentType).toBe('password');
    expect(updatedConfirmPasswordInput.props.autoComplete).toBe('password');
  });
});
