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
                style={[
                    styles.finishButton,
                    {
                        backgroundColor: colors.primaryContainer || colors.primary,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 3,
                        elevation: 3,
                    },
                ]}
                onPress={onFinishWorkout}
                disabled={saving}
                testID="finish-workout-button"
                activeOpacity={0.8}
            >
                {saving ? (
                    <ActivityIndicator color={colors.onPrimaryContainer || colors.background} />
                ) : (
                    <>
                        <MaterialIcons
                            name="check-circle"
                            size={22}
                            color={colors.onPrimaryContainer || colors.background}
                        />
                        <Text
                            style={[
                                styles.finishButtonText,
                                { color: colors.onPrimaryContainer || colors.background },
                            ]}
                        >
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
        paddingHorizontal: 4,
        paddingVertical: 16,
        marginBottom: 20,
    },
    finishButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
    },
    finishButtonText: {
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    },
});

export default WorkoutActions;
