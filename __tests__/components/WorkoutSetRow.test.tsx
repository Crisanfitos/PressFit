import React from 'react';
import { render, fireEvent, cleanup, waitFor } from '@testing-library/react-native';
import WorkoutSetRow, { areWorkoutSetRowPropsEqual } from '../../src/components/WorkoutSetRow';
import { HapticService } from '../../src/services/HapticService';

jest.mock('../../src/services/HapticService', () => ({
    HapticService: {
        selection: jest.fn(),
        setCompleted: jest.fn(),
        warning: jest.fn(),
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

    describe('RPE Input Validation (PF-309)', () => {
        it('allows valid RPE input (e.g. 8.5) and calls onSetChange on blur', async () => {
            const { getByTestId, findByDisplayValue } = await render(
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

            const rpeInput = getByTestId('set-rpe-input-0');
            fireEvent.changeText(rpeInput, '8.5');
            expect(await findByDisplayValue('8.5')).toBeTruthy();
            fireEvent(rpeInput, 'blur');

            expect(mockOnSetChange).toHaveBeenCalledWith('set-1', 'rpe', '8.5');
            expect(HapticService.warning).not.toHaveBeenCalled();
        });

        it('handles optional empty RPE and calls onSetChange with empty string', async () => {
            const { getByTestId, findByDisplayValue } = await render(
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

            const rpeInput = getByTestId('set-rpe-input-0');
            fireEvent.changeText(rpeInput, '');
            expect(await findByDisplayValue('')).toBeTruthy();
            fireEvent(rpeInput, 'blur');

            expect(mockOnSetChange).toHaveBeenCalledWith('set-1', 'rpe', '');
        });

        it('clamps RPE below 1 (e.g. 0) to 1 and triggers warning haptic', async () => {
            const { getByTestId, findByDisplayValue } = await render(
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

            const rpeInput = getByTestId('set-rpe-input-0');
            fireEvent.changeText(rpeInput, '0');
            expect(await findByDisplayValue('0')).toBeTruthy();
            fireEvent(rpeInput, 'blur');

            expect(HapticService.warning).toHaveBeenCalled();
            expect(mockOnSetChange).toHaveBeenCalledWith('set-1', 'rpe', '1');
        });

        it('clamps RPE above 10 (e.g. 15) to 10 and triggers warning haptic', async () => {
            const { getByTestId, findByDisplayValue } = await render(
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

            const rpeInput = getByTestId('set-rpe-input-0');
            fireEvent.changeText(rpeInput, '15');
            expect(await findByDisplayValue('15')).toBeTruthy();
            fireEvent(rpeInput, 'blur');

            expect(HapticService.warning).toHaveBeenCalled();
            expect(mockOnSetChange).toHaveBeenCalledWith('set-1', 'rpe', '10');
        });

        it('sanitizes non-numeric text to empty and calls onSetChange with empty string', async () => {
            const { getByTestId, findByDisplayValue } = await render(
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

            const rpeInput = getByTestId('set-rpe-input-0');
            fireEvent.changeText(rpeInput, 'abc');
            expect(await findByDisplayValue('abc')).toBeTruthy();
            fireEvent(rpeInput, 'blur');

            expect(mockOnSetChange).toHaveBeenCalledWith('set-1', 'rpe', '');
        });
    });

    describe('areWorkoutSetRowPropsEqual Comparator (Atomic Memoization)', () => {
        const baseProps: any = {
            set: defaultSet,
            setIndex: 0,
            exerciseId: 'ex-1',
            tipoPeso: 'total',
            isInputEditable: true,
            isStructureEditable: true,
            colors: mockColors,
            ghostWeight: null,
            ghostReps: null,
            ghostRpe: null,
            navMode: 'DEFAULT',
            lastCompletedSetId: null,
            restTimerVisible: false,
            savedTimerSetIds: new Set<string>(),
            onSetChange: mockOnSetChange,
            onDeleteSet: mockOnDeleteSet,
            onStartRestTimer: mockOnStartRestTimer,
        };

        it('returns true when relevant props are identical', () => {
            const nextProps = { ...baseProps, onSetChange: jest.fn() }; // function reference changed
            expect(areWorkoutSetRowPropsEqual(baseProps, nextProps)).toBe(true);
        });

        it('returns false when set scalar values change', () => {
            const nextProps = { ...baseProps, set: { ...defaultSet, peso_utilizado: 85 } };
            expect(areWorkoutSetRowPropsEqual(baseProps, nextProps)).toBe(false);
        });

        it('returns false when editable status changes', () => {
            const nextProps = { ...baseProps, isInputEditable: false };
            expect(areWorkoutSetRowPropsEqual(baseProps, nextProps)).toBe(false);
        });

        it('isolates rest timer completion: returns true if completed set belongs to another row', () => {
            const nextProps = {
                ...baseProps,
                lastCompletedSetId: 'set-999', // another set
                restTimerVisible: true,
            };
            expect(areWorkoutSetRowPropsEqual(baseProps, nextProps)).toBe(true);
        });

        it('invalidates memoization when this row becomes the completed set', () => {
            const nextProps = {
                ...baseProps,
                lastCompletedSetId: 'set-1', // this set
                restTimerVisible: true,
            };
            expect(areWorkoutSetRowPropsEqual(baseProps, nextProps)).toBe(false);
        });

        it('invalidates memoization when this row changes savedTimerSetIds membership', () => {
            const nextProps = {
                ...baseProps,
                savedTimerSetIds: new Set<string>(['set-1']),
            };
            expect(areWorkoutSetRowPropsEqual(baseProps, nextProps)).toBe(false);
        });

        it('invalidates memoization when onOpenPlateCalculator changes', () => {
            const nextProps = {
                ...baseProps,
                onOpenPlateCalculator: jest.fn(),
            };
            expect(areWorkoutSetRowPropsEqual(baseProps, nextProps)).toBe(false);
        });
    });

    it('triggers onOpenPlateCalculator when plate calculator button is pressed', async () => {
        const mockOpenPlate = jest.fn();
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
                onOpenPlateCalculator={mockOpenPlate}
            />
        );

        const plateBtn = getByTestId('plate-calculator-button-0');
        expect(plateBtn).toBeTruthy();
        fireEvent.press(plateBtn);

        expect(mockOpenPlate).toHaveBeenCalledWith(80, 'set-1', 'ex-1');
    });

    describe('In-Situ Set Deletion with canDelete prop (PF-314)', () => {
        it('renders delete button when canDelete is true even if isStructureEditable is false', async () => {
            const mockDelete = jest.fn();
            const { getByTestId } = await render(
                <WorkoutSetRow
                    set={defaultSet}
                    setIndex={0}
                    exerciseId="ex-1"
                    tipoPeso="total"
                    isInputEditable={true}
                    isStructureEditable={false}
                    canDelete={true}
                    colors={mockColors}
                    onSetChange={mockOnSetChange}
                    onDeleteSet={mockDelete}
                />
            );

            const deleteBtn = getByTestId('delete-set-button-0');
            expect(deleteBtn).toBeTruthy();
            fireEvent.press(deleteBtn);
            expect(mockDelete).toHaveBeenCalledWith('set-1', 'ex-1');
        });

        it('invalidates memoization when canDelete changes', () => {
            const baseProps: any = {
                set: defaultSet,
                setIndex: 0,
                exerciseId: 'ex-1',
                tipoPeso: 'total',
                isInputEditable: true,
                isStructureEditable: false,
                canDelete: false,
                colors: mockColors,
            };

            const nextProps = {
                ...baseProps,
                canDelete: true,
            };

            expect(areWorkoutSetRowPropsEqual(baseProps, nextProps)).toBe(false);
        });
    });

    describe('Interactive Set Type Selection (PF-315)', () => {
        it('renders set number button with testID and shows number for normal set', async () => {
            const { getByTestId, getByText } = await render(
                <WorkoutSetRow
                    set={{ ...defaultSet, tipo_serie: 'normal' }}
                    setIndex={0}
                    exerciseId="ex-1"
                    tipoPeso="total"
                    isInputEditable={true}
                    isStructureEditable={true}
                    colors={mockColors}
                    onSetChange={mockOnSetChange}
                />
            );

            expect(getByTestId('set-type-button-0')).toBeTruthy();
            expect(getByText('1')).toBeTruthy();
        });

        it('renders short code badge (W, A, F, D) when set is non-normal', async () => {
            const { getByTestId, getByText } = await render(
                <WorkoutSetRow
                    set={{ ...defaultSet, tipo_serie: 'warmup' }}
                    setIndex={0}
                    exerciseId="ex-1"
                    tipoPeso="total"
                    isInputEditable={true}
                    isStructureEditable={true}
                    colors={mockColors}
                    onSetChange={mockOnSetChange}
                />
            );

            expect(getByTestId('set-type-button-0')).toBeTruthy();
            expect(getByText('W')).toBeTruthy();
        });

        it('opens SetTypePickerModal when set type button is pressed', async () => {
            const { getByTestId, queryByTestId, findByTestId } = await render(
                <WorkoutSetRow
                    set={defaultSet}
                    setIndex={0}
                    exerciseId="ex-1"
                    tipoPeso="total"
                    isInputEditable={true}
                    isStructureEditable={true}
                    colors={mockColors}
                    onSetChange={mockOnSetChange}
                />
            );

            expect(queryByTestId('set-type-picker-modal')).toBeNull();
            fireEvent.press(getByTestId('set-type-button-0'));
            expect(await findByTestId('set-type-picker-modal')).toBeTruthy();
        });

        it('calls onSetChange with tipo_serie when an option is selected from modal', async () => {
            const { getByTestId, findByTestId } = await render(
                <WorkoutSetRow
                    set={defaultSet}
                    setIndex={0}
                    exerciseId="ex-1"
                    tipoPeso="total"
                    isInputEditable={true}
                    isStructureEditable={true}
                    colors={mockColors}
                    onSetChange={mockOnSetChange}
                />
            );

            fireEvent.press(getByTestId('set-type-button-0'));
            const failureOption = await findByTestId('set-type-option-failure');
            fireEvent.press(failureOption);

            expect(mockOnSetChange).toHaveBeenCalledWith('set-1', 'tipo_serie', 'failure');
        });

        it('calls onSelectSetType if provided when option is selected', async () => {
            const mockSelectSetType = jest.fn();
            const { getByTestId, findByTestId } = await render(
                <WorkoutSetRow
                    set={defaultSet}
                    setIndex={0}
                    exerciseId="ex-1"
                    tipoPeso="total"
                    isInputEditable={true}
                    isStructureEditable={true}
                    colors={mockColors}
                    onSetChange={mockOnSetChange}
                    onSelectSetType={mockSelectSetType}
                />
            );

            fireEvent.press(getByTestId('set-type-button-0'));
            const dropOption = await findByTestId('set-type-option-drop');
            fireEvent.press(dropOption);

            expect(mockSelectSetType).toHaveBeenCalledWith('set-1', 'drop');
        });

        it('invalidates memoization when tipo_serie changes', () => {
            const baseProps: any = {
                set: { ...defaultSet, tipo_serie: 'normal' },
                setIndex: 0,
                exerciseId: 'ex-1',
                tipoPeso: 'total',
                isInputEditable: true,
                isStructureEditable: true,
                colors: mockColors,
            };

            const nextProps = {
                ...baseProps,
                set: { ...defaultSet, tipo_serie: 'warmup' },
            };

            expect(areWorkoutSetRowPropsEqual(baseProps, nextProps)).toBe(false);
        });

        it('invalidates memoization when onSelectSetType callback changes', () => {
            const baseProps: any = {
                set: defaultSet,
                setIndex: 0,
                exerciseId: 'ex-1',
                tipoPeso: 'total',
                isInputEditable: true,
                isStructureEditable: true,
                colors: mockColors,
            };

            const nextProps = {
                ...baseProps,
                onSelectSetType: jest.fn(),
            };

            expect(areWorkoutSetRowPropsEqual(baseProps, nextProps)).toBe(false);
        });
    });
});


