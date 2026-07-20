import React from 'react';
import { render } from '@testing-library/react-native';
import DailyProgressScreen from '../../src/screens/DailyProgressScreen';
import { useProgressController } from '../../src/controllers/useProgressController';
import { AuthContext } from '../../src/context/AuthContext';

jest.mock('../../src/controllers/useProgressController');

const mockUseProgressController = useProgressController as jest.MockedFunction<typeof useProgressController>;

describe('DailyProgressScreen Component (RNTL)', () => {
    const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() } as any;

    beforeEach(() => {
        jest.clearAllMocks();
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

    it('renders daily progress screen title and stats', async () => {
        const { getByText } = await render(
            <AuthContext.Provider value={{ user: { id: 'u1' } } as any}>
                <DailyProgressScreen navigation={mockNavigation} />
            </AuthContext.Provider>
        );

        expect(getByText('Progreso Diario')).toBeTruthy();
        expect(getByText('Sin entrenamientos hoy')).toBeTruthy();
    });
});
