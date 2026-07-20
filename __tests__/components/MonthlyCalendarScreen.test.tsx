import React from 'react';
import { render } from '@testing-library/react-native';
import MonthlyCalendarScreen from '../../src/screens/MonthlyCalendarScreen';
import { RoutineService } from '../../src/services/RoutineService';
import { WorkoutService } from '../../src/services/WorkoutService';
import { AuthContext } from '../../src/context/AuthContext';

jest.mock('../../src/services/RoutineService', () => ({
    RoutineService: {
        getAllWeeklyRoutines: jest.fn().mockResolvedValue({ data: [], error: null }),
        getUserRoutines: jest.fn().mockResolvedValue({ data: [], error: null }),
        getWorkoutsForDateRange: jest.fn().mockResolvedValue({ data: [], error: null }),
    },
}));

jest.mock('../../src/services/WorkoutService', () => ({
    WorkoutService: {
        getWorkoutsForMonth: jest.fn().mockResolvedValue({ data: [], error: null }),
    },
}));

describe('MonthlyCalendarScreen Component (RNTL)', () => {
    const mockNavigation = { navigate: jest.fn(), addListener: jest.fn(() => jest.fn()) } as any;

    beforeEach(() => {
        jest.clearAllMocks();
        (RoutineService.getAllWeeklyRoutines as jest.Mock).mockResolvedValue({
            data: [{ id: 'r1', nombre: 'Torso Pierna', activa: true }],
            error: null,
        });
        (RoutineService.getUserRoutines as jest.Mock).mockResolvedValue({
            data: [{ id: 'r1', nombre: 'Torso Pierna', activa: true }],
            error: null,
        });
        (RoutineService.getWorkoutsForDateRange as jest.Mock).mockResolvedValue({
            data: [],
            error: null,
        });
        (WorkoutService.getWorkoutsForMonth as jest.Mock).mockResolvedValue({
            data: [],
            error: null,
        });
    });

    it('renders monthly calendar screen header and legend items', async () => {
        const { findByText } = await render(
            <AuthContext.Provider value={{ user: { id: 'user-1' } } as any}>
                <MonthlyCalendarScreen navigation={mockNavigation} />
            </AuthContext.Provider>
        );

        expect(await findByText('Hoy')).toBeTruthy();
        expect(await findByText('Completado')).toBeTruthy();
    });
});
