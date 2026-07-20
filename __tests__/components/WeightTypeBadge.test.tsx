import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WeightTypeBadge } from '../../src/components/WeightTypeBadge';

describe('WeightTypeBadge Component (RNTL)', () => {
    const mockColors = {
        primary: '#238636',
        surface: '#161b22',
        border: '#30363d',
        text: '#ffffff',
        textSecondary: '#888888',
    };

    it('renders badge short label for "total"', async () => {
        const { getByText } = await render(
            <WeightTypeBadge
                tipoPeso="total"
                colors={mockColors}
            />
        );
        expect(getByText('KG')).toBeTruthy();
    });

    it('renders badge short label for "por_lado"', async () => {
        const { getByText } = await render(
            <WeightTypeBadge
                tipoPeso="por_lado"
                colors={mockColors}
            />
        );
        expect(getByText('KG/lado')).toBeTruthy();
    });

    it('renders badge short label for "corporal"', async () => {
        const { getByText } = await render(
            <WeightTypeBadge
                tipoPeso="corporal"
                colors={mockColors}
            />
        );
        expect(getByText('BW')).toBeTruthy();
    });

    it('opens menu and selects a new option when editable', async () => {
        const mockOnSelect = jest.fn();
        const { getByText, findByText } = await render(
            <WeightTypeBadge
                tipoPeso="total"
                editable={true}
                onSelect={mockOnSelect}
                colors={mockColors}
            />
        );

        const badge = getByText('KG');
        fireEvent.press(badge);

        // findByText automatically waits for modal re-render
        const option = await findByText('Por Lado');
        expect(option).toBeTruthy();

        fireEvent.press(option);

        expect(mockOnSelect).toHaveBeenCalledWith('por_lado');
    });

    it('does not trigger onSelect if selecting the currently active option', async () => {
        const mockOnSelect = jest.fn();
        const { getByText, findByText } = await render(
            <WeightTypeBadge
                tipoPeso="total"
                editable={true}
                onSelect={mockOnSelect}
                colors={mockColors}
            />
        );

        fireEvent.press(getByText('KG'));
        const sameOption = await findByText('Peso Total');
        fireEvent.press(sameOption);

        expect(mockOnSelect).not.toHaveBeenCalled();
    });
});
