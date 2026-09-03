import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../types/theme';

export interface PhysicalProgressEmptyStateProps {
    message: string;
    colors: ThemeColors;
}

export const PhysicalProgressEmptyState: React.FC<PhysicalProgressEmptyStateProps> = ({
    message,
    colors,
}) => {
    return (
        <View style={styles.emptyState}>
            <MaterialIcons name="photo-camera" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>{message}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyStateText: {
        marginTop: 16,
        fontSize: 14,
    },
});

export default PhysicalProgressEmptyState;
