import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    AppState,
    AppStateStatus,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import {
    setupNotificationChannel,
    setupNotificationCategory,
    requestNotificationPermissions,
    scheduleTimerNotification,
    cancelTimerNotification,
    getElapsedSecondsFromStorage,
    checkActiveRestTimer,
    setRestTimerUIVisible,
    logTimerNotification,
    handleNotificationAction,
    getPendingTimerAction,
    clearPendingTimerAction,
    ACTION_OK,
    ACTION_PAUSE,
    ACTION_DISCARD,
    TIMER_STORAGE_KEY,
    TIMER_PAUSED_ELAPSED_KEY,
} from '../services/TimerNotificationService';
import { HapticService } from '../services/HapticService';

// Notification update interval: 1s ensures real-time updates (≤ 2s) matching the UI timer.
// Using stable TIMER_NOTIFICATION_IDENTIFIER eliminates flickering completely without cancel+repost.
const NOTIFICATION_UPDATE_INTERVAL_MS = 1_000;

interface RestTimerProps {
    visible: boolean;
    onDismiss: () => void;
    onTimerStop: (seconds: number) => void;
    colors: any;
}

const RestTimer: React.FC<RestTimerProps> = ({ visible, onDismiss, onTimerStop, colors }) => {
    const { t } = useTranslation();

    const [seconds, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [isStopped, setIsStopped] = useState(false);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const notifIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const slideAnim = useRef(new Animated.Value(100)).current;
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);
    const isInBackgroundRef = useRef(false);

    // Stable references to prevent stale closures and race conditions in listeners
    const visibleRef = useRef(visible);
    const isRunningRef = useRef(isRunning);
    const isStoppedRef = useRef(isStopped);
    const secondsRef = useRef(seconds);
    const onTimerStopRef = useRef(onTimerStop);
    const onDismissRef = useRef(onDismiss);

    useEffect(() => {
        visibleRef.current = visible;
        isRunningRef.current = isRunning;
        isStoppedRef.current = isStopped;
        secondsRef.current = seconds;
        onTimerStopRef.current = onTimerStop;
        onDismissRef.current = onDismiss;
    });

    // ─── Foreground UI visibility flag: allow notification banners when RestTimer is not active on screen ───
    useEffect(() => {
        setRestTimerUIVisible(visible);
        return () => {
            setRestTimerUIVisible(false);
        };
    }, [visible]);

    // ─── Reconcile pending push notification actions (PF-284) ───
    const reconcilePendingAction = useCallback(async (): Promise<string | null> => {
        const pendingAction = await getPendingTimerAction();
        if (!pendingAction) return null;

        logTimerNotification('info', `Reconciling pending timer action: ${pendingAction}`);
        await clearPendingTimerAction();

        if (pendingAction === 'OK') {
            const elapsed = await getElapsedSecondsFromStorage();
            await AsyncStorage.removeItem(TIMER_STORAGE_KEY);
            await AsyncStorage.removeItem(TIMER_PAUSED_ELAPSED_KEY);
            await cancelTimerNotification();
            HapticService.timerFinished();
            onTimerStopRef.current(elapsed > 0 ? elapsed : secondsRef.current);
            setIsStopped(false);
            setIsRunning(false);
            onDismissRef.current();
        } else if (pendingAction === 'PAUSE') {
            const elapsed = await getElapsedSecondsFromStorage();
            setIsRunning(false);
            setIsStopped(true);
            setSeconds(elapsed);
        } else if (pendingAction === 'DISCARD') {
            await AsyncStorage.removeItem(TIMER_STORAGE_KEY);
            await AsyncStorage.removeItem(TIMER_PAUSED_ELAPSED_KEY);
            await cancelTimerNotification();
            setIsStopped(false);
            setIsRunning(false);
            onDismissRef.current();
        }
        return pendingAction;
    }, []);

    // ─── One-time setup: permissions + Android channel + notification category ───
    useEffect(() => {
        (async () => {
            await requestNotificationPermissions();
            await setupNotificationChannel();
            await setupNotificationCategory();

            // Check if app was launched directly from an action response
            try {
                const lastResponse = await Notifications.getLastNotificationResponseAsync();
                if (lastResponse?.actionIdentifier) {
                    await handleNotificationAction(lastResponse.actionIdentifier);
                }
            } catch (_) { }

            await reconcilePendingAction();
        })();
    }, [reconcilePendingAction]);

    // ─── Handle notification response (user taps action button in drawer/lock screen) ───
    useEffect(() => {
        const sub = Notifications.addNotificationResponseReceivedListener(async (response) => {
            const actionId = response.actionIdentifier;
            logTimerNotification('debug', `Notification response action: ${actionId}`);

            await handleNotificationAction(actionId);
            await reconcilePendingAction();
        });
        return () => sub.remove();
    }, [reconcilePendingAction]);

    // ─── AppState listener with stable refs (avoids teardown race conditions) ───
    useEffect(() => {
        const appStateSub = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
            const prev = appStateRef.current;
            appStateRef.current = nextState;
            logTimerNotification('debug', `AppState changed from ${prev} to ${nextState}`);

            if (!visibleRef.current) return;

            if (nextState === 'background' || nextState === 'inactive') {
                // App going to background — show notification
                isInBackgroundRef.current = true;
                if (isRunningRef.current && !isStoppedRef.current) {
                    const elapsed = await getElapsedSecondsFromStorage();
                    await scheduleTimerNotification(elapsed);

                    // Update notification every NOTIFICATION_UPDATE_INTERVAL_MS while in background
                    if (notifIntervalRef.current) {
                        clearInterval(notifIntervalRef.current);
                    }
                    notifIntervalRef.current = setInterval(async () => {
                        const e = await getElapsedSecondsFromStorage();
                        await scheduleTimerNotification(e);
                    }, NOTIFICATION_UPDATE_INTERVAL_MS);
                }
            } else if (nextState === 'active') {
                // App coming back to foreground
                isInBackgroundRef.current = false;

                // Stop notification update interval
                if (notifIntervalRef.current) {
                    clearInterval(notifIntervalRef.current);
                    notifIntervalRef.current = null;
                }

                // Check and reconcile any action performed in background
                await reconcilePendingAction();

                // If running, recalculate elapsed and keep notification synchronized
                if (
                    (prev === 'background' || prev === 'inactive') &&
                    isRunningRef.current &&
                    !isStoppedRef.current
                ) {
                    const elapsed = await getElapsedSecondsFromStorage();
                    setSeconds(elapsed);
                    await scheduleTimerNotification(elapsed);
                }
            }
        });

        return () => {
            appStateSub.remove();
            if (notifIntervalRef.current) {
                clearInterval(notifIntervalRef.current);
                notifIntervalRef.current = null;
            }
        };
    }, [reconcilePendingAction]);

    // ─── Visibility: animate + start/reset timer (with kill-recovery reconciliation) ───
    useEffect(() => {
        if (visible) {
            // Check if a timer was already running before (survives app kill via AsyncStorage)
            (async () => {
                const actionHandled = await reconcilePendingAction();
                if (actionHandled) return;

                const { active, elapsedSeconds, paused } = await checkActiveRestTimer();
                if (active && elapsedSeconds > 0) {
                    // Reconcile: resume from persisted start timestamp or paused state
                    setSeconds(elapsedSeconds);
                    if (paused) {
                        setIsStopped(true);
                        setIsRunning(false);
                    } else {
                        setIsStopped(false);
                        setIsRunning(true);
                    }
                } else {
                    // Fresh start: store new timestamp
                    const startTs = Date.now();
                    setSeconds(0);
                    await AsyncStorage.removeItem(TIMER_PAUSED_ELAPSED_KEY);
                    await clearPendingTimerAction();
                    await AsyncStorage.setItem(TIMER_STORAGE_KEY, String(startTs));
                    await scheduleTimerNotification(0);
                    setIsStopped(false);
                    setIsRunning(true);
                }
            })();
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 65,
                friction: 11,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: 100,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible, reconcilePendingAction]);

    // ─── setInterval while running in foreground ───
    useEffect(() => {
        if (isRunning && !isStopped) {
            intervalRef.current = setInterval(async () => {
                const elapsed = await getElapsedSecondsFromStorage();
                setSeconds(elapsed);
                await scheduleTimerNotification(elapsed);
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, isStopped]);

    // ─── Actions ───

    const handleStop = useCallback(async () => {
        setIsRunning(false);
        setIsStopped(true);
        const elapsed = await getElapsedSecondsFromStorage();
        await AsyncStorage.setItem(TIMER_PAUSED_ELAPSED_KEY, String(elapsed));
        await AsyncStorage.removeItem(TIMER_STORAGE_KEY);
        await scheduleTimerNotification(elapsed, { paused: true });
    }, []);

    const handleConfirm = useCallback(async () => {
        // Get exact elapsed from AsyncStorage before clearing
        const elapsed = await getElapsedSecondsFromStorage();
        await AsyncStorage.removeItem(TIMER_STORAGE_KEY);
        await AsyncStorage.removeItem(TIMER_PAUSED_ELAPSED_KEY);
        await clearPendingTimerAction();
        await cancelTimerNotification();
        HapticService.timerFinished();

        onTimerStop(elapsed > 0 ? elapsed : seconds);
        setIsStopped(false);
        onDismiss();
    }, [seconds, onTimerStop, onDismiss]);

    const handleResume = useCallback(async () => {
        setIsStopped(false);
        setIsRunning(true);
        const currentSecs = secondsRef.current;
        await AsyncStorage.removeItem(TIMER_PAUSED_ELAPSED_KEY);
        await clearPendingTimerAction();
        const adjustedStart = Date.now() - currentSecs * 1000;
        await AsyncStorage.setItem(TIMER_STORAGE_KEY, String(adjustedStart));
        await scheduleTimerNotification(currentSecs);
    }, []);

    const handleDiscard = useCallback(async () => {
        await AsyncStorage.removeItem(TIMER_STORAGE_KEY);
        await AsyncStorage.removeItem(TIMER_PAUSED_ELAPSED_KEY);
        await clearPendingTimerAction();
        await cancelTimerNotification();
        setIsStopped(false);
        onDismiss();
    }, [onDismiss]);

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!visible) return null;

    const styles = StyleSheet.create({
        container: {
            position: 'absolute',
            bottom: 20,
            left: 16,
            right: 16,
            backgroundColor: colors.surface,
            borderRadius: 16,
            paddingVertical: 12,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: isStopped ? colors.textSecondary : colors.primary,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 10,
        },
        iconContainer: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: `${colors.primary}20`,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
        },
        timerText: {
            fontSize: 28,
            fontWeight: '700',
            color: isStopped ? colors.textSecondary : colors.text,
            fontVariant: ['tabular-nums'],
            flex: 1,
        },
        label: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: -2,
        },
        actionButton: {
            width: 38,
            height: 38,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 6,
        },
        stopButton: {
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: colors.primary,
        },
        stopButtonText: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.textOnPrimary,
        },
        dismissButton: {
            padding: 8,
            marginLeft: 8,
        },
    });

    return (
        <Animated.View testID="rest-timer-banner" style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.iconContainer}>
                <MaterialIcons
                    name={isStopped ? 'timer-off' : 'timer'}
                    size={22}
                    color={isStopped ? colors.textSecondary : colors.primary}
                />
            </View>
            <View style={{ flex: 1 }}>
                <Text testID="rest-timer-text" style={styles.timerText}>{formatTime(seconds)}</Text>
                <Text style={styles.label}>{isStopped ? t('timer.paused', 'Pausado') : t('timer.rest', 'Descanso')}</Text>
            </View>

            {isStopped ? (
                <>
                    <TouchableOpacity
                        testID="rest-timer-confirm-button"
                        style={[styles.actionButton, { backgroundColor: '#22c55e' }]}
                        onPress={handleConfirm}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <MaterialIcons name="check" size={22} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        testID="rest-timer-resume-button"
                        style={[styles.actionButton, { backgroundColor: colors.primary }]}
                        onPress={handleResume}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <MaterialIcons name="play-arrow" size={22} color={colors.textOnPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        testID="rest-timer-discard-button"
                        style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
                        onPress={handleDiscard}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <MaterialIcons name="close" size={22} color="#fff" />
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <TouchableOpacity testID="rest-timer-pause-button" style={styles.stopButton} onPress={handleStop}>
                        <Text style={styles.stopButtonText}>{t('timer.stop', 'Parar')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity testID="rest-timer-discard-button" style={styles.dismissButton} onPress={handleDiscard}>
                        <MaterialIcons name="close" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </>
            )}
        </Animated.View>
    );
};

export default RestTimer;
