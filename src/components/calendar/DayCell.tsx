import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CalendarDay, DayStyleInfo } from './calendarTypes';

export interface DayCellProps {
    day: CalendarDay;
    index: number;
    dayStyle: DayStyleInfo | null;
    isCurrentMonth: boolean;
    daySize: number;
    colors: any;
    onPress: (date: Date | null) => void;
}

export const DayCell: React.FC<DayCellProps> = ({
    day,
    index,
    dayStyle,
    isCurrentMonth,
    daySize,
    colors,
    onPress,
}) => {
    const isFuture = dayStyle?.isFuture ?? false;
    const isToday = dayStyle?.isToday ?? false;
    const isPast = dayStyle?.isPast ?? false;
    const isCompleted = dayStyle?.isCompleted ?? false;
    const isInProgress = dayStyle?.isInProgress ?? false;

    let testID = `calendar-day-${index}`;
    if (isToday) {
        testID = 'calendar-day-today';
    } else if (isPast) {
        testID = 'calendar-day-past';
    } else if (isFuture) {
        testID = 'calendar-day-future';
    }

    const cellInnerSize = daySize - 8;

    return (
        <TouchableOpacity
            style={[styles.dayCell, { width: daySize, height: daySize }]}
            onPress={() => onPress(day.date)}
            disabled={!day.date || isFuture}
            activeOpacity={isFuture ? 1 : 0.7}
            testID={testID}
        >
            {dayStyle?.inCurrentWeek && isCurrentMonth && (
                <View
                    style={[
                        styles.weekHighlight,
                        { backgroundColor: `${colors.primary}15` },
                    ]}
                />
            )}
            <View
                style={[
                    styles.dayInner,
                    {
                        width: cellInnerSize,
                        height: cellInnerSize,
                        borderRadius: cellInnerSize / 2,
                    },
                    // Completed takes priority (including today if completed)
                    isCompleted && {
                        backgroundColor: colors.timelineCompleted || colors.statusSuccess,
                    },
                    // In Progress takes priority
                    isInProgress && !isCompleted && {
                        backgroundColor: colors.timelineInProgress || colors.statusWarning,
                    },
                    // Today only if not completed and not in progress
                    isToday && !isCompleted && !isInProgress && {
                        backgroundColor: colors.primary,
                    },
                    // Missed (past and not completed/in progress/today)
                    isPast && !isCompleted && !isInProgress && !isToday && {
                        backgroundColor: `${colors.statusError}30`,
                    },
                    isFuture && {
                        opacity: 0.4,
                    },
                ]}
            >
                <Text
                    style={[
                        styles.dayText,
                        { color: colors.text },
                        // White text for colored backgrounds
                        (isCompleted || isInProgress) && { color: '#fff', fontWeight: 'bold' },
                        isToday && !isCompleted && !isInProgress && {
                            color: colors.textOnPrimary,
                            fontWeight: 'bold',
                        },
                        isFuture && { color: colors.textSecondary },
                    ]}
                >
                    {day.dayNumber}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    dayCell: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    dayInner: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayText: {
        fontSize: 14,
        fontWeight: '500',
    },
    weekHighlight: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 8,
    },
});
