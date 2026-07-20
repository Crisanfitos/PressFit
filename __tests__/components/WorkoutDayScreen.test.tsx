import React from 'react';
import { render } from '@testing-library/react-native';
import WorkoutDayScreen from '../../src/screens/WorkoutDayScreen';
import { RoutineService } from '../../src/services/RoutineService';
import { WorkoutService } from '../../src/services/WorkoutService';

jest.mock('../../src/services/RoutineService', () => ({
    RoutineService: {
        getAllWeeklyRoutines: jest.fn().mockResolvedValue({ data: [], error: null }),
        getRoutineDayByDate: jest.fn().mockResolvedValue({ data: null, error: null }),
        getWorkoutStatsForRoutineDay: jest.fn().mockResolvedValue({ data: null, error: null }),
    },
}));

jest.mock('../../src/services/WorkoutService', () => ({
    WorkoutService: {
        getActiveWorkout: jest.fn().mockResolvedValue({ data: null, error: null }),
    },
}));

describe('WorkoutDayScreen Component (RNTL)', () => {
    const mockNavigation = { navigate: jest.fn(), addListener: jest.fn(() => jest.fn()) } as any;
    const mockRoute = {
        params: {
            date: '2026-01-15',
            routineId: 'r-1',
            isToday: true,
        },
    } as any;

    beforeEach(() => {
        jest.clearAllMocks();
        (RoutineService.getRoutineDayByDate as jest.Mock).mockResolvedValue({
            data: {
                id: 'day-1',
                nombre_dia: 'Pierna Completa',
                descripcion_dia: 'Enfoque en cuádriceps e isquios',
                dia_semana: 4,
            },
            error: null,
        });
        (RoutineService.getWorkoutStatsForRoutineDay as jest.Mock).mockResolvedValue({
            data: { isCompleted: false },
            error: null,
        });
        (WorkoutService.getActiveWorkout as jest.Mock).mockResolvedValue({
            data: null,
            error: null,
        });
    });

    it('renders workout day status text', async () => {
        const { findByText } = await render(
            <WorkoutDayScreen navigation={mockNavigation} route={mockRoute} />
        );

        expect(await findByText('Sin entrenar')).toBeTruthy();
    });
});
