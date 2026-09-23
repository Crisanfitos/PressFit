import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
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
    });

    it('renders CalendarLegend only in monthly viewMode and hides it in weekly viewMode (PF-400)', async () => {
        const { findByTestId, queryByTestId, findByText } = await render(
            <AuthContext.Provider value={{ user: { id: 'user-1' } } as any}>
                <MonthlyCalendarScreen navigation={mockNavigation} />
            </AuthContext.Provider>
        );

        // Initially in weekly viewMode: legend should NOT be present
        expect(queryByTestId('status-legend')).toBeNull();

        // Switch to monthly viewMode
        const monthlyToggle = await findByTestId('toggle-monthly-view');
        fireEvent.press(monthlyToggle);

        // Now in monthly viewMode: legend should be present
        expect(await findByTestId('status-legend')).toBeTruthy();
        expect(await findByText('Hoy')).toBeTruthy();
        expect(await findByText('Completado')).toBeTruthy();

        // Switch back to weekly viewMode
        const weeklyToggle = await findByTestId('toggle-weekly-view');
        fireEvent.press(weeklyToggle);

        // Legend should be hidden again
        await waitFor(() => {
            expect(queryByTestId('status-legend')).toBeNull();
        });
    });
});
