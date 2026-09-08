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
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import {
    checkActiveRestTimer,
    getTimerTargetDuration,
    addSecondsToRestTimer,
    discardActiveRestTimer,
} from '../../services/TimerNotificationService';
import { HapticService } from '../../services/HapticService';

export interface RestTimerFloatingBarProps {
    visible?: boolean;
    targetSeconds?: number;
    onPress?: () => void;
    onAddSeconds?: (seconds: number) => void;
    onSkip?: () => void;
    testID?: string;
    bottomOffset?: number;
}

export const RestTimerFloatingBar: React.FC<RestTimerFloatingBarProps> = ({
    visible: propVisible,
    targetSeconds: propTargetSeconds,
    onPress,
    onAddSeconds,
    onSkip,
    testID = 'rest-timer-floating-bar',
    bottomOffset = 75,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { colors } = theme;

    const [seconds, setSeconds] = useState(0);
    const [targetDuration, setTargetDuration] = useState(propTargetSeconds || 90);
    const [timerActive, setTimerActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    const isMountedRef = useRef(true);
    const slideAnim = useRef(new Animated.Value(100)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    const isVisible = propVisible !== undefined ? propVisible : timerActive;

    const syncTimerState = useCallback(async () => {
        const { active, elapsedSeconds, paused } = await checkActiveRestTimer();
        if (!isMountedRef.current) return;
        setTimerActive(active);
        setIsPaused(Boolean(paused));
        if (active) {
            setSeconds(elapsedSeconds);
            if (!propTargetSeconds) {
                const persistedTarget = await getTimerTargetDuration();
                if (!isMountedRef.current) return;
                setTargetDuration(persistedTarget);
            }
        }
    }, [propTargetSeconds]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (propTargetSeconds) {
            setTargetDuration(propTargetSeconds);
        }
    }, [propTargetSeconds]);

    useEffect(() => {
        syncTimerState();
        const interval = setInterval(() => {
            if (isMountedRef.current) {
                syncTimerState();
            }
        }, 1000);
        const appStateSub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
            if (nextState === 'active' && isMountedRef.current) {
                syncTimerState();
            }
        });
        return () => {
            clearInterval(interval);
            appStateSub.remove();
        };
    }, [syncTimerState]);

    useEffect(() => {
        let anim: Animated.CompositeAnimation;
        if (isVisible) {
            anim = Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 70,
                friction: 12,
            });
        } else {
            anim = Animated.timing(slideAnim, {
                toValue: 120,
                duration: 200,
                useNativeDriver: true,
            });
        }
        anim.start();
        return () => {
            anim.stop();
        };
    }, [isVisible, slideAnim]);

    // Animate progress percentage
    useEffect(() => {
        const currentTarget = Math.max(1, targetDuration);
        const ratio = Math.min(1, Math.max(0, seconds / currentTarget));
        const anim = Animated.timing(progressAnim, {
            toValue: ratio,
            duration: 350,
            useNativeDriver: false,
        });
        anim.start();
        return () => {
            anim.stop();
        };
    }, [seconds, targetDuration, progressAnim]);

    const handleAdd30s = async () => {
        HapticService.selection();
        const { target } = await addSecondsToRestTimer(30);
        setTargetDuration(target);
        if (onAddSeconds) {
            onAddSeconds(30);
        }
    };

    const handleSkip = async () => {
        HapticService.selection();
        await discardActiveRestTimer();
        setTimerActive(false);
        if (onSkip) {
            onSkip();
        }
    };

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isVisible) return null;

    const remaining = Math.max(0, targetDuration - seconds);
    const isOvertime = seconds > targetDuration;

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    const styles = StyleSheet.create({
        container: {
            position: 'absolute',
            bottom: bottomOffset,
            left: 16,
            right: 16,
            zIndex: 999,
            elevation: 12,
        },
        barCard: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 16,
            paddingVertical: 10,
            paddingHorizontal: 14,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            overflow: 'hidden',
        },
        contentRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        leftSection: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            marginRight: 8,
        },
        iconCircle: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: `${colors.primary}20`,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
        },
        timeColumn: {
            flexDirection: 'column',
        },
        timeText: {
            fontSize: 16,
            fontWeight: '700',
            color: isOvertime ? '#ef4444' : colors.text,
            fontVariant: ['tabular-nums'],
        },
        labelText: {
            fontSize: 11,
            color: colors.textSecondary,
            fontWeight: '500',
            marginTop: 1,
        },
        actionsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
        },
        addSecondsButton: {
            backgroundColor: `${colors.primary}18`,
            borderColor: colors.primary,
            borderWidth: 1,
            borderRadius: 10,
            paddingVertical: 6,
            paddingHorizontal: 10,
            flexDirection: 'row',
            alignItems: 'center',
        },
        addSecondsText: {
            fontSize: 12,
            fontWeight: '700',
            color: colors.primary,
        },
        skipButton: {
            backgroundColor: colors.surfaceHighlight || '#2A2A2A',
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 10,
            paddingVertical: 6,
            paddingHorizontal: 10,
            flexDirection: 'row',
            alignItems: 'center',
        },
        skipText: {
            fontSize: 12,
            fontWeight: '600',
            color: colors.textSecondary,
        },
        progressTrack: {
            height: 3,
            backgroundColor: colors.border,
            borderRadius: 1.5,
            marginTop: 8,
            overflow: 'hidden',
        },
        progressFill: {
            height: '100%',
            backgroundColor: isOvertime ? '#ef4444' : colors.primary,
            borderRadius: 1.5,
        },
    });

    return (
        <Animated.View
            testID={testID}
            style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
        >
            <View style={styles.barCard}>
                <View style={styles.contentRow}>
                    <TouchableOpacity
                        testID={`${testID}-touchable`}
                        activeOpacity={0.7}
                        onPress={onPress}
                        style={styles.leftSection}
                    >
                        <View style={styles.iconCircle}>
                            <MaterialIcons
                                name={isPaused ? 'pause' : 'timer'}
                                size={20}
                                color={isPaused ? '#eab308' : colors.primary}
                            />
                        </View>
                        <View style={styles.timeColumn}>
                            <Text testID={`${testID}-time`} style={styles.timeText}>
                                {isOvertime ? `+${formatTime(seconds - targetDuration)}` : formatTime(remaining)}
                            </Text>
                            <Text style={styles.labelText}>
                                {isPaused
                                    ? t('timer.paused', 'Pausado')
                                    : isOvertime
                                    ? t('timer.overtime', 'Tiempo extra')
                                    : t('timer.remaining', 'Descanso restante')}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.actionsRow}>
                        <TouchableOpacity
                            testID={`${testID}-add-30s`}
                            activeOpacity={0.7}
                            onPress={handleAdd30s}
                            style={styles.addSecondsButton}
                            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                        >
                            <MaterialIcons name="add" size={14} color={colors.primary} />
                            <Text style={styles.addSecondsText}>30s</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            testID={`${testID}-skip`}
                            activeOpacity={0.7}
                            onPress={handleSkip}
                            style={styles.skipButton}
                            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                        >
                            <Text style={styles.skipText}>{t('timer.skip', 'Saltar')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progressTrack}>
                    <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                </View>
            </View>
        </Animated.View>
    );
};

export default RestTimerFloatingBar;
