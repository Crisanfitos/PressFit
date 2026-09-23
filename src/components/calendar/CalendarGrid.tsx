import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CalendarDay, DayStyleInfo } from './calendarTypes';
import { WeekHeader } from './WeekHeader';
import { DayCell } from './DayCell';
import { calculateDayStyle } from './calendarUtils';

export interface CalendarGridProps {
    calendarDays: CalendarDay[];
    weekDays: string[];
    completedDays: Set<string>;
    inProgressDays: Set<string>;
    isCurrentMonth: boolean;
    daySize: number;
    colors: any;
    isInCurrentWeekFn?: (date: Date) => boolean;
    onDayPress: (date: Date | null) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
    calendarDays,
    weekDays,
    completedDays,
    inProgressDays,
    isCurrentMonth,
    daySize,
    colors,
    isInCurrentWeekFn,
    onDayPress,
}) => {
    const weeks = React.useMemo(() => {
        const result: CalendarDay[][] = [];
        for (let i = 0; i < calendarDays.length; i += 7) {
            result.push(calendarDays.slice(i, i + 7));
        }
        return result;
    }, [calendarDays]);

    return (
        <View style={styles.calendarContainer} testID="calendar-grid-container">
            <WeekHeader
                weekDays={weekDays}
                daySize={daySize}
                textColor={colors.textSecondary}
            />

            <View style={styles.calendarGrid}>
                {weeks.map((week, weekIndex) => (
                    <View key={weekIndex} style={styles.weekRow}>
                        {week.map((day, dayIndex) => {
                            const index = weekIndex * 7 + dayIndex;
                            const dayStyle: DayStyleInfo | null = day.date
                                ? calculateDayStyle(day.date, completedDays, inProgressDays, isInCurrentWeekFn)
                                : null;

                            return (
                                <DayCell
                                    key={index}
                                    day={day}
                                    index={index}
                                    dayStyle={dayStyle}
                                    isCurrentMonth={isCurrentMonth}
                                    daySize={daySize}
                                    colors={colors}
                                    onPress={onDayPress}
                                />
                            );
                        })}
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    calendarContainer: {
        width: '100%',
    },
    calendarGrid: {
        width: '100%',
    },
    weekRow: {
        flexDirection: 'row',
        width: '100%',
    },
});
