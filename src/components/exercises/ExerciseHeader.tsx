import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../types/theme';

export interface ExerciseHeaderProps {
    isSelectionMode: boolean;
    selectedCount: number;
    saving: boolean;
    colors: ThemeColors;
    onBack: () => void;
    onClearSelection: () => void;
    onConfirmSelection: () => void;
    onOpenCreateModal: () => void;
}

export const ExerciseHeader: React.FC<ExerciseHeaderProps> = ({
    isSelectionMode,
    selectedCount,
    saving,
    colors,
    onBack,
    onClearSelection,
    onConfirmSelection,
    onOpenCreateModal,
}) => {
    return (
        <View style={styles.header}>
            {isSelectionMode ? (
                <TouchableOpacity onPress={onClearSelection} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                    <MaterialIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    testID="exercise-library-back-button"
                    onPress={onBack}
                    style={styles.backButton}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
            )}

            <Text style={[styles.headerText, { color: colors.text }]}>
                {isSelectionMode ? `${selectedCount} Seleccionados` : 'Biblioteca de Ejercicios'}
            </Text>

            {isSelectionMode ? (
                <TouchableOpacity
                    testID="confirm-exercise-selection-button"
                    onPress={onConfirmSelection}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <MaterialIcons name="check" size={24} color={colors.primary} />
                    )}
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    testID="open-create-custom-exercise-button"
                    onPress={onOpenCreateModal}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <MaterialIcons name="add" size={24} color={colors.primary} />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingBottom: 12,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default ExerciseHeader;
