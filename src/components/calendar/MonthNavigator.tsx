import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface MonthNavigatorProps {
    monthTitle: string;
    colors: any;
    onPrevMonth: () => void;
    onNextMonth: () => void;
}

export const MonthNavigator: React.FC<MonthNavigatorProps> = ({
    monthTitle,
    colors,
    onPrevMonth,
    onNextMonth,
}) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.surface }]}
                onPress={onPrevMonth}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                testID="prev-month-button"
            >
                <MaterialIcons name="chevron-left" size={28} color={colors.text} />
            </TouchableOpacity>

            <Text style={[styles.title, { color: colors.text }]} testID="month-title">
                {monthTitle}
            </Text>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.surface }]}
                onPress={onNextMonth}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                testID="next-month-button"
            >
                <MaterialIcons name="chevron-right" size={28} color={colors.text} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    button: {
        padding: 8,
        borderRadius: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
    },
});
