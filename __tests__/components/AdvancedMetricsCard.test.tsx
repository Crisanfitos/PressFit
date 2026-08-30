import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AdvancedMetricsCard from '../../src/components/AdvancedMetricsCard';
import { ExerciseService } from '../../src/services/ExerciseService';
import { AnalyticsService } from '../../src/services/AnalyticsService';

jest.mock('react-native-gifted-charts', () => {
    const mockReact = require('react');
    const { View: mockView, Text: mockText, TouchableOpacity: mockTouch } = require('react-native');
    return {
        LineChart: (props: any) =>
            mockReact.createElement(
                mockView,
                { testID: 'line-chart-gifted' },
                mockReact.createElement(mockText, null, `ChartPoints: ${props.data?.length || 0}`),
                ...(props.data || []).map((pt: any, idx: number) =>
                    mockReact.createElement(
                        mockTouch,
                        {
                            key: idx,
                            testID: `chart-point-${idx}`,
                            onPress: pt.onPress,
                        },
                        mockReact.createElement(mockText, null, `${pt.value} kg`)
                    )
                )
            ),
    };
});

jest.mock('../../src/services/ExerciseService', () => ({
    ExerciseService: {
        getExercises: jest.fn(),
    },
}));

jest.mock('../../src/services/AnalyticsService', () => ({
    AnalyticsService: {
        get1RMHistory: jest.fn(),
    },
}));

describe('AdvancedMetricsCard Component (PF-156)', () => {
    const mockExercises = [
        { id: 'ex-1', titulo: 'Press de Banca Plano', grupo_muscular: 'Pecho' },
        { id: 'ex-2', titulo: 'Sentadilla Trasera', grupo_muscular: 'Piernas' },
    ];

    const mock1RMHistory = [
        {
            fecha: '2026-08-01',
            estimated1RM: 100,
            peso_utilizado: 80,
            repeticiones: 8,
            numero_serie: 1,
            formula: 'brzycki' as const,
        },
        {
            fecha: '2026-08-15',
            estimated1RM: 112.5,
            peso_utilizado: 100,
            repeticiones: 5,
            numero_serie: 2,
            formula: 'brzycki' as const,
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        (ExerciseService.getExercises as jest.Mock).mockResolvedValue({
            data: mockExercises,
            error: null,
        });
        (AnalyticsService.get1RMHistory as jest.Mock).mockResolvedValue({
            data: mock1RMHistory,
            error: null,
        });
    });

    it('renders header, title, and initial exercise information', async () => {
        const { getByText, getByTestId } = await render(
            <AdvancedMetricsCard userId="user-123" initialExerciseId="ex-1" />
        );

        expect(getByText('1RM Estimado')).toBeTruthy();

        await waitFor(() => {
            expect(getByText('Press de Banca Plano')).toBeTruthy();
        });

        expect(getByTestId('advanced-metrics-card')).toBeTruthy();
    });

    it('calculates and displays key KPI metrics correctly when 1RM history exists', async () => {
        const { getByText, getAllByText, getByTestId } = await render(
            <AdvancedMetricsCard userId="user-123" initialExerciseId="ex-1" />
        );

        await waitFor(() => {
            expect(getByTestId('metric-current-1rm')).toBeTruthy();
            expect(getByTestId('metric-best-1rm')).toBeTruthy();
            expect(getByTestId('metric-formula')).toBeTruthy();
        });

        // 1RM Actual = 112.5 kg, Diff = +12.5 kg (+12.5%)
        expect(getAllByText('112.5 kg').length).toBeGreaterThanOrEqual(1);
        expect(getByText('+12.5 kg (+12.5%)')).toBeTruthy();

        // Formula badge
        expect(getByText('Brzycki')).toBeTruthy();
        expect(getByText('≤ 10 reps')).toBeTruthy();

        // Chart rendered
        expect(getByTestId('line-chart-gifted')).toBeTruthy();
    });

    it('displays empty state message when no 1RM history is recorded for the exercise', async () => {
        (AnalyticsService.get1RMHistory as jest.Mock).mockResolvedValue({
            data: [],
            error: null,
        });

        const { getByTestId, getByText } = await render(
            <AdvancedMetricsCard userId="user-123" initialExerciseId="ex-1" />
        );

        await waitFor(() => {
            expect(getByTestId('advanced-metrics-empty')).toBeTruthy();
        });

        expect(getByText('No hay series registradas para estimar el 1RM de este ejercicio.')).toBeTruthy();
    });

    it('allows opening selector modal and switching exercise', async () => {
        const handleExerciseChange = jest.fn();

        const { getByTestId, getByText } = await render(
            <AdvancedMetricsCard
                userId="user-123"
                initialExerciseId="ex-1"
                onExerciseChange={handleExerciseChange}
            />
        );

        await waitFor(() => {
            expect(getByText('Press de Banca Plano')).toBeTruthy();
        });

        // Open selector modal
        await act(async () => {
            fireEvent.press(getByTestId('exercise-selector-button'));
        });

        expect(getByText('Seleccionar Ejercicio')).toBeTruthy();
        expect(getByTestId('exercise-option-ex-2')).toBeTruthy();

        // Select exercise 2
        (AnalyticsService.get1RMHistory as jest.Mock).mockResolvedValue({
            data: [
                {
                    fecha: '2026-08-20',
                    estimated1RM: 140,
                    peso_utilizado: 120,
                    repeticiones: 6,
                    numero_serie: 1,
                    formula: 'brzycki',
                },
            ],
            error: null,
        });

        await act(async () => {
            fireEvent.press(getByTestId('exercise-option-ex-2'));
        });

        expect(handleExerciseChange).toHaveBeenCalledWith('ex-2');
    });

    it('shows interactive banner when a chart point is pressed and allows closing it', async () => {
        const { getByTestId, queryByTestId, getByText } = await render(
            <AdvancedMetricsCard userId="user-123" initialExerciseId="ex-1" />
        );

        await waitFor(() => {
            expect(getByTestId('chart-point-0')).toBeTruthy();
        });

        // Initially no tooltip banner
        expect(queryByTestId('selected-point-banner')).toBeNull();

        // Press first chart point
        await act(async () => {
            fireEvent.press(getByTestId('chart-point-0'));
        });

        await waitFor(() => {
            expect(getByTestId('selected-point-banner')).toBeTruthy();
        });

        expect(getByText(/2026-08-01/)).toBeTruthy();

        // Close tooltip banner
        await act(async () => {
            fireEvent.press(getByTestId('close-tooltip-button'));
        });

        expect(queryByTestId('selected-point-banner')).toBeNull();
    });
});
