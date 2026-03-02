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
import { MaterialIcons } from '@expo/vector-icons';

const TIMER_STORAGE_KEY = '@pressfit_rest_timer_start';

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
    const slideAnim = useRef(new Animated.Value(100)).current;
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);

    // ─── Persist start time to AsyncStorage so background can be calculated ───
    const saveStartTime = useCallback(async (startTimestamp: number) => {
        await AsyncStorage.setItem(TIMER_STORAGE_KEY, String(startTimestamp));
    }, []);

    const clearStartTime = useCallback(async () => {
        await AsyncStorage.removeItem(TIMER_STORAGE_KEY);
    }, []);

    // ─── Recalculate elapsed time from saved start timestamp ───
    const recalculateFromStorage = useCallback(async () => {
        try {
            const saved = await AsyncStorage.getItem(TIMER_STORAGE_KEY);
            if (saved) {
                const startTs = parseInt(saved, 10);
                const elapsed = Math.floor((Date.now() - startTs) / 1000);
                setSeconds(elapsed > 0 ? elapsed : 0);
            }
        } catch (_) { }
    }, []);

    // ─── AppState listener: recalculate when app returns to foreground ───
    useEffect(() => {
        const subscription = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
            const prev = appStateRef.current;
            appStateRef.current = nextState;

            if (
                (prev === 'background' || prev === 'inactive') &&
                nextState === 'active' &&
                isRunning &&
                !isStopped
            ) {
                // App came back to foreground — recalculate elapsed time
                await recalculateFromStorage();
            }
        });
        return () => subscription.remove();
    }, [isRunning, isStopped, recalculateFromStorage]);

    // ─── Visibility: animate slide in/out, start/reset timer ───
    useEffect(() => {
        if (visible) {
            const startTs = Date.now();
            setSeconds(0);
            setIsStopped(false);
            setIsRunning(true);
            saveStartTime(startTs);
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
            clearStartTime();
        }
    }, [visible]);

    // ─── Interval while running ───
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

    // Parar: pausa, muestra botones
    const handleStop = useCallback(() => {
        setIsRunning(false);
        setIsStopped(true);
    }, []);

    // OK: recalcular tiempo exacto desde AsyncStorage, guardar en DB, cerrar
    const handleConfirm = useCallback(async () => {
        let finalSeconds = seconds;
        try {
            const saved = await AsyncStorage.getItem(TIMER_STORAGE_KEY);
            if (saved) {
                const elapsed = Math.floor((Date.now() - parseInt(saved, 10)) / 1000);
                if (elapsed > 0) finalSeconds = elapsed;
            }
        } catch (_) { }

        await clearStartTime();
        onTimerStop(finalSeconds);
        setIsStopped(false);
        onDismiss();
    }, [seconds, onTimerStop, onDismiss, clearStartTime]);

    // Reanudar: continuar el cronómetro
    const handleResume = useCallback(() => {
        setIsStopped(false);
        setIsRunning(true);
    }, []);

    // Descartar: cerrar sin guardar
    const handleDiscard = useCallback(async () => {
        await clearStartTime();
        setIsStopped(false);
        onDismiss();
    }, [onDismiss, clearStartTime]);

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
                // Stopped: OK (verde) | Reanudar (primary) | Descartar (rojo)
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
                // Running: Parar | X (dismiss/discard)
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
