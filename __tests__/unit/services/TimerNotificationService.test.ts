import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    setupNotificationCategory,
    setupNotificationChannel,
    isNotificationChannelEnabled,
    requestNotificationPermissions,
    getNotificationPermissionStatus,
    scheduleTimerNotification,
    cancelTimerNotification,
    getElapsedSecondsFromStorage,
    checkActiveRestTimer,
    setRestTimerUIVisible,
    isRestTimerUIVisibleState,
    setTimerNotificationLogLevel,
    logTimerNotification,
    saveActiveWorkoutParams,
    getActiveWorkoutParams,
    clearActiveWorkoutParams,
    TIMER_NOTIFICATION_ID_KEY,
    NOTIFICATION_CATEGORY_ID,
    TIMER_CHANNEL_ID,
    ACTION_OK,
    ACTION_PAUSE,
    ACTION_DISCARD,
} from '../../../src/services/TimerNotificationService';

jest.mock('expo-notifications', () => ({
    setNotificationHandler: jest.fn(),
    setNotificationCategoryAsync: jest.fn(),
    setNotificationChannelAsync: jest.fn(),
    getNotificationChannelAsync: jest.fn(),
    getPermissionsAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    scheduleNotificationAsync: jest.fn(),
    dismissNotificationAsync: jest.fn(),
    cancelScheduledNotificationAsync: jest.fn(),
    AndroidImportance: {
        HIGH: 4,
        NONE: 0,
    },
    AndroidNotificationVisibility: {
        PUBLIC: 1,
    },
    PermissionStatus: {
        GRANTED: 'granted',
        DENIED: 'denied',
        UNDETERMINED: 'undetermined',
    },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
}));

