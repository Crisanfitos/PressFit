import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react-native';
import WorkoutSetRow from '../../src/components/WorkoutSetRow';
import { HapticService } from '../../src/services/HapticService';

jest.mock('../../src/services/HapticService', () => ({
    HapticService: {
        selection: jest.fn(),
        setCompleted: jest.fn(),
    },
}));

describe('WorkoutSetRow Component (RNTL)', () => {
    const mockColors = {
        background: '#121212',
        surface: '#1E1E1E',
        surfaceHighlight: '#2A2A2A',
        text: '#FFFFFF',
        textSecondary: '#A0A0A0',
        primary: '#3B82F6',
        border: '#333333',
        inputBackground: '#242424',
    };

    const defaultSet = {
        id: 'set-1',
        numero_serie: 1,
        peso_utilizado: 80,
        repeticiones: 10,
        rpe: 8,
    };

    const mockOnSetChange = jest.fn();
    const mockOnDeleteSet = jest.fn();
    const mockOnStartRestTimer = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('renders set number, inputs with values and labels correctly', async () => {
        const { getByText, getByTestId } = await render(
            <WorkoutSetRow
                set={defaultSet}
                setIndex={0}
                exerciseId="ex-1"
                tipoPeso="total"
                isInputEditable={true}
                isStructureEditable={true}
                colors={mockColors}
                onSetChange={mockOnSetChange}
                onDeleteSet={mockOnDeleteSet}
                onStartRestTimer={mockOnStartRestTimer}
            />
        );

        expect(getByText('1')).toBeTruthy();
        expect(getByTestId('set-weight-input-0')).toBeTruthy();
        expect(getByTestId('set-reps-input-0')).toBeTruthy();
        expect(getByTestId('set-rpe-input-0')).toBeTruthy();
    });

    it('renders bodyweight (BW) placeholder instead of weight input when tipoPeso is corporal', async () => {
        const { getByText, queryByTestId } = await render(
            <WorkoutSetRow
                set={defaultSet}
                setIndex={0}
                exerciseId="ex-1"
                tipoPeso="corporal"
                isInputEditable={true}
                isStructureEditable={false}
                colors={mockColors}
                onSetChange={mockOnSetChange}
            />
        );

        expect(getByText('BW')).toBeTruthy();
        expect(queryByTestId('set-weight-input-0')).toBeNull();
    });

    it('quick adjusts weight plus 2.5kg with haptic feedback', async () => {
        const { getByTestId } = await render(
            <WorkoutSetRow
                set={defaultSet}
                setIndex={0}
                exerciseId="ex-1"
                tipoPeso="total"
                isInputEditable={true}
                isStructureEditable={false}
                colors={mockColors}
                onSetChange={mockOnSetChange}
            />
        );

        const plusBtn = getByTestId('quick-adjust-weight-plus-0');
        fireEvent.press(plusBtn);

        expect(HapticService.selection).toHaveBeenCalledTimes(1);
        expect(mockOnSetChange).toHaveBeenCalledWith('set-1', 'weight', '82.5');
    });

    it('quick adjusts weight minus 2.5kg with haptic feedback', async () => {
        const { getByTestId } = await render(
            <WorkoutSetRow
                set={defaultSet}
                setIndex={0}
                exerciseId="ex-1"
                tipoPeso="total"
                isInputEditable={true}
                isStructureEditable={false}
                colors={mockColors}
                onSetChange={mockOnSetChange}
            />
        );

        const minusBtn = getByTestId('quick-adjust-weight-minus-0');
        fireEvent.press(minusBtn);

        expect(HapticService.selection).toHaveBeenCalledTimes(1);
        expect(mockOnSetChange).toHaveBeenCalledWith('set-1', 'weight', '77.5');
    });

    it('uses ghost weight as base when current weight is empty/0 for quick adjustments', async () => {
        const emptySet = {
            id: 'set-2',
            numero_serie: 2,
            peso_utilizado: 0,
            repeticiones: 0,
        };

        const { getByTestId } = await render(
            <WorkoutSetRow
                set={emptySet}
                setIndex={1}
                exerciseId="ex-1"
                tipoPeso="total"
                ghostWeight="60"
                isInputEditable={true}
                isStructureEditable={false}
                colors={mockColors}
                onSetChange={mockOnSetChange}
            />
        );

        const plusBtn = getByTestId('quick-adjust-weight-plus-1');
        fireEvent.press(plusBtn);

        expect(HapticService.selection).toHaveBeenCalled();
        expect(mockOnSetChange).toHaveBeenCalledWith('set-2', 'weight', '62.5');
    });

    it('clamps weight so it never goes below 0', async () => {
        const zeroSet = {
            id: 'set-3',
            numero_serie: 1,
            peso_utilizado: 1,
            repeticiones: 0,
        };

        const { getByTestId } = await render(
            <WorkoutSetRow
                set={zeroSet}
                setIndex={0}
                exerciseId="ex-1"
                tipoPeso="total"
                isInputEditable={true}
                isStructureEditable={false}
                colors={mockColors}
                onSetChange={mockOnSetChange}
            />
        );

        const minusBtn = getByTestId('quick-adjust-weight-minus-0');
        fireEvent.press(minusBtn);

        expect(mockOnSetChange).toHaveBeenCalledWith('set-3', 'weight', '0');
    });

    it('quick adjusts reps plus 1 with haptic feedback', async () => {
        const { getByTestId } = await render(
            <WorkoutSetRow
                set={defaultSet}
                setIndex={0}
                exerciseId="ex-1"
                tipoPeso="total"
                isInputEditable={true}
                isStructureEditable={false}
                colors={mockColors}
                onSetChange={mockOnSetChange}
            />
        );

        const plusRepsBtn = getByTestId('quick-adjust-reps-plus-0');
        fireEvent.press(plusRepsBtn);
        expect(mockOnSetChange).toHaveBeenCalledWith('set-1', 'reps', '11');
    });

    it('quick adjusts reps minus 1 with haptic feedback', async () => {
        const { getByTestId } = await render(
            <WorkoutSetRow
                set={defaultSet}
                setIndex={0}
                exerciseId="ex-1"
                tipoPeso="total"
                isInputEditable={true}
                isStructureEditable={false}
                colors={mockColors}
                onSetChange={mockOnSetChange}
            />
        );

        const minusRepsBtn = getByTestId('quick-adjust-reps-minus-0');
        fireEvent.press(minusRepsBtn);
        expect(mockOnSetChange).toHaveBeenCalledWith('set-1', 'reps', '9');
    });

    it('calls onDeleteSet when delete button is pressed in editable structure mode', async () => {
        const { getByTestId } = await render(
            <WorkoutSetRow
                set={defaultSet}
                setIndex={0}
                exerciseId="ex-1"
                tipoPeso="total"
                isInputEditable={true}
                isStructureEditable={true}
                colors={mockColors}
                onSetChange={mockOnSetChange}
                onDeleteSet={mockOnDeleteSet}
            />
        );

        const deleteBtn = getByTestId('delete-set-button-0');
        fireEvent.press(deleteBtn);

        expect(mockOnDeleteSet).toHaveBeenCalledWith('set-1', 'ex-1');
    });

    it('calls onStartRestTimer when rest timer button is pressed', async () => {
        const { getByTestId } = await render(
            <WorkoutSetRow
                set={defaultSet}
                setIndex={0}
                exerciseId="ex-1"
                tipoPeso="total"
                isInputEditable={true}
                isStructureEditable={false}
                colors={mockColors}
                onSetChange={mockOnSetChange}
                onStartRestTimer={mockOnStartRestTimer}
            />
        );

        const timerBtn = getByTestId('set-complete-checkbox-0');
        fireEvent.press(timerBtn);

        expect(mockOnStartRestTimer).toHaveBeenCalledWith('set-1');
    });

    it('handles string inputs for peso_utilizado plus (PF-BUG-070)', async () => {
        const stringSet = {
            id: 'set-str-1',
            numero_serie: 1,
            peso_utilizado: '80' as any,
            repeticiones: 10,
            rpe: 8,
        };

        const { getByTestId } = await render(
            <WorkoutSetRow
                set={stringSet}
                setIndex={0}
                exerciseId="ex-1"
                tipoPeso="total"
                isInputEditable={true}
                isStructureEditable={false}
                colors={mockColors}
                onSetChange={mockOnSetChange}
            />
        );

        const plusBtn = getByTestId('quick-adjust-weight-plus-0');
        expect(() => fireEvent.press(plusBtn)).not.toThrow();
        expect(mockOnSetChange).toHaveBeenCalledWith('set-str-1', 'weight', '82.5');
    });

    it('handles string inputs for peso_utilizado minus (PF-BUG-070)', async () => {
        const stringSet = {
            id: 'set-str-1',
            numero_serie: 1,
            peso_utilizado: '80' as any,
            repeticiones: 10,
            rpe: 8,
        };

        const { getByTestId } = await render(
            <WorkoutSetRow
                set={stringSet}
                setIndex={0}
                exerciseId="ex-1"
                tipoPeso="total"
                isInputEditable={true}
                isStructureEditable={false}
                colors={mockColors}
                onSetChange={mockOnSetChange}
            />
        );

        const minusBtn = getByTestId('quick-adjust-weight-minus-0');
        expect(() => fireEvent.press(minusBtn)).not.toThrow();
        expect(mockOnSetChange).toHaveBeenCalledWith('set-str-1', 'weight', '77.5');
    });

    it('handles string inputs for repeticiones plus (PF-BUG-070)', async () => {
        const stringSet = {
            id: 'set-str-2',
            numero_serie: 1,
            peso_utilizado: 50,
            repeticiones: '10' as any,
        };

        const { getByTestId } = await render(
            <WorkoutSetRow
                set={stringSet}
                setIndex={0}
                exerciseId="ex-1"
                tipoPeso="total"
                isInputEditable={true}
                isStructureEditable={false}
                colors={mockColors}
                onSetChange={mockOnSetChange}
            />
        );

        const plusRepsBtn = getByTestId('quick-adjust-reps-plus-0');
        fireEvent.press(plusRepsBtn);
        expect(mockOnSetChange).toHaveBeenCalledWith('set-str-2', 'reps', '11');
    });

    it('handles string inputs for repeticiones minus (PF-BUG-070)', async () => {
        const stringSet = {
            id: 'set-str-2',
            numero_serie: 1,
            peso_utilizado: 50,
            repeticiones: '10' as any,
        };

        const { getByTestId } = await render(
            <WorkoutSetRow
                set={stringSet}
                setIndex={0}
                exerciseId="ex-1"
                tipoPeso="total"
                isInputEditable={true}
                isStructureEditable={false}
                colors={mockColors}
                onSetChange={mockOnSetChange}
            />
        );

        const minusRepsBtn = getByTestId('quick-adjust-reps-minus-0');
        fireEvent.press(minusRepsBtn);
        expect(mockOnSetChange).toHaveBeenCalledWith('set-str-2', 'reps', '9');
    });
});
