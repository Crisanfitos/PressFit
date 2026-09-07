import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { WorkoutDayExercise, WorkoutStats } from './types';

interface WorkoutDayExerciseListProps {
    exercises: WorkoutDayExercise[];
    workoutStats: WorkoutStats | null;
}

export const WorkoutDayExerciseList: React.FC<WorkoutDayExerciseListProps> = ({
    exercises,
    workoutStats,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { colors } = theme;

    const styles = StyleSheet.create({
        content: {
            flex: 1,
            padding: 20,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 16,
        },
        exerciseCard: {
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
        },
        exerciseIcon: {
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: `${colors.primary}20`,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
        },
        exerciseInfo: {
            flex: 1,
        },
        exerciseName: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 4,
        },
        exerciseMuscle: {
            fontSize: 14,
            color: colors.textSecondary,
        },
        exerciseSets: {
            alignItems: 'center',
        },
        setsNumber: {
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.primary,
        },
        setsLabel: {
            fontSize: 12,
            color: colors.textSecondary,
        },
        emptyState: {
            alignItems: 'center',
            paddingVertical: 40,
        },
        emptyText: {
            fontSize: 16,
            color: colors.textSecondary,
            marginTop: 12,
            textAlign: 'center',
        },
        completedExerciseCard: {
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
        },
        completedExerciseHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
            paddingBottom: 12,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
        },
        completedExerciseName: {
            fontSize: 16,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: 2,
        },
        setRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 6,
        },
        setNumber: {
            color: colors.textSecondary,
            width: 60,
            fontSize: 14,
        },
        setDetails: {
            color: colors.text,
            flex: 1,
            fontWeight: '500',
            fontSize: 15,
        },
        setBadgesContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
        },
        badge: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: `${colors.textSecondary}20`,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
        },
        badgeText: {
            color: colors.textSecondary,
            fontSize: 12,
            fontWeight: 'bold',
        },
    });

    return (
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
            <Text style={styles.sectionTitle}>
                {workoutStats?.isCompleted
                    ? t('workout.exercises', 'Ejercicios')
                    : `${t('workout.exercises', 'Ejercicios')} (${exercises.length})`}
            </Text>

            {exercises.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialIcons name="fitness-center" size={48} color={colors.textSecondary} />
                    <Text style={styles.emptyText}>
                        {t('workout.noScheduledExercises', 'No hay ejercicios programados para este día.')}
                    </Text>
                </View>
            ) : workoutStats?.isCompleted ? (
                exercises.map((exercise, index) => {
                    const sortedSeries = [...(exercise.series || [])].sort(
                        (a, b) => a.numero_serie - b.numero_serie
                    );

                    return (
                        <View key={exercise.id || index} style={styles.completedExerciseCard}>
                            <View style={styles.completedExerciseHeader}>
                                <View style={styles.exerciseIcon}>
                                    <MaterialIcons name="fitness-center" size={24} color={colors.primary} />
                                </View>
                                <View style={styles.exerciseInfo}>
                                    <Text style={styles.completedExerciseName}>
                                        {exercise.ejercicio?.titulo || t('workout.exercise', 'Ejercicio')}
                                    </Text>
                                    <Text style={styles.exerciseMuscle}>
                                        {exercise.ejercicio?.grupo_muscular || 'Sin grupo'}
                                    </Text>
                                </View>
                            </View>

                            {sortedSeries.length > 0 ? (
                                sortedSeries.map((set) => (
                                    <View key={set.id || set.numero_serie} style={styles.setRow}>
                                        <Text style={styles.setNumber}>
                                            {t('workout.sets', 'Serie')} {set.numero_serie}
                                        </Text>
                                        <Text style={styles.setDetails}>
                                            {set.peso_utilizado || 0} kg × {set.repeticiones || 0} reps
                                        </Text>
                                        <View style={styles.setBadgesContainer}>
                                            {set.rpe ? (
                                                <View style={styles.badge}>
                                                    <Text style={styles.badgeText}>RPE {set.rpe}</Text>
                                                </View>
                                            ) : null}
                                            {set.descanso_segundos ? (
                                                <View style={styles.badge}>
                                                    <MaterialIcons
                                                        name="timer"
                                                        size={10}
                                                        color={colors.textSecondary}
                                                        style={{ marginRight: 2 }}
                                                    />
                                                    <Text style={styles.badgeText}>{set.descanso_segundos}s</Text>
                                                </View>
                                            ) : null}
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <Text
                                    style={[
                                        styles.emptyText,
                                        { fontSize: 14, marginTop: 4, marginBottom: 8 },
                                    ]}
                                >
                                    No se registraron series.
                                </Text>
                            )}
                        </View>
                    );
                })
            ) : (
                exercises.map((exercise, index) => (
                    <View key={exercise.id || index} style={styles.exerciseCard}>
                        <View style={styles.exerciseIcon}>
                            <MaterialIcons name="fitness-center" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.exerciseInfo}>
                            <Text style={styles.exerciseName}>
                                {exercise.ejercicio?.titulo || t('workout.exercise', 'Ejercicio')}
                            </Text>
                            <Text style={styles.exerciseMuscle}>
                                {exercise.ejercicio?.grupo_muscular || 'Sin grupo'}
                            </Text>
                        </View>
                        <View style={styles.exerciseSets}>
                            <Text style={styles.setsNumber}>{exercise.series?.length || 0}</Text>
                            <Text style={styles.setsLabel}>{t('workout.sets', 'series').toLowerCase()}</Text>
                        </View>
                    </View>
                ))
            )}
        </ScrollView>
    );
};
