import React from 'react';
import { render } from '@testing-library/react-native';
import ExerciseDetailScreen from '../../src/screens/ExerciseDetailScreen';
import { useExerciseDetailController } from '../../src/controllers/useExerciseDetailController';
import { PersonalRecordService } from '../../src/services/PersonalRecordService';

jest.mock('../../src/controllers/useExerciseDetailController');
jest.mock('../../src/services/PersonalRecordService', () => ({
    PersonalRecordService: {
        getPersonalRecord: jest.fn().mockResolvedValue({ data: null, error: null }),
        getExerciseHistory: jest.fn().mockResolvedValue({ data: [], error: null }),
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

        (PersonalRecordService.getPersonalRecord as jest.Mock).mockResolvedValue({
            data: null,
            error: null,
        });
        (PersonalRecordService.getExerciseHistory as jest.Mock).mockResolvedValue({
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

    it('renders YouTube button and opens YouTube when exercise has video_url (PF-248)', async () => {
        const { Linking } = require('react-native');
        jest.spyOn(Linking, 'openURL').mockImplementation(() => Promise.resolve());

        mockUseExerciseDetailController.mockReturnValue({
            exercise: {
                id: 'ex-custom-1',
                titulo: 'Elevaciones Laterales Pesadas',
                grupo_muscular: 'hombros',
                video_url: 'https://youtu.be/dQw4w9WgXcQ',
            },
            loading: false,
        } as any);

        const { getByText } = await render(
            <ExerciseDetailScreen navigation={mockNavigation} route={mockRoute} />
        );

        const youtubeBtn = getByText('Ver Video en YouTube');
        expect(youtubeBtn).toBeTruthy();

        const { fireEvent } = require('@testing-library/react-native');
        fireEvent.press(youtubeBtn);

        expect(Linking.openURL).toHaveBeenCalledWith('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });
});
