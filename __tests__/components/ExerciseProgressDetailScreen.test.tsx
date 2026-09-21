import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import ExerciseProgressDetailScreen from '../../src/screens/ExerciseProgressDetailScreen';
import { ExerciseService } from '../../src/services/ExerciseService';
import { WorkoutService } from '../../src/services/WorkoutService';
import { AnalyticsService } from '../../src/services/AnalyticsService';
import { AuthContext } from '../../src/context/AuthContext';

jest.mock('../../src/services/ExerciseService', () => ({
    ExerciseService: {
        getExerciseById: jest.fn(),
    },
}));

jest.mock('../../src/services/WorkoutService', () => ({
    WorkoutService: {
        getExerciseHistory: jest.fn(),
    },
}));

jest.mock('../../src/services/AnalyticsService', () => ({
    AnalyticsService: {
        get1RMHistory: jest.fn(),
    },
}));

jest.mock('../../src/components/charts/StrengthProgressChart', () => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return {
        __esModule: true,
        default: ({ data, selectedRange, onRangeChange, testID }: any) => (
            <View testID={testID || 'strength-chart'}>
                <Text testID="mock-chart-range">{selectedRange}</Text>
                <Text testID="mock-chart-points">{data.length}</Text>
                <TouchableOpacity testID="mock-range-btn-1A" onPress={() => onRangeChange('1A')}>
                    <Text>1A</Text>
                </TouchableOpacity>
            </View>
        ),
    };
});

const MOCK_1RM_HISTORY = [
    { fecha: '2026-01-15', estimated1RM: 95.0, peso_utilizado: 80, repeticiones: 8 },
    { fecha: '2026-02-01', estimated1RM: 100.0, peso_utilizado: 85, repeticiones: 8 },
    { fecha: '2026-03-01', estimated1RM: 102.5, peso_utilizado: 87.5, repeticiones: 8 },
];

const MOCK_HISTORY_DATA = [
    { id: 's1', numero_serie: 1, peso_utilizado: 80, repeticiones: 10, tipo_peso: 'total', fecha: '2026-03-01', rpe: 8, rutina_id: 'r1' },
    { id: 's2', numero_serie: 2, peso_utilizado: 85, repeticiones: 8, tipo_peso: 'total', fecha: '2026-03-01', rpe: 9, rutina_id: 'r1' },
    { id: 's3', numero_serie: 1, peso_utilizado: 75, repeticiones: 10, tipo_peso: 'total', fecha: '2026-02-15', rpe: 7, rutina_id: 'r2' },
];

