import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeColors } from '../../theme/colors';

export interface TodayRoutineHeroCardProps {
    dayName?: string;
    routineTitle: string;
    description?: string;
    estimatedMinutes?: number | string;
    exerciseCount?: number;
    totalSets?: number;
    estimatedLoad?: string | number;
    targetRpe?: string | number;
    targetMuscles?: string[];
    status?: 'completed' | 'in_progress' | 'scheduled' | 'rest';
    onStartPress: () => void;
    colors: ThemeColors;
    testID?: string;
}

export const TodayRoutineHeroCard: React.FC<TodayRoutineHeroCardProps> = ({
    dayName = 'HOY',
    routineTitle,
    description,
    estimatedMinutes = 55,
    exerciseCount = 5,
    totalSets = 16,
    estimatedLoad = '4,850 kg',
    targetRpe = '8.5 / 10',
    targetMuscles = [],
    status = 'scheduled',
    onStartPress,
    colors,
    testID = 'hero-card-today',
}) => {
    const isCompleted = status === 'completed';
    const isInProgress = status === 'in_progress';
    const isRest = status === 'rest';

    const ctaLabel = isCompleted
        ? 'Ver Entrenamiento'
        : isInProgress
        ? 'Continuar Entrenamiento'
        : isRest
        ? 'Ver Detalles del Día'
        : 'Iniciar Entrenamiento';

    const ctaIcon = isCompleted ? 'done-all' : isInProgress ? 'play-arrow' : isRest ? 'self-improvement' : 'play-arrow';

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: colors.surfaceContainerLowest || colors.surface,
                    borderColor: colors.primaryContainer || colors.primary,
                },
            ]}
            testID={testID}
        >
            {/* Top Kinetic Accent Line */}
            <LinearGradient
                colors={[
                    colors.secondaryContainer || '#fd761a',
                    colors.tertiaryContainer || '#720080',
                    colors.primaryContainer || '#1e3a8a',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.accentLine}
            />

            {/* Header Row */}
            <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                    <View
                        style={[
                            styles.todayPill,
                            {
                                backgroundColor: colors.secondaryFixed || '#ffdbca',
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.todayPillText,
                                { color: colors.onSecondaryFixed || '#341100' },
                            ]}
                        >
                            {dayName.toUpperCase()}
                        </Text>
                    </View>

                    {!isRest && (
                        <View style={styles.timeBadge}>
                            <MaterialIcons
                                name="schedule"
                                size={15}
                                color={colors.secondaryContainer || colors.primary}
                            />
                            <Text
                                style={[
                                    styles.timeText,
                                    { color: colors.onSurfaceVariant || colors.textSecondary },
                                ]}
                            >
                                {typeof estimatedMinutes === 'number' ? `${estimatedMinutes} min` : estimatedMinutes}
                            </Text>
                        </View>
                    )}
                </View>

                <View
                    style={[
                        styles.countBadge,
                        { backgroundColor: colors.surfaceContainer || colors.surfaceContainerHigh },
                    ]}
                >
                    <Text
                        style={[
                            styles.countText,
                            { color: colors.primary || colors.text },
                        ]}
                    >
                        {isRest ? 'Descanso' : `${exerciseCount} Ejercicios`}
                    </Text>
                </View>
            </View>

            {/* Routine Title */}
            <Text
                style={[
                    styles.routineTitle,
                    { color: colors.onSurface || colors.text },
                ]}
                testID="hero-routine-title"
            >
                {routineTitle}
            </Text>

            {/* Description */}
            {description ? (
                <Text
                    style={[
                        styles.descriptionText,
                        { color: colors.onSurfaceVariant || colors.textSecondary },
                    ]}
                >
                    {description}
                </Text>
            ) : null}

            {/* Key Metrics Strip (if not rest) */}
            {!isRest && (
                <View
                    style={[
                        styles.metricsStrip,
                        { backgroundColor: colors.surfaceContainerLow || colors.surfaceContainer },
                    ]}
                >
                    <View style={styles.metricColumn}>
                        <Text
                            style={[
                                styles.metricLabel,
                                { color: colors.onSurfaceVariant || colors.textSecondary },
                            ]}
                        >
                            Series Totales
                        </Text>
                        <Text
                            style={[
                                styles.metricValue,
                                { color: colors.primary || colors.text },
                            ]}
                            testID="hero-series-count"
                        >
                            {totalSets} Sets
                        </Text>
                    </View>

                    <View
                        style={[
                            styles.metricColumn,
                            styles.metricDivider,
                            { borderColor: (colors.outlineVariant || colors.border) + '80' },
                        ]}
                    >
                        <Text
                            style={[
                                styles.metricLabel,
                                { color: colors.onSurfaceVariant || colors.textSecondary },
                            ]}
                        >
                            Carga Estimada
                        </Text>
                        <Text
                            style={[
                                styles.metricValue,
                                { color: colors.onSurface || colors.text },
                            ]}
                            testID="hero-estimated-load"
                        >
                            {typeof estimatedLoad === 'number' ? `${estimatedLoad} kg` : estimatedLoad}
                        </Text>
                    </View>

                    <View style={styles.metricColumn}>
                        <Text
                            style={[
                                styles.metricLabel,
                                { color: colors.onSurfaceVariant || colors.textSecondary },
                            ]}
                        >
                            RPE Objetivo
                        </Text>
                        <Text
                            style={[
                                styles.metricValue,
                                { color: colors.secondaryContainer || colors.primaryDarkMint || colors.primary },
                            ]}
                            testID="hero-target-rpe"
                        >
                            {targetRpe}
                        </Text>
                    </View>
                </View>
            )}

            {/* Target Muscles Chips */}
            {targetMuscles && targetMuscles.length > 0 ? (
                <View style={styles.musclesRow}>
                    {targetMuscles.map((muscle, idx) => (
                        <View
                            key={`${muscle}-${idx}`}
                            style={[
                                styles.muscleChip,
                                { backgroundColor: colors.surfaceContainer || colors.surfaceContainerHigh },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.muscleChipText,
                                    { color: colors.onSurface || colors.text },
                                ]}
                            >
                                {muscle}
                            </Text>
                        </View>
                    ))}
                </View>
            ) : null}

            {/* Primary Athletic CTA */}
            <TouchableOpacity
                style={[
                    styles.ctaButton,
                    {
                        backgroundColor: isCompleted
                            ? (colors.primary || colors.statusSuccess)
                            : (colors.secondaryContainer || colors.primary),
                    },
                ]}
                onPress={onStartPress}
                activeOpacity={0.88}
                testID="hero-start-workout-button"
            >
                <MaterialIcons
                    name={ctaIcon}
                    size={22}
                    color={colors.onSecondary || colors.onPrimary || '#ffffff'}
                />
                <Text
                    style={[
                        styles.ctaText,
                        { color: colors.onSecondary || colors.onPrimary || '#ffffff' },
                    ]}
                >
                    {ctaLabel}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        padding: 16,
        borderWidth: 2,
        position: 'relative',
        overflow: 'hidden',
        marginVertical: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    accentLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 5,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 6,
        marginBottom: 10,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    todayPill: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 9999,
    },
    todayPillText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    timeText: {
        fontSize: 12,
        fontWeight: '500',
    },
    countBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    countText: {
        fontSize: 12,
        fontWeight: '700',
    },
    routineTitle: {
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: -0.3,
        marginBottom: 4,
    },
    descriptionText: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 12,
    },
    metricsStrip: {
        flexDirection: 'row',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 6,
        marginVertical: 10,
        alignItems: 'center',
    },
    metricColumn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    metricDivider: {
        borderLeftWidth: 1,
        borderRightWidth: 1,
    },
    metricLabel: {
        fontSize: 11,
        fontWeight: '500',
        marginBottom: 2,
    },
    metricValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    musclesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 14,
    },
    muscleChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 9999,
    },
    muscleChipText: {
        fontSize: 11,
        fontWeight: '600',
    },
    ctaButton: {
        height: 52,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    ctaText: {
        fontSize: 16,
        fontWeight: '700',
    },
});

export default TodayRoutineHeroCard;
