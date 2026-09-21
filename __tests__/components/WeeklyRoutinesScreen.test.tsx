import React from 'react';
import { render } from '@testing-library/react-native';
import WeeklyRoutinesScreen from '../../src/screens/WeeklyRoutinesScreen';
import { AuthContext } from '../../src/context/AuthContext';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { RoutineService } from '../../src/services/RoutineService';

jest.mock('../../src/services/RoutineService', () => ({
    RoutineService: {
        getAllWeeklyRoutines: jest.fn().mockResolvedValue({
            data: [{ id: 'r1', nombre: 'Hipertrofia 4 Días', activa: true }],
            error: null,
        }),
        getWeeklyRoutineWithDays: jest.fn().mockResolvedValue({
            data: { id: 'r1', nombre: 'Hipertrofia 4 Días', rutinas_diarias: [] },
            error: null,
        }),
        getWorkoutsForDateRange: jest.fn().mockResolvedValue({ data: [], error: null }),
    },
}));

describe('WeeklyRoutinesScreen Component (RNTL)', () => {
    it('renders Mis Rutinas title and weekly plan sections', async () => {
        const { findByText } = await render(
            <AuthContext.Provider value={{ user: { id: 'u1' } } as any}>
                <ThemeProvider>
                    <WeeklyRoutinesScreen navigation={{ navigate: jest.fn() }} />
                </ThemeProvider>
            </AuthContext.Provider>
        );

        expect(await findByText('Mis Rutinas')).toBeTruthy();
        expect(await findByText('Rutinas de la Semana')).toBeTruthy();
    });
});

