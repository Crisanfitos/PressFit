import React from 'react';
import { render } from '@testing-library/react-native';
import WeightChart from '../../src/components/WeightChart';

jest.mock('react-native-gifted-charts', () => {
    const mockReact = require('react');
    const { Text: mockText } = require('react-native');
    return {
        LineChart: (props: any) => mockReact.createElement(mockText, { testID: 'line-chart-mock' }, `Points: ${props.data?.length || 0}`),
    };
});

describe('WeightChart Component (RNTL)', () => {
    const mockColors = {
        primary: '#238636',
        surface: '#161b22',
        border: '#30363d',
        text: '#ffffff',
        textSecondary: '#888888',
    };

    it('renders empty state when weight data is empty', async () => {
        const { getByText, queryByTestId } = await render(
            <WeightChart data={[]} colors={mockColors} />
        );

        expect(getByText('Evolución de Peso')).toBeTruthy();
        expect(getByText('Aún no hay datos de peso registrados')).toBeTruthy();
        expect(queryByTestId('line-chart-mock')).toBeNull();
    });

    it('renders weight chart and current weight when data exists', async () => {
        const mockData = [
            { id: 'w1', peso: 70, created_at: '2026-01-01T10:00:00Z' },
            { id: 'w2', peso: 72, created_at: '2026-01-15T10:00:00Z' },
        ];

        const { getByText, getByTestId } = await render(
            <WeightChart data={mockData} colors={mockColors} />
        );

        expect(getByText('Evolución de Peso')).toBeTruthy();
        expect(getByText('72 kg')).toBeTruthy();
        expect(getByTestId('line-chart-mock')).toBeTruthy();
    });

    it('renders trend indicators when 2 or more weight entries are provided', async () => {
        const mockData = [
            { id: 'w1', peso: 70, created_at: '2026-01-01T10:00:00Z' },
            { id: 'w2', peso: 73, created_at: '2026-01-15T10:00:00Z' },
        ];

        const { getByText } = await render(
            <WeightChart data={mockData} colors={mockColors} />
        );

        expect(getByText('+3.0 kg desde el primer registro')).toBeTruthy();
        expect(getByText('+3.0 kg desde el último registro')).toBeTruthy();
    });
});
