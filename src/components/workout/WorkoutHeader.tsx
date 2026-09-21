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
}

export const WorkoutHeader: React.FC<WorkoutHeaderProps> = ({
    dayName,
    fechaDia,
    descripcion,
    routineDayId,
    workoutId,
    colors,
    onBack,
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
                    <Text style={[styles.headerText, { color: colors.onSurface || colors.text }]}>
                        {dayName || 'Entrenamiento'}
                        {formattedDate}
                    </Text>
                    {descripcion ? (
                        <Text style={[styles.descriptionText, { color: colors.onSurfaceVariant || colors.primary }]}>
                            {descripcion}
                        </Text>
                    ) : null}
                </View>
            </View>
            <SyncStatusBadge compact alwaysShow />
        </Reanimated.View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    pulseDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginLeft: 4,
        marginRight: 8,
    },
    titleContainer: {
        marginLeft: 4,
        flex: 1,
    },
    headerText: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: -0.16,
    },
    descriptionText: {
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 2,
    },
});

export default WorkoutHeader;
