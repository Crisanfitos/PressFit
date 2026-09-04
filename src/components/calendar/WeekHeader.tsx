import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface WeekHeaderProps {
    weekDays: string[];
    daySize: number;
    textColor: string;
}

export const WeekHeader: React.FC<WeekHeaderProps> = ({ weekDays, daySize, textColor }) => {
    return (
        <View style={styles.weekDaysRow} testID="week-header-row">
            {weekDays.map((day, index) => (
                <Text
                    key={index}
                    style={[styles.weekDayLabel, { width: daySize, color: textColor }]}
                    testID={`weekday-header-${index}`}
                >
                    {day}
                </Text>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    weekDaysRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    weekDayLabel: {
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '600',
    },
});
