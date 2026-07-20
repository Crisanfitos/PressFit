import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import RestTimer from '../../src/components/RestTimer';

jest.mock('../../src/services/TimerNotificationService', () => ({
    requestNotificationPermissions: jest.fn().mockResolvedValue(true),
    setupNotificationCategory: jest.fn().mockResolvedValue(undefined),
    scheduleTimerNotification: jest.fn().mockResolvedValue(undefined),
    cancelTimerNotification: jest.fn().mockResolvedValue(undefined),
    getElapsedSecondsFromStorage: jest.fn().mockResolvedValue(120),
    ACTION_OK: 'ACTION_OK',
    ACTION_PAUSE: 'ACTION_PAUSE',
    ACTION_DISCARD: 'ACTION_DISCARD',
}));

describe('RestTimer Component (RNTL)', () => {
    const mockOnDismiss = jest.fn();
    const mockOnTimerStop = jest.fn();
    const colors = {
        surface: '#161b22',
        primary: '#238636',
        text: '#ffffff',
        textSecondary: '#8b949e',
        textOnPrimary: '#ffffff',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders null when visible is false', async () => {
        const { queryByText } = await render(
            <RestTimer visible={false} onDismiss={mockOnDismiss} onTimerStop={mockOnTimerStop} colors={colors} />
        );
        expect(queryByText('Descanso')).toBeNull();
    });

    it('renders timer time and "Descanso" label when visible is true', async () => {
        const { getByText } = await render(
            <RestTimer visible={true} onDismiss={mockOnDismiss} onTimerStop={mockOnTimerStop} colors={colors} />
        );
        expect(getByText('Descanso')).toBeTruthy();
        expect(getByText('0:00')).toBeTruthy();
    });

    it('pauses timer and shows "Pausado" state when Parar is pressed', async () => {
        const { getByText, findByText } = await render(
            <RestTimer visible={true} onDismiss={mockOnDismiss} onTimerStop={mockOnTimerStop} colors={colors} />
        );

        fireEvent.press(getByText('Parar'));
        expect(await findByText('Pausado')).toBeTruthy();
    });

    it('resumes timer when play-arrow button is pressed in paused state', async () => {
        const { getByText, findByText, getByTestId } = await render(
            <RestTimer visible={true} onDismiss={mockOnDismiss} onTimerStop={mockOnTimerStop} colors={colors} />
        );

        fireEvent.press(getByText('Parar'));
        expect(await findByText('Pausado')).toBeTruthy();

        fireEvent.press(getByTestId('icon-play-arrow'));
        expect(await findByText('Descanso')).toBeTruthy();
    });

    it('calls onTimerStop and onDismiss when confirm check button is pressed', async () => {
        const { getByText, findByText, getByTestId } = await render(
            <RestTimer visible={true} onDismiss={mockOnDismiss} onTimerStop={mockOnTimerStop} colors={colors} />
        );

        fireEvent.press(getByText('Parar'));
        await findByText('Pausado');

        await fireEvent.press(getByTestId('icon-check'));

        expect(mockOnTimerStop).toHaveBeenCalledWith(120);
        expect(mockOnDismiss).toHaveBeenCalled();
    });

    it('calls onDismiss when close discard button is pressed', async () => {
        const { getByTestId } = await render(
            <RestTimer visible={true} onDismiss={mockOnDismiss} onTimerStop={mockOnTimerStop} colors={colors} />
        );

        await fireEvent.press(getByTestId('icon-close'));

        expect(mockOnDismiss).toHaveBeenCalled();
    });
});
