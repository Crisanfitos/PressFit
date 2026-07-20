import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import EditProfileModal from '../../src/components/EditProfileModal';

jest.spyOn(Alert, 'alert');

describe('EditProfileModal Component (RNTL)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders modal header and pre-fills current metrics when visible', async () => {
        const { getByText, getByDisplayValue } = await render(
            <EditProfileModal
                visible={true}
                onClose={jest.fn()}
                currentMetrics={{ peso: 75.5, altura: 178 }}
                onSave={jest.fn()}
            />
        );

        expect(getByText('Editar Datos Físicos')).toBeTruthy();
        expect(getByDisplayValue('75.5')).toBeTruthy();
        expect(getByDisplayValue('178')).toBeTruthy();
    });

    it('displays IMC preview when weight and height are sufficient', async () => {
        const { getByText } = await render(
            <EditProfileModal
                visible={true}
                onClose={jest.fn()}
                currentMetrics={{ peso: 80, altura: 180 }}
                onSave={jest.fn()}
            />
        );

        expect(getByText('IMC calculado:')).toBeTruthy();
        expect(getByText('24.7')).toBeTruthy();
    });

    it('shows Alert error if required height is missing on first time save', async () => {
        const { getByText } = await render(
            <EditProfileModal
                visible={true}
                onClose={jest.fn()}
                currentMetrics={null}
                onSave={jest.fn()}
            />
        );

        fireEvent.press(getByText('Guardar'));

        expect(Alert.alert).toHaveBeenCalledWith('Error', 'La altura es requerida la primera vez que introduces tus datos');
    });

    it('calls onSave with parsed metrics and onClose when form is valid', async () => {
        const mockOnSave = jest.fn().mockResolvedValue(undefined);
        const mockOnClose = jest.fn();

        const { getByText, getByDisplayValue, findByDisplayValue } = await render(
            <EditProfileModal
                visible={true}
                onClose={mockOnClose}
                currentMetrics={{ peso: 70, altura: 175 }}
                onSave={mockOnSave}
            />
        );

        const weightInput = getByDisplayValue('70');
        fireEvent.changeText(weightInput, '72');

        // Wait for input value to re-render to '72'
        await findByDisplayValue('72');

        await act(async () => {
            fireEvent.press(getByText('Guardar'));
        });

        expect(mockOnSave).toHaveBeenCalledWith({
            weight: 72,
            height: 175,
            bodyFatPercentage: null,
        });
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when Cancelar button is pressed', async () => {
        const mockOnClose = jest.fn();
        const { getByText } = await render(
            <EditProfileModal
                visible={true}
                onClose={mockOnClose}
                currentMetrics={{ peso: 70, altura: 175 }}
                onSave={jest.fn()}
            />
        );

        fireEvent.press(getByText('Cancelar'));
        expect(mockOnClose).toHaveBeenCalled();
    });
});
