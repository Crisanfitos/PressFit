import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import RestTimer from '../../src/components/RestTimer';

const mockCheckActiveRestTimer = jest.fn().mockResolvedValue({ active: false, elapsedSeconds: 0 });
const mockGetPendingTimerAction = jest.fn().mockResolvedValue(null);
const mockClearPendingTimerAction = jest.fn().mockResolvedValue(undefined);
const mockHandleNotificationAction = jest.fn().mockResolvedValue(null);

jest.mock('../../src/services/TimerNotificationService', () => ({
    requestNotificationPermissions: jest.fn().mockResolvedValue(true),
    setupNotificationCategory: jest.fn().mockResolvedValue(undefined),
    setupNotificationChannel: jest.fn().mockResolvedValue(undefined),
    scheduleTimerNotification: jest.fn().mockResolvedValue(undefined),
    cancelTimerNotification: jest.fn().mockResolvedValue(undefined),
    getElapsedSecondsFromStorage: jest.fn().mockResolvedValue(120),
    checkActiveRestTimer: (...args: any[]) => mockCheckActiveRestTimer(...args),
    setRestTimerUIVisible: jest.fn(),
    logTimerNotification: jest.fn(),
    handleNotificationAction: (...args: any[]) => mockHandleNotificationAction(...args),
    getPendingTimerAction: (...args: any[]) => mockGetPendingTimerAction(...args),
    clearPendingTimerAction: (...args: any[]) => mockClearPendingTimerAction(...args),
    setPendingTimerAction: jest.fn().mockResolvedValue(undefined),
    ACTION_OK: 'ACTION_OK',
    ACTION_PAUSE: 'ACTION_PAUSE',
    ACTION_DISCARD: 'ACTION_DISCARD',
    TIMER_STORAGE_KEY: '@pressfit_rest_timer_start',
    TIMER_PAUSED_ELAPSED_KEY: '@pressfit_timer_paused_elapsed',
    TIMER_PENDING_ACTION_KEY: '@pressfit_timer_action',
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

    describe('Kill-recovery reconciliation (PF-133)', () => {
        it('reconciles elapsed time from AsyncStorage when a previous timer exists', async () => {
            // Simulate a timer that was running for 3 minutes before app kill
            mockCheckActiveRestTimer.mockResolvedValueOnce({ active: true, elapsedSeconds: 180 });

            const { findByText } = await render(
                <RestTimer visible={true} onDismiss={mockOnDismiss} onTimerStop={mockOnTimerStop} colors={colors} />
            );

            // Should show 3:00 instead of 0:00
            expect(await findByText('3:00')).toBeTruthy();
        });

        it('starts fresh at 0:00 when no previous timer exists', async () => {
            mockCheckActiveRestTimer.mockResolvedValueOnce({ active: false, elapsedSeconds: 0 });

            const { findByText } = await render(
                <RestTimer visible={true} onDismiss={mockOnDismiss} onTimerStop={mockOnTimerStop} colors={colors} />
            );

            expect(await findByText('0:00')).toBeTruthy();
        });
    });

    describe('Lifecycle & Visibility reliability (PF-285)', () => {
        it('registers Android notification channel and synchronizes foreground UI visibility', async () => {
            const { setRestTimerUIVisible, setupNotificationChannel } = require('../../src/services/TimerNotificationService');

            const { unmount } = await render(
                <RestTimer visible={true} onDismiss={mockOnDismiss} onTimerStop={mockOnTimerStop} colors={colors} />
            );

            expect(setupNotificationChannel).toHaveBeenCalled();
            expect(setRestTimerUIVisible).toHaveBeenCalledWith(true);

            await act(async () => {
                unmount();
            });
            expect(setRestTimerUIVisible).toHaveBeenCalledWith(false);
        });
    });

    describe('Notification Actions & Reconciliation (PF-284)', () => {
        it('reconciles pending OK action by calling onTimerStop and onDismiss', async () => {
            mockGetPendingTimerAction.mockResolvedValueOnce('OK');
            const { getElapsedSecondsFromStorage } = require('../../src/services/TimerNotificationService');
            getElapsedSecondsFromStorage.mockResolvedValueOnce(95);

            await render(
                <RestTimer visible={true} onDismiss={mockOnDismiss} onTimerStop={mockOnTimerStop} colors={colors} />
            );

            expect(mockClearPendingTimerAction).toHaveBeenCalled();
            expect(mockOnTimerStop).toHaveBeenCalledWith(95);
            expect(mockOnDismiss).toHaveBeenCalled();
        });

        it('reconciles pending PAUSE action by setting stopped state and frozen elapsed', async () => {
            mockGetPendingTimerAction.mockResolvedValueOnce('PAUSE');
            const { getElapsedSecondsFromStorage } = require('../../src/services/TimerNotificationService');
            getElapsedSecondsFromStorage.mockResolvedValueOnce(75);

            const { findByText } = await render(
                <RestTimer visible={true} onDismiss={mockOnDismiss} onTimerStop={mockOnTimerStop} colors={colors} />
            );

            expect(mockClearPendingTimerAction).toHaveBeenCalled();
            expect(await findByText('Pausado')).toBeTruthy();
            expect(await findByText('1:15')).toBeTruthy();
        });

        it('reconciles pending DISCARD action by dismissing modal', async () => {
            mockGetPendingTimerAction.mockResolvedValueOnce('DISCARD');

            await render(
                <RestTimer visible={true} onDismiss={mockOnDismiss} onTimerStop={mockOnTimerStop} colors={colors} />
            );

            expect(mockClearPendingTimerAction).toHaveBeenCalled();
            expect(mockOnDismiss).toHaveBeenCalled();
        });
    });
});
