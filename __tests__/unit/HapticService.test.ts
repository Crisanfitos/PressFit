import * as Haptics from 'expo-haptics';
import { HapticService } from '../../src/services/HapticService';

describe('HapticService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Basic Feedback Methods', () => {
        it('triggers light impact feedback', async () => {
            await HapticService.light();
            expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
        });

        it('triggers medium impact feedback', async () => {
            await HapticService.medium();
            expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
        });

        it('triggers heavy impact feedback', async () => {
            await HapticService.heavy();
            expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
        });

        it('triggers selection feedback', async () => {
            await HapticService.selection();
            expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
        });

        it('triggers success notification feedback', async () => {
            await HapticService.success();
            expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
        });

        it('triggers warning notification feedback', async () => {
            await HapticService.warning();
            expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Warning);
        });

        it('triggers error notification feedback', async () => {
            await HapticService.error();
            expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Error);
        });
    });

    describe('Semantic Feedback Methods', () => {
        it('triggers setCompleted feedback using light impact', async () => {
            const lightSpy = jest.spyOn(HapticService, 'light');
            await HapticService.setCompleted();
            expect(lightSpy).toHaveBeenCalled();
            expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
        });

        it('triggers timerFinished feedback using success notification', async () => {
            const successSpy = jest.spyOn(HapticService, 'success');
            await HapticService.timerFinished();
            expect(successSpy).toHaveBeenCalled();
            expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
        });
    });

    describe('Error Resilience', () => {
        it('gracefully handles error in light() without throwing', async () => {
            (Haptics.impactAsync as jest.Mock).mockRejectedValueOnce(new Error('Hardware unsupported'));
            await expect(HapticService.light()).resolves.toBeUndefined();
        });

        it('gracefully handles error in medium() without throwing', async () => {
            (Haptics.impactAsync as jest.Mock).mockRejectedValueOnce(new Error('Hardware unsupported'));
            await expect(HapticService.medium()).resolves.toBeUndefined();
        });

        it('gracefully handles error in heavy() without throwing', async () => {
            (Haptics.impactAsync as jest.Mock).mockRejectedValueOnce(new Error('Hardware unsupported'));
            await expect(HapticService.heavy()).resolves.toBeUndefined();
        });

        it('gracefully handles error in selection() without throwing', async () => {
            (Haptics.selectionAsync as jest.Mock).mockRejectedValueOnce(new Error('Hardware unsupported'));
            await expect(HapticService.selection()).resolves.toBeUndefined();
        });

        it('gracefully handles error in success() without throwing', async () => {
            (Haptics.notificationAsync as jest.Mock).mockRejectedValueOnce(new Error('Hardware unsupported'));
            await expect(HapticService.success()).resolves.toBeUndefined();
        });

        it('gracefully handles error in warning() without throwing', async () => {
            (Haptics.notificationAsync as jest.Mock).mockRejectedValueOnce(new Error('Hardware unsupported'));
            await expect(HapticService.warning()).resolves.toBeUndefined();
        });

        it('gracefully handles error in error() without throwing', async () => {
            (Haptics.notificationAsync as jest.Mock).mockRejectedValueOnce(new Error('Hardware unsupported'));
            await expect(HapticService.error()).resolves.toBeUndefined();
        });
    });
});
