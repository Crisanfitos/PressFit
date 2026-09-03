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
    TIMER_NOTIFICATION_IDENTIFIER,
    NOTIFICATION_CATEGORY_ID,
    NOTIFICATION_CATEGORY_PAUSED_ID,
    TIMER_CHANNEL_ID,
    formatTime,
    ACTION_OK,
    ACTION_PAUSE,
    ACTION_RESUME,
    ACTION_DISCARD,
    TIMER_PENDING_ACTION_KEY,
    TIMER_PAUSED_ELAPSED_KEY,
    TIMER_STORAGE_KEY,
    setPendingTimerAction,
    getPendingTimerAction,
    clearPendingTimerAction,
    handleNotificationAction,
    getNotificationPlatformConfig,
    buildTimerNotificationContent,
    TIMER_NOTIFICATION_COLOR,
    TIMER_NOTIFICATION_PAUSED_COLOR,
    TIMER_NOTIFICATION_ENABLED_KEY,
    isTimerNotificationEnabled,
    setTimerNotificationEnabled,
    resetTimerNotificationEnabledCacheForTesting,
} from '../../../src/services/TimerNotificationService';
import i18n from '../../../src/i18n';

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
        resetTimerNotificationEnabledCacheForTesting();
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
                    lightColor: TIMER_NOTIFICATION_COLOR,
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
        it('should register REST_TIMER category with action buttons (opensAppToForeground: false to avoid hijacking app UI in PF-293)', async () => {
            await setupNotificationCategory();

            expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledWith(
                NOTIFICATION_CATEGORY_ID,
                [
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

    describe('formatTime (PF-283)', () => {
        it('formats various durations into M:SS strings', () => {
            expect(formatTime(0)).toBe('0:00');
            expect(formatTime(9)).toBe('0:09');
            expect(formatTime(59)).toBe('0:59');
            expect(formatTime(60)).toBe('1:00');
            expect(formatTime(125)).toBe('2:05');
            expect(formatTime(3600)).toBe('60:00');
        });
    });

    describe('scheduleTimerNotification (PF-283)', () => {
        it('should schedule/update notification in-place using stable identifier', async () => {
            const originalOS = Platform.OS;
            Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });

            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(TIMER_NOTIFICATION_IDENTIFIER);
            (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValueOnce(TIMER_NOTIFICATION_IDENTIFIER);

            const result = await scheduleTimerNotification(125); // 2 mins 5 secs -> 2:05

            expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
                expect.objectContaining({
                    identifier: TIMER_NOTIFICATION_IDENTIFIER,
                    content: expect.objectContaining({
                        title: 'PressFit — Descanso en curso',
                        body: '⏱ 2:05',
                        categoryIdentifier: NOTIFICATION_CATEGORY_ID,
                        sticky: true,
                        autoDismiss: false,
                        color: TIMER_NOTIFICATION_COLOR,
                        priority: 'high',
                    }),
                    trigger: { channelId: TIMER_CHANNEL_ID },
                })
            );
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(TIMER_NOTIFICATION_ID_KEY, TIMER_NOTIFICATION_IDENTIFIER);
            // Updating in-place: no dismissal needed when using the same identifier
            expect(Notifications.dismissNotificationAsync).not.toHaveBeenCalled();
            expect(result).toBe(TIMER_NOTIFICATION_IDENTIFIER);

            Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
        });

        it('should clean up legacy notification if previousId differs from new identifier', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('legacy_uuid_123');
            (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValueOnce(TIMER_NOTIFICATION_IDENTIFIER);

            const result = await scheduleTimerNotification(30);

            expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith('legacy_uuid_123');
            expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('legacy_uuid_123');
            expect(result).toBe(TIMER_NOTIFICATION_IDENTIFIER);
        });

        it('should handle errors during scheduling gracefully and return null', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
            (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValueOnce(new Error('Notification error'));

            const result = await scheduleTimerNotification(45);

            expect(result).toBeNull();
        });
    });

    describe('cancelTimerNotification (PF-283)', () => {
        it('should dismiss and cancel both stored ID and TIMER_NOTIFICATION_IDENTIFIER', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('active_notif_789');
            (Notifications.dismissNotificationAsync as jest.Mock).mockResolvedValue(undefined);
            (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockResolvedValue(undefined);

            await cancelTimerNotification();

            expect(AsyncStorage.getItem).toHaveBeenCalledWith(TIMER_NOTIFICATION_ID_KEY);
            expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith('active_notif_789');
            expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith(TIMER_NOTIFICATION_IDENTIFIER);
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith(TIMER_NOTIFICATION_ID_KEY);
        });

        it('should dismiss TIMER_NOTIFICATION_IDENTIFIER even if no ID is stored in storage', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

            await cancelTimerNotification();

            expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith(TIMER_NOTIFICATION_IDENTIFIER);
            expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(TIMER_NOTIFICATION_IDENTIFIER);
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith(TIMER_NOTIFICATION_ID_KEY);
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
            (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
                if (key === TIMER_STORAGE_KEY) return start.toString();
                return null;
            });

            const elapsed = await getElapsedSecondsFromStorage();

            expect(elapsed).toBeGreaterThanOrEqual(29);
            expect(elapsed).toBeLessThanOrEqual(31);
        });

        it('should handle storage error and return 0', async () => {
            (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Read error'));

            const elapsed = await getElapsedSecondsFromStorage();

            expect(elapsed).toBe(0);
        });

        it('should return paused elapsed seconds when TIMER_PAUSED_ELAPSED_KEY is saved', async () => {
            (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
                if (key === TIMER_PAUSED_ELAPSED_KEY) return '85';
                return null;
            });

            const elapsed = await getElapsedSecondsFromStorage();
            expect(elapsed).toBe(85);
        });
    });

    describe('checkActiveRestTimer', () => {
        it('should return { active: false, elapsedSeconds: 0 } when no active timer timestamp exists', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const res = await checkActiveRestTimer();

            expect(res).toEqual({ active: false, elapsedSeconds: 0 });
        });

        it('should return { active: true, elapsedSeconds: X, paused: false } when active timer exists', async () => {
            const now = Date.now();
            const start = now - 60000; // 60 seconds ago
            (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
                if (key === TIMER_STORAGE_KEY) return start.toString();
                return null;
            });

            const res = await checkActiveRestTimer();

            expect(res.active).toBe(true);
            expect(res.paused).toBe(false);
            expect(res.elapsedSeconds).toBeGreaterThanOrEqual(59);
            expect(res.elapsedSeconds).toBeLessThanOrEqual(61);
        });

        it('should return { active: true, elapsedSeconds: 45, paused: true } when timer is paused', async () => {
            (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
                if (key === TIMER_PAUSED_ELAPSED_KEY) return '45';
                return null;
            });

            const res = await checkActiveRestTimer();

            expect(res).toEqual({ active: true, elapsedSeconds: 45, paused: true });
        });

        it('should return { active: false, elapsedSeconds: 0 } when pending action is DISCARD', async () => {
            (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
                if (key === TIMER_PENDING_ACTION_KEY) return 'DISCARD';
                if (key === TIMER_STORAGE_KEY) return String(Date.now() - 10000);
                return null;
            });

            const res = await checkActiveRestTimer();

            expect(res).toEqual({ active: false, elapsedSeconds: 0 });
        });
    });

    describe('Pending Actions Persistence (PF-284)', () => {
        it('saves and reads pending actions correctly', async () => {
            await setPendingTimerAction('OK');
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(TIMER_PENDING_ACTION_KEY, 'OK');

            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('PAUSE');
            const action = await getPendingTimerAction();
            expect(action).toBe('PAUSE');

            await clearPendingTimerAction();
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith(TIMER_PENDING_ACTION_KEY);
        });

        it('returns null for invalid or null pending actions', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('INVALID');
            expect(await getPendingTimerAction()).toBeNull();

            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
            expect(await getPendingTimerAction()).toBeNull();
        });
    });

    describe('handleNotificationAction (PF-284)', () => {
        it('handles ACTION_OK: saves OK action, freezes elapsed, removes timer start and cancels notification', async () => {
            (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
                if (key === TIMER_STORAGE_KEY) return String(Date.now() - 50000);
                return null;
            });

            const result = await handleNotificationAction(ACTION_OK);

            expect(result).toBe('OK');
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(TIMER_PENDING_ACTION_KEY, 'OK');
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(TIMER_PAUSED_ELAPSED_KEY, expect.any(String));
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith(TIMER_STORAGE_KEY);
            expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith(TIMER_NOTIFICATION_IDENTIFIER);
        });

        it('handles ACTION_PAUSE: saves PAUSE action, freezes elapsed, removes timer start and updates notification with paused indicator', async () => {
            (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
                if (key === TIMER_STORAGE_KEY) return String(Date.now() - 75000);
                return null;
            });

            const result = await handleNotificationAction(ACTION_PAUSE);

            expect(result).toBe('PAUSE');
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(TIMER_PENDING_ACTION_KEY, 'PAUSE');
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(TIMER_PAUSED_ELAPSED_KEY, expect.any(String));
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith(TIMER_STORAGE_KEY);
            expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
                expect.objectContaining({
                    identifier: TIMER_NOTIFICATION_IDENTIFIER,
                    content: expect.objectContaining({
                        body: '⏸ Pausado (1:15)',
                        color: '#eab308',
                        categoryIdentifier: NOTIFICATION_CATEGORY_PAUSED_ID,
                    }),
                })
            );
        });

        it('handles ACTION_DISCARD: saves DISCARD action, removes both storage keys and cancels notification', async () => {
            const result = await handleNotificationAction(ACTION_DISCARD);

            expect(result).toBe('DISCARD');
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(TIMER_PENDING_ACTION_KEY, 'DISCARD');
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith(TIMER_STORAGE_KEY);
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith(TIMER_PAUSED_ELAPSED_KEY);
            expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith(TIMER_NOTIFICATION_IDENTIFIER);
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

    describe('Platform Capabilities & Configuration (PF-286)', () => {
        it('returns Android configuration when platform is android', () => {
            const originalOS = Platform.OS;
            Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });

            const config = getNotificationPlatformConfig();

            expect(config.platform).toBe('android');
            expect(config.supportsNativeChronometer).toBe(false);
            expect(config.updateCadenceMs).toBe(1000);
            expect(config.channelId).toBe(TIMER_CHANNEL_ID);
            expect(config.channelPriority).toBe('high');
            expect(config.isSticky).toBe(true);
            expect(config.brandColor).toBe(TIMER_NOTIFICATION_COLOR);

            Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
        });

        it('returns iOS configuration when platform is ios', () => {
            const originalOS = Platform.OS;
            Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });

            const config = getNotificationPlatformConfig();

            expect(config.platform).toBe('ios');
            expect(config.supportsNativeChronometer).toBe(false);
            expect(config.channelId).toBeUndefined();
            expect(config.isSticky).toBe(false);
            expect(config.brandColor).toBe(TIMER_NOTIFICATION_COLOR);

            Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
        });

        it('returns default fallback configuration for unknown platforms', () => {
            const originalOS = Platform.OS;
            Object.defineProperty(Platform, 'OS', { value: 'windows', configurable: true });

            const config = getNotificationPlatformConfig();

            expect(config.platform).toBe('default');
            expect(config.channelId).toBeUndefined();
            expect(config.isSticky).toBe(false);

            Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
        });
    });

    describe('buildTimerNotificationContent (PF-286)', () => {
        it('builds standard active timer content with brand color and formatted time', () => {
            const originalOS = Platform.OS;
            Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });

            const content = buildTimerNotificationContent(75);

            expect(content).toEqual(
                expect.objectContaining({
                    title: 'PressFit — Descanso en curso',
                    body: '⏱ 1:15',
                    categoryIdentifier: NOTIFICATION_CATEGORY_ID,
                    sticky: true,
                    autoDismiss: false,
                    color: TIMER_NOTIFICATION_COLOR,
                    priority: 'high',
                })
            );
            expect(content.subtitle).toBeDefined();

            Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
        });

        it('builds paused timer content with warning color and paused body', () => {
            const originalOS = Platform.OS;
            Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });

            const content = buildTimerNotificationContent(90, { paused: true });

            expect(content).toEqual(
                expect.objectContaining({
                    title: 'PressFit — Descanso en curso',
                    body: '⏸ Pausado (1:30)',
                    categoryIdentifier: NOTIFICATION_CATEGORY_PAUSED_ID,
                    sticky: true,
                    autoDismiss: false,
                    color: TIMER_NOTIFICATION_PAUSED_COLOR,
                    priority: 'high',
                })
            );
            expect(content.subtitle).toBeDefined();

            Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
        });

        it('includes interruptionLevel active on iOS', () => {
            const originalOS = Platform.OS;
            Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });

            const content = buildTimerNotificationContent(30);

            expect((content as any).interruptionLevel).toBe('active');
            expect(content.sticky).toBe(false);

            Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
        });
    });

    describe('scheduleTimerNotification with options (PF-293)', () => {
        it('schedules notification with paused state and correct content', async () => {
            (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValueOnce('test-notif-paused');

            const id = await scheduleTimerNotification(42, { paused: true });

            expect(id).toBe('test-notif-paused');
            expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: expect.objectContaining({
                        body: '⏸ Pausado (0:42)',
                        color: TIMER_NOTIFICATION_PAUSED_COLOR,
                        categoryIdentifier: NOTIFICATION_CATEGORY_PAUSED_ID,
                    }),
                })
            );
        });
    });

    describe('Timer notification preferences and i18n (PF-287)', () => {
        beforeEach(async () => {
            resetTimerNotificationEnabledCacheForTesting();
            await i18n.changeLanguage('es');
        });

        it('isTimerNotificationEnabled defaults to true when not set in storage', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
            const enabled = await isTimerNotificationEnabled();
            expect(enabled).toBe(true);
        });

        it('isTimerNotificationEnabled returns false when stored as "false"', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('false');
            const enabled = await isTimerNotificationEnabled();
            expect(enabled).toBe(false);
        });

        it('setTimerNotificationEnabled persists value and cancels notification when false', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('active-id-123');
            await setTimerNotificationEnabled(false);

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(TIMER_NOTIFICATION_ENABLED_KEY, 'false');
            expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith('active-id-123');
            expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith(TIMER_NOTIFICATION_IDENTIFIER);
        });

        it('scheduleTimerNotification returns null without scheduling when preference is disabled', async () => {
            await setTimerNotificationEnabled(false);

            const result = await scheduleTimerNotification(10);
            expect(result).toBeNull();
            expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
        });

        it('translates notification content and actions in Spanish (es)', async () => {
            await i18n.changeLanguage('es');
            const content = buildTimerNotificationContent(15, { paused: true });
            expect(content.title).toBe('PressFit — Descanso en curso');
            expect(content.body).toBe('⏸ Pausado (0:15)');

            await setupNotificationCategory();
            expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledWith(
                NOTIFICATION_CATEGORY_ID,
                expect.arrayContaining([
                    expect.objectContaining({ identifier: ACTION_OK, buttonTitle: '✅ OK' }),
                    expect.objectContaining({ identifier: ACTION_PAUSE, buttonTitle: '⏸ Pausar' }),
                    expect.objectContaining({ identifier: ACTION_DISCARD, buttonTitle: '✕ Descartar' }),
                ])
            );
            expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledWith(
                NOTIFICATION_CATEGORY_PAUSED_ID,
                expect.arrayContaining([
                    expect.objectContaining({ identifier: ACTION_OK, buttonTitle: '✅ OK' }),
                    expect.objectContaining({ identifier: ACTION_RESUME, buttonTitle: '▶️ Reanudar' }),
                    expect.objectContaining({ identifier: ACTION_DISCARD, buttonTitle: '✕ Descartar' }),
                ])
            );
        });

        it('translates notification content and actions in English (en)', async () => {
            await i18n.changeLanguage('en');
            const content = buildTimerNotificationContent(15, { paused: true });
            expect(content.title).toBe('PressFit — Rest in progress');
            expect(content.body).toBe('⏸ Paused (0:15)');

            await setupNotificationCategory();
            expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledWith(
                NOTIFICATION_CATEGORY_ID,
                expect.arrayContaining([
                    expect.objectContaining({ identifier: ACTION_OK, buttonTitle: '✅ OK' }),
                    expect.objectContaining({ identifier: ACTION_PAUSE, buttonTitle: '⏸ Pause' }),
                    expect.objectContaining({ identifier: ACTION_DISCARD, buttonTitle: '✕ Discard' }),
                ])
            );
            expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledWith(
                NOTIFICATION_CATEGORY_PAUSED_ID,
                expect.arrayContaining([
                    expect.objectContaining({ identifier: ACTION_OK, buttonTitle: '✅ OK' }),
                    expect.objectContaining({ identifier: ACTION_RESUME, buttonTitle: '▶️ Resume' }),
                    expect.objectContaining({ identifier: ACTION_DISCARD, buttonTitle: '✕ Discard' }),
                ])
            );
        });
    });

    describe('Resume action and background notification optimization (PF-294)', () => {
        beforeEach(async () => {
            await i18n.changeLanguage('es');
            (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('test-notif-id');
        });

        it('buildTimerNotificationContent includes formatted subtitle with start time', () => {
            const fixedStart = new Date(2026, 8, 3, 14, 30, 0).getTime();
            const content = buildTimerNotificationContent(60, { paused: false, startTimeMs: fixedStart });

            expect(content.subtitle).toBeDefined();
            expect(content.subtitle).toContain('Inicio:');
            expect(content.categoryIdentifier).toBe(NOTIFICATION_CATEGORY_ID);
        });

        it('buildTimerNotificationContent switches to NOTIFICATION_CATEGORY_PAUSED_ID when paused', () => {
            const fixedStart = new Date(2026, 8, 3, 14, 30, 0).getTime();
            const content = buildTimerNotificationContent(60, { paused: true, startTimeMs: fixedStart });

            expect(content.categoryIdentifier).toBe(NOTIFICATION_CATEGORY_PAUSED_ID);
            expect(content.subtitle).toContain('Pausado:');
        });

        it('handleNotificationAction(ACTION_RESUME) restores running timer in storage and updates notification', async () => {
            (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
                if (key === TIMER_PAUSED_ELAPSED_KEY) return '45';
                return null;
            });

            const actionResult = await handleNotificationAction(ACTION_RESUME);

            expect(actionResult).toBe('RESUME');
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith(TIMER_PAUSED_ELAPSED_KEY);
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(TIMER_STORAGE_KEY, expect.any(String));
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(TIMER_PENDING_ACTION_KEY, 'RESUME');

            // Verifies that notification was scheduled back to running category
            expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: expect.objectContaining({
                        categoryIdentifier: NOTIFICATION_CATEGORY_ID,
                        color: TIMER_NOTIFICATION_COLOR,
                    }),
                })
            );
        });

        it('handleNotificationAction(ACTION_PAUSE) persists paused elapsed and updates notification with paused category', async () => {
            const fakeStart = Date.now() - 30000;
            (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
                if (key === TIMER_STORAGE_KEY) return String(fakeStart);
                return null;
            });

            const actionResult = await handleNotificationAction(ACTION_PAUSE);

            expect(actionResult).toBe('PAUSE');
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(TIMER_PAUSED_ELAPSED_KEY, expect.any(String));
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith(TIMER_STORAGE_KEY);
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(TIMER_PENDING_ACTION_KEY, 'PAUSE');

            expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: expect.objectContaining({
                        categoryIdentifier: NOTIFICATION_CATEGORY_PAUSED_ID,
                        color: TIMER_NOTIFICATION_PAUSED_COLOR,
                    }),
                })
            );
        });

        it('getPendingTimerAction returns RESUME when set', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('RESUME');
            const action = await getPendingTimerAction();
            expect(action).toBe('RESUME');
        });
    });
});

