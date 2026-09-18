import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { ManualFinishWorkoutModal } from '../../src/components/workoutDay/ManualFinishWorkoutModal';

describe('ManualFinishWorkoutModal Component (PF-376)', () => {
    const mockStartTime = '2026-09-17T18:00:00.000Z';
    const mockOnClose = jest.fn();
    const mockOnConfirm = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders null when visible is false', async () => {
        const { queryByTestId } = await render(
            <ThemeProvider>
                <ManualFinishWorkoutModal
                    visible={false}
                    dayName="Torso Hipertrofia"
                    startTime={mockStartTime}
                    onClose={mockOnClose}
                    onConfirm={mockOnConfirm}
                />
            </ThemeProvider>
        );

        expect(queryByTestId('manual-finish-modal')).toBeNull();
    });

    it('renders correctly when visible with start time details and default duration', async () => {
        const { getByTestId, getByText } = await render(
            <ThemeProvider>
                <ManualFinishWorkoutModal
                    visible={true}
                    dayName="Torso Hipertrofia"
                    startTime={mockStartTime}
                    onClose={mockOnClose}
                    onConfirm={mockOnConfirm}
                />
            </ThemeProvider>
        );

        expect(getByTestId('manual-finish-modal')).toBeTruthy();
        expect(getByTestId('manual-finish-modal-title')).toBeTruthy();
        expect(getByText('Torso Hipertrofia')).toBeTruthy();
        expect(getByTestId('pending-workout-modal-start-time')).toBeTruthy();
        expect(getByTestId('manual-finish-time-button')).toBeTruthy();
        expect(getByTestId('manual-finish-confirm-button')).toBeTruthy();
        expect(getByTestId('manual-finish-cancel-button')).toBeTruthy();
    });

    it('blocks confirm and shows validation error if end time is <= start time or < 1 minute after', async () => {
        // Provide initialEndTime only 10 minutes after start so a single -15m step causes invalid duration
        const initialEndTime = new Date(new Date(mockStartTime).getTime() + 10 * 60 * 1000);

        const { getByTestId, queryByTestId } = await render(
            <ThemeProvider>
                <ManualFinishWorkoutModal
                    visible={true}
                    dayName="Torso Hipertrofia"
                    startTime={mockStartTime}
                    initialEndTime={initialEndTime}
                    onClose={mockOnClose}
                    onConfirm={mockOnConfirm}
                />
            </ThemeProvider>
        );

        expect(queryByTestId('time-validation-error')).toBeNull();

        // Step back 15 minutes -> ends 5 mins BEFORE start time
        const decreaseBtn = getByTestId('decrease-time-15min');
        fireEvent.press(decreaseBtn);

        await waitFor(() => {
            expect(getByTestId('time-validation-error')).toBeTruthy();
        });

        // Attempting to press confirm should be blocked
        const confirmBtn = getByTestId('manual-finish-confirm-button');
        fireEvent.press(confirmBtn);

        expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('handles close button and cancel button presses', async () => {
        const { getByTestId } = await render(
            <ThemeProvider>
                <ManualFinishWorkoutModal
                    visible={true}
                    dayName="Pierna Fuerza"
                    startTime={mockStartTime}
                    onClose={mockOnClose}
                    onConfirm={mockOnConfirm}
                />
            </ThemeProvider>
        );

        const cancelBtn = getByTestId('manual-finish-cancel-button');
        fireEvent.press(cancelBtn);
        await waitFor(() => {
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        const closeBtn = getByTestId('manual-finish-modal-close');
        fireEvent.press(closeBtn);
        await waitFor(() => {
            expect(mockOnClose).toHaveBeenCalledTimes(2);
        });
    });

    it('allows adjusting end time with stepper and confirms when time is valid', async () => {
        mockOnConfirm.mockResolvedValue({ success: true });

        const { getByTestId } = await render(
            <ThemeProvider>
                <ManualFinishWorkoutModal
                    visible={true}
                    dayName="Pierna Fuerza"
                    startTime={mockStartTime}
                    onClose={mockOnClose}
                    onConfirm={mockOnConfirm}
                />
            </ThemeProvider>
        );

        const increaseBtn = getByTestId('increase-time-15min');
        fireEvent.press(increaseBtn);

        await waitFor(() => {
            expect(getByTestId('manual-finish-time-text')).toBeTruthy();
        });

        const confirmBtn = getByTestId('manual-finish-confirm-button');
        fireEvent.press(confirmBtn);

        await waitFor(() => {
            expect(mockOnConfirm).toHaveBeenCalledTimes(1);
            expect(mockOnClose).toHaveBeenCalled();
        });
    });
});
