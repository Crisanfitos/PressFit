import React from 'react';
import { render } from '@testing-library/react-native';
import ExerciseDetailScreen from '../../src/screens/ExerciseDetailScreen';
import { useExerciseDetailController } from '../../src/controllers/useExerciseDetailController';
import { PersonalRecordService } from '../../src/services/PersonalRecordService';

jest.mock('../../src/controllers/useExerciseDetailController');
jest.mock('../../src/services/PersonalRecordService', () => ({
    PersonalRecordService: {
        getExerciseRecords: jest.fn().mockResolvedValue({ data: [], error: null }),
    },
}));

const mockUseExerciseDetailController = useExerciseDetailController as jest.MockedFunction<typeof useExerciseDetailController>;

describe('ExerciseDetailScreen Component (RNTL)', () => {
    const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() } as any;
    const mockRoute = { params: { exerciseId: 'ex-1' } } as any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseExerciseDetailController.mockReturnValue({
            exercise: {
                id: 'ex-1',
                titulo: 'Press de Banca',
                grupo_muscular: 'pecho',
                instrucciones: 'Acuéstate en el banco y empuja la barra',
            },
            loading: false,
        } as any);

        (PersonalRecordService.getExerciseRecords as jest.Mock).mockResolvedValue({
            data: [],
            error: null,
        });
    });

    it('renders exercise details and title', async () => {
        const { getByText } = await render(
            <ExerciseDetailScreen navigation={mockNavigation} route={mockRoute} />
        );

        expect(getByText('Press de Banca')).toBeTruthy();
    });
});
