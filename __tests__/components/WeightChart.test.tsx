import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { View, Text, TouchableOpacity } from 'react-native';
import WeightChart from '../../src/components/WeightChart';

jest.mock('react-native-gifted-charts', () => {
    const mockReact = require('react');
    const { View: mockView, Text: mockText, TouchableOpacity: mockTouch } = require('react-native');
    return {
        LineChart: (props: any) => mockReact.createElement(
            mockView,
            { testID: 'line-chart-mock' },
            mockReact.createElement(mockText, null, `Points: ${props.data?.length || 0}`),
            ...(props.data || []).map((pt: any, idx: number) =>
                mockReact.createElement(
                    mockTouch,
                    {
                        key: pt.id || idx,
                        testID: `weight-chart-point-${pt.id || idx}`,
                        onPress: pt.onPress,
                    },
                    mockReact.createElement(mockText, null, `${pt.value} kg`)
                )
            )
        ),
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

        const { getByText, getAllByText, getByTestId } = await render(
            <WeightChart data={mockData} colors={mockColors} />
        );

        expect(getByText('Evolución de Peso')).toBeTruthy();
        expect(getAllByText('72 kg').length).toBeGreaterThanOrEqual(1);
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

    it('displays tooltip banner when a data point is pressed and closes it on close button press', async () => {
        const mockData = [
            { id: 'w1', peso: 70, created_at: '2026-01-01T10:00:00Z' },
            { id: 'w2', peso: 73, created_at: '2026-01-15T10:00:00Z' },
        ];

        const { getByTestId, queryByTestId, getAllByText } = await render(
            <WeightChart data={mockData} colors={mockColors} />
        );

        // Tooltip is initially hidden
        expect(queryByTestId('weight-chart-selected-tooltip')).toBeNull();

        // Tap on first point
        const point1 = getByTestId('weight-chart-point-w1');
        await act(async () => {
            fireEvent.press(point1);
        });

        // Tooltip banner should be visible with point details
        expect(getByTestId('weight-chart-selected-tooltip')).toBeTruthy();
        expect(getAllByText('70 kg').length).toBeGreaterThanOrEqual(2);

        // Close tooltip
        const closeBtn = getByTestId('weight-chart-tooltip-close');
        await act(async () => {
            fireEvent.press(closeBtn);
        });

        // Tooltip should be hidden again
        expect(queryByTestId('weight-chart-selected-tooltip')).toBeNull();
    });
});
