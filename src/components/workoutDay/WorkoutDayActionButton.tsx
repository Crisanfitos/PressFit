import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { WorkoutStats } from './types';

interface WorkoutDayActionButtonProps {
    isToday?: boolean;
    hasContent: boolean;
    workoutStats: WorkoutStats | null;
    activeWorkout: any;
    onPress: () => void;
}

export const WorkoutDayActionButton: React.FC<WorkoutDayActionButtonProps> = ({
    isToday,
    hasContent,
    workoutStats,
    activeWorkout,
    onPress,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { colors } = theme;

    if (!isToday || !hasContent) {
        return null;
    }

    const styles = StyleSheet.create({
        bottomButton: {
            margin: 20,
            borderRadius: 16,
            overflow: 'hidden',
        },
        buttonGradient: {
            paddingVertical: 18,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
        },
        buttonText: {
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.background,
            marginLeft: 8,
        },
    });

    const getIconName = () => {
        if (workoutStats?.isCompleted) return 'edit';
        if (activeWorkout) return 'play-arrow';
        return 'play-circle-filled';
    };

    const getButtonLabel = () => {
        if (workoutStats?.isCompleted) {
            return t('workout.viewWorkout', 'Ver / Editar Entrenamiento');
        }
        if (activeWorkout) {
            return t('workout.continueWorkout', 'Continuar Entrenamiento');
        }
        return t('workout.startWorkout', 'Empezar Entrenamiento');
    };

    return (
        <TouchableOpacity
            style={styles.bottomButton}
            onPress={onPress}
            testID="start-workout-button"
        >
            <LinearGradient
                colors={[colors.primary, `${colors.primary}CC`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
            >
                <MaterialIcons
                    name={getIconName()}
                    size={24}
                    color={colors.background}
                />
                <Text style={styles.buttonText}>{getButtonLabel()}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );
};
