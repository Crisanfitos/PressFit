import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../types/theme';

export interface WorkoutPlaceholderProps {
    isStructureEditable: boolean;
    colors: ThemeColors;
    t: (key: string, defaultValue?: string) => string;
    onAddExercise: () => void;
}

export const WorkoutPlaceholder: React.FC<WorkoutPlaceholderProps> = ({
    isStructureEditable,
    colors,
    t,
    onAddExercise,
}) => {
    return (
        <View style={styles.placeholderContainer}>
            <View style={[styles.placeholderIconContainer, { backgroundColor: `${colors.primary}20` }]}>
                <MaterialIcons name="fitness-center" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.placeholderTitle, { color: colors.text }]}>¡Día libre de ejercicios!</Text>
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                {t('workout.noScheduledExercises', 'No hay ejercicios programados.')}
                {isStructureEditable && ' Añade ejercicios para comenzar.'}
            </Text>
            {isStructureEditable && (
                <TouchableOpacity
                    testID="add-exercise-button"
                    style={[styles.addExerciseButton, { backgroundColor: colors.primary }]}
                    onPress={onAddExercise}
                >
                    <MaterialIcons name="add" size={24} color={colors.background} />
                    <Text style={[styles.addExerciseButtonText, { color: colors.background }]}>
                        {t('workout.addExercise', 'Añadir Ejercicio')}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    placeholderIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    placeholderTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },
    placeholderText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    addExerciseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 9999,
    },
    addExerciseButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default WorkoutPlaceholder;