describe('TimerNotificationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (Notifications.dismissNotificationAsync as jest.Mock).mockResolvedValue(undefined);
        (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockResolvedValue(undefined);
    });

    describe('Diagnostic Logger & UI Visibility', () => {
        it('allows setting and reading RestTimer UI visibility', () => {
            setRestTimerUIVisible(true);
            expect(isRestTimerUIVisibleState()).toBe(true);

            setRestTimerUIVisible(false);
            expect(isRestTimerUIVisibleState()).toBe(false);
        });

        it('logs messages according to configured log level', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
            setTimerNotificationLogLevel('warn');
            logTimerNotification('warn', 'Test warning');
            expect(consoleSpy).toHaveBeenCalledWith('[TimerNotification] Test warning');

            consoleSpy.mockClear();
            logTimerNotification('debug', 'Test debug');
            expect(consoleSpy).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });

    describe('Android Notification Channel', () => {
        it('configures high-importance channel on android', async () => {
            const originalOS = Platform.OS;
            Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });

            (Notifications.setNotificationChannelAsync as jest.Mock).mockResolvedValueOnce(undefined);
            await setupNotificationChannel();

            expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
                TIMER_CHANNEL_ID,
                expect.objectContaining({
                    name: 'Temporizador de Descanso',
                    importance: 4,
                    lightColor: '#22c55e',
                })
            );

            Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
        });

        it('checks if notification channel is enabled', async () => {
            const originalOS = Platform.OS;
            Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });

            (Notifications.getNotificationChannelAsync as jest.Mock).mockResolvedValueOnce({
                importance: 4,
            });
            const enabled = await isNotificationChannelEnabled();
            expect(enabled).toBe(true);

            (Notifications.getNotificationChannelAsync as jest.Mock).mockResolvedValueOnce({
                importance: 0,
            });
            const disabled = await isNotificationChannelEnabled();
            expect(disabled).toBe(false);

            Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
        });
    });

    describe('setupNotificationCategory', () => {
        it('should register REST_TIMER category with action buttons', async () => {
            await setupNotificationCategory();

            expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledWith(
                NOTIFICATION_CATEGORY_ID,
                [
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
                ]
            );
        });
    });

    describe('requestNotificationPermissions & getNotificationPermissionStatus', () => {
        it('should return true if existing permission status is granted', async () => {
            (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });

            const granted = await requestNotificationPermissions();

            expect(granted).toBe(true);
            expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
        });

        it('should request permissions and return true if granted after prompt when canAskAgain is true', async () => {
            (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
                status: 'undetermined',
                canAskAgain: true,
            });
            (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });

            const granted = await requestNotificationPermissions();

            expect(granted).toBe(true);
            expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
        });

        it('should return false if requested permission is denied', async () => {
            (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
                status: 'undetermined',
                canAskAgain: true,
            });
            (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });

            const granted = await requestNotificationPermissions();

            expect(granted).toBe(false);
        });

        it('should retrieve status via getNotificationPermissionStatus', async () => {
            (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });
            const status = await getNotificationPermissionStatus();
            expect(status).toBe('granted');
        });
    });

    describe('scheduleTimerNotification', () => {
        it('should schedule new notification before dismissing old notification and save ID to AsyncStorage', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('old_notif_123');
            (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValueOnce('new_notif_456');

            const result = await scheduleTimerNotification(125); // 2 mins 5 secs -> 2:05

            expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
                content: {
                    title: 'PressFit — Descanso en curso',
                    body: '⏱ 2:05',
                    categoryIdentifier: NOTIFICATION_CATEGORY_ID,
                    data: { type: 'REST_TIMER' },
                    sticky: true,
                    autoDismiss: false,
                    color: '#22c55e',
                },
                trigger: null,
            });
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(TIMER_NOTIFICATION_ID_KEY, 'new_notif_456');
            expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith('old_notif_123');
            expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('old_notif_123');
            expect(result).toBe('new_notif_456');
        });

        it('should handle errors during scheduling gracefully and return null', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
            (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValueOnce(new Error('Notification error'));

            const result = await scheduleTimerNotification(45);

            expect(result).toBeNull();
        });
    });

    describe('cancelTimerNotification', () => {
        it('should dismiss, cancel notification and remove ID from storage if ID exists', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('active_notif_789');
            (Notifications.dismissNotificationAsync as jest.Mock).mockResolvedValueOnce(undefined);
            (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockResolvedValueOnce(undefined);

            await cancelTimerNotification();

            expect(AsyncStorage.getItem).toHaveBeenCalledWith(TIMER_NOTIFICATION_ID_KEY);
            expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith('active_notif_789');
            expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('active_notif_789');
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith(TIMER_NOTIFICATION_ID_KEY);
        });

        it('should do nothing if no active notification ID is stored', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

            await cancelTimerNotification();

            expect(Notifications.dismissNotificationAsync).not.toHaveBeenCalled();
            expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
            expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
        });
    });

    describe('getElapsedSecondsFromStorage', () => {
        it('should return 0 if no timestamp is saved', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

            const elapsed = await getElapsedSecondsFromStorage();

            expect(elapsed).toBe(0);
        });

        it('should calculate non-negative elapsed seconds when timestamp exists', async () => {
            const now = Date.now();
            const start = now - 30000; // 30 seconds ago
            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(start.toString());

            const elapsed = await getElapsedSecondsFromStorage();

            expect(elapsed).toBeGreaterThanOrEqual(29);
            expect(elapsed).toBeLessThanOrEqual(31);
        });

        it('should handle storage error and return 0', async () => {
            (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Read error'));

            const elapsed = await getElapsedSecondsFromStorage();

            expect(elapsed).toBe(0);
        });
    });

    describe('checkActiveRestTimer', () => {
        it('should return { active: false, elapsedSeconds: 0 } when no active timer timestamp exists', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

            const res = await checkActiveRestTimer();

            expect(res).toEqual({ active: false, elapsedSeconds: 0 });
        });

        it('should return { active: true, elapsedSeconds: X } when active timer exists', async () => {
            const now = Date.now();
            const start = now - 60000; // 60 seconds ago
            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(start.toString());

            const res = await checkActiveRestTimer();

            expect(res.active).toBe(true);
            expect(res.elapsedSeconds).toBeGreaterThanOrEqual(59);
            expect(res.elapsedSeconds).toBeLessThanOrEqual(61);
        });
    });

    describe('Active Workout Route Params', () => {
        it('saves and reads workout params', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
            await saveActiveWorkoutParams({ routineDayId: 'rd-1', dayName: 'Pecho' });
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@pressfit_active_workout_params',
                JSON.stringify({ routineDayId: 'rd-1', dayName: 'Pecho' })
            );

            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
                JSON.stringify({ routineDayId: 'rd-1', dayName: 'Pecho' })
            );
            const params = await getActiveWorkoutParams();
            expect(params).toEqual({ routineDayId: 'rd-1', dayName: 'Pecho' });

            await clearActiveWorkoutParams();
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@pressfit_active_workout_params');
        });
    });
});
