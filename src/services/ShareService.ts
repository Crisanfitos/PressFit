import { Share, Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { SocialCardData } from '../components/social';
import { formatDuration, formatVolume } from '../components/social/SocialCardCanvas.styles';

export interface CaptureOptions {
    format?: 'png' | 'jpg';
    quality?: number;
    result?: 'tmpfile' | 'base64' | 'data-uri';
}

export interface ShareOptions {
    title?: string;
    message?: string;
    imageUri?: string | null;
    data?: SocialCardData;
}

export interface ShareResult {
    success: boolean;
    action?: string;
    imageUri?: string | null;
    error?: string;
}

/**
 * ShareService
 *
 * Provides native view capture (react-native-view-shot) and OS sharing (Share.share)
 * for workout summary achievements and PR cards.
 * PF-163
 */
export class ShareService {
    /**
     * Builds a clean, formatted text message from workout social card data.
     */
    static buildShareMessage(data: SocialCardData): string {
        const parts: string[] = [];
        parts.push('¡Entrenamiento completado con PressFit! 🏋️‍♂️');

        const duration = data.durationMinutes ?? data.duration;
        if (duration !== null && duration !== undefined && duration > 0) {
            parts.push(`⏱️ Duración: ${formatDuration(duration)}`);
        }

        const volume = data.totalVolumeKg ?? data.totalVolume;
        if (volume !== undefined && volume > 0) {
            parts.push(`⚡ Volumen total: ${formatVolume(volume)}`);
        }

        const sets = data.completedSets ?? data.totalSets;
        if (sets !== undefined && sets > 0) {
            parts.push(`📊 Series completadas: ${sets}`);
        }

        if (data.totalReps !== undefined && data.totalReps > 0) {
            parts.push(`🔁 Repeticiones: ${data.totalReps}`);
        }

        const prList = data.prs ?? data.personalRecords;
        if (prList && prList.length > 0) {
            parts.push('\n🏆 ¡Nuevos Récords Personales (PR)!');
            prList.forEach((pr) => {
                const repStr = pr.reps ? ` x ${pr.reps} reps` : '';
                parts.push(`  • ${pr.exerciseName}: ${pr.weight} kg${repStr}`);
            });
        }

        parts.push('\n#PressFit #Workout #Fitness');
        return parts.join('\n');
    }

    /**
     * Captures a rendered component ref into an image file URI.
     * Returns the URI of the temporary file generated.
     */
    static async captureCard(
        viewRef: React.RefObject<any>,
        options?: CaptureOptions
    ): Promise<string | null> {
        if (!viewRef || !viewRef.current) {
            console.warn('[ShareService] captureCard called without a valid viewRef');
            return null;
        }

        try {
            const uri = await captureRef(viewRef, {
                format: options?.format || 'png',
                quality: options?.quality ?? 1.0,
                result: options?.result || 'tmpfile',
            });
            return uri;
        } catch (error: any) {
            console.error('[ShareService] Error capturing card view:', error);
            return null;
        }
    }

    /**
     * Opens the native share dialog with an image URI and/or text message.
     */
    static async share(options: ShareOptions): Promise<ShareResult> {
        try {
            let message = options.message;
            if (!message && options.data) {
                message = this.buildShareMessage(options.data);
            }

            const sharePayload: { message?: string; url?: string; title?: string } = {};

            if (message) {
                sharePayload.message = message;
            }

            if (options.title) {
                sharePayload.title = options.title;
            }

            if (options.imageUri) {
                sharePayload.url = options.imageUri;
            }

            if (!sharePayload.message && !sharePayload.url) {
                sharePayload.message = '¡Entrenamiento completado con PressFit!';
            }

            const result = await Share.share(sharePayload, {
                dialogTitle: options.title || 'Compartir entrenamiento',
            });

            if (result.action === Share.sharedAction) {
                return {
                    success: true,
                    action: result.action,
                    imageUri: options.imageUri || null,
                };
            } else if (result.action === Share.dismissedAction) {
                return {
                    success: false,
                    action: result.action,
                    imageUri: options.imageUri || null,
                };
            }

            return {
                success: true,
                action: result.action,
                imageUri: options.imageUri || null,
            };
        } catch (error: any) {
            console.error('[ShareService] Error sharing workout:', error);
            return {
                success: false,
                error: error.message || 'Error desconocido al compartir',
                imageUri: options.imageUri || null,
            };
        }
    }

    /**
     * Combined convenience method: captures view ref and immediately opens share sheet.
     */
    static async captureAndShare(
        viewRef: React.RefObject<any>,
        options?: { data?: SocialCardData; title?: string; captureOptions?: CaptureOptions }
    ): Promise<ShareResult> {
        let imageUri: string | null = null;
        if (viewRef && viewRef.current) {
            imageUri = await this.captureCard(viewRef, options?.captureOptions);
        }

        return this.share({
            imageUri,
            data: options?.data,
            title: options?.title || 'Mi Entrenamiento en PressFit',
        });
    }
}
