import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TIMER_STORAGE_KEY = '@pressfit_rest_timer_start';

// Notification identifiers
export const TIMER_NOTIFICATION_ID_KEY = '@pressfit_timer_notif_id';
export const NOTIFICATION_CATEGORY_ID = 'REST_TIMER';

// Action identifiers
export const ACTION_OK = 'TIMER_OK';
export const ACTION_PAUSE = 'TIMER_PAUSE';
export const ACTION_DISCARD = 'TIMER_DISCARD';

// ─── Foreground handler: don't show alerts while timer UI is visible ───
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

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

// ─── Request permissions ───
export async function requestNotificationPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
}

// ─── Format seconds as M:SS ───
function formatTime(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ─── Schedule (or update) the timer notification ───
// The app icon is configured via app.json expo-notifications plugin ("icon": "./assets/icon.png").
// Re-post every 10s to update the displayed time — avoids the flickering caused by 1s updates.
export async function scheduleTimerNotification(elapsedSeconds: number): Promise<string | null> {
    try {
        // Cancel existing displayed notification before posting the updated one
        await cancelTimerNotification();

        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: 'PressFit — Descanso en curso',
                body: `⏱ ${formatTime(elapsedSeconds)}`,
                categoryIdentifier: NOTIFICATION_CATEGORY_ID,
                data: { type: 'REST_TIMER' },
                sticky: true,
                autoDismiss: false,
            },
            trigger: null, // Immediate
        });

        await AsyncStorage.setItem(TIMER_NOTIFICATION_ID_KEY, id);
        return id;
    } catch (error) {
        console.warn('[TimerNotification] Failed to schedule:', error);
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
        }
    } catch (error) {
        console.warn('[TimerNotification] Failed to cancel:', error);
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
}): Promise<void> {
    try {
        if (params && (params.routineDayId || params.workoutId)) {
            await AsyncStorage.setItem(WORKOUT_PARAMS_KEY, JSON.stringify(params));
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

