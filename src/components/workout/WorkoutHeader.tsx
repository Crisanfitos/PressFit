import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../types/theme';

export interface WorkoutHeaderProps {
    dayName?: string;
    fechaDia?: string;
    descripcion?: string;
    routineDayId?: string;
    workoutId?: string;
    colors: ThemeColors;
    onBack: () => void;
}

export const WorkoutHeader: React.FC<WorkoutHeaderProps> = ({
    dayName,
    fechaDia,
    descripcion,
    routineDayId,
    workoutId,
    colors,
    onBack,
}) => {
    const formattedDate = fechaDia
        ? ` — ${new Date(fechaDia + 'T00:00:00').getDate()}/${(new Date(fechaDia + 'T00:00:00').getMonth() + 1).toString().padStart(2, '0')}`
        : '';

    return (
        <Reanimated.View
            style={[styles.header, { borderBottomColor: colors.border }]}
            sharedTransitionTag={`workout-header-${routineDayId || workoutId || 'active'}`}
        >
            <View style={styles.headerRow}>
                <TouchableOpacity
                    testID="workout-back-button"
                    style={styles.backButton}
                    onPress={onBack}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Text style={[styles.headerText, { color: colors.text }]}>
                        {dayName || 'Entrenamiento'}
                        {formattedDate}
                    </Text>
                    {descripcion ? (
                        <Text style={[styles.descriptionText, { color: colors.primary }]}>
                            {descripcion}
                        </Text>
                    ) : null}
                </View>
            </View>
        </Reanimated.View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    titleContainer: {
        marginLeft: 12,
    },
    headerText: {
        fontSize: 18,
        fontWeight: '600',
    },
    descriptionText: {
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 2,
    },
});

export default WorkoutHeader;
