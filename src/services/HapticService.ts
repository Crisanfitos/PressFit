import * as Haptics from 'expo-haptics';

/**
 * HapticService
 * Centralized service for providing haptic feedback wrapping expo-haptics.
 * All methods are fail-safe and safely handle unsupported platforms/errors.
 */
export const HapticService = {
    /**
     * Trigger light impact feedback.
     */
    async light(): Promise<void> {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            // Silently ignore errors on unsupported platforms/devices
        }
    },

    /**
     * Trigger medium impact feedback.
     */
    async medium(): Promise<void> {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {
            // Silently ignore errors on unsupported platforms/devices
        }
    },

    /**
     * Trigger heavy impact feedback.
     */
    async heavy(): Promise<void> {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } catch (error) {
            // Silently ignore errors on unsupported platforms/devices
        }
    },

    /**
     * Trigger selection change feedback.
     */
    async selection(): Promise<void> {
        try {
            await Haptics.selectionAsync();
        } catch (error) {
            // Silently ignore errors on unsupported platforms/devices
        }
    },

    /**
     * Trigger success notification feedback.
     */
    async success(): Promise<void> {
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            // Silently ignore errors on unsupported platforms/devices
        }
    },

    /**
     * Trigger warning notification feedback.
     */
    async warning(): Promise<void> {
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch (error) {
            // Silently ignore errors on unsupported platforms/devices
        }
    },

    /**
     * Trigger error notification feedback.
     */
    async error(): Promise<void> {
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (error) {
            // Silently ignore errors on unsupported platforms/devices
        }
    },

    /**
     * Semantic action: Trigger soft vibration when marking a set as completed.
     */
    async setCompleted(): Promise<void> {
        await this.light();
    },

    /**
     * Semantic action: Trigger vibration pattern when the rest timer concludes or is confirmed.
     */
    async timerFinished(): Promise<void> {
        await this.success();
    },
};

export default HapticService;
