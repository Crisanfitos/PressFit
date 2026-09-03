import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const TIMER_STORAGE_KEY = '@pressfit_rest_timer_start';
export const TIMER_PENDING_ACTION_KEY = '@pressfit_timer_action';
export const TIMER_PAUSED_ELAPSED_KEY = '@pressfit_timer_paused_elapsed';

export type TimerPendingAction = 'OK' | 'PAUSE' | 'DISCARD';

// Notification identifiers
export const TIMER_NOTIFICATION_ID_KEY = '@pressfit_timer_notif_id';
export const TIMER_NOTIFICATION_IDENTIFIER = 'pressfit_rest_timer_notif';
export const NOTIFICATION_CATEGORY_ID = 'REST_TIMER';
export const TIMER_CHANNEL_ID = 'pressfit_rest_timer';
export const TIMER_NOTIFICATION_COLOR = '#102218';
export const TIMER_NOTIFICATION_PAUSED_COLOR = '#eab308';

// Action identifiers
export const ACTION_OK = 'TIMER_OK';
export const ACTION_PAUSE = 'TIMER_PAUSE';
export const ACTION_DISCARD = 'TIMER_DISCARD';

// ─── Diagnostic Logger ───
export type TimerLogLevel = 'none' | 'error' | 'warn' | 'info' | 'debug';
let currentLogLevel: TimerLogLevel = 'info';

export function setTimerNotificationLogLevel(level: TimerLogLevel): void {
    currentLogLevel = level;
}

export function logTimerNotification(level: 'error' | 'warn' | 'info' | 'debug', message: string, ...args: any[]): void {
    const priority: Record<TimerLogLevel, number> = { none: 0, error: 1, warn: 2, info: 3, debug: 4 };
    if (priority[level] <= priority[currentLogLevel]) {
        if (level === 'error') console.error(`[TimerNotification] ${message}`, ...args);
        else if (level === 'warn') console.warn(`[TimerNotification] ${message}`, ...args);
        else if (level === 'debug') console.debug(`[TimerNotification] ${message}`, ...args);
        else console.log(`[TimerNotification] ${message}`, ...args);
    }
}

// ─── Foreground UI visibility flag ───
// When the RestTimer UI modal is open in foreground, banner alerts are suppressed.
// When RestTimer is not visible (e.g. minimized, user on another screen/tab), banner is allowed.
let isRestTimerUIVisible = false;

export function setRestTimerUIVisible(visible: boolean): void {
    isRestTimerUIVisible = visible;
    logTimerNotification('debug', `RestTimer UI visibility set to: ${visible}`);
}

export function isRestTimerUIVisibleState(): boolean {
    return isRestTimerUIVisible;
}

// ─── Foreground handler: conditional banner based on RestTimer UI visibility ───
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: !isRestTimerUIVisible,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

// ─── Android Notification Channel ───
export async function setupNotificationChannel(): Promise<void> {
    if (Platform.OS === 'android') {
        try {
            await Notifications.setNotificationChannelAsync(TIMER_CHANNEL_ID, {
                name: 'Temporizador de Descanso',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: TIMER_NOTIFICATION_COLOR,
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                bypassDnd: false,
                showBadge: false,
                enableLights: true,
                enableVibrate: false,
            });
            logTimerNotification('debug', 'Notification channel configured successfully');
        } catch (error) {
            logTimerNotification('warn', 'Failed to configure notification channel:', error);
        }
    }
}

export async function isNotificationChannelEnabled(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    try {
        const channel = await Notifications.getNotificationChannelAsync(TIMER_CHANNEL_ID);
        return channel !== null && channel.importance !== Notifications.AndroidImportance.NONE;
    } catch {
        return true;
    }
}

