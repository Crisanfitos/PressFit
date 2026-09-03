import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../types/theme';

export interface PhysicalProgressHeaderProps {
    isSelectionMode: boolean;
    selectedCount: number;
    title: string;
    colors: ThemeColors;
    onBack: () => void;
    onClearSelection: () => void;
    onDeleteSelected: () => void;
}

export const PhysicalProgressHeader: React.FC<PhysicalProgressHeaderProps> = ({
    isSelectionMode,
    selectedCount,
    title,
    colors,
    onBack,
    onClearSelection,
    onDeleteSelected,
}) => {
    if (isSelectionMode) {
        return (
            <View style={[styles.selectionHeader, { backgroundColor: colors.primary }]}>
                <TouchableOpacity onPress={onClearSelection} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <MaterialIcons name="close" size={24} color={colors.background} />
                </TouchableOpacity>
                <Text style={[styles.selectionText, { color: colors.background }]}>
                    {selectedCount} seleccionadas
                </Text>
                <TouchableOpacity onPress={onDeleteSelected} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <MaterialIcons name="delete" size={24} color={colors.background} />
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
                onPress={onBack}
                style={styles.backButton}
                testID="physical-progress-back-button"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
                <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerText, { color: colors.text }]}>{title}</Text>
            <View style={{ width: 24 }} />
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    selectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    selectionText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default PhysicalProgressHeader;
