import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react-native';
import { SetActionModal } from '../../src/components/workout/SetActionModal';
import { HapticService } from '../../src/services/HapticService';

jest.mock('../../src/services/HapticService', () => ({
    HapticService: {
        selection: jest.fn(),
        impact: jest.fn(),
        notification: jest.fn(),
        warning: jest.fn(),
    },
}));

const mockColors = {
    background: '#0d1117',
    surface: '#161b22',
    surfaceHighlight: '#21262d',
    text: '#ffffff',
    textSecondary: '#8b949e',
    primary: '#22c55e',
    border: '#30363d',
};

describe('SetActionModal Component (RNTL)', () => {
    const mockOnClose = jest.fn();
    const mockOnOpenTypePicker = jest.fn();
    const mockOnDuplicateSet = jest.fn();
    const mockOnOpenPlateCalculator = jest.fn();
    const mockOnDeleteSet = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('renders null when visible is false', async () => {
        const { queryByTestId } = await render(
            <SetActionModal
                visible={false}
                setNumber={2}
                colors={mockColors}
                onClose={mockOnClose}
            />
        );
        expect(queryByTestId('set-action-modal-container')).toBeNull();
    });

    it('renders header, title and type information correctly when visible', async () => {
        const { getByTestId, getByText } = await render(
            <SetActionModal
                visible={true}
                setNumber={2}
                setType="normal"
                colors={mockColors}
                onClose={mockOnClose}
                onOpenTypePicker={mockOnOpenTypePicker}
            />
        );
        expect(getByTestId('set-action-modal-container')).toBeTruthy();
        expect(getByText('Opciones de Serie 2')).toBeTruthy();
        expect(getByText('Tipo de Serie')).toBeTruthy();
        expect(getByText('Actualmente: Normal')).toBeTruthy();
    });

    it('triggers onClose when close button is pressed', async () => {
        const { getByTestId } = await render(
            <SetActionModal
                visible={true}
                setNumber={1}
                colors={mockColors}
                onClose={mockOnClose}
            />
        );

        fireEvent.press(getByTestId('set-action-modal-close-button'));
        expect(HapticService.selection).toHaveBeenCalledTimes(1);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('triggers onClose when backdrop is pressed', async () => {
        const { getByTestId } = await render(
            <SetActionModal
                visible={true}
                setNumber={1}
                colors={mockColors}
                onClose={mockOnClose}
            />
        );

        fireEvent.press(getByTestId('set-action-modal-backdrop'));
        expect(HapticService.selection).toHaveBeenCalledTimes(1);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('triggers onOpenTypePicker and closes modal when type action item is pressed', async () => {
        const { getByTestId } = await render(
            <SetActionModal
                visible={true}
                setNumber={1}
                colors={mockColors}
                onClose={mockOnClose}
                onOpenTypePicker={mockOnOpenTypePicker}
            />
        );

        fireEvent.press(getByTestId('action-change-set-type'));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockOnOpenTypePicker).toHaveBeenCalledTimes(1);
    });

    it('triggers onDuplicateSet and closes modal when duplicate action is pressed', async () => {
        const { getByTestId } = await render(
            <SetActionModal
                visible={true}
                setNumber={1}
                colors={mockColors}
                onClose={mockOnClose}
                onDuplicateSet={mockOnDuplicateSet}
            />
        );

        fireEvent.press(getByTestId('action-duplicate-set'));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockOnDuplicateSet).toHaveBeenCalledTimes(1);
    });

    it('triggers onOpenPlateCalculator when plate calculator action is pressed', async () => {
        const { getByTestId } = await render(
            <SetActionModal
                visible={true}
                setNumber={1}
                isBodyweight={false}
                colors={mockColors}
                onClose={mockOnClose}
                onOpenPlateCalculator={mockOnOpenPlateCalculator}
            />
        );

        fireEvent.press(getByTestId('action-plate-calculator'));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockOnOpenPlateCalculator).toHaveBeenCalledTimes(1);
    });

    it('hides plate calculator action when isBodyweight is true', async () => {
        const { queryByTestId } = await render(
            <SetActionModal
                visible={true}
                setNumber={1}
                isBodyweight={true}
                colors={mockColors}
                onClose={mockOnClose}
                onOpenPlateCalculator={mockOnOpenPlateCalculator}
            />
        );
        expect(queryByTestId('action-plate-calculator')).toBeNull();
    });

    it('triggers onDeleteSet and closes modal when delete action is pressed', async () => {
        const { getByTestId } = await render(
            <SetActionModal
                visible={true}
                setNumber={1}
                canDelete={true}
                colors={mockColors}
                onClose={mockOnClose}
                onDeleteSet={mockOnDeleteSet}
            />
        );

        const deleteBtn = getByTestId('action-delete-set');
        expect(deleteBtn).toBeTruthy();
        fireEvent.press(deleteBtn);
        expect(HapticService.warning).toHaveBeenCalledTimes(1);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockOnDeleteSet).toHaveBeenCalledTimes(1);
    });

    it('hides delete action when canDelete is false', async () => {
        const { queryByTestId } = await render(
            <SetActionModal
                visible={true}
                setNumber={1}
                canDelete={false}
                colors={mockColors}
                onClose={mockOnClose}
                onDeleteSet={mockOnDeleteSet}
            />
        );
        expect(queryByTestId('action-delete-set')).toBeNull();
    });

    it('uses custom deleteTestID when provided', async () => {
        const { getByTestId } = await render(
            <SetActionModal
                visible={true}
                setNumber={1}
                canDelete={true}
                deleteTestID="custom-delete-btn"
                colors={mockColors}
                onClose={mockOnClose}
                onDeleteSet={mockOnDeleteSet}
            />
        );
        expect(getByTestId('custom-delete-btn')).toBeTruthy();
    });
});
