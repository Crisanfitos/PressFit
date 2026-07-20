import React from 'react';
import { render } from '@testing-library/react-native';
import PhysicalProgressScreen from '../../src/screens/PhysicalProgressScreen';
import { useProgressController } from '../../src/controllers/useProgressController';
import { UserService } from '../../src/services/UserService';
import { AuthContext } from '../../src/context/AuthContext';

jest.mock('../../src/controllers/useProgressController');
jest.mock('../../src/services/UserService', () => ({
    UserService: {
        getWeightHistory: jest.fn().mockResolvedValue({ data: [], error: null }),
        getProgressPhotos: jest.fn().mockResolvedValue({ data: [], error: null }),
        getUserMetrics: jest.fn().mockResolvedValue({ data: null, error: null }),
    },
}));

const mockUseProgressController = useProgressController as jest.MockedFunction<typeof useProgressController>;

describe('PhysicalProgressScreen Component (RNTL)', () => {
    const mockNavigation = { navigate: jest.fn() } as any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseProgressController.mockReturnValue({
            dailyStats: null,
            weeklyStats: null,
            monthlyStats: null,
            progressPhotos: [],
            loading: false,
            fetchDailyProgress: jest.fn(),
            fetchWeeklyProgress: jest.fn(),
            fetchMonthlyProgress: jest.fn(),
            fetchPhotos: jest.fn(),
        } as any);

        (UserService.getWeightHistory as jest.Mock).mockResolvedValue({
            data: [{ id: 'w1', peso: 75, created_at: '2026-01-01' }],
            error: null,
        });
        (UserService.getProgressPhotos as jest.Mock).mockResolvedValue({
            data: [],
            error: null,
        });
        (UserService.getUserMetrics as jest.Mock).mockResolvedValue({
            data: { peso: 75, altura: 175, imc: 24.5 },
            error: null,
        });
    });

    it('renders physical progress screen title and tabs', async () => {
        const { findByText } = await render(
            <AuthContext.Provider value={{ user: { id: 'u1' } } as any}>
                <PhysicalProgressScreen navigation={mockNavigation} />
            </AuthContext.Provider>
        );

        expect(await findByText('Cambio Físico')).toBeTruthy();
        expect(await findByText('Evolución de Peso')).toBeTruthy();
        expect(await findByText('Añadir Foto')).toBeTruthy();
    });
});
