import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen, {
  ONBOARDING_COMPLETED_KEY,
  ONBOARDING_PREFERENCES_KEY,
} from '../../src/screens/OnboardingScreen';

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      mode: 'dark',
      colors: {
        background: '#121212',
        surface: '#1E1E1E',
        border: '#333333',
        text: '#FFFFFF',
        textSecondary: '#AAAAAA',
        textOnPrimary: '#000000',
        primary: '#FF6B00',
      },
    },
  }),
}));

describe('OnboardingScreen (PF-165)', () => {
  const mockNavigation: any = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Step 1 with goal options and next button disabled initially', async () => {
    const { getByTestId } = await render(
      <OnboardingScreen navigation={mockNavigation} />
    );

    expect(getByTestId('onboarding-screen')).toBeTruthy();
    expect(getByTestId('onboarding-step1-title')).toBeTruthy();
    expect(getByTestId('goal-card-strength')).toBeTruthy();
    expect(getByTestId('goal-card-hypertrophy')).toBeTruthy();
    expect(getByTestId('goal-card-fat_loss')).toBeTruthy();
    expect(getByTestId('goal-card-endurance')).toBeTruthy();

    const nextButton = getByTestId('next-button');
    expect(nextButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('calls navigation.goBack when cancel/back button is pressed on Step 1', async () => {
    const { getByTestId } = await render(
      <OnboardingScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByTestId('back-button'));
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('advances from Step 1 to Step 2, and supports going back to Step 1', async () => {
    const { getByTestId, queryByTestId } = await render(
      <OnboardingScreen navigation={mockNavigation} />
    );

    // Select hypertrophy
    fireEvent.press(getByTestId('goal-card-hypertrophy'));
    await waitFor(() => {
      expect(getByTestId('next-button').props.accessibilityState?.disabled).toBe(false);
    });

    // Advance to Step 2
    fireEvent.press(getByTestId('next-button'));
    await waitFor(() => {
      expect(getByTestId('onboarding-step2-title')).toBeTruthy();
    });

    // Press back to return to Step 1
    fireEvent.press(getByTestId('back-button'));
    await waitFor(() => {
      expect(getByTestId('onboarding-step1-title')).toBeTruthy();
      expect(queryByTestId('onboarding-step2-title')).toBeNull();
    });
  });

  it('advances from Step 2 to Step 3 and supports going back to Step 2', async () => {
    const { getByTestId, queryByTestId } = await render(
      <OnboardingScreen navigation={mockNavigation} />
    );

    // Step 1: Goal
    fireEvent.press(getByTestId('goal-card-strength'));
    await waitFor(() => {
      expect(getByTestId('next-button').props.accessibilityState?.disabled).toBe(false);
    });
    fireEvent.press(getByTestId('next-button'));

    // Step 2: Days
    await waitFor(() => {
      expect(getByTestId('days-chip-4')).toBeTruthy();
    });
    fireEvent.press(getByTestId('days-chip-4'));
    await waitFor(() => {
      expect(getByTestId('days-info-card')).toBeTruthy();
      expect(getByTestId('next-button').props.accessibilityState?.disabled).toBe(false);
    });

    // Advance to Step 3
    fireEvent.press(getByTestId('next-button'));
    await waitFor(() => {
      expect(getByTestId('onboarding-step3-title')).toBeTruthy();
      expect(getByTestId('level-card-intermediate')).toBeTruthy();
    });

    // Press back to return to Step 2
    fireEvent.press(getByTestId('back-button'));
    await waitFor(() => {
      expect(getByTestId('onboarding-step2-title')).toBeTruthy();
      expect(queryByTestId('onboarding-step3-title')).toBeNull();
    });
  });

  it('saves preferences and completed flag to AsyncStorage on finish', async () => {
    const { getByTestId } = await render(
      <OnboardingScreen navigation={mockNavigation} />
    );

    // Step 1: Select Strength
    fireEvent.press(getByTestId('goal-card-strength'));
    await waitFor(() => {
      expect(getByTestId('next-button').props.accessibilityState?.disabled).toBe(false);
    });
    fireEvent.press(getByTestId('next-button'));

    // Step 2: Select 3 days
    await waitFor(() => {
      expect(getByTestId('days-chip-3')).toBeTruthy();
    });
    fireEvent.press(getByTestId('days-chip-3'));
    await waitFor(() => {
      expect(getByTestId('next-button').props.accessibilityState?.disabled).toBe(false);
    });
    fireEvent.press(getByTestId('next-button'));

    // Step 3: Select Beginner
    await waitFor(() => {
      expect(getByTestId('level-card-beginner')).toBeTruthy();
    });
    fireEvent.press(getByTestId('level-card-beginner'));

    // Press finish button
    await waitFor(() => {
      expect(getByTestId('finish-button').props.accessibilityState?.disabled).toBe(false);
    });
    fireEvent.press(getByTestId('finish-button'));

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        ONBOARDING_COMPLETED_KEY,
        'true'
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        ONBOARDING_PREFERENCES_KEY,
        expect.stringContaining('"goal":"strength"')
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        ONBOARDING_PREFERENCES_KEY,
        expect.stringContaining('"daysPerWeek":3')
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        ONBOARDING_PREFERENCES_KEY,
        expect.stringContaining('"experienceLevel":"beginner"')
      );
      expect(mockNavigation.navigate).toHaveBeenCalledWith('SignUp');
    });
  });

  it('handles Skip button properly by persisting completion and navigating to SignUp', async () => {
    const { getByTestId } = await render(
      <OnboardingScreen navigation={mockNavigation} />
    );

    const skipButton = getByTestId('skip-button');
    fireEvent.press(skipButton);

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        ONBOARDING_COMPLETED_KEY,
        'true'
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        ONBOARDING_PREFERENCES_KEY,
        expect.stringContaining('"goal":null')
      );
      expect(mockNavigation.navigate).toHaveBeenCalledWith('SignUp');
    });
  });
});
