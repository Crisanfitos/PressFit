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

// ─── Configure foreground handler ───
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: false, // Timer UI handles foreground display
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
export function formatNotifTime(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Internal: ID of the currently displayed notification (kept in memory + AsyncStorage)
let _currentNotifId: string | null = null;

// ─── Post/update timer notification (fast path: dismiss old, post new) ───
// NOTE: expo-notifications doesn't support Android usesChronometer natively,
// so we update every second via JS interval. dismiss+post is faster than
// cancel(scheduled)+post because the notification was already presented.
export async function scheduleTimerNotification(elapsedSeconds: number): Promise<string | null> {
    try {
        // Dismiss the previously shown notification in-place without full cancel roundtrip
        if (_currentNotifId) {
            await Notifications.dismissNotificationAsync(_currentNotifId).catch(() => { });
        }

        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: `⏱  ${formatNotifTime(elapsedSeconds)}  —  Descanso en curso`,
                body: 'Pulsa un botón para continuar',
                categoryIdentifier: NOTIFICATION_CATEGORY_ID,
                data: { type: 'REST_TIMER' },
                sticky: true,
                autoDismiss: false,
            },
            trigger: null, // Immediate
        });

        _currentNotifId = id;
        await AsyncStorage.setItem(TIMER_NOTIFICATION_ID_KEY, id);
        return id;
    } catch (error) {
        console.warn('[TimerNotification] Failed to post:', error);
        return null;
    }
}

// ─── Cancel and dismiss the timer notification fully ───
export async function cancelTimerNotification(): Promise<void> {
    try {
        if (_currentNotifId) {
            await Notifications.dismissNotificationAsync(_currentNotifId).catch(() => { });
            await Notifications.cancelScheduledNotificationAsync(_currentNotifId).catch(() => { });
            _currentNotifId = null;
        }
        // Also check AsyncStorage in case the in-memory ref was lost (app restart edge case)
        const stored = await AsyncStorage.getItem(TIMER_NOTIFICATION_ID_KEY);
        if (stored && stored !== _currentNotifId) {
            await Notifications.dismissNotificationAsync(stored).catch(() => { });
            await Notifications.cancelScheduledNotificationAsync(stored).catch(() => { });
        }
        await AsyncStorage.removeItem(TIMER_NOTIFICATION_ID_KEY);
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