// ─── Register notification category with action buttons ───
// Button highlight/press ripple is handled automatically by the OS.
export async function setupNotificationCategory(): Promise<void> {
    await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORY_ID, [
        {
            identifier: ACTION_OK,
            buttonTitle: '✅ OK',
            options: { opensAppToForeground: false },
        },
        {
            identifier: ACTION_PAUSE,
            buttonTitle: '⏸ Pausar',
            options: { opensAppToForeground: false },
        },
        {
            identifier: ACTION_DISCARD,
            buttonTitle: '✕ Descartar',
            options: { opensAppToForeground: false },
        },
    ]);
}

// ─── Request permissions with retry capability ───
export async function requestNotificationPermissions(): Promise<boolean> {
    try {
        const { status: existingStatus, canAskAgain } = await Notifications.getPermissionsAsync();
        if (existingStatus === 'granted') return true;
        if (canAskAgain || existingStatus === 'undetermined') {
            const { status } = await Notifications.requestPermissionsAsync();
            return status === 'granted';
        }
        logTimerNotification('warn', 'Notification permissions denied and cannot ask again');
        return false;
    } catch (error) {
        logTimerNotification('error', 'Error requesting notification permissions:', error);
        return false;
    }
}

export async function getNotificationPermissionStatus(): Promise<Notifications.PermissionStatus> {
    try {
        const { status } = await Notifications.getPermissionsAsync();
        return status;
    } catch {
        return Notifications.PermissionStatus.UNDETERMINED;
    }
}

