import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import FatigueLevelCard from '../../src/components/FatigueLevelCard';
import { AnalyticsService } from '../../src/services/AnalyticsService';
import { FatigueAnalysisResult } from '../../src/utils/analyticsUtils';

jest.mock('../../src/services/AnalyticsService', () => ({
    AnalyticsService: {
        getWeeklyFatigueAnalysis: jest.fn(),
    },
}));

describe('FatigueLevelCard Component (PF-157)', () => {
    const mockOptimalFatigue: FatigueAnalysisResult = {
        averageRPE: 7.2,
        fatigueLevel: 'optimo',
        totalSeriesCount: 16,
        rpeSeriesCount: 16,
        highIntensityCount: 1,
        statusLabel: 'Óptimo',
        statusColor: '#10B981',
        recommendation: 'Carga de trabajo óptima. Excelente capacidad de asimilación y recuperación.',
    };

    const mockOvertrainingFatigue: FatigueAnalysisResult = {
        averageRPE: 9.2,
        fatigueLevel: 'sobreentrenamiento',
        totalSeriesCount: 20,
        rpeSeriesCount: 20,
        highIntensityCount: 14,
        statusLabel: 'Sobreentrenamiento',
        statusColor: '#EF4444',
        recommendation: 'Alerta de fatiga acumulada crítica. Considera una semana de descarga (deload).',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders with initialData directly without loading state', async () => {
        const { getByText, getByTestId } = await render(
            <FatigueLevelCard initialData={mockOptimalFatigue} />
        );

        expect(getByText('Fatiga y RPE Semanal')).toBeTruthy();
        expect(getByText('Óptimo')).toBeTruthy();
        expect(getByText('7.2 / 10')).toBeTruthy();
        expect(getByText('16')).toBeTruthy();
        expect(getByTestId('fatigue-status-badge')).toBeTruthy();
        expect(getByText('Carga de trabajo óptima. Excelente capacidad de asimilación y recuperación.')).toBeTruthy();
    });

    it('fetches data dynamically using AnalyticsService when userId is provided', async () => {
        (AnalyticsService.getWeeklyFatigueAnalysis as jest.Mock).mockResolvedValue({
            data: mockOvertrainingFatigue,
            error: null,
        });

        const { getByText, getByTestId } = await render(
            <FatigueLevelCard userId="user-99" />
        );

        await waitFor(() => {
            expect(getByText('Sobreentrenamiento')).toBeTruthy();
        });

        expect(getByText('9.2 / 10')).toBeTruthy();
        expect(getByText('14')).toBeTruthy();
        expect(getByTestId('metric-high-intensity')).toBeTruthy();
        expect(getByText('Alerta de fatiga acumulada crítica. Considera una semana de descarga (deload).')).toBeTruthy();
    });

    it('displays fallback state when no RPE series data is available', async () => {
        const emptyData: FatigueAnalysisResult = {
            averageRPE: 0,
            fatigueLevel: 'sin_datos',
            totalSeriesCount: 0,
            rpeSeriesCount: 0,
            highIntensityCount: 0,
            statusLabel: 'Sin Datos',
            statusColor: '#6B7280',
            recommendation: 'Registra el RPE en tus series de entrenamiento para analizar tu fatiga acumulada.',
        };

        (AnalyticsService.getWeeklyFatigueAnalysis as jest.Mock).mockResolvedValue({
            data: emptyData,
            error: null,
        });

        const { getByText } = await render(
            <FatigueLevelCard userId="user-new" />
        );

        await waitFor(() => {
            expect(getByText('Sin Datos')).toBeTruthy();
        });

        expect(getByText('—')).toBeTruthy();
        expect(getByText('Registra el RPE en tus series de entrenamiento para analizar tu fatiga acumulada.')).toBeTruthy();
    });
});
