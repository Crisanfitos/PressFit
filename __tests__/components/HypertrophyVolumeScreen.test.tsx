import React from 'react';
import { render, fireEvent, act, cleanup } from '@testing-library/react-native';
import HypertrophyVolumeScreen from '../../src/screens/HypertrophyVolumeScreen';
import { AuthContext } from '../../src/context/AuthContext';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { AnalyticsService } from '../../src/services/AnalyticsService';
import { RoutineService } from '../../src/services/RoutineService';
import { ExerciseService } from '../../src/services/ExerciseService';
import { RoutineRebalanceService } from '../../src/services/RoutineRebalanceService';
import { AlertContext } from '../../src/context/AlertContext';

jest.mock('../../src/services/AnalyticsService', () => ({
    AnalyticsService: {
        getEffectiveSetsByMuscleGroup: jest.fn(),
    },
}));

jest.mock('../../src/services/RoutineService', () => ({
    RoutineService: {
        getUserRoutines: jest.fn(),
        getWeeklyRoutineWithDays: jest.fn(),
    },
}));

jest.mock('../../src/services/ExerciseService', () => ({
    ExerciseService: {
        getExercises: jest.fn(),
    },
}));

jest.mock('../../src/services/RoutineRebalanceService', () => ({
    RoutineRebalanceService: {
        cloneAndApplyRebalancePlan: jest.fn(),
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

    it('opens RoutineRebalanceModal and clones active routine on confirm (PF-449)', async () => {
        const mockShowToast = jest.fn();
        const mockAlertContext = {
            showAlert: jest.fn(),
            hideAlert: jest.fn(),
            showToast: mockShowToast,
            hideToast: jest.fn(),
        };

        (AnalyticsService.getEffectiveSetsByMuscleGroup as jest.Mock).mockResolvedValue({
            data: {
                totalSeriesEfectivas: 30,
                porGrupoMuscular: { Pecho: 24, Bíceps: 4 },
                distribucion: [
                    { grupo_muscular: 'Pecho', series_efectivas: 24, porcentaje: 80 },
                    { grupo_muscular: 'Bíceps', series_efectivas: 4, porcentaje: 20 },
                ],
            },
            error: null,
        });

        const activeRoutine = {
            id: 'routine-1',
            user_id: 'test-user-id-123',
            nombre: 'Push Pull Legs',
            activa: true,
            rutinas_diarias: [
                {
                    id: 'day-1',
                    rutina_semanal_id: 'routine-1',
                    dia_semana: 1,
                    nombre_dia: 'Empuje',
                    fecha_dia: null,
                    ejercicios_programados: [
                        {
                            id: 'se-1',
                            dia_rutina_id: 'day-1',
                            ejercicio_id: 'ex-1',
                            orden: 1,
                            series_objetivo: 4,
                            repeticiones_objetivo: 10,
                            ejercicio: { id: 'ex-1', nombre: 'Press Banca', grupo_muscular: 'Pecho' },
                        },
                    ],
                },
            ],
        };

        (RoutineService.getUserRoutines as jest.Mock).mockResolvedValue({
            data: [activeRoutine],
            error: null,
        });
        (RoutineService.getWeeklyRoutineWithDays as jest.Mock).mockResolvedValue({
            data: activeRoutine,
            error: null,
        });
        (ExerciseService.getExercises as jest.Mock).mockResolvedValue({
            data: [{ id: 'ex-2', nombre: 'Curl Bíceps', grupo_muscular: 'Bíceps' }],
            error: null,
        });
        (RoutineRebalanceService.cloneAndApplyRebalancePlan as jest.Mock).mockResolvedValue({
            data: { id: 'routine-2', nombre: 'Adj. Push Pull Legs (14/11)', activa: true },
            error: null,
        });

        const { getByTestId } = await render(
            <AuthContext.Provider value={mockAuthContext}>
                <AlertContext.Provider value={mockAlertContext}>
                    <ThemeProvider>
                        <HypertrophyVolumeScreen navigation={mockNavigation} />
                    </ThemeProvider>
                </AlertContext.Provider>
            </AuthContext.Provider>
        );

        await fireEvent.press(getByTestId('hypertrophy-rebalance-button'));

        expect(RoutineService.getUserRoutines).toHaveBeenCalledWith('test-user-id-123');
        expect(getByTestId('routine-rebalance-modal')).toBeTruthy();

        await fireEvent.press(getByTestId('rebalance-confirm-button'));

        expect(RoutineRebalanceService.cloneAndApplyRebalancePlan).toHaveBeenCalledTimes(1);
        expect(mockShowToast).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'success' })
        );
    });
});