// ─── Format seconds as M:SS ───
export function formatTime(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ─── Platform Capabilities & Configuration (PF-286) ───
export interface NotificationPlatformConfig {
    platform: 'android' | 'ios' | 'default';
    supportsNativeChronometer: boolean;
    updateCadenceMs: number;
    channelId?: string;
    channelPriority: 'high' | 'default';
    isSticky: boolean;
    brandColor: string;
}

export function getNotificationPlatformConfig(): NotificationPlatformConfig {
    const isAndroid = Platform.OS === 'android';
    const isIOS = Platform.OS === 'ios';

    return {
        platform: isAndroid ? 'android' : isIOS ? 'ios' : 'default',
        supportsNativeChronometer: false, // expo-notifications does not expose Android chronometer API in JS
        updateCadenceMs: 1000,
        channelId: isAndroid ? TIMER_CHANNEL_ID : undefined,
        channelPriority: 'high',
        isSticky: isAndroid,
        brandColor: TIMER_NOTIFICATION_COLOR,
    };
}

export interface BuildTimerNotificationOptions {
    paused?: boolean;
}

export function buildTimerNotificationContent(
    elapsedSeconds: number,
    options?: BuildTimerNotificationOptions
): Notifications.NotificationContentInput {
    const isPaused = !!options?.paused;
    const config = getNotificationPlatformConfig();

    const content: Notifications.NotificationContentInput = {
        title: 'PressFit — Descanso en curso',
        body: isPaused ? '⏸ Pausado' : `⏱ ${formatTime(elapsedSeconds)}`,
        categoryIdentifier: NOTIFICATION_CATEGORY_ID,
        data: { type: 'REST_TIMER' },
        sticky: config.isSticky,
        autoDismiss: false,
        color: isPaused ? TIMER_NOTIFICATION_PAUSED_COLOR : config.brandColor,
        priority: config.channelPriority === 'high' ? 'high' : 'default',
    };

    if (Platform.OS === 'ios') {
        (content as any).interruptionLevel = 'active';
    }

    return content;
}

// ─── Schedule (or update) the timer notification ───
// Uses a stable identifier (TIMER_NOTIFICATION_IDENTIFIER) to update existing notification in-place.
// This eliminates visible flickering completely (no cancel+repost cycle needed) and provides real-time updates.
export async function scheduleTimerNotification(
    elapsedSeconds: number,
    options?: BuildTimerNotificationOptions
): Promise<string | null> {
    try {
        const previousId = await AsyncStorage.getItem(TIMER_NOTIFICATION_ID_KEY);
        const content = buildTimerNotificationContent(elapsedSeconds, options);

        const newId = await Notifications.scheduleNotificationAsync({
            identifier: TIMER_NOTIFICATION_IDENTIFIER,
            content,
            trigger: Platform.OS === 'android' ? { channelId: TIMER_CHANNEL_ID } : null,
        });

        await AsyncStorage.setItem(TIMER_NOTIFICATION_ID_KEY, newId);
        logTimerNotification('debug', `Scheduled/updated notification ${newId}, elapsed: ${elapsedSeconds}s`);

        // Clean up legacy notification only if a different ID was previously stored
        if (previousId && previousId !== newId && previousId !== TIMER_NOTIFICATION_IDENTIFIER) {
            await Notifications.dismissNotificationAsync(previousId).catch(() => { });
            await Notifications.cancelScheduledNotificationAsync(previousId).catch(() => { });
        }

        return newId;
    } catch (error) {
        logTimerNotification('warn', 'Failed to schedule:', error);
        return null;
    }
}

// ─── Cancel the active timer notification ───
export async function cancelTimerNotification(): Promise<void> {
    try {
        const id = await AsyncStorage.getItem(TIMER_NOTIFICATION_ID_KEY);
        const idsToCancel = new Set([TIMER_NOTIFICATION_IDENTIFIER]);
        if (id) idsToCancel.add(id);

        for (const notifId of idsToCancel) {
            await Notifications.dismissNotificationAsync(notifId).catch(() => { });
            await Notifications.cancelScheduledNotificationAsync(notifId).catch(() => { });
        }

        await AsyncStorage.removeItem(TIMER_NOTIFICATION_ID_KEY);
        logTimerNotification('debug', `Cancelled notification: ${Array.from(idsToCancel).join(', ')}`);
    } catch (error) {
        logTimerNotification('warn', 'Failed to cancel:', error);
    }
}

// ─── Get elapsed seconds from stored start timestamp (or frozen paused seconds) ───
export async function getElapsedSecondsFromStorage(): Promise<number> {
    try {
        const paused = await AsyncStorage.getItem(TIMER_PAUSED_ELAPSED_KEY);
        if (paused !== null) {
            return Math.max(0, parseInt(paused, 10) || 0);
        }
        const saved = await AsyncStorage.getItem(TIMER_STORAGE_KEY);
        if (saved) {
            return Math.max(0, Math.floor((Date.now() - parseInt(saved, 10)) / 1000));
        }
    } catch (_) { }
    return 0;
}

// ─── Check if a rest timer was active (survives app kill via AsyncStorage) ───
export async function checkActiveRestTimer(): Promise<{ active: boolean; elapsedSeconds: number; paused?: boolean }> {
    try {
        const pendingAction = await getPendingTimerAction();
        if (pendingAction === 'DISCARD') {
            return { active: false, elapsedSeconds: 0 };
        }
        const paused = await AsyncStorage.getItem(TIMER_PAUSED_ELAPSED_KEY);
        if (paused !== null) {
            return { active: true, elapsedSeconds: Math.max(0, parseInt(paused, 10) || 0), paused: true };
        }
        const saved = await AsyncStorage.getItem(TIMER_STORAGE_KEY);
        if (saved) {
            const elapsed = Math.max(0, Math.floor((Date.now() - parseInt(saved, 10)) / 1000));
            return { active: true, elapsedSeconds: elapsed, paused: false };
        }
    } catch (_) { }
    return { active: false, elapsedSeconds: 0 };
}

// ─── Push Notification Action Persistence & Handlers (PF-284) ───

export async function setPendingTimerAction(action: TimerPendingAction): Promise<void> {
    try {
        await AsyncStorage.setItem(TIMER_PENDING_ACTION_KEY, action);
        logTimerNotification('debug', `Set pending timer action: ${action}`);
    } catch (error) {
        logTimerNotification('warn', 'Failed to set pending timer action:', error);
    }
}

export async function getPendingTimerAction(): Promise<TimerPendingAction | null> {
    try {
        const action = await AsyncStorage.getItem(TIMER_PENDING_ACTION_KEY);
        if (action === 'OK' || action === 'PAUSE' || action === 'DISCARD') {
            return action as TimerPendingAction;
        }
    } catch (error) {
        logTimerNotification('warn', 'Failed to get pending timer action:', error);
    }
    return null;
}

export async function clearPendingTimerAction(): Promise<void> {
    try {
        await AsyncStorage.removeItem(TIMER_PENDING_ACTION_KEY);
        logTimerNotification('debug', 'Cleared pending timer action');
    } catch (error) {
        logTimerNotification('warn', 'Failed to clear pending timer action:', error);
    }
}

/**
 * Executes immediate side effects for push notification actions.
 * Guarantees that state is persisted in AsyncStorage even if React components are unmounted.
 */
export async function handleNotificationAction(actionId: string): Promise<TimerPendingAction | null> {
    logTimerNotification('info', `Handling notification action: ${actionId}`);
    try {
        if (actionId === ACTION_OK) {
            const elapsed = await getElapsedSecondsFromStorage();
            await setPendingTimerAction('OK');
            await AsyncStorage.setItem(TIMER_PAUSED_ELAPSED_KEY, String(elapsed));
            await AsyncStorage.removeItem(TIMER_STORAGE_KEY);
            await cancelTimerNotification();
            return 'OK';
        } else if (actionId === ACTION_PAUSE) {
            const elapsed = await getElapsedSecondsFromStorage();
            await setPendingTimerAction('PAUSE');
            await AsyncStorage.setItem(TIMER_PAUSED_ELAPSED_KEY, String(elapsed));
            await AsyncStorage.removeItem(TIMER_STORAGE_KEY);

            // Update notification with paused indicator
            try {
                const pausedContent = buildTimerNotificationContent(elapsed, { paused: true });
                await Notifications.scheduleNotificationAsync({
                    identifier: TIMER_NOTIFICATION_IDENTIFIER,
                    content: pausedContent,
                    trigger: Platform.OS === 'android' ? { channelId: TIMER_CHANNEL_ID } : null,
                });
            } catch (_) { }
            return 'PAUSE';
        } else if (actionId === ACTION_DISCARD) {
            await setPendingTimerAction('DISCARD');
            await AsyncStorage.removeItem(TIMER_STORAGE_KEY);
            await AsyncStorage.removeItem(TIMER_PAUSED_ELAPSED_KEY);
            await cancelTimerNotification();
            return 'DISCARD';
        }
    } catch (error) {
        logTimerNotification('warn', 'Error executing notification action:', error);
    }
    return null;
}

// ─── Active Workout Route Params Persistence ───
const WORKOUT_PARAMS_KEY = '@pressfit_active_workout_params';

export async function saveActiveWorkoutParams(params: {
    routineDayId?: string;
    workoutId?: string;
    dayName?: string;
    dayOfWeek?: number;
    mode?: string;
    activeSetId?: string | null;
}): Promise<void> {
    try {
        const existing = (await getActiveWorkoutParams()) || {};
        const updated = { ...existing, ...params };
        if (params.activeSetId === null) {
            delete updated.activeSetId;
        }
        if (updated.routineDayId || updated.workoutId) {
            await AsyncStorage.setItem(WORKOUT_PARAMS_KEY, JSON.stringify(updated));
        }
    } catch (_) { }
}

export async function getActiveWorkoutParams(): Promise<any | null> {
    try {
        const saved = await AsyncStorage.getItem(WORKOUT_PARAMS_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (_) { }
    return null;
}

export async function clearActiveWorkoutParams(): Promise<void> {
    try {
        await AsyncStorage.removeItem(WORKOUT_PARAMS_KEY);
    } catch (_) { }
}
