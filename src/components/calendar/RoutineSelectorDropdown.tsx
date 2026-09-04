import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { WeeklyRoutine } from './calendarTypes';

export interface RoutineSelectorDropdownProps {
    selectedRoutine: WeeklyRoutine | null;
    routines: WeeklyRoutine[];
    showRoutineSelector: boolean;
    dropdownHeight: Animated.Value;
    colors: any;
    placeholderText?: string;
    onToggle: () => void;
    onSelectRoutine: (routine: WeeklyRoutine) => void;
    onActivateRoutine: (routineId: string) => void;
}

export const RoutineSelectorDropdown: React.FC<RoutineSelectorDropdownProps> = ({
    selectedRoutine,
    routines,
    showRoutineSelector,
    dropdownHeight,
    colors,
    placeholderText = 'Seleccionar Rutina',
    onToggle,
    onSelectRoutine,
    onActivateRoutine,
}) => {
    return (
        <View
            style={[
                styles.routineSelector,
                { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
        >
            <TouchableOpacity
                style={styles.routineSelectorButton}
                onPress={onToggle}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                testID="routine-selector-button"
            >
                <MaterialIcons name="fitness-center" size={24} color={colors.primary} />
                <Text style={[styles.routineSelectorText, { color: colors.text }]}>
                    {selectedRoutine?.nombre || placeholderText}
                </Text>
                <MaterialIcons
                    name={showRoutineSelector ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                    size={24}
                    color={colors.textSecondary}
                    style={styles.routineSelectorIcon}
                />
            </TouchableOpacity>

            <Animated.View
                style={[
                    styles.dropdownContainer,
                    { height: dropdownHeight, backgroundColor: colors.surface },
                ]}
            >
                {routines.map((routine) => (
                    <View
                        key={routine.id}
                        style={[styles.dropdownItem, { borderTopColor: colors.border }]}
                    >
                        <TouchableOpacity
                            style={{ flex: 1 }}
                            onPress={() => {
                                onSelectRoutine(routine);
                                onToggle();
                            }}
                            testID={`routine-item-${routine.id}`}
                        >
                            <Text
                                style={[
                                    styles.dropdownItemText,
                                    routine.activa
                                        ? { color: colors.text, fontWeight: '600' }
                                        : { color: colors.textSecondary },
                                ]}
                            >
                                {routine.nombre}
                            </Text>
                        </TouchableOpacity>
                        {routine.activa ? (
                            <MaterialIcons
                                name="check-circle"
                                size={22}
                                color={colors.primary}
                                testID={`routine-active-check-${routine.id}`}
                            />
                        ) : (
                            <TouchableOpacity
                                onPress={() => onActivateRoutine(routine.id)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                testID={`routine-activate-button-${routine.id}`}
                            >
                                <MaterialIcons
                                    name="radio-button-unchecked"
                                    size={22}
                                    color={colors.textSecondary}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    routineSelector: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        borderWidth: 1,
    },
    routineSelectorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    routineSelectorText: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
        marginLeft: 8,
    },
    routineSelectorIcon: {
        marginLeft: 8,
    },
    dropdownContainer: {
        overflow: 'hidden',
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderTopWidth: 1,
    },
    dropdownItemText: {
        fontSize: 16,
        flex: 1,
    },
});
