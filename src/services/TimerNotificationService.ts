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

// ─── Configure foreground handler (show notification while app is in foreground) ───
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: false,  // SDK 54: replaces shouldShowAlert
        shouldShowList: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

// ─── Set up notification category with actions ───
export async function setupNotificationCategory(): Promise<void> {
    await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORY_ID, [
        {
            identifier: ACTION_OK,
            buttonTitle: '✅ OK',
            options: { opensAppToForeground: true },
        },
        {
            identifier: ACTION_PAUSE,
            buttonTitle: '⏸ Pausa',
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
export async function scheduleTimerNotification(elapsedSeconds: number): Promise<string | null> {
    try {
        // Cancel existing timer notification first
        await cancelTimerNotification();

        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: 'PressFit — Descanso en curso',
                body: `⏱ ${formatTime(elapsedSeconds)}`,
                categoryIdentifier: NOTIFICATION_CATEGORY_ID,
                data: { type: 'REST_TIMER' },
                sticky: true,   // Android: keep notification until dismissed
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
            await Notifications.dismissNotificationAsync(id);
            await Notifications.cancelScheduledNotificationAsync(id).catch(() => { });
            await AsyncStorage.removeItem(TIMER_NOTIFICATION_ID_KEY);
        }
    } catch (error) {
        console.warn('[TimerNotification] Failed to cancel:', error);
    }
}

// ─── Helper: get elapsed seconds from stored start time ───
export async function getElapsedSecondsFromStorage(): Promise<number> {
    try {
        const saved = await AsyncStorage.getItem(TIMER_STORAGE_KEY);
        if (saved) {
            return Math.max(0, Math.floor((Date.now() - parseInt(saved, 10)) / 1000));
        }
    } catch (_) { }
    return 0;
}
