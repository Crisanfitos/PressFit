import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SetInput from '../../src/components/SetInput';

describe('SetInput Component (RNTL)', () => {
    const mockColors = {
        inputBackground: '#0d1117',
        surfaceHighlight: '#21262d',
        border: '#30363d',
        text: '#ffffff',
        textSecondary: '#888888',
    };

    it('renders with initial numeric value correctly', async () => {
        const { getByTestId } = await render(
            <SetInput
                value={60}
                onChange={jest.fn()}
                isEditable={true}
                colors={mockColors}
            />
        );
        const input = getByTestId('set-input');
        expect(input.props.value).toBe('60');
    });

    it('displays placeholder when value is empty or zero', async () => {
        const { getByTestId } = await render(
            <SetInput
                value={0}
                placeholder="-"
                onChange={jest.fn()}
                isEditable={true}
                colors={mockColors}
            />
        );
        const input = getByTestId('set-input');
        expect(input.props.placeholder).toBe('-');
        expect(input.props.value).toBe('');
    });

    it('does not call onChange on blur if value was not changed', async () => {
        const mockOnChange = jest.fn();
        const { getByTestId } = await render(
            <SetInput
                value={60}
                onChange={mockOnChange}
                isEditable={true}
                colors={mockColors}
            />
        );

        const input = getByTestId('set-input');
        fireEvent(input, 'blur');

        expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('respects isEditable prop', async () => {
        const { getByTestId } = await render(
            <SetInput
                value={50}
                onChange={jest.fn()}
                isEditable={false}
                colors={mockColors}
            />
        );

        const input = getByTestId('set-input');
        expect(input.props.editable).toBe(false);
    });

    it('calls onChange on blur when value has changed', async () => {
        const mockOnChange = jest.fn();
        const { getByTestId, rerender } = await render(
            <SetInput
                value={60}
                onChange={mockOnChange}
                isEditable={true}
                colors={mockColors}
            />
        );

        const input = getByTestId('set-input');

        fireEvent.changeText(input, '70');
        expect(mockOnChange).not.toHaveBeenCalled();

        await rerender(
            <SetInput
                value={60}
                onChange={mockOnChange}
                isEditable={true}
                colors={mockColors}
            />
        );

        fireEvent(input, 'blur');

        expect(mockOnChange).toHaveBeenCalledWith('70');
    });
});
