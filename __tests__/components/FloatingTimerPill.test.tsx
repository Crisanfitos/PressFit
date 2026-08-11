import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import FloatingTimerPill from '../../src/components/FloatingTimerPill';
import { ThemeProvider } from '../../src/context/ThemeContext';

const mockCheckActiveRestTimer = jest.fn().mockResolvedValue({ active: false, elapsedSeconds: 0 });

jest.mock('../../src/services/TimerNotificationService', () => ({
    checkActiveRestTimer: (...args: any[]) => mockCheckActiveRestTimer(...args),
}));

describe('FloatingTimerPill Component', () => {
    const mockOnPress = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders null when visible is false', async () => {
        const { queryByTestId } = await render(
            <ThemeProvider>
                <FloatingTimerPill visible={false} onPress={mockOnPress} />
            </ThemeProvider>
        );
        expect(queryByTestId('floating-timer-pill')).toBeNull();
    });

    it('renders pill with formatted time when visible is true', async () => {
        const { getByTestId, getByText } = await render(
            <ThemeProvider>
                <FloatingTimerPill visible={true} onPress={mockOnPress} />
            </ThemeProvider>
        );
        expect(getByTestId('floating-timer-pill')).toBeTruthy();
        expect(getByText('0:00')).toBeTruthy();
        expect(getByText('Descanso')).toBeTruthy();
    });

    it('calls onPress when the pill touchable is pressed', async () => {
        const { getByTestId } = await render(
            <ThemeProvider>
                <FloatingTimerPill visible={true} onPress={mockOnPress} />
            </ThemeProvider>
        );
        fireEvent.press(getByTestId('floating-timer-pill-touchable'));
        expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('reconciles active state and elapsed seconds from AsyncStorage service on mount when prop is undefined', async () => {
        mockCheckActiveRestTimer.mockResolvedValueOnce({ active: true, elapsedSeconds: 95 });

        const { findByText, getByTestId } = await render(
            <ThemeProvider>
                <FloatingTimerPill onPress={mockOnPress} />
            </ThemeProvider>
        );

        expect(await findByText('1:35')).toBeTruthy();
        expect(getByTestId('floating-timer-pill')).toBeTruthy();
    });
});
