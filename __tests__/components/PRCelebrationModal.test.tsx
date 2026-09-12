import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react-native';
import { PRCelebrationModal } from '../../src/components/workout/PRCelebrationModal';
import { BrokenPRDetail } from '../../src/services/PersonalRecordService';
import { HapticService } from '../../src/services/HapticService';

jest.mock('../../src/services/HapticService', () => ({
    HapticService: {
        selection: jest.fn(),
        heavy: jest.fn(),
        success: jest.fn(),
        prCelebration: jest.fn(),
    },
}));

const mockColors = {
    surface: '#1e293b',
    surfaceHighlight: '#334155',
    text: '#ffffff',
    textSecondary: '#94a3b8',
    primary: '#f59e0b',
    border: '#475569',
};

const sampleBrokenPRs: BrokenPRDetail[] = [
    {
        type: 'weight',
        previousValue: 95,
        newValue: 100,
        label: '¡Nuevo Peso Máximo: 100 kg!',
    },
    {
        type: 'volume',
        previousValue: 800,
        newValue: 1000,
        label: '¡Nuevo Tonelaje de Serie: 1000 kg!',
    },
    {
        type: '1rm',
        previousValue: 108,
        newValue: 115.4,
        label: '¡Nuevo 1RM Estimado: 115.4 kg!',
    },
];

describe('PRCelebrationModal Component (PF-318)', () => {
    const mockOnClose = jest.fn();
    const mockOnShare = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('renders null when visible is false', async () => {
        const { queryByTestId } = await render(
            <PRCelebrationModal
                visible={false}
                exerciseName="Press de Banca"
                brokenPRs={sampleBrokenPRs}
                onClose={mockOnClose}
                colors={mockColors}
            />
        );

        expect(queryByTestId('pr-celebration-modal')).toBeNull();
    });

    it('renders celebratory modal with title, exercise name and all broken PRs when visible is true', async () => {
        const { getByTestId, getByText } = await render(
            <PRCelebrationModal
                visible={true}
                exerciseName="Press de Banca"
                brokenPRs={sampleBrokenPRs}
                onClose={mockOnClose}
                colors={mockColors}
            />
        );

        expect(getByTestId('pr-celebration-modal')).toBeTruthy();
        expect(getByText('¡NUEVO RÉCORD PERSONAL!')).toBeTruthy();
        expect(getByText('Press de Banca')).toBeTruthy();
        expect(getByText('100 kg')).toBeTruthy();
        expect(getByText('+5 kg (antes 95 kg)')).toBeTruthy();
        expect(getByText('1000 kg')).toBeTruthy();
        expect(getByText('+200 kg (antes 800 kg)')).toBeTruthy();
        expect(getByText('115.4 kg')).toBeTruthy();
        expect(getByText('+7.4 kg (antes 108 kg)')).toBeTruthy();
    });

    it('triggers onClose and haptic feedback when pressing continue button', async () => {
        const { getByTestId } = await render(
            <PRCelebrationModal
                visible={true}
                exerciseName="Sentadilla Libre"
                brokenPRs={sampleBrokenPRs}
                onClose={mockOnClose}
                colors={mockColors}
            />
        );

        const continueBtn = getByTestId('pr-modal-continue-button');
        fireEvent.press(continueBtn);

        expect(HapticService.selection).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('triggers onShare and haptic feedback when share button is clicked', async () => {
        const { getByTestId } = await render(
            <PRCelebrationModal
                visible={true}
                exerciseName="Sentadilla Libre"
                brokenPRs={sampleBrokenPRs}
                onClose={mockOnClose}
                onShare={mockOnShare}
                colors={mockColors}
            />
        );

        const shareBtn = getByTestId('pr-modal-share-button');
        fireEvent.press(shareBtn);

        expect(HapticService.selection).toHaveBeenCalled();
        expect(mockOnShare).toHaveBeenCalledTimes(1);
    });
});
