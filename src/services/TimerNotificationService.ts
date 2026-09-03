import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TIMER_STORAGE_KEY = '@pressfit_rest_timer_start';

// Notification identifiers
export const TIMER_NOTIFICATION_ID_KEY = '@pressfit_timer_notif_id';
export const NOTIFICATION_CATEGORY_ID = 'REST_TIMER';
export const TIMER_CHANNEL_ID = 'pressfit_rest_timer';

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
                lightColor: '#22c55e',
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
            options: { opensAppToForeground: true },
        },
        {
            identifier: ACTION_PAUSE,
            buttonTitle: '⏸ Pausar',
            options: { opensAppToForeground: true },
        },
        {
            identifier: ACTION_DISCARD,
            buttonTitle: '✕ Descartar',
            options: { opensAppToForeground: true },
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
function formatTime(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ─── Schedule (or update) the timer notification ───
// Inverted sequence: schedule new notification first, save ID, then dismiss old one.
// This prevents orphan cancellations where notification disappears if app process is killed.
export async function scheduleTimerNotification(elapsedSeconds: number): Promise<string | null> {
    try {
        const previousId = await AsyncStorage.getItem(TIMER_NOTIFICATION_ID_KEY);

        const newId = await Notifications.scheduleNotificationAsync({
            content: {
                title: 'PressFit — Descanso en curso',
                body: `⏱ ${formatTime(elapsedSeconds)}`,
                categoryIdentifier: NOTIFICATION_CATEGORY_ID,
                data: { type: 'REST_TIMER' },
                sticky: true,
                autoDismiss: false,
                color: '#22c55e',
            },
            trigger: null, // Immediate
        });

        await AsyncStorage.setItem(TIMER_NOTIFICATION_ID_KEY, newId);
        logTimerNotification('debug', `Scheduled notification ${newId}, elapsed: ${elapsedSeconds}s`);

        // Clean up previous notification only after new one is successfully scheduled
        if (previousId && previousId !== newId) {
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
        if (id) {
            await Notifications.dismissNotificationAsync(id).catch(() => { });
            await Notifications.cancelScheduledNotificationAsync(id).catch(() => { });
            await AsyncStorage.removeItem(TIMER_NOTIFICATION_ID_KEY);
            logTimerNotification('debug', `Cancelled notification ${id}`);
        }
    } catch (error) {
        logTimerNotification('warn', 'Failed to cancel:', error);
    }
}

// ─── Get elapsed seconds from stored start timestamp ───
export async function getElapsedSecondsFromStorage(): Promise<number> {
    try {
        const saved = await AsyncStorage.getItem(TIMER_STORAGE_KEY);
        if (saved) {
            return Math.max(0, Math.floor((Date.now() - parseInt(saved, 10)) / 1000));
        }
    } catch (_) { }
    return 0;
}

// ─── Check if a rest timer was active (survives app kill via AsyncStorage) ───
export async function checkActiveRestTimer(): Promise<{ active: boolean; elapsedSeconds: number }> {
    try {
        const saved = await AsyncStorage.getItem(TIMER_STORAGE_KEY);
        if (saved) {
            const elapsed = Math.max(0, Math.floor((Date.now() - parseInt(saved, 10)) / 1000));
            return { active: true, elapsedSeconds: elapsed };
        }
    } catch (_) { }
    return { active: false, elapsedSeconds: 0 };
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
