import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { RoutineRebalanceModal } from '../../src/components/analytics/RoutineRebalanceModal';
import { RebalancePlan } from '../../src/utils/routineRebalancePlanner';

jest.mock('../../src/context/ThemeContext', () => ({
    useTheme: () => ({
        theme: {
            colors: {
                background: '#09090B',
                surface: '#18181B',
                text: '#FFFFFF',
                textSecondary: '#A1A1AA',
                border: '#27272A',
                primary: '#10B981',
            },
        },
    }),
}));

describe('RoutineRebalanceModal Component (PF-448)', () => {
    const mockPlan: RebalancePlan = {
        status: 'ready',
        sourceRoutineId: 'r-1',
        sourceRoutineName: 'Push Pull Legs',
        suggestedName: 'Adj. Push Pull Legs (14/11)',
        consultationDate: '14/11',
        muscleSummaries: [
            {
                muscleKey: 'pecho',
                muscleLabel: 'Pecho',
                currentSets: 24,
                projectedSets: 20,
                deltaSets: -4,
                statusBefore: 'overtraining',
                action: 'reduce',
                thresholds: { mv: 6, mev: 10, mavMin: 12, mavMax: 20, mrv: 22 },
            },
            {
                muscleKey: 'espalda',
                muscleLabel: 'Espalda',
                currentSets: 16,
                projectedSets: 16,
                deltaSets: 0,
                statusBefore: 'optimal',
                action: 'keep',
                thresholds: { mv: 8, mev: 12, mavMin: 14, mavMax: 22, mrv: 25 },
            },
            {
                muscleKey: 'biceps',
                muscleLabel: 'Bíceps',
                currentSets: 4,
                projectedSets: 6,
                deltaSets: 2,
                statusBefore: 'maintenance',
                action: 'boost',
                thresholds: { mv: 4, mev: 6, mavMin: 10, mavMax: 16, mrv: 18 },
            },
        ],
        operations: [
            {
                id: 'op-1',
                type: 'remove_sets',
                action: 'reduce',
                muscleKey: 'pecho',
                muscleLabel: 'Pecho',
                dayId: 'day-1',
                dayName: 'Lunes - Empuje',
                scheduledExerciseId: 'se-1',
                exerciseId: 'ex-1',
                exerciseName: 'Press Banca',
                currentSets: 4,
                proposedSets: 2,
                deltaSets: -2,
                enabled: true,
            },
        ],
    };

    it('renders muscle summaries, editable name, and calls onConfirm with edited values', async () => {
        const onConfirm = jest.fn();
        const { getByTestId, getByText } = await render(
            <RoutineRebalanceModal
                visible={true}
                plan={mockPlan}
                weekLabel="09/11 - 15/11"
                onClose={jest.fn()}
                onConfirm={onConfirm}
            />
        );

        expect(getByText('Plan de Rebalanceo')).toBeTruthy();
        expect(getByText('Pecho')).toBeTruthy();
        expect(getByText('Espalda')).toBeTruthy();
        expect(getByText('Bíceps')).toBeTruthy();
        expect(getByText('Subir')).toBeTruthy();
        expect(getByText('Mantener')).toBeTruthy();
        expect(getByText('Bajar')).toBeTruthy();

        const nameInput = getByTestId('rebalance-routine-name-input');
        await fireEvent.changeText(nameInput, 'Mi Rutina Ajustada');

        await fireEvent.press(getByTestId('rebalance-confirm-button'));
        expect(onConfirm).toHaveBeenCalledWith(
            expect.objectContaining({
                customName: 'Mi Rutina Ajustada',
                activateImmediately: true,
            })
        );
    });

    it('renders no_active_routine empty state cleanly', async () => {
        const { getByTestId } = await render(
            <RoutineRebalanceModal
                visible={true}
                plan={{
                    ...mockPlan,
                    status: 'no_active_routine',
                    operations: [],
                    muscleSummaries: [],
                }}
                onClose={jest.fn()}
                onConfirm={jest.fn()}
            />
        );
        expect(getByTestId('rebalance-no-active-routine')).toBeTruthy();
    });
});
