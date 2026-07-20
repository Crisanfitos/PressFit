import React from 'react';
import { render } from '@testing-library/react-native';
import MonthlyProgressScreen from '../../src/screens/MonthlyProgressScreen';
import { useProgressController } from '../../src/controllers/useProgressController';
import { AuthContext } from '../../src/context/AuthContext';

jest.mock('../../src/controllers/useProgressController');

const mockUseProgressController = useProgressController as jest.MockedFunction<typeof useProgressController>;

describe('MonthlyProgressScreen Component (RNTL)', () => {
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
            fetchMonthlyProgressByDate: jest.fn(),
        } as any);
    });

    it('renders monthly progress screen title and stats', async () => {
        const { getByText } = await render(
            <AuthContext.Provider value={{ user: { id: 'u1' } } as any}>
                <MonthlyProgressScreen navigation={mockNavigation} />
            </AuthContext.Provider>
        );

        expect(getByText('Progreso Mensual')).toBeTruthy();
        expect(getByText('Entrenamientos')).toBeTruthy();
    });
});
