import React from 'react';
import { render } from '@testing-library/react-native';
import ExerciseDetailScreen from '../../src/screens/ExerciseDetailScreen';
import { useExerciseDetailController } from '../../src/controllers/useExerciseDetailController';
import { PersonalRecordService } from '../../src/services/PersonalRecordService';

jest.mock('../../src/controllers/useExerciseDetailController');
jest.mock('../../src/services/ExerciseService', () => ({
    ExerciseService: {
        deleteCustomExercise: jest.fn().mockResolvedValue({ data: true, error: null }),
    },
}));
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

    it('renders edit-custom-exercise-button when es_propietario is true and opens modal (PF-249)', async () => {
        const { fireEvent } = require('@testing-library/react-native');

        mockUseExerciseDetailController.mockReturnValue({
            exercise: {
                id: 'ex-custom-owner',
                titulo: 'Remo Gironda Custom',
                grupo_muscular: 'espalda',
                es_propietario: true,
                is_custom: true,
                es_oficial: false,
            },
            loading: false,
            refetch: jest.fn(),
        } as any);

        const { getByTestId } = await render(
            <ExerciseDetailScreen navigation={mockNavigation} route={mockRoute} />
        );

        const editBtn = getByTestId('edit-custom-exercise-button');
        expect(editBtn).toBeTruthy();

        const { act, waitFor } = require('@testing-library/react-native');
        await act(async () => {
            fireEvent.press(editBtn);
        });

        await waitFor(() => {
            expect(getByTestId('edit-custom-exercise-modal')).toBeTruthy();
        });
    });


    it('does NOT render edit-custom-exercise-button when exercise is official or not owned (PF-249)', async () => {
        mockUseExerciseDetailController.mockReturnValue({
            exercise: {
                id: 'ex-official',
                titulo: 'Dominadas Oficiales',
                grupo_muscular: 'espalda',
                es_propietario: false,
                is_custom: false,
                es_oficial: true,
            },
            loading: false,
            refetch: jest.fn(),
        } as any);

        const { queryByTestId } = await render(
            <ExerciseDetailScreen navigation={mockNavigation} route={mockRoute} />
        );

        expect(queryByTestId('edit-custom-exercise-button')).toBeNull();
    });

    it('renders delete-custom-exercise-button when es_propietario is true, opens modal, and confirms deletion (PF-250)', async () => {
        const { fireEvent, act, waitFor } = require('@testing-library/react-native');
        const { ExerciseService } = require('../../src/services/ExerciseService');

        mockUseExerciseDetailController.mockReturnValue({
            exercise: {
                id: 'ex-custom-del',
                titulo: 'Press Personalizado a Borrar',
                grupo_muscular: 'pecho',
                es_propietario: true,
                is_custom: true,
                es_oficial: false,
            },
            loading: false,
            refetch: jest.fn(),
        } as any);

        const { getByTestId } = await render(
            <ExerciseDetailScreen navigation={mockNavigation} route={mockRoute} />
        );

        const deleteBtn = getByTestId('delete-custom-exercise-button');
        expect(deleteBtn).toBeTruthy();

        await act(async () => {
            fireEvent.press(deleteBtn);
        });

        await waitFor(() => {
            expect(getByTestId('delete-custom-exercise-modal')).toBeTruthy();
        });

        const confirmBtn = getByTestId('delete-custom-exercise-confirm-button');
        await act(async () => {
            fireEvent.press(confirmBtn);
        });

        expect(ExerciseService.deleteCustomExercise).toHaveBeenCalledWith('ex-custom-del');
        expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it('does NOT render delete-custom-exercise-button when exercise is official or not owned (PF-250)', async () => {
        mockUseExerciseDetailController.mockReturnValue({
            exercise: {
                id: 'ex-official-del',
                titulo: 'Press Oficial',
                grupo_muscular: 'pecho',
                es_propietario: false,
                is_custom: false,
                es_oficial: true,
            },
            loading: false,
            refetch: jest.fn(),
        } as any);

        const { queryByTestId } = await render(
            <ExerciseDetailScreen navigation={mockNavigation} route={mockRoute} />
        );

        expect(queryByTestId('delete-custom-exercise-button')).toBeNull();
    });
});

