/**
 * Unit tests for ShareService.
 *
 * Tests message formatting, view-shot capture, and native sharing.
 * PF-163
 */

import { Share } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { ShareService } from '../../../src/services/ShareService';
import { SocialCardData } from '../../../src/components/social';
import { formatVolume } from '../../../src/components/social/SocialCardCanvas.styles';

describe('ShareService (PF-163)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('buildShareMessage', () => {
        const sampleData: SocialCardData = {
            durationMinutes: 75,
            totalVolumeKg: 12500,
            completedSets: 18,
            totalReps: 142,
            prs: [
                { exerciseName: 'Press de Banca', weight: 100, reps: 5 },
                { exerciseName: 'Sentadilla', weight: 140 },
            ],
            username: 'Alex',
        };

        it('includes header, duration, volume, sets and reps', () => {
            const msg = ShareService.buildShareMessage(sampleData);
            expect(msg).toContain('¡Entrenamiento completado con PressFit!');
            expect(msg).toContain('1h 15m');
            expect(msg).toContain(formatVolume(12500));
            expect(msg).toContain('18');
            expect(msg).toContain('142');
        });

        it('includes PR records when present', () => {
            const msg = ShareService.buildShareMessage(sampleData);
            expect(msg).toContain('Récords Personales');
            expect(msg).toContain('Press de Banca: 100 kg x 5 reps');
            expect(msg).toContain('Sentadilla: 140 kg');
        });

        it('formats correctly without PRs', () => {
            const dataWithoutPRs: SocialCardData = {
                durationMinutes: 45,
                totalVolumeKg: 5000,
                completedSets: 10,
                totalReps: 80,
                prs: [],
            };
            const msg = ShareService.buildShareMessage(dataWithoutPRs);
            expect(msg).toContain('45m');
            expect(msg).toContain(formatVolume(5000));
            expect(msg).not.toContain('Récords Personales');
        });

        it('handles null duration gracefully', () => {
            const dataNullDuration: SocialCardData = {
                durationMinutes: null,
                totalVolumeKg: 3000,
                completedSets: 8,
                totalReps: 64,
            };
            const msg = ShareService.buildShareMessage(dataNullDuration);
            expect(msg).not.toContain('Duración');
            expect(msg).toContain(formatVolume(3000));
        });

        it('includes standard hashtag signature', () => {
            const msg = ShareService.buildShareMessage(sampleData);
            expect(msg).toContain('#PressFit');
        });
    });

    describe('captureCard', () => {
        it('returns null if viewRef is null or viewRef.current is null', async () => {
            const nullRef = { current: null };
            const res = await ShareService.captureCard(nullRef);
            expect(res).toBeNull();
            expect(captureRef).not.toHaveBeenCalled();
        });

        it('calls captureRef with default options and returns URI on success', async () => {
            (captureRef as jest.Mock).mockResolvedValueOnce('file:///tmp/card.png');
            const dummyRef = { current: {} };

            const uri = await ShareService.captureCard(dummyRef);
            expect(captureRef).toHaveBeenCalledWith(dummyRef, {
                format: 'png',
                quality: 1.0,
                result: 'tmpfile',
            });
            expect(uri).toBe('file:///tmp/card.png');
        });

        it('respects custom capture options', async () => {
            (captureRef as jest.Mock).mockResolvedValueOnce('file:///tmp/custom.jpg');
            const dummyRef = { current: {} };

            const uri = await ShareService.captureCard(dummyRef, {
                format: 'jpg',
                quality: 0.8,
                result: 'base64',
            });
            expect(captureRef).toHaveBeenCalledWith(dummyRef, {
                format: 'jpg',
                quality: 0.8,
                result: 'base64',
            });
            expect(uri).toBe('file:///tmp/custom.jpg');
        });

        it('returns null if captureRef throws an error', async () => {
            (captureRef as jest.Mock).mockRejectedValueOnce(new Error('Native capture failure'));
            const dummyRef = { current: {} };

            const uri = await ShareService.captureCard(dummyRef);
            expect(uri).toBeNull();
        });
    });

    describe('share', () => {
        it('calls Share.share with provided message and imageUri', async () => {
            const spyShare = jest.spyOn(Share, 'share').mockResolvedValueOnce({
                action: Share.sharedAction,
                activityType: 'com.apple.UIKit.activity.PostToTwitter',
            });

            const result = await ShareService.share({
                title: 'Mi Logro',
                message: 'Mensaje personalizado',
                imageUri: 'file:///tmp/test.png',
            });

            expect(spyShare).toHaveBeenCalledWith(
                {
                    title: 'Mi Logro',
                    message: 'Mensaje personalizado',
                    url: 'file:///tmp/test.png',
                },
                {
                    dialogTitle: 'Mi Logro',
                }
            );
            expect(result.success).toBe(true);
            expect(result.action).toBe(Share.sharedAction);
            expect(result.imageUri).toBe('file:///tmp/test.png');
        });

        it('auto-builds message from SocialCardData if message is not provided', async () => {
            const spyShare = jest.spyOn(Share, 'share').mockResolvedValueOnce({
                action: Share.sharedAction,
            });

            const data: SocialCardData = {
                durationMinutes: 50,
                totalVolumeKg: 8000,
                completedSets: 12,
                totalReps: 96,
            };

            const result = await ShareService.share({
                data,
            });

            expect(spyShare).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining(formatVolume(8000)),
                }),
                expect.any(Object)
            );
            expect(result.success).toBe(true);
        });

        it('returns success: false when user dismisses the dialog', async () => {
            jest.spyOn(Share, 'share').mockResolvedValueOnce({
                action: Share.dismissedAction,
            });

            const result = await ShareService.share({
                message: 'Entrenamiento cancelado',
            });

            expect(result.success).toBe(false);
            expect(result.action).toBe(Share.dismissedAction);
        });

        it('handles Share.share exception gracefully without throwing', async () => {
            jest.spyOn(Share, 'share').mockRejectedValueOnce(new Error('Share dialog failed'));

            const result = await ShareService.share({
                message: 'Test message',
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Share dialog failed');
        });
    });

    describe('captureAndShare', () => {
        it('captures the ref and immediately triggers share with the resulting URI', async () => {
            (captureRef as jest.Mock).mockResolvedValueOnce('file:///tmp/auto_captured.png');
            const spyShare = jest.spyOn(Share, 'share').mockResolvedValueOnce({
                action: Share.sharedAction,
            });

            const dummyRef = { current: {} };
            const data: SocialCardData = {
                durationMinutes: 60,
                totalVolumeKg: 10000,
                completedSets: 15,
                totalReps: 120,
            };

            const result = await ShareService.captureAndShare(dummyRef, { data });

            expect(captureRef).toHaveBeenCalled();
            expect(spyShare).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: 'file:///tmp/auto_captured.png',
                    message: expect.stringContaining(formatVolume(10000)),
                }),
                expect.any(Object)
            );
            expect(result.success).toBe(true);
            expect(result.imageUri).toBe('file:///tmp/auto_captured.png');
        });
    });
});
