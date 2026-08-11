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
import { useTheme } from '../context/ThemeContext';
import { checkActiveRestTimer } from '../services/TimerNotificationService';

export interface FloatingTimerPillProps {
    visible?: boolean;
    onPress?: () => void;
    testID?: string;
}

const FloatingTimerPill: React.FC<FloatingTimerPillProps> = ({
    visible: propVisible,
    onPress,
    testID = 'floating-timer-pill',
}) => {
    const { theme } = useTheme();
    const { colors } = theme;

    const [seconds, setSeconds] = useState(0);
    const [timerActive, setTimerActive] = useState(false);

    const slideAnim = useRef(new Animated.Value(80)).current;

    const isVisible = propVisible !== undefined ? propVisible : timerActive;

    const syncTimerState = useCallback(async () => {
        const { active, elapsedSeconds } = await checkActiveRestTimer();
        setTimerActive(active);
        if (active) {
            setSeconds(elapsedSeconds);
        }
    }, []);

    useEffect(() => {
        syncTimerState();
        const interval = setInterval(syncTimerState, 1000);
        const appStateSub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
            if (nextState === 'active') {
                syncTimerState();
            }
        });
        return () => {
            clearInterval(interval);
            appStateSub.remove();
        };
    }, [syncTimerState]);

    useEffect(() => {
        if (isVisible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 70,
                friction: 12,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: 80,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [isVisible, slideAnim]);

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isVisible) return null;

    const styles = StyleSheet.create({
        container: {
            position: 'absolute',
            bottom: 75,
            right: 16,
            zIndex: 999,
            elevation: 12,
        },
        pill: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderColor: colors.primary,
            borderWidth: 1.5,
            borderRadius: 24,
            paddingVertical: 8,
            paddingHorizontal: 14,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 6,
        },
        iconContainer: {
            marginRight: 8,
        },
        timeText: {
            fontSize: 14,
            fontWeight: '700',
            color: colors.text,
            fontVariant: ['tabular-nums'],
        },
        labelText: {
            fontSize: 11,
            color: colors.textSecondary,
            marginLeft: 6,
        },
    });

    return (
        <Animated.View
            testID={testID}
            style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
        >
            <TouchableOpacity
                testID={`${testID}-touchable`}
                activeOpacity={0.8}
                onPress={onPress}
                style={styles.pill}
            >
                <View style={styles.iconContainer}>
                    <MaterialIcons name="timer" size={18} color={colors.primary} />
                </View>

                <Text testID={`${testID}-time`} style={styles.timeText}>
                    {formatTime(seconds)}
                </Text>

                <Text style={styles.labelText}>Descanso</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default FloatingTimerPill;
