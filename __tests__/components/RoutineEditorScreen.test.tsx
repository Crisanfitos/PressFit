import React from 'react';
import { render } from '@testing-library/react-native';
import RoutineEditorScreen from '../../src/screens/RoutineEditorScreen';
import { RoutineService } from '../../src/services/RoutineService';
import { AuthContext } from '../../src/context/AuthContext';

jest.mock('../../src/services/RoutineService', () => ({
    RoutineService: {
        getAllWeeklyRoutines: jest.fn(),
    },
}));

describe('RoutineEditorScreen Component (RNTL)', () => {
    const mockNavigation = { navigate: jest.fn(), addListener: jest.fn(() => jest.fn()) } as any;

    beforeEach(() => {
        jest.clearAllMocks();
        (RoutineService.getAllWeeklyRoutines as jest.Mock).mockResolvedValue({
            data: [
                { id: 'r1', nombre: 'Rutina Torso-Pierna', activa: true },
            ],
            error: null,
        });
    });

    it('renders routine editor title and routine list', async () => {
        const { findByText } = await render(
            <AuthContext.Provider value={{ user: { id: 'u1' } } as any}>
                <RoutineEditorScreen navigation={mockNavigation} />
            </AuthContext.Provider>
        );

        expect(await findByText('Mis Plantillas')).toBeTruthy();
        expect(await findByText('Rutina Torso-Pierna')).toBeTruthy();
    });
});
