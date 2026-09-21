import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../types/theme';
import { SyncStatusBadge } from '../SyncStatusBadge';

export interface WorkoutHeaderProps {
    dayName?: string;
    fechaDia?: string | null;
    descripcion?: string;
    routineDayId?: string;
    workoutId?: string;
    colors: ThemeColors;
    onBack: () => void;
    timer?: number;
    onFinish?: () => void;
    saving?: boolean;
    mode?: string;
}

const formatTimer = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const WorkoutHeader: React.FC<WorkoutHeaderProps> = ({
    dayName,
    fechaDia,
    descripcion,
    routineDayId,
    workoutId,
    colors,
    onBack,
    timer,
    onFinish,
    saving,
    mode,
}) => {
    const pulseAnim = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.4,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [pulseAnim]);

    const formattedDate = fechaDia
        ? ` — ${new Date(fechaDia + 'T00:00:00').getDate()}/${(new Date(fechaDia + 'T00:00:00').getMonth() + 1).toString().padStart(2, '0')}`
        : '';

    return (
        <Reanimated.View
            style={[
                styles.header,
                {
                    backgroundColor: colors.surfaceContainerLowest || colors.headerBackground,
                    borderBottomColor: colors.outlineVariant || colors.border,
                },
            ]}
            sharedTransitionTag={`workout-header-${routineDayId || workoutId || 'active'}`}
        >
            <View style={styles.headerRow}>
                <TouchableOpacity
                    testID="workout-back-button"
                    style={styles.backButton}
                    onPress={onBack}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                    <MaterialIcons name="arrow-back" size={24} color={colors.onSurface || colors.text} />
                </TouchableOpacity>

                {/* Stitch Pulsing Active Session Indicator Dot */}
                <Animated.View
                    testID="workout-active-pulse-dot"
                    style={[
                        styles.pulseDot,
                        {
                            backgroundColor: colors.primaryContainer || colors.primary,
                            opacity: pulseAnim,
                        },
                    ]}
                />

                <View style={styles.titleContainer}>
                    <Text style={[styles.headerText, { color: colors.onSurface || colors.text }]} numberOfLines={1}>
                        {dayName || 'Entrenamiento'}
                        {formattedDate}
                    </Text>
                    {timer !== undefined && timer !== null ? (
                        <View style={styles.timerRow}>
                            <MaterialIcons name="timer" size={13} color={colors.onSurfaceVariant || colors.textSecondary} />
                            <Text style={[styles.timerText, { color: colors.onSurfaceVariant || colors.textSecondary }]}>
                                {formatTimer(timer)}
                            </Text>
                        </View>
                    ) : descripcion ? (
                        <Text style={[styles.descriptionText, { color: colors.onSurfaceVariant || colors.primary }]} numberOfLines={1}>
                            {descripcion}
                        </Text>
                    ) : null}
                </View>
            </View>

            <View style={styles.rightActions}>
                {mode === 'ACTIVE' && onFinish ? (
                    <TouchableOpacity
                        testID="header-finish-button"
                        style={[
                            styles.finishHeaderBtn,
                            {
                                backgroundColor: colors.primaryContainer || colors.primary,
                            },
                        ]}
                        onPress={onFinish}
                        disabled={saving}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={[
                                styles.finishHeaderBtnText,
                                { color: colors.onPrimaryContainer || colors.background },
                            ]}
                        >
                            Terminar
                        </Text>
                        <MaterialIcons
                            name="flag"
                            size={16}
                            color={colors.onPrimaryContainer || colors.background}
                        />
                    </TouchableOpacity>
                ) : null}
                <SyncStatusBadge compact alwaysShow />
            </View>
        </Reanimated.View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    backButton: {
        padding: 6,
        marginLeft: -6,
    },
    pulseDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginLeft: 4,
        marginRight: 8,
    },
    titleContainer: {
        marginLeft: 2,
        flex: 1,
    },
    headerText: {
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: -0.16,
    },
    descriptionText: {
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 2,
    },
    timerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 1,
    },
    timerText: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.3,
        fontVariant: ['tabular-nums'],
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    finishHeaderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
    },
    finishHeaderBtnText: {
        fontSize: 13,
        fontWeight: '700',
    },
});

export default WorkoutHeader;
