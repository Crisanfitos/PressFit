import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../types/theme';

export interface PhysicalProgressFabProps {
    colors: ThemeColors;
    label: string;
    onPress: () => void;
}

export const PhysicalProgressFab: React.FC<PhysicalProgressFabProps> = ({
    colors,
    label,
    onPress,
}) => {
    return (
        <TouchableOpacity style={styles.fab} onPress={onPress}>
            <View style={[styles.fabButton, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="add-a-photo" size={24} color={colors.background} />
                <Text style={[styles.fabText, { color: colors.background }]}>{label}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 16,
        zIndex: 10,
    },
    fabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 16,
        paddingRight: 24,
        paddingVertical: 14,
        borderRadius: 28,
        elevation: 8,
    },
    fabText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});

export default PhysicalProgressFab;
