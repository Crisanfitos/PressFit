import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../theme/colors';

export interface WeeklyRoutineDayCardProps {
    dayName: string; // 'LUNES', 'MARTES', etc.
    dateDisplay?: string; // '18/09'
    routineTitle: string; // 'Empuje: Pecho, Hombro & Tríceps'
    status: 'completed' | 'scheduled' | 'rest';
    exerciseCount?: number;
    durationMinutes?: number | null;
    totalVolumeKg?: number | null;
    description?: string;
    onPress: () => void;
    colors: ThemeColors;
    testID?: string;
}

export const WeeklyRoutineDayCard: React.FC<WeeklyRoutineDayCardProps> = ({
    dayName,
    dateDisplay,
    routineTitle,
    status,
    exerciseCount = 0,
    durationMinutes,
    totalVolumeKg,
    description,
    onPress,
    colors,
    testID = 'weekly-routine-day-card',
}) => {
    const isCompleted = status === 'completed';
    const isRest = status === 'rest';

    const cardBg = isRest
        ? (colors.surfaceContainerLow || colors.surface)
        : (colors.surfaceContainerLowest || colors.surface);
    const cardBorder = isRest
        ? (colors.outlineVariant || colors.border) + '70'
        : (colors.outlineVariant || colors.border);

    const iconName = isRest ? 'self-improvement' : isCompleted ? 'fitness-center' : 'fitness-center';
    const iconBg = isRest
        ? (colors.surfaceContainer || colors.surfaceContainerHigh)
        : (colors.surfaceContainerHigh || colors.surface);
    const iconColor = isRest
        ? (colors.outline || colors.textSecondary)
        : (colors.primary || colors.text);

    return (
        <TouchableOpacity
            style={[
                styles.card,
                {
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                },
                isRest && styles.restCard,
            ]}
            onPress={onPress}
            activeOpacity={0.75}
            testID={testID}
        >
            <View style={styles.leftSection}>
                <View
                    style={[
                        styles.iconContainer,
                        {
                            backgroundColor: iconBg,
                        },
                    ]}
                >
                    <MaterialIcons name={iconName} size={22} color={iconColor} />
                </View>

                <View style={styles.detailsContainer}>
                    <View style={styles.headerRow}>
                        <Text
                            style={[
                                styles.dayNameText,
                                {
                                    color: isCompleted
                                        ? (colors.outline || colors.textSecondary)
                                        : isRest
                                        ? (colors.outline || colors.textSecondary)
                                        : (colors.secondaryContainer || colors.primary),
                                },
                            ]}
                        >
                            {dayName.toUpperCase()}{dateDisplay ? ` • ${dateDisplay}` : ''}
                        </Text>

                        {isCompleted ? (
                            <View style={styles.statusBadge}>
                                <MaterialIcons
                                    name="done-all"
                                    size={14}
                                    color={colors.primary || colors.statusSuccess}
                                />
                                <Text
                                    style={[
                                        styles.statusBadgeText,
                                        { color: colors.primary || colors.statusSuccess },
                                    ]}
                                    testID="weekly-card-badge-completed"
                                >
                                    Completado
                                </Text>
                            </View>
                        ) : !isRest ? (
                            <Text
                                style={[
                                    styles.scheduledBadgeText,
                                    { color: colors.onSurfaceVariant || colors.textSecondary },
                                ]}
                                testID="weekly-card-badge-scheduled"
                            >
                                Programado
                            </Text>
                        ) : null}
                    </View>

                    <Text
                        style={[
                            styles.routineTitle,
                            {
                                color: isRest
                                    ? (colors.onSurfaceVariant || colors.textSecondary)
                                    : (colors.onSurface || colors.text),
                            },
                        ]}
                        numberOfLines={1}
                    >
                        {routineTitle}
                    </Text>

                    {isRest ? (
                        <Text
                            style={[
                                styles.descriptionText,
                                { color: colors.outline || colors.textSecondary },
                            ]}
                            numberOfLines={1}
                        >
                            {description || 'Estiramientos y recuperación activa'}
                        </Text>
                    ) : (
                        <View style={styles.metaRow}>
                            {exerciseCount > 0 ? (
                                <>
                                    <Text
                                        style={[
                                            styles.metaText,
                                            { color: colors.onSurfaceVariant || colors.textSecondary },
                                        ]}
                                    >
                                        {exerciseCount} ejercicios
                                    </Text>
                                    <View
                                        style={[
                                            styles.metaDot,
                                            { backgroundColor: colors.outlineVariant || colors.border },
                                        ]}
                                    />
                                </>
                            ) : null}

                            {durationMinutes ? (
                                <>
                                    <Text
                                        style={[
                                            styles.metaText,
                                            { color: colors.onSurfaceVariant || colors.textSecondary },
                                        ]}
                                    >
                                        {durationMinutes} min
                                    </Text>
                                    {totalVolumeKg ? (
                                        <View
                                            style={[
                                                styles.metaDot,
                                                { backgroundColor: colors.outlineVariant || colors.border },
                                            ]}
                                        />
                                    ) : null}
                                </>
                            ) : null}

                            {totalVolumeKg ? (
                                <Text
                                    style={[
                                        styles.metaText,
                                        { color: colors.primary || colors.text },
                                    ]}
                                >
                                    {totalVolumeKg.toLocaleString()} kg
                                </Text>
                            ) : null}
                        </View>
                    )}
                </View>
            </View>

            <MaterialIcons
                name="chevron-right"
                size={22}
                color={colors.onSurfaceVariant || colors.textSecondary}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 4,
    },
    restCard: {
        opacity: 0.85,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    iconContainer: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    detailsContainer: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2,
    },
    dayNameText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    scheduledBadgeText: {
        fontSize: 11,
        fontWeight: '500',
    },
    routineTitle: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.2,
        marginBottom: 2,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 12,
        fontWeight: '500',
    },
    metaDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
    },
    descriptionText: {
        fontSize: 12,
    },
});

export default WeeklyRoutineDayCard;
