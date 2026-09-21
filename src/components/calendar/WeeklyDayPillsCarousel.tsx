import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../theme/colors';

export interface DayPillData {
    dayKey: string; // YYYY-MM-DD
    dayLetter: string; // 'L', 'M', 'X', 'J', 'V', 'S', 'D'
    dayNumber: number; // 18, 19, 20...
    isToday: boolean;
    isSelected?: boolean;
    status: 'completed' | 'active' | 'scheduled' | 'rest';
    date: Date;
}

export interface WeeklyDayPillsCarouselProps {
    days: DayPillData[];
    onSelectDay: (day: DayPillData) => void;
    colors: ThemeColors;
    testID?: string;
}

export const WeeklyDayPillsCarousel: React.FC<WeeklyDayPillsCarouselProps> = ({
    days,
    onSelectDay,
    colors,
    testID = 'weekly-day-pills-carousel',
}) => {
    return (
        <View style={styles.wrapper} testID={testID}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.container}
            >
                {days.map((day) => {
                    const isCompleted = day.status === 'completed';
                    const isActive = day.isToday || day.status === 'active' || day.isSelected;
                    const isRest = day.status === 'rest';

                    let pillBg = colors.surfaceContainerLowest || colors.surface;
                    let pillBorder = colors.outlineVariant || colors.border;
                    let letterColor = colors.onSurfaceVariant || colors.textSecondary;
                    let numberColor = colors.onSurface || colors.text;

                    if (isActive) {
                        pillBg = colors.primaryContainer || colors.primary;
                        pillBorder = colors.primary;
                        letterColor = colors.onPrimary || '#ffffff';
                        numberColor = colors.onPrimary || '#ffffff';
                    } else if (isRest) {
                        pillBg = colors.surfaceContainerLow || colors.surface;
                        pillBorder = (colors.outlineVariant || colors.border) + '80';
                        letterColor = colors.textSecondary;
                        numberColor = colors.textSecondary;
                    }

                    return (
                        <TouchableOpacity
                            key={day.dayKey}
                            style={[
                                styles.pill,
                                {
                                    backgroundColor: pillBg,
                                    borderColor: pillBorder,
                                },
                                isActive && styles.activePill,
                                isRest && styles.restPill,
                            ]}
                            onPress={() => onSelectDay(day)}
                            activeOpacity={0.8}
                            testID={`weekly-pill-${day.dayKey}`}
                        >
                            <Text
                                style={[
                                    styles.letterText,
                                    { color: letterColor },
                                    isActive && styles.activeLetterText,
                                ]}
                            >
                                {day.dayLetter}
                            </Text>

                            <Text
                                style={[
                                    styles.numberText,
                                    { color: numberColor },
                                    isActive && styles.activeNumberText,
                                ]}
                            >
                                {day.dayNumber}
                            </Text>

                            <View style={styles.statusSlot}>
                                {isCompleted ? (
                                    <MaterialIcons
                                        name="check-circle"
                                        size={16}
                                        color={isActive ? colors.onPrimary : (colors.primary || colors.statusSuccess)}
                                        testID={`weekly-pill-icon-completed-${day.dayKey}`}
                                    />
                                ) : isActive ? (
                                    <View
                                        style={[
                                            styles.activeDot,
                                            { backgroundColor: colors.secondaryContainer || '#ff9f1a' },
                                        ]}
                                        testID={`weekly-pill-dot-active-${day.dayKey}`}
                                    />
                                ) : isRest ? (
                                    <MaterialIcons
                                        name="hotel"
                                        size={15}
                                        color={colors.outline || colors.textSecondary}
                                        testID={`weekly-pill-icon-rest-${day.dayKey}`}
                                    />
                                ) : (
                                    <View
                                        style={[
                                            styles.scheduledDot,
                                            { backgroundColor: colors.outlineVariant || colors.textSecondary },
                                        ]}
                                        testID={`weekly-pill-dot-scheduled-${day.dayKey}`}
                                    />
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        marginVertical: 8,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        gap: 6,
        minWidth: '100%',
    },
    pill: {
        flex: 1,
        minWidth: 44,
        paddingVertical: 10,
        paddingHorizontal: 4,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    activePill: {
        borderWidth: 1.5,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        transform: [{ scale: 1.04 }],
    },
    restPill: {
        opacity: 0.75,
    },
    letterText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    activeLetterText: {
        fontWeight: '700',
        opacity: 0.9,
    },
    numberText: {
        fontSize: 14,
        fontWeight: '600',
    },
    activeNumberText: {
        fontWeight: '800',
        fontSize: 15,
    },
    statusSlot: {
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    scheduledDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        opacity: 0.6,
    },
});

export default WeeklyDayPillsCarousel;
