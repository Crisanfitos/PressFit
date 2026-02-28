import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface RestTimerProps {
    visible: boolean;
    onDismiss: () => void;
    onTimerStop: (seconds: number) => void;
    colors: any;
}

const RestTimer: React.FC<RestTimerProps> = ({ visible, onDismiss, onTimerStop, colors }) => {
    const [seconds, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const slideAnim = useRef(new Animated.Value(100)).current;

    useEffect(() => {
        if (visible) {
            setSeconds(0);
            setIsRunning(true);
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
            setSeconds(0);
        }
    }, [visible]);

    useEffect(() => {
        if (isRunning) {
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
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning]);

    const handleStop = useCallback(() => {
        setIsRunning(false);
        onTimerStop(seconds);
        onDismiss();
    }, [seconds, onTimerStop, onDismiss]);

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
            borderColor: colors.primary,
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
            color: colors.text,
            fontVariant: ['tabular-nums'],
            flex: 1,
        },
        label: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: -2,
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
                <MaterialIcons name="timer" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.timerText}>{formatTime(seconds)}</Text>
                <Text style={styles.label}>Descanso</Text>
            </View>
            <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
                <Text style={styles.stopButtonText}>Parar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
                <MaterialIcons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
        </Animated.View>
    );
};

export default RestTimer;
