import React from 'react';
import { render } from '@testing-library/react-native';
import RoutineDetailScreen from '../../src/screens/RoutineDetailScreen';
import { RoutineService } from '../../src/services/RoutineService';

jest.mock('../../src/services/RoutineService');

describe('RoutineDetailScreen Component (RNTL)', () => {
    const mockNavigation = { navigate: jest.fn(), addListener: jest.fn(() => jest.fn()) } as any;
    const mockRoute = { params: { routineId: 'routine-101' } } as any;

    beforeEach(() => {
        jest.clearAllMocks();
        (RoutineService.getWeeklyRoutineWithDays as jest.Mock).mockResolvedValue({
            data: {
                id: 'routine-101',
                nombre: 'Rutina Hipertrofia',
                activa: true,
                rutinas_diarias: [
                    { id: 'd-1', dia_semana: 1, nombre_dia: 'Día 1: Pecho', ejercicios: [] },
                ],
            },
            error: null,
        });
    });

    it('renders routine detail title and routine name', async () => {
        const { findByText } = await render(
            <RoutineDetailScreen navigation={mockNavigation} route={mockRoute} />
        );

        expect(await findByText('Rutina Hipertrofia')).toBeTruthy();
        expect(await findByText('Lunes')).toBeTruthy();
    });
});
