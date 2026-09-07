import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { WorkoutStats } from './types';

interface WorkoutDayHeaderProps {
    dayData: any;
    routineId?: string;
    selectedDate: Date;
    workoutStats: WorkoutStats | null;
    activeWorkout: any;
    formatDate: (d: Date) => string;
    formatDuration: (minutes: number | null) => string;
    onBack: () => void;
}

export const WorkoutDayHeader: React.FC<WorkoutDayHeaderProps> = ({
    dayData,
    routineId,
    selectedDate,
    workoutStats,
    activeWorkout,
    formatDate,
    formatDuration,
    onBack,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { colors } = theme;

    const styles = StyleSheet.create({
        header: {
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        backRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
        },
        backButton: {
            marginRight: 12,
        },
        dateText: {
            fontSize: 16,
            color: colors.textSecondary,
        },
        dayTitle: {
            fontSize: 28,
            fontWeight: 'bold',
            color: colors.text,
        },
        dayDescription: {
            fontSize: 14,
            color: colors.primary,
            marginTop: 4,
            fontStyle: 'italic',
        },
        statusBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            marginTop: 12,
        },
        statusText: {
            fontSize: 14,
            fontWeight: '600',
            marginLeft: 6,
        },
        heroSummaryContainer: {
            flexDirection: 'row',
            marginTop: 16,
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 16,
        },
        heroSummaryItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
        },
        heroSummaryText: {
            fontSize: 15,
            fontWeight: '600',
            color: colors.text,
        },
    });

    return (
        <Reanimated.View
            style={styles.header}
            sharedTransitionTag={`workout-header-${dayData?.id || routineId}`}
        >
            <View style={styles.backRow}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={onBack}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    testID="workout-day-back-button"
                >
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            </View>

            <Text style={styles.dayTitle}>
                {dayData?.nombre_dia || 'Sin entrenar'}
            </Text>

            {dayData?.descripcion ? (
                <Text style={styles.dayDescription}>{dayData.descripcion}</Text>
            ) : null}

            {workoutStats?.isCompleted && (
                <View
                    style={[styles.statusBadge, { backgroundColor: `${colors.statusSuccess}20` }]}
                    testID="status-badge-completed"
                >
                    <MaterialIcons name="check-circle" size={18} color={colors.statusSuccess} />
                    <Text style={[styles.statusText, { color: colors.statusSuccess }]}>
                        {t('workout.statusCompleted', 'Completado')}
                    </Text>
                </View>
            )}

            {workoutStats?.isCompleted && (
                <View style={styles.heroSummaryContainer}>
                    <View style={styles.heroSummaryItem}>
                        <MaterialIcons name="fitness-center" size={20} color={colors.primary} />
                        <Text style={styles.heroSummaryText}>
                            {workoutStats.exerciseCount} {t('workout.exercises', 'Ejercicios')}
                        </Text>
                    </View>
                    <View style={styles.heroSummaryItem}>
                        <MaterialIcons name="timer" size={20} color={colors.primary} />
                        <Text style={styles.heroSummaryText}>{formatDuration(workoutStats.duration)}</Text>
                    </View>
                </View>
            )}

            {activeWorkout && !workoutStats?.isCompleted && (
                <View
                    style={[styles.statusBadge, { backgroundColor: `${colors.statusWarning}20` }]}
                    testID="status-badge-in-progress"
                >
                    <MaterialIcons name="play-circle" size={18} color={colors.statusWarning} />
                    <Text style={[styles.statusText, { color: colors.statusWarning }]}>
                        {t('workout.statusInProgress', 'En Progreso')}
                    </Text>
                </View>
            )}
        </Reanimated.View>
    );
};
