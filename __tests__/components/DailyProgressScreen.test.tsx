import React from 'react';
import { render } from '@testing-library/react-native';
import DailyProgressScreen from '../../src/screens/DailyProgressScreen';
import { useProgressController } from '../../src/controllers/useProgressController';
import { AuthContext } from '../../src/context/AuthContext';
import i18n from '../../src/i18n';

jest.mock('../../src/controllers/useProgressController');

const mockUseProgressController = useProgressController as jest.MockedFunction<typeof useProgressController>;

describe('DailyProgressScreen Component (RNTL)', () => {
    const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() } as any;

    beforeEach(async () => {
        jest.clearAllMocks();
        await i18n.changeLanguage('es');
        mockUseProgressController.mockReturnValue({
            dailyStats: null,
            weeklyStats: null,
            monthlyStats: null,
            loading: false,
            fetchDailyProgress: jest.fn(),
            fetchWeeklyProgress: jest.fn(),
            fetchMonthlyProgress: jest.fn(),
            fetchDailyProgressByDate: jest.fn(),
        } as any);
    });

    afterEach(async () => {
        await i18n.changeLanguage('es');
    });

    it('renders daily progress screen empty state in Spanish', async () => {
        const { getByText } = await render(
            <AuthContext.Provider value={{ user: { id: 'u1' } } as any}>
                <DailyProgressScreen navigation={mockNavigation} />
            </AuthContext.Provider>
        );

        expect(getByText('Progreso Diario')).toBeTruthy();
        expect(getByText('Sin entrenamientos hoy')).toBeTruthy();
    });

    it('renders daily stats with labels in Spanish (PF-404)', async () => {
        mockUseProgressController.mockReturnValue({
            dailyStats: { exercises: 5, sets: 18, duration: 65, totalWeight: 4200 },
            weeklyStats: null,
            monthlyStats: null,
            loading: false,
            fetchDailyProgress: jest.fn(),
            fetchWeeklyProgress: jest.fn(),
            fetchMonthlyProgress: jest.fn(),
            fetchDailyProgressByDate: jest.fn(),
        } as any);

        const { getByText } = await render(
            <AuthContext.Provider value={{ user: { id: 'u1' } } as any}>
                <DailyProgressScreen navigation={mockNavigation} />
            </AuthContext.Provider>
        );

        expect(getByText('Progreso Diario')).toBeTruthy();
        expect(getByText('Ejercicios')).toBeTruthy();
        expect(getByText('Series')).toBeTruthy();
        expect(getByText('Minutos')).toBeTruthy();
        expect(getByText('Kg Totales')).toBeTruthy();
    });

    it('switches to English and renders translated titles and labels (PF-404)', async () => {
        await i18n.changeLanguage('en');

        mockUseProgressController.mockReturnValue({
            dailyStats: { exercises: 5, sets: 18, duration: 65, totalWeight: 4200 },
            weeklyStats: null,
            monthlyStats: null,
            loading: false,
            fetchDailyProgress: jest.fn(),
            fetchWeeklyProgress: jest.fn(),
            fetchMonthlyProgress: jest.fn(),
            fetchDailyProgressByDate: jest.fn(),
        } as any);

        const { getByText } = await render(
            <AuthContext.Provider value={{ user: { id: 'u1' } } as any}>
                <DailyProgressScreen navigation={mockNavigation} />
            </AuthContext.Provider>
        );

        expect(getByText('Daily Progress')).toBeTruthy();
        expect(getByText('Exercises')).toBeTruthy();
        expect(getByText('Sets')).toBeTruthy();
        expect(getByText('Minutes')).toBeTruthy();
        expect(getByText('Total Weight')).toBeTruthy();
    });
});
