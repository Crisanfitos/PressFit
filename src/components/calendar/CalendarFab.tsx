import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export interface CalendarFabProps {
    colors: any;
    onPress: () => void;
}

export const CalendarFab: React.FC<CalendarFabProps> = ({ colors, onPress }) => {
    const GradientComponent = LinearGradient || View;
    return (
        <TouchableOpacity
            testID="edit-routine-fab"
            style={styles.fab}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <GradientComponent
                colors={[colors.primary, colors.primaryDark || `${colors.primary}DD`]}
                style={[StyleSheet.absoluteFill, { borderRadius: 30 }]}
            />
            <MaterialIcons name="edit" size={28} color={colors.textOnPrimary || '#fff'} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});

export default CalendarFab;
