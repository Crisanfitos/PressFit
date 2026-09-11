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
    finishActiveRestTimer,
    setPendingTimerAction,
    discardActiveRestTimer,
    addSecondsToRestTimer,
} from '../../services/TimerNotificationService';
import { HapticService } from '../../services/HapticService';

export interface RestTimerFloatingBarProps {
    visible?: boolean;
    targetSeconds?: number;
    onPress?: () => void;
    onFinish?: () => void;
    onAddSeconds?: (seconds: number) => void;
    onSkip?: () => void;
    testID?: string;
    bottomOffset?: number;
}

export const RestTimerFloatingBar: React.FC<RestTimerFloatingBarProps> = ({
    visible: propVisible,
    targetSeconds: _propTargetSeconds,
    onPress,
    onFinish,
    onAddSeconds,
    onSkip,
    testID = 'rest-timer-floating-bar',
    bottomOffset = 75,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { colors } = theme;

    const [seconds, setSeconds] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    const isMountedRef = useRef(true);
    const slideAnim = useRef(new Animated.Value(100)).current;
    const pulseAnim = useRef(new Animated.Value(0.6)).current;

    const isVisible = propVisible !== undefined ? propVisible : timerActive;

    const syncTimerState = useCallback(async () => {
        const { active, elapsedSeconds, paused } = await checkActiveRestTimer();
        if (!isMountedRef.current) return;
        setTimerActive(active);
        setIsPaused(Boolean(paused));
        if (active) {
            setSeconds(elapsedSeconds);
        }
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

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

    // Pulse animation while running
    useEffect(() => {
        if (isVisible && !isPaused) {
            const loop = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 0.6,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            );
            loop.start();
            return () => loop.stop();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isVisible, isPaused, pulseAnim]);

    const handleFinish = async () => {
        HapticService.selection();
        await finishActiveRestTimer();
        setTimerActive(false);
        if (onFinish) {
            onFinish();
        }
    };

    const handleAdd30s = async () => {
        HapticService.selection();
        await addSecondsToRestTimer(30);
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
            backgroundColor: isPaused ? '#eab30820' : `${colors.primary}20`,
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
            color: isPaused ? colors.textSecondary : colors.text,
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
        finishButton: {
            backgroundColor: '#22c55e',
            borderRadius: 10,
            paddingVertical: 6,
            paddingHorizontal: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },
        finishText: {
            fontSize: 12,
            fontWeight: '700',
            color: '#ffffff',
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
        indicatorTrack: {
            height: 2.5,
            backgroundColor: colors.border,
            borderRadius: 1.5,
            marginTop: 8,
            overflow: 'hidden',
        },
        indicatorLine: {
            height: '100%',
            width: '100%',
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
                        <Animated.View
                            style={[
                                styles.iconCircle,
                                { opacity: isPaused ? 1 : pulseAnim },
                            ]}
                        >
                            <MaterialIcons
                                name={isPaused ? 'pause' : 'timer'}
                                size={20}
                                color={isPaused ? '#eab308' : colors.primary}
                            />
                        </Animated.View>
                        <View style={styles.timeColumn}>
                            <Text testID={`${testID}-time`} style={styles.timeText}>
                                {formatTime(seconds)}
                            </Text>
                            <Text style={styles.labelText}>
                                {isPaused
                                    ? t('timer.paused', 'Pausado')
                                    : t('timer.rest', 'Descanso')}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.actionsRow}>
                        <TouchableOpacity
                            testID={`${testID}-finish`}
                            activeOpacity={0.7}
                            onPress={handleFinish}
                            style={styles.finishButton}
                            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                        >
                            <MaterialIcons name="check" size={16} color="#fff" style={{ marginRight: 4 }} />
                            <Text style={styles.finishText}>{t('timer.ready', 'Listo')}</Text>
                        </TouchableOpacity>

                        {onAddSeconds && (
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
                        )}

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

                {/* Status indicator line */}
                <View style={styles.indicatorTrack}>
                    <View
                        style={[
                            styles.indicatorLine,
                            { backgroundColor: isPaused ? '#eab308' : colors.primary },
                        ]}
                    />
                </View>
            </View>
        </Animated.View>
    );
};

export default RestTimerFloatingBar;
