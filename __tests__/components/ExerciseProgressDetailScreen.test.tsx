import React from 'react';
import { render } from '@testing-library/react-native';
import ExerciseProgressDetailScreen from '../../src/screens/ExerciseProgressDetailScreen';
import { ExerciseService } from '../../src/services/ExerciseService';
import { WorkoutService } from '../../src/services/WorkoutService';
import { AuthContext } from '../../src/context/AuthContext';

jest.mock('../../src/services/ExerciseService', () => ({
    ExerciseService: {
        getExerciseById: jest.fn().mockResolvedValue({ data: { id: 'ex-101', titulo: 'Curl de Bíceps' }, error: null }),
    },
}));

jest.mock('../../src/services/WorkoutService', () => ({
    WorkoutService: {
        getExerciseSeriesHistory: jest.fn().mockResolvedValue({ data: [], error: null }),
        getExerciseHistory: jest.fn().mockResolvedValue({ data: [], error: null }),
    },
}));

describe('ExerciseProgressDetailScreen Component (RNTL)', () => {
    const mockNavigation = { navigate: jest.fn(), goBack: jest.fn(), addListener: jest.fn(() => jest.fn()) } as any;
    const mockRoute = { params: { exerciseId: 'ex-101' } } as any;

    beforeEach(() => {
        jest.clearAllMocks();
        (ExerciseService.getExerciseById as jest.Mock).mockResolvedValue({
            data: { id: 'ex-101', titulo: 'Curl de Bíceps' },
            error: null,
        });
        (WorkoutService.getExerciseSeriesHistory as jest.Mock).mockResolvedValue({
            data: [
                { id: 's1', numero_serie: 1, peso_utilizado: 14, repeticiones: 10, tipo_peso: 'total', fecha: '2026-01-01' },
            ],
            error: null,
        });
        (WorkoutService.getExerciseHistory as jest.Mock).mockResolvedValue({
            data: [],
            error: null,
        });
    });

    it('renders exercise progress detail screen header', async () => {
        const { findByText } = await render(
            <AuthContext.Provider value={{ user: { id: 'u1' } } as any}>
                <ExerciseProgressDetailScreen navigation={mockNavigation} route={mockRoute} />
            </AuthContext.Provider>
        );

        expect(await findByText('Curl de Bíceps')).toBeTruthy();
        expect(await findByText('Historial de Series')).toBeTruthy();
    });
});
