import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import RestTimer from '../../src/components/RestTimer';

jest.mock('expo-notifications', () => ({
    addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    requestPermissionsAsync: jest.fn(),
    setNotificationCategoryAsync: jest.fn(),
}));

jest.mock('../../src/services/TimerNotificationService', () => ({
    requestNotificationPermissions: jest.fn(),
    setupNotificationCategory: jest.fn(),
    scheduleTimerNotification: jest.fn(),
    cancelTimerNotification: jest.fn(),
    getElapsedSecondsFromStorage: jest.fn().mockResolvedValue(45),
    ACTION_OK: 'ok',
    ACTION_PAUSE: 'pause',
    ACTION_DISCARD: 'discard',
}));

describe('RestTimer Component (RNTL)', () => {
    const mockColors = {
        primary: '#238636',
        surface: '#161b22',
        border: '#30363d',
        text: '#ffffff',
        textSecondary: '#888888',
        textOnPrimary: '#000000',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders null when visible is false', async () => {
        const { queryByText } = await render(
            <RestTimer
                visible={false}
                onDismiss={jest.fn()}
                onTimerStop={jest.fn()}
                colors={mockColors}
            />
        );

        expect(queryByText('Descanso')).toBeNull();
    });

    it('renders timer time and "Descanso" label when visible is true', async () => {
        const { getByText } = await render(
            <RestTimer
                visible={true}
                onDismiss={jest.fn()}
                onTimerStop={jest.fn()}
                colors={mockColors}
            />
        );

        expect(getByText('0:00')).toBeTruthy();
        expect(getByText('Descanso')).toBeTruthy();
        expect(getByText('Parar')).toBeTruthy();
    });

    it('pauses timer and shows "Pausado" state when Parar is pressed', async () => {
        const { getByText, findByTestId, findByText } = await render(
            <RestTimer
                visible={true}
                onDismiss={jest.fn()}
                onTimerStop={jest.fn()}
                colors={mockColors}
            />
        );

        fireEvent.press(getByText('Parar'));

        expect(await findByText('Pausado')).toBeTruthy();
        expect(await findByTestId('icon-check')).toBeTruthy();
        expect(await findByTestId('icon-play-arrow')).toBeTruthy();
    });

    it('calls onTimerStop and onDismiss when confirm check button is pressed', async () => {
        const mockOnTimerStop = jest.fn();
        const mockOnDismiss = jest.fn();

        const { getByText, findByTestId } = await render(
            <RestTimer
                visible={true}
                onDismiss={mockOnDismiss}
                onTimerStop={mockOnTimerStop}
                colors={mockColors}
            />
        );

        fireEvent.press(getByText('Parar'));

        const checkIcon = await findByTestId('icon-check');

        await act(async () => {
            fireEvent.press(checkIcon);
        });

        expect(mockOnTimerStop).toHaveBeenCalledWith(45);
        expect(mockOnDismiss).toHaveBeenCalled();
    });

    it('calls onDismiss when close button is pressed', async () => {
        const mockOnDismiss = jest.fn();

        const { findByTestId } = await render(
            <RestTimer
                visible={true}
                onDismiss={mockOnDismiss}
                onTimerStop={jest.fn()}
                colors={mockColors}
            />
        );

        const closeIcon = await findByTestId('icon-close');

        await act(async () => {
            fireEvent.press(closeIcon);
        });

        expect(mockOnDismiss).toHaveBeenCalled();
    });
});
