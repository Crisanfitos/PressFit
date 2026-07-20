import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LogoutConfirmationModal from '../../src/components/LogoutConfirmationModal';

describe('LogoutConfirmationModal Component (RNTL)', () => {
    it('renders modal title and text when visible', async () => {
        const { getByText } = await render(
            <LogoutConfirmationModal
                visible={true}
                onClose={jest.fn()}
                onConfirm={jest.fn()}
            />
        );

        expect(getByText('Cerrar Sesión')).toBeTruthy();
        expect(getByText('¿Estás seguro de que deseas cerrar sesión en tu cuenta?')).toBeTruthy();
    });

    it('triggers onClose when close icon/button is pressed', async () => {
        const mockOnClose = jest.fn();
        const { getByTestId } = await render(
            <LogoutConfirmationModal
                visible={true}
                onClose={mockOnClose}
                onConfirm={jest.fn()}
            />
        );

        const closeIcon = getByTestId('icon-close');
        fireEvent.press(closeIcon);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('triggers onConfirm when confirm icon/button is pressed', async () => {
        const mockOnConfirm = jest.fn();
        const { getByTestId } = await render(
            <LogoutConfirmationModal
                visible={true}
                onClose={jest.fn()}
                onConfirm={mockOnConfirm}
            />
        );

        const checkIcon = getByTestId('icon-check');
        fireEvent.press(checkIcon);

        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });
});
