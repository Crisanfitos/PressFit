import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import StrengthProgressChart from '../../src/components/charts/StrengthProgressChart';
import { OneRMDataPoint, TimeRange } from '../../src/components/charts/StrengthProgressChart';

const MOCK_DATA: OneRMDataPoint[] = [
    { fecha: '2026-01-10', estimated1RM: 90.0, peso_utilizado: 77.5, repeticiones: 8 },
    { fecha: '2026-02-05', estimated1RM: 95.5, peso_utilizado: 82.5, repeticiones: 8 },
    { fecha: '2026-03-01', estimated1RM: 102.5, peso_utilizado: 87.5, repeticiones: 8 },
];

describe('StrengthProgressChart Component - PF-394', () => {
    const mockOnRangeChange = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderChart = async (
        data = MOCK_DATA,
        selectedRange: TimeRange = '3M',
        onRangeChange = mockOnRangeChange
    ) =>
        await render(
            <StrengthProgressChart
                data={data}
                selectedRange={selectedRange}
                onRangeChange={onRangeChange}
                testID="test-strength-chart"
            />
        );

    it('renders the chart container', async () => {
        const { getByTestId } = await renderChart();
        expect(getByTestId('test-strength-chart')).toBeTruthy();
    });

    it('renders the time range selector bar', async () => {
        const { getByTestId } = await renderChart();
        expect(getByTestId('strength-chart-range-selector')).toBeTruthy();
    });

    it('renders all 5 time range buttons', async () => {
        const { getByTestId } = await renderChart();
        const ranges: TimeRange[] = ['1M', '3M', '6M', '1A', 'Todo'];
        ranges.forEach((r) => {
            expect(getByTestId(`strength-chart-range-${r}`)).toBeTruthy();
        });
    });

    it('calls onRangeChange with 1M when 1M button pressed', async () => {
        const { getByTestId } = await renderChart();
        fireEvent.press(getByTestId('strength-chart-range-1M'));
        expect(mockOnRangeChange).toHaveBeenCalledWith('1M');
    });

    it('calls onRangeChange with 3M when 3M button pressed', async () => {
        const { getByTestId } = await renderChart();
        fireEvent.press(getByTestId('strength-chart-range-3M'));
        expect(mockOnRangeChange).toHaveBeenCalledWith('3M');
    });

    it('calls onRangeChange with 6M when 6M button pressed', async () => {
        const { getByTestId } = await renderChart();
        fireEvent.press(getByTestId('strength-chart-range-6M'));
        expect(mockOnRangeChange).toHaveBeenCalledWith('6M');
    });

    it('calls onRangeChange with 1A when 1A button pressed', async () => {
        const { getByTestId } = await renderChart();
        fireEvent.press(getByTestId('strength-chart-range-1A'));
        expect(mockOnRangeChange).toHaveBeenCalledWith('1A');
    });

    it('calls onRangeChange with Todo when Todo button pressed', async () => {
        const { getByTestId } = await renderChart();
        fireEvent.press(getByTestId('strength-chart-range-Todo'));
        expect(mockOnRangeChange).toHaveBeenCalledWith('Todo');
    });

    it('renders the chart plot area', async () => {
        const { getByTestId } = await renderChart();
        expect(getByTestId('strength-chart-plot')).toBeTruthy();
    });

    it('renders empty message when data is empty', async () => {
        const { getByText } = await renderChart([]);
        expect(getByText('Sin datos para el período seleccionado')).toBeTruthy();
    });

    it('does not render empty message when data is non-empty', async () => {
        const { queryByText } = await renderChart(MOCK_DATA);
        expect(queryByText('Sin datos para el período seleccionado')).toBeNull();
    });

    it('renders with single data point', async () => {
        const single: OneRMDataPoint[] = [
            { fecha: '2026-03-01', estimated1RM: 100.0, peso_utilizado: 85, repeticiones: 8 },
        ];
        const { getByTestId } = await renderChart(single);
        expect(getByTestId('strength-chart-plot')).toBeTruthy();
    });

    it('renders with Todo as selected range', async () => {
        const { getByTestId } = await renderChart(MOCK_DATA, 'Todo');
        expect(getByTestId('strength-chart-range-Todo')).toBeTruthy();
    });
});
