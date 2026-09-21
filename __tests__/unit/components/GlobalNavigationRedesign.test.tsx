import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WorkoutHeader } from '../../../src/components/workout/WorkoutHeader';
import { RestTimerFloatingBar } from '../../../src/components/timer/RestTimerFloatingBar';
import FloatingTimerPill from '../../../src/components/FloatingTimerPill';
import { ResumeWorkoutModal } from '../../../src/components/workout/ResumeWorkoutModal';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import { themes } from '../../../src/theme/colors';

jest.mock('../../../src/services/HapticService', () => ({
    HapticService: {
        selection: jest.fn(),
    },
}));

jest.mock('../../../src/services/TimerNotificationService', () => ({
    checkActiveRestTimer: jest.fn().mockResolvedValue({ active: true, elapsedSeconds: 45, paused: false }),
    getTimerTargetDuration: jest.fn().mockResolvedValue(90),
    setPendingTimerAction: jest.fn().mockResolvedValue(undefined),
    finishActiveRestTimer: jest.fn().mockResolvedValue(45),
    addSecondsToRestTimer: jest.fn().mockResolvedValue({ elapsed: 45, target: 120 }),
    discardActiveRestTimer: jest.fn().mockResolvedValue(undefined),
}));

describe('Global Navigation & Header Redesign (PF-389)', () => {
    describe('WorkoutHeader with Stitch M3 styling', () => {
        it('renders pulsing active workout indicator dot and back button', async () => {
            const mockBack = jest.fn();
            const { getByTestId, getByText } = await render(
                <ThemeProvider>
                    <WorkoutHeader
                        dayName="Empuje: Pecho & Hombros"
                        fechaDia="2026-09-21"
                        descripcion="RPE 8-9 · Descanso 2min"
                        colors={themes.dark.colors}
                        onBack={mockBack}
                    />
                </ThemeProvider>
            );

            expect(getByTestId('workout-back-button')).toBeTruthy();
            expect(getByTestId('workout-active-pulse-dot')).toBeTruthy();
            expect(getByText(/Empuje: Pecho & Hombros/)).toBeTruthy();
            expect(getByText('RPE 8-9 · Descanso 2min')).toBeTruthy();

            fireEvent.press(getByTestId('workout-back-button'));
            expect(mockBack).toHaveBeenCalledTimes(1);
        });
    });

    describe('RestTimerFloatingBar M3 Integration', () => {
        it('renders with M3 container and controls when visible', async () => {
            const mockPress = jest.fn();
            const mockFinish = jest.fn();
            const mockAdd30s = jest.fn();
            const mockSkip = jest.fn();

            const { getByTestId, findByText } = await render(
                <ThemeProvider>
                    <RestTimerFloatingBar
                        visible={true}
                        onPress={mockPress}
                        onFinish={mockFinish}
                        onAddSeconds={mockAdd30s}
                        onSkip={mockSkip}
                    />
                </ThemeProvider>
            );

            expect(getByTestId('rest-timer-floating-bar')).toBeTruthy();
            expect(getByTestId('rest-timer-floating-bar-time')).toBeTruthy();
            expect(getByTestId('rest-timer-floating-bar-finish')).toBeTruthy();
            expect(getByTestId('rest-timer-floating-bar-add-30s')).toBeTruthy();
            expect(getByTestId('rest-timer-floating-bar-skip')).toBeTruthy();
            expect(await findByText('Descanso')).toBeTruthy();

            fireEvent.press(getByTestId('rest-timer-floating-bar-touchable'));
            expect(mockPress).toHaveBeenCalled();
        });
    });

    describe('FloatingTimerPill M3 Integration', () => {
        it('renders pill with timer and responds to press', async () => {
            const mockPress = jest.fn();
            const { getByTestId, findByText } = await render(
                <ThemeProvider>
                    <FloatingTimerPill visible={true} onPress={mockPress} />
                </ThemeProvider>
            );

            expect(getByTestId('floating-timer-pill')).toBeTruthy();
            expect(await findByText('Descanso')).toBeTruthy();
            fireEvent.press(getByTestId('floating-timer-pill-touchable'));
            expect(mockPress).toHaveBeenCalled();
        });
    });

    describe('ResumeWorkoutModal M3 Tokens', () => {
        it('renders session card and buttons with M3 colors', async () => {
            const mockResume = jest.fn();
            const mockDiscard = jest.fn();
            const session = {
                workoutId: 'w-test',
                routineDayId: 'rd-test',
                dayName: 'Tirón: Espalda y Bíceps',
                dayOfWeek: 1,
                startTime: '2026-09-21T18:00:00.000Z',
                elapsedMinutes: 25,
                exerciseCount: 4,
                completedSetsCount: 8,
                totalSetsCount: 16,
            };

            const { getByTestId, getByText } = await render(
                <ThemeProvider>
                    <ResumeWorkoutModal
                        visible={true}
                        session={session}
                        onResume={mockResume}
                        onDiscard={mockDiscard}
                        colors={themes.dark.colors}
                    />
                </ThemeProvider>
            );

            expect(getByTestId('resume-workout-modal')).toBeTruthy();
            expect(getByText('Tirón: Espalda y Bíceps')).toBeTruthy();
            expect(getByText('25 min transcurridos')).toBeTruthy();
            expect(getByTestId('resume-workout-confirm-button')).toBeTruthy();
            expect(getByTestId('resume-workout-discard-button')).toBeTruthy();
        });
    });
});
