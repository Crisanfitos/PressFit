import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react-native';
import { SetTypePickerModal } from '../../src/components/workout/SetTypePickerModal';
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
    background: '#09090b',
    surface: '#18181b',
    surfaceHighlight: '#27272a',
    text: '#ffffff',
    textSecondary: '#a1a1aa',
    primary: '#ef4444',
    border: '#3f3f46',
};

describe('SetTypePickerModal Component (PF-315)', () => {
    const mockOnSelect = jest.fn();
    const mockOnClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('renders null when visible is false', async () => {
        const { queryByTestId } = await render(
            <SetTypePickerModal
                visible={false}
                currentType="normal"
                onSelect={mockOnSelect}
                onClose={mockOnClose}
                colors={mockColors}
            />
        );

        expect(queryByTestId('set-type-picker-modal')).toBeNull();
    });

    it('renders title, subtitle, and all 5 set type options when visible is true', async () => {
        const { getByTestId, getByText } = await render(
            <SetTypePickerModal
                visible={true}
                currentType="normal"
                onSelect={mockOnSelect}
                onClose={mockOnClose}
                colors={mockColors}
            />
        );

        expect(getByTestId('set-type-picker-modal')).toBeTruthy();
        expect(getByText('Tipo de Serie')).toBeTruthy();
        expect(getByText('Elige la clasificación adecuada para esta serie')).toBeTruthy();

        // 5 options
        expect(getByTestId('set-type-option-normal')).toBeTruthy();
        expect(getByTestId('set-type-option-warmup')).toBeTruthy();
        expect(getByTestId('set-type-option-feeder')).toBeTruthy();
        expect(getByTestId('set-type-option-failure')).toBeTruthy();
        expect(getByTestId('set-type-option-drop')).toBeTruthy();

        // Labels & Short codes
        expect(getByText('Normal')).toBeTruthy();
        expect(getByText('Calentamiento')).toBeTruthy();
        expect(getByText('Aproximación')).toBeTruthy();
        expect(getByText('Fallo')).toBeTruthy();
        expect(getByText('Drop Set')).toBeTruthy();

        expect(getByText('N')).toBeTruthy();
        expect(getByText('W')).toBeTruthy();
        expect(getByText('A')).toBeTruthy();
        expect(getByText('F')).toBeTruthy();
        expect(getByText('D')).toBeTruthy();
    });

    it('triggers haptic feedback, onSelect and onClose when an option is selected', async () => {
        const { getByTestId } = await render(
            <SetTypePickerModal
                visible={true}
                currentType="normal"
                onSelect={mockOnSelect}
                onClose={mockOnClose}
                colors={mockColors}
            />
        );

        fireEvent.press(getByTestId('set-type-option-warmup'));

        expect(HapticService.selection).toHaveBeenCalledTimes(1);
        expect(mockOnSelect).toHaveBeenCalledWith('warmup');
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('triggers onClose when close button is pressed', async () => {
        const { getByTestId } = await render(
            <SetTypePickerModal
                visible={true}
                currentType="normal"
                onSelect={mockOnSelect}
                onClose={mockOnClose}
                colors={mockColors}
            />
        );

        fireEvent.press(getByTestId('set-type-picker-close-button'));

        expect(HapticService.selection).toHaveBeenCalledTimes(1);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockOnSelect).not.toHaveBeenCalled();
    });

    it('triggers onClose when backdrop is pressed', async () => {
        const { getByTestId } = await render(
            <SetTypePickerModal
                visible={true}
                currentType="feeder"
                onSelect={mockOnSelect}
                onClose={mockOnClose}
                colors={mockColors}
            />
        );

        fireEvent.press(getByTestId('set-type-picker-backdrop'));

        expect(HapticService.selection).toHaveBeenCalledTimes(1);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('renders all options with accurate descriptions', async () => {
        const { getByText } = await render(
            <SetTypePickerModal
                visible={true}
                currentType="failure"
                onSelect={mockOnSelect}
                onClose={mockOnClose}
                colors={mockColors}
            />
        );

        expect(getByText('Serie estándar de trabajo efectivo')).toBeTruthy();
        expect(getByText('Serie preparatoria sin fatiga acumulada')).toBeTruthy();
        expect(getByText('Serie de aproximación al peso de trabajo')).toBeTruthy();
        expect(getByText('Serie llevada al fallo muscular técnico (RIR 0)')).toBeTruthy();
        expect(getByText('Descarga de peso inmediata tras el fallo')).toBeTruthy();
    });
});
