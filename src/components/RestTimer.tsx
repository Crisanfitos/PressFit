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

import {
    setupNotificationCategory,
    requestNotificationPermissions,
    scheduleTimerNotification,
    cancelTimerNotification,
    getElapsedSecondsFromStorage,
    ACTION_OK,
    ACTION_PAUSE,
    ACTION_DISCARD,
} from '../services/TimerNotificationService';

const TIMER_STORAGE_KEY = '@pressfit_rest_timer_start';

// Notification update interval: 10s is smooth enough without causing flicker.
// 1s caused visible flickering due to the cancel+repost cycle.
const NOTIFICATION_UPDATE_INTERVAL_MS = 10_000;

interface RestTimerProps {
    visible: boolean;
    onDismiss: () => void;
    onTimerStop: (seconds: number) => void;
    colors: any;
}

const RestTimer: React.FC<RestTimerProps> = ({ visible, onDismiss, onTimerStop, colors }) => {
    const [seconds, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [isStopped, setIsStopped] = useState(false);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const notifIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const slideAnim = useRef(new Animated.Value(100)).current;
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);
    const isInBackgroundRef = useRef(false);

    // ─── One-time setup: permissions + notification category ───
    useEffect(() => {
        (async () => {
            await requestNotificationPermissions();
            await setupNotificationCategory();
        })();
    }, []);

    // ─── Handle notification response (user taps action button in drawer/lock screen) ───
    useEffect(() => {
        const sub = Notifications.addNotificationResponseReceivedListener(async (response) => {
            const actionId = response.actionIdentifier;

            if (actionId === ACTION_OK) {
                // Calculate exact elapsed time and save
                const elapsed = await getElapsedSecondsFromStorage();
                await cancelTimerNotification();
                await AsyncStorage.removeItem(TIMER_STORAGE_KEY);
                onTimerStop(elapsed > 0 ? elapsed : seconds);
                setIsStopped(false);
                onDismiss();
            } else if (actionId === ACTION_PAUSE) {
                // Pause in-app timer (user brings app back by tapping the notification)
                setIsRunning(false);
                setIsStopped(true);
                await cancelTimerNotification();
            } else if (actionId === ACTION_DISCARD) {
                await cancelTimerNotification();
                await AsyncStorage.removeItem(TIMER_STORAGE_KEY);
                setIsStopped(false);
                onDismiss();
            }
        });
        return () => sub.remove();
    }, [seconds, onTimerStop, onDismiss]);

    // ─── AppState listener ───
    useEffect(() => {
        const appStateSub = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
            const prev = appStateRef.current;
            appStateRef.current = nextState;

            if (!visible) return;

            if (nextState === 'background' || nextState === 'inactive') {
                // App going to background — show notification
                isInBackgroundRef.current = true;
                if (isRunning && !isStopped) {
                    const elapsed = await getElapsedSecondsFromStorage();
                    await scheduleTimerNotification(elapsed);

                    // Update notification every NOTIFICATION_UPDATE_INTERVAL_MS while in background
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

                // Cancel the notification since user is back in app
                await cancelTimerNotification();

                // Recalculate elapsed time from start timestamp
                if (
                    (prev === 'background' || prev === 'inactive') &&
                    isRunning &&
                    !isStopped
                ) {
                    const elapsed = await getElapsedSecondsFromStorage();
                    setSeconds(elapsed);
                }
            }
        });

        return () => {
            appStateSub.remove();
            if (notifIntervalRef.current) clearInterval(notifIntervalRef.current);
        };
    }, [visible, isRunning, isStopped]);

    // ─── Visibility: animate + start/reset timer ───
    useEffect(() => {
        if (visible) {
            const startTs = Date.now();
            setSeconds(0);
            setIsStopped(false);
            setIsRunning(true);
            AsyncStorage.setItem(TIMER_STORAGE_KEY, String(startTs));
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
            setIsRunning(false);
            setIsStopped(false);
            setSeconds(0);
            AsyncStorage.removeItem(TIMER_STORAGE_KEY);
            cancelTimerNotification();
        }
    }, [visible]);

    // ─── setInterval while running in foreground ───
    useEffect(() => {
        if (isRunning && !isStopped) {
            intervalRef.current = setInterval(() => {
                setSeconds((prev) => prev + 1);
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

    const handleStop = useCallback(() => {
        setIsRunning(false);
        setIsStopped(true);
    }, []);

    const handleConfirm = useCallback(async () => {
        // Get exact elapsed from AsyncStorage before clearing
        const elapsed = await getElapsedSecondsFromStorage();
        await AsyncStorage.removeItem(TIMER_STORAGE_KEY);
        await cancelTimerNotification();

        onTimerStop(elapsed > 0 ? elapsed : seconds);
        setIsStopped(false);
        onDismiss();
    }, [seconds, onTimerStop, onDismiss]);

    const handleResume = useCallback(() => {
        setIsStopped(false);
        setIsRunning(true);
    }, []);

    const handleDiscard = useCallback(async () => {
        await AsyncStorage.removeItem(TIMER_STORAGE_KEY);
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
            color: '#fff',
        },
        dismissButton: {
            padding: 8,
            marginLeft: 8,
        },
    });

    return (
        <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.iconContainer}>
                <MaterialIcons
                    name={isStopped ? 'timer-off' : 'timer'}
                    size={22}
                    color={isStopped ? colors.textSecondary : colors.primary}
                />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.timerText}>{formatTime(seconds)}</Text>
                <Text style={styles.label}>{isStopped ? 'Pausado' : 'Descanso'}</Text>
            </View>

            {isStopped ? (
                <>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#22c55e' }]}
                        onPress={handleConfirm}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <MaterialIcons name="check" size={22} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.primary }]}
                        onPress={handleResume}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <MaterialIcons name="play-arrow" size={22} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
                        onPress={handleDiscard}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <MaterialIcons name="close" size={22} color="#fff" />
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
                        <Text style={styles.stopButtonText}>Parar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dismissButton} onPress={handleDiscard}>
                        <MaterialIcons name="close" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </>
            )}
        </Animated.View>
    );
};

export default RestTimer;
