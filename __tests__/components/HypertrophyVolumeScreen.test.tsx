import React from 'react';
import { render, fireEvent, act, cleanup } from '@testing-library/react-native';
import HypertrophyVolumeScreen from '../../src/screens/HypertrophyVolumeScreen';
import { AuthContext } from '../../src/context/AuthContext';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { AnalyticsService } from '../../src/services/AnalyticsService';

jest.mock('../../src/services/AnalyticsService', () => ({
    AnalyticsService: {
        getEffectiveSetsByMuscleGroup: jest.fn(),
    },
}));

describe('HypertrophyVolumeScreen Component', () => {
    const mockNavigation = {
        navigate: jest.fn(),
        goBack: jest.fn(),
    } as any;

    const mockAuthContext = {
        user: { id: 'test-user-id-123' },
        session: null,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
    } as any;

    const mockVolumeData = {
        totalSeriesEfectivas: 42,
        porGrupoMuscular: {
            Pecho: 16,
            Espalda: 18,
            Bíceps: 8,
        },
        distribucion: [
            { grupo_muscular: 'Pecho', series_efectivas: 16, porcentaje: 38.1 },
            { grupo_muscular: 'Espalda', series_efectivas: 18, porcentaje: 42.9 },
            { grupo_muscular: 'Bíceps', series_efectivas: 8, porcentaje: 19.0 },
        ],
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (AnalyticsService.getEffectiveSetsByMuscleGroup as jest.Mock).mockResolvedValue({
            data: mockVolumeData,
            error: null,
        });
    });

    afterEach(() => {
        cleanup();
    });

    it('renders header, week selector and summary cards', async () => {
        const { getByTestId, getByText } = await render(
            <AuthContext.Provider value={mockAuthContext}>
                <ThemeProvider>
                    <HypertrophyVolumeScreen navigation={mockNavigation} />
                </ThemeProvider>
            </AuthContext.Provider>
        );

        expect(getByTestId('hypertrophy-volume-screen')).toBeTruthy();
        expect(getByText('Volumen de Hipertrofia')).toBeTruthy();
        expect(getByTestId('hypertrophy-week-selector')).toBeTruthy();
        expect(getByTestId('hypertrophy-summary-card')).toBeTruthy();
    });

    it('invokes navigation.goBack when back button is pressed', async () => {
        const { getByTestId } = await render(
            <AuthContext.Provider value={mockAuthContext}>
                <ThemeProvider>
                    <HypertrophyVolumeScreen navigation={mockNavigation} />
                </ThemeProvider>
            </AuthContext.Provider>
        );

        const backBtn = getByTestId('hypertrophy-back-button');
        fireEvent.press(backBtn);

        expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it('renders muscle volume bars for each muscle in the summary', async () => {
        const { getByTestId, getByText } = await render(
            <AuthContext.Provider value={mockAuthContext}>
                <ThemeProvider>
                    <HypertrophyVolumeScreen navigation={mockNavigation} />
                </ThemeProvider>
            </AuthContext.Provider>
        );

        expect(getByTestId('hypertrophy-muscles-list')).toBeTruthy();
        expect(getByTestId('muscle-volume-bar-pecho')).toBeTruthy();
        expect(getByTestId('muscle-volume-bar-espalda')).toBeTruthy();
        expect(getByTestId('muscle-volume-bar-biceps')).toBeTruthy();
        expect(getByText('Pecho')).toBeTruthy();
        expect(getByText('Espalda')).toBeTruthy();
    });

    it('toggles scientific legend card on info button press', async () => {
        const { getByTestId, queryByTestId } = await render(
            <AuthContext.Provider value={mockAuthContext}>
                <ThemeProvider>
                    <HypertrophyVolumeScreen navigation={mockNavigation} />
                </ThemeProvider>
            </AuthContext.Provider>
        );

        expect(queryByTestId('hypertrophy-legend-card')).toBeNull();

        const infoBtn = getByTestId('hypertrophy-info-button');
        await act(async () => {
            fireEvent.press(infoBtn);
        });

        expect(getByTestId('hypertrophy-legend-card')).toBeTruthy();

        await act(async () => {
            fireEvent.press(infoBtn);
        });
        expect(queryByTestId('hypertrophy-legend-card')).toBeNull();
    });

    it('allows changing weeks using week selector buttons', async () => {
        const { getByTestId } = await render(
            <AuthContext.Provider value={mockAuthContext}>
                <ThemeProvider>
                    <HypertrophyVolumeScreen navigation={mockNavigation} />
                </ThemeProvider>
            </AuthContext.Provider>
        );

        const prevBtn = getByTestId('hypertrophy-prev-week');
        await act(async () => {
            fireEvent.press(prevBtn);
        });

        expect(AnalyticsService.getEffectiveSetsByMuscleGroup).toHaveBeenCalledTimes(2);
    });

    it('renders empty state when there are no recorded sets in the week', async () => {
        (AnalyticsService.getEffectiveSetsByMuscleGroup as jest.Mock).mockResolvedValue({
            data: {
                totalSeriesEfectivas: 0,
                porGrupoMuscular: {},
                distribucion: [],
            },
            error: null,
        });

        const { getByTestId, getByText } = await render(
            <AuthContext.Provider value={mockAuthContext}>
                <ThemeProvider>
                    <HypertrophyVolumeScreen navigation={mockNavigation} />
                </ThemeProvider>
            </AuthContext.Provider>
        );

        expect(getByTestId('hypertrophy-empty-state')).toBeTruthy();
        expect(getByText('Sin registros esta semana')).toBeTruthy();
    });
});