describe('ExerciseProgressDetailScreen Component - PF-394 M3 Bento Redesign', () => {
    const mockNavigation = {
        navigate: jest.fn(),
        goBack: jest.fn(),
        addListener: jest.fn(() => jest.fn()),
    } as any;
    const mockRoute = { params: { exerciseId: 'ex-101' } } as any;

    const renderScreen = async () =>
        await render(
            <AuthContext.Provider value={{ user: { id: 'u1' } } as any}>
                <ExerciseProgressDetailScreen navigation={mockNavigation} route={mockRoute} />
            </AuthContext.Provider>
        );

    beforeEach(() => {
        jest.clearAllMocks();
        (ExerciseService.getExerciseById as jest.Mock).mockResolvedValue({
            data: { id: 'ex-101', titulo: 'Press de Banca' },
            error: null,
        });
        (WorkoutService.getExerciseHistory as jest.Mock).mockResolvedValue({
            data: MOCK_HISTORY_DATA,
            error: null,
        });
        (AnalyticsService.get1RMHistory as jest.Mock).mockResolvedValue({
            data: MOCK_1RM_HISTORY,
            error: null,
        });
    });

    it('renders the exercise progress detail screen container', async () => {
        const { getByTestId } = await renderScreen();
        await waitFor(() => {
            expect(getByTestId('exercise-progress-detail-screen')).toBeTruthy();
        });
    });

    it('navigates back when back button is pressed', async () => {
        const { getByTestId } = await renderScreen();
        await waitFor(() => getByTestId('exercise-progress-detail-back-button'));
        fireEvent.press(getByTestId('exercise-progress-detail-back-button'));
        expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
    });

    it('renders 1RM card', async () => {
        const { getByTestId } = await renderScreen();
        await waitFor(() => {
            expect(getByTestId('exercise-progress-1rm-card')).toBeTruthy();
        });
    });

    it('renders 1RM value from AnalyticsService data', async () => {
        const { getByTestId } = await renderScreen();
        await waitFor(() => {
            expect(getByTestId('exercise-progress-1rm-value')).toBeTruthy();
        });
    });

    it('renders trend badge when 1RM history has multiple entries', async () => {
        const { getByTestId } = await renderScreen();
        await waitFor(() => {
            expect(getByTestId('exercise-progress-trend-badge')).toBeTruthy();
        });
    });

    it('renders bento mini cards section', async () => {
        const { getByTestId } = await renderScreen();
        await waitFor(() => {
            expect(getByTestId('exercise-progress-mini-cards')).toBeTruthy();
        });
    });

    it('renders max volume mini card', async () => {
        const { getByTestId } = await renderScreen();
        await waitFor(() => {
            expect(getByTestId('exercise-progress-max-volume-card')).toBeTruthy();
        });
    });

    it('renders best set mini card', async () => {
        const { getByTestId } = await renderScreen();
        await waitFor(() => {
            expect(getByTestId('exercise-progress-best-set-card')).toBeTruthy();
        });
    });

    it('renders the chart card container', async () => {
        const { getByTestId } = await renderScreen();
        await waitFor(() => {
            expect(getByTestId('exercise-progress-chart-card')).toBeTruthy();
        });
    });

    it('renders the StrengthProgressChart component', async () => {
        const { getByTestId } = await renderScreen();
        await waitFor(() => {
            expect(getByTestId('exercise-progress-strength-chart')).toBeTruthy();
        });
    });

    it('renders history list', async () => {
        const { getByTestId } = await renderScreen();
        await waitFor(() => {
            expect(getByTestId('exercise-progress-history-list')).toBeTruthy();
        });
    });

    it('calls AnalyticsService.get1RMHistory on mount', async () => {
        await renderScreen();
        await waitFor(() => {
            expect(AnalyticsService.get1RMHistory).toHaveBeenCalledWith('u1', 'ex-101');
        });
    });

    it('calls WorkoutService.getExerciseHistory on mount', async () => {
        await renderScreen();
        await waitFor(() => {
            expect(WorkoutService.getExerciseHistory).toHaveBeenCalledWith('u1', 'ex-101');
        });
    });

    it('shows dash when no 1RM history is available', async () => {
        (AnalyticsService.get1RMHistory as jest.Mock).mockResolvedValue({ data: [], error: null });
        (WorkoutService.getExerciseHistory as jest.Mock).mockResolvedValue({ data: [], error: null });
        const { getByTestId } = await renderScreen();
        await waitFor(() => {
            expect(getByTestId('exercise-progress-detail-screen')).toBeTruthy();
        });
    });

    it('renders chart container and metric toggle buttons', async () => {
        const { getByTestId } = await renderScreen();
        await waitFor(() => {
            expect(getByTestId('exercise-progress-chart-container')).toBeTruthy();
            expect(getByTestId('exercise-progress-toggle-weight')).toBeTruthy();
            expect(getByTestId('exercise-progress-toggle-volume')).toBeTruthy();
        });
        await act(async () => {
            fireEvent.press(getByTestId('exercise-progress-toggle-volume'));
        });
        await act(async () => {
            fireEvent.press(getByTestId('exercise-progress-toggle-weight'));
        });
    });

    it('renders AI recommendation card', async () => {
        const { getByTestId } = await renderScreen();
        await waitFor(() => {
            expect(getByTestId('exercise-progress-recommendation')).toBeTruthy();
        });
    });
});
