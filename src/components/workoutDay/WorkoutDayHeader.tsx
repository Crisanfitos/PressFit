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
    isToday?: boolean;
    isPendingPreviousWorkout?: boolean;
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
    isToday = true,
    isPendingPreviousWorkout = false,
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
            borderBottomColor: colors.outlineVariant || colors.border,
            backgroundColor: colors.surfaceContainerLowest || colors.surface,
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
            fontSize: 15,
            fontWeight: '500',
            color: colors.onSurfaceVariant || colors.textSecondary,
        },
        dayTitle: {
            fontSize: 28,
            fontWeight: '800',
            letterSpacing: -0.5,
            color: colors.onSurface || colors.text,
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
            backgroundColor: colors.surfaceContainerLow || colors.surface,
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.outlineVariant || colors.border,
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
            color: colors.onSurface || colors.text,
        },
        pendingBanner: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginTop: 14,
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
        },
        pendingBannerTitle: {
            fontSize: 14,
            fontWeight: 'bold',
        },
        pendingBannerText: {
            fontSize: 13,
            marginTop: 2,
        },
    });

    const formatStartTime = (iso?: string | null) => {
        if (!iso) return '-';
        const d = new Date(iso);
        if (isNaN(d.getTime())) return '-';
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

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
                {dayData?.nombre_dia || t('workout.noWorkoutDay', 'Sin entrenar')}
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

            {isPendingPreviousWorkout && (
                <View
                    style={[styles.statusBadge, { backgroundColor: `${colors.statusWarning}20` }]}
                    testID="status-badge-pending-finish"
                >
                    <MaterialIcons name="schedule" size={18} color={colors.statusWarning} />
                    <Text style={[styles.statusText, { color: colors.statusWarning }]}>
                        {t('workout.statusPendingFinish', 'Pendiente de Finalizar')}
                    </Text>
                </View>
            )}

            {isPendingPreviousWorkout && (
                <View
                    style={[
                        styles.pendingBanner,
                        {
                            backgroundColor: `${colors.statusWarning}15`,
                            borderColor: `${colors.statusWarning}40`,
                        },
                    ]}
                    testID="pending-workout-banner"
                >
                    <MaterialIcons name="warning" size={22} color={colors.statusWarning} />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.pendingBannerTitle, { color: colors.statusWarning }]}>
                            {t('workout.pendingFinishTitle', 'Rutina pendiente de días anteriores')}
                        </Text>
                        <Text
                            style={[styles.pendingBannerText, { color: colors.textSecondary }]}
                            testID="pending-workout-start-time"
                        >
                            {t('workout.startedAt', 'Hora de inicio')}: {formatStartTime(dayData?.hora_inicio || activeWorkout?.hora_inicio || workoutStats?.startTime)}
                        </Text>
                    </View>
                </View>
            )}

            {!isPendingPreviousWorkout && activeWorkout && !workoutStats?.isCompleted && (
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
