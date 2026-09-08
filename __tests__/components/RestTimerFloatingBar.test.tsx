import React from 'react';
import { render, fireEvent, act, cleanup } from '@testing-library/react-native';
import RestTimerFloatingBar from '../../src/components/timer/RestTimerFloatingBar';
import { ThemeProvider } from '../../src/context/ThemeContext';
import * as TimerNotificationService from '../../src/services/TimerNotificationService';
import { HapticService } from '../../src/services/HapticService';

jest.mock('../../src/services/HapticService', () => ({
    HapticService: {
        selection: jest.fn(),
    },
}));

jest.mock('../../src/services/TimerNotificationService', () => ({
    checkActiveRestTimer: jest.fn(),
    getTimerTargetDuration: jest.fn(),
    addSecondsToRestTimer: jest.fn(),
    discardActiveRestTimer: jest.fn(),
}));

describe('RestTimerFloatingBar Component', () => {
    const mockOnPress = jest.fn();
    const mockOnAddSeconds = jest.fn();
    const mockOnSkip = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (TimerNotificationService.checkActiveRestTimer as jest.Mock).mockResolvedValue({
            active: false,
            elapsedSeconds: 0,
            paused: false,
        });
        (TimerNotificationService.getTimerTargetDuration as jest.Mock).mockResolvedValue(90);
        (TimerNotificationService.addSecondsToRestTimer as jest.Mock).mockResolvedValue({
            elapsed: 30,
            target: 120,
        });
        (TimerNotificationService.discardActiveRestTimer as jest.Mock).mockResolvedValue(undefined);
    });

    afterEach(() => {
        cleanup();
    });

    it('renders null when visible is false', async () => {
        const { queryByTestId } = await render(
            <ThemeProvider>
                <RestTimerFloatingBar visible={false} onPress={mockOnPress} />
            </ThemeProvider>
        );
        expect(queryByTestId('rest-timer-floating-bar')).toBeNull();
    });

    it('renders bar with formatted remaining time and label when visible is true', async () => {
        (TimerNotificationService.checkActiveRestTimer as jest.Mock).mockResolvedValue({
            active: true,
            elapsedSeconds: 30,
            paused: false,
        });

        const { getByTestId, findByText } = await render(
            <ThemeProvider>
                <RestTimerFloatingBar
                    visible={true}
                    targetSeconds={90}
                    onPress={mockOnPress}
                />
            </ThemeProvider>
        );

        // 90s target - 30s elapsed = 60s remaining => "1:00"
        expect(getByTestId('rest-timer-floating-bar')).toBeTruthy();
        expect(getByTestId('rest-timer-floating-bar-time')).toBeTruthy();
        expect(await findByText('1:00')).toBeTruthy();
        expect(await findByText('Descanso restante')).toBeTruthy();
    });

    it('calls onPress when the bar touchable is tapped', async () => {
        const { getByTestId } = await render(
            <ThemeProvider>
                <RestTimerFloatingBar visible={true} onPress={mockOnPress} />
            </ThemeProvider>
        );

        const touchable = getByTestId('rest-timer-floating-bar-touchable');
        fireEvent.press(touchable);
        expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('handles +30s button press: triggers haptics and adds 30 seconds', async () => {
        const { getByTestId } = await render(
            <ThemeProvider>
                <RestTimerFloatingBar
                    visible={true}
                    targetSeconds={90}
                    onAddSeconds={mockOnAddSeconds}
                />
            </ThemeProvider>
        );

        const addBtn = getByTestId('rest-timer-floating-bar-add-30s');
        await act(async () => {
            fireEvent.press(addBtn);
        });

        expect(HapticService.selection).toHaveBeenCalled();
        expect(TimerNotificationService.addSecondsToRestTimer).toHaveBeenCalledWith(30);
        expect(mockOnAddSeconds).toHaveBeenCalledWith(30);
    });

    it('handles Saltar button press: triggers haptics, discards timer, and calls onSkip', async () => {
        const { getByTestId } = await render(
            <ThemeProvider>
                <RestTimerFloatingBar
                    visible={true}
                    onSkip={mockOnSkip}
                />
            </ThemeProvider>
        );

        const skipBtn = getByTestId('rest-timer-floating-bar-skip');
        await act(async () => {
            fireEvent.press(skipBtn);
        });

        expect(HapticService.selection).toHaveBeenCalled();
        expect(TimerNotificationService.discardActiveRestTimer).toHaveBeenCalled();
        expect(mockOnSkip).toHaveBeenCalledTimes(1);
    });

    it('displays overtime indicator and format when elapsed exceeds target', async () => {
        (TimerNotificationService.checkActiveRestTimer as jest.Mock).mockResolvedValue({
            active: true,
            elapsedSeconds: 105,
            paused: false,
        });

        const { findByText } = await render(
            <ThemeProvider>
                <RestTimerFloatingBar
                    visible={true}
                    targetSeconds={90}
                />
            </ThemeProvider>
        );

        // 105s - 90s = 15s overtime => "+0:15"
        expect(await findByText('+0:15')).toBeTruthy();
        expect(await findByText('Tiempo extra')).toBeTruthy();
    });

    it('displays paused label when timer is paused', async () => {
        (TimerNotificationService.checkActiveRestTimer as jest.Mock).mockResolvedValue({
            active: true,
            elapsedSeconds: 45,
            paused: true,
        });

        const { findByText } = await render(
            <ThemeProvider>
                <RestTimerFloatingBar
                    visible={true}
                    targetSeconds={90}
                />
            </ThemeProvider>
        );

        expect(await findByText('Pausado')).toBeTruthy();
    });
});
