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
    return (
        <View style={styles.calendarContainer} testID="calendar-grid-container">
            <WeekHeader
                weekDays={weekDays}
                daySize={daySize}
                textColor={colors.textSecondary}
            />

            <View style={styles.calendarGrid}>
                {calendarDays.map((day, index) => {
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
        </View>
    );
};

const styles = StyleSheet.create({
    calendarContainer: {
        paddingHorizontal: 20,
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
});
