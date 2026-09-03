import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../types/theme';

export interface WorkoutActionsProps {
    mode: string;
    navMode?: string;
    saving: boolean;
    colors: ThemeColors;
    t: (key: string, defaultValue?: string) => string;
    onFinishWorkout: () => void;
}

export const WorkoutActions: React.FC<WorkoutActionsProps> = ({
    mode,
    navMode,
    saving,
    colors,
    t,
    onFinishWorkout,
}) => {
    if (mode !== 'ACTIVE' || navMode === 'edit') {
        return null;
    }

    return (
        <View style={styles.finishButtonContainer}>
            <TouchableOpacity
                style={[styles.finishButton, { backgroundColor: colors.primary }]}
                onPress={onFinishWorkout}
                disabled={saving}
                testID="finish-workout-button"
            >
                {saving ? (
                    <ActivityIndicator color={colors.background} />
                ) : (
                    <>
                        <MaterialIcons name="check-circle" size={24} color={colors.background} />
                        <Text style={[styles.finishButtonText, { color: colors.background }]}>
                            {t('workout.finishWorkout', 'Finalizar Entrenamiento')}
                        </Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    finishButtonContainer: {
        padding: 16,
        marginBottom: 20,
    },
    finishButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
    },
    finishButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default WorkoutActions;
