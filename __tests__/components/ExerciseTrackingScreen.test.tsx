import React from 'react';
import { render } from '@testing-library/react-native';
import ExerciseTrackingScreen from '../../src/screens/ExerciseTrackingScreen';
import { ExerciseService } from '../../src/services/ExerciseService';
import { AuthContext } from '../../src/context/AuthContext';

jest.mock('../../src/services/ExerciseService');

describe('ExerciseTrackingScreen Component (RNTL)', () => {
    const mockNavigation = { navigate: jest.fn() } as any;

    beforeEach(() => {
        jest.clearAllMocks();
        (ExerciseService.getUserExercisesWithProgress as jest.Mock).mockResolvedValue({
            data: [
                { id: 'ex-1', titulo: 'Press Militar' },
            ],
            error: null,
        });
    });

    it('renders exercise tracking title and exercise list', async () => {
        const { findByText } = await render(
            <AuthContext.Provider value={{ user: { id: 'user-1' } } as any}>
                <ExerciseTrackingScreen navigation={mockNavigation} />
            </AuthContext.Provider>
        );

        expect(await findByText('Progreso por Ejercicio')).toBeTruthy();
        expect(await findByText('Press Militar')).toBeTruthy();
    });
});
