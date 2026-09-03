import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../types/theme';
import { WeightTypeBadge } from '../WeightTypeBadge';
import { PersonalNoteButton } from '../PersonalNoteButton';
import WorkoutSetRow from '../WorkoutSetRow';
import { TipoPeso, TIPO_PESO_SHORT_LABELS } from '../../types/setTypes';

export interface ExerciseCardProps {
    exercise: {
        id: string;
        titulo: string;
        tipo_peso?: TipoPeso;
        routine_exercise_id: string;
        sets?: any[];
        series?: any[];
    };
    index: number;
    isCollapsed: boolean;
    isInputEditable: boolean;
    isStructureEditable: boolean;
    mode: string;
    navMode?: string;
    colors: ThemeColors;
    previousWorkout: any;
    lastCompletedSetId: string | null;
    restTimerVisible: boolean;
    savedTimerSetIds: Set<string>;
    onToggleCollapse: (exerciseId: string) => void;
    onUpdateWeightType: (routineExerciseId: string, exerciseId: string, tipo: TipoPeso) => void;
    onNavigateDetail: (exerciseId: string) => void;
    onDeleteExercise: (exerciseId: string, exerciseName: string, routineExerciseId: string) => void;
    onSetChange: (setId: string, field: string, value: string) => void;
    onDeleteSet: (setId: string, exerciseId: string) => void;
    onStartRestTimer: (setId: string) => void;
    onAddSet: (exerciseId: string) => void;
    getGhostValue: (exerciseId: string, setNumber: number, field: 'weight' | 'reps' | 'rpe') => string | null;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
    exercise,
    index,
    isCollapsed,
    isInputEditable,
    isStructureEditable,
    mode,
    navMode,
    colors,
    previousWorkout,
    lastCompletedSetId,
    restTimerVisible,
    savedTimerSetIds,
    onToggleCollapse,
    onUpdateWeightType,
    onNavigateDetail,
    onDeleteExercise,
    onSetChange,
    onDeleteSet,
    onStartRestTimer,
    onAddSet,
    getGhostValue,
}) => {
    const setsList = exercise.sets || exercise.series || [];

    return (
        <View style={[styles.exerciseCard, { backgroundColor: colors.surface, borderColor: colors.border }]} testID={`exercise-card-${index}`}>
            <TouchableOpacity onPress={() => onToggleCollapse(exercise.id)} activeOpacity={0.7}>
                <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseHeaderLeft}>
                        <MaterialIcons
                            name={isCollapsed ? 'expand-more' : 'expand-less'}
                            size={24}
                            color={colors.primary}
                            style={styles.collapseIcon}
                        />
                        <View style={{ flex: 1, flexDirection: 'column' }}>
                            <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={2}>
                                {exercise.titulo}
                            </Text>
                            <View style={styles.badgesRow}>
                                <WeightTypeBadge
                                    tipoPeso={exercise.tipo_peso || 'total'}
                                    editable={isInputEditable}
                                    onSelect={(tipo) => onUpdateWeightType(exercise.routine_exercise_id, exercise.id, tipo)}
                                    colors={colors}
                                />
                                {previousWorkout?.isStale && (
                                    <View style={styles.staleBadge} testID="stale-badge">
                                        <MaterialIcons name="schedule" size={12} color="#92400e" style={{ marginRight: 2 }} />
                                        <Text style={styles.staleBadgeText}>
                                            Referencia de hace {previousWorkout.days_diff ?? '15+'} días
                                        </Text>
                                    </View>
                                )}
                                <PersonalNoteButton exerciseId={exercise.id} />
                            </View>
                        </View>
                    </View>
                    <View style={styles.exerciseActions}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            onPress={() => onNavigateDetail(exercise.id)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <MaterialIcons name="info-outline" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                        {isStructureEditable && (
                            <TouchableOpacity
                                testID={`delete-exercise-button-${index}`}
                                style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: '#fee2e2' }]}
                                onPress={() => onDeleteExercise(exercise.id, exercise.titulo, exercise.routine_exercise_id)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </TouchableOpacity>

            {!isCollapsed && (
                <View style={styles.setsContainer}>
                    {/* Header Row */}
                    <View style={[styles.setRow, { marginBottom: 8 }]}>
                        <Text style={[styles.setNumber, { color: colors.textSecondary, fontSize: 12 }]}>Serie</Text>
                        <View style={[styles.inputGroup, { maxWidth: 80 }]}>
                            <Text style={[styles.referenceText, { color: colors.primary }]}>
                                {TIPO_PESO_SHORT_LABELS[exercise.tipo_peso || 'total']}
                            </Text>
                        </View>
                        <View style={[styles.inputGroup, { maxWidth: 80 }]}>
                            <Text style={[styles.referenceText, { color: colors.primary }]}>REPS</Text>
                        </View>
                        <View style={[styles.inputGroup, { maxWidth: 60 }]}>
                            <Text style={[styles.referenceText, { color: colors.primary }]}>RPE</Text>
                        </View>
                        {isStructureEditable && <View style={{ width: 28 }} />}
                    </View>

                    {setsList.length === 0 ? (
                        <View style={styles.emptySetsContainer}>
                            <Text style={[styles.emptySetsText, { color: colors.textSecondary }]}>
                                No hay series todavía
                            </Text>
                        </View>
                    ) : (
                        setsList.map((set: any, setIndex: number) => (
                            <WorkoutSetRow
                                key={set.id || setIndex}
                                set={set}
                                setIndex={setIndex}
                                exerciseId={exercise.id}
                                tipoPeso={exercise.tipo_peso || 'total'}
                                ghostWeight={getGhostValue(exercise.id, set.numero_serie, 'weight')}
                                ghostReps={getGhostValue(exercise.id, set.numero_serie, 'reps')}
                                ghostRpe={getGhostValue(exercise.id, set.numero_serie, 'rpe')}
                                isInputEditable={isInputEditable}
                                isStructureEditable={isStructureEditable}
                                colors={colors}
                                navMode={navMode}
                                lastCompletedSetId={lastCompletedSetId}
                                restTimerVisible={restTimerVisible}
                                savedTimerSetIds={savedTimerSetIds}
                                onSetChange={onSetChange}
                                onDeleteSet={onDeleteSet}
                                onStartRestTimer={onStartRestTimer}
                            />
                        ))
                    )}

                    {(isStructureEditable || (isInputEditable && mode !== 'ACTIVE')) && (
                        <TouchableOpacity
                            testID={`add-set-button-${index}`}
                            style={[
                                styles.addSetButton,
                                {
                                    backgroundColor: `${colors.primary}20`,
                                    borderColor: colors.primary,
                                },
                            ]}
                            onPress={() => onAddSet(exercise.id)}
                        >
                            <MaterialIcons name="add" size={16} color={colors.primary} />
                            <Text style={[styles.addSetText, { color: colors.primary }]}>Añadir Series</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    exerciseCard: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    exerciseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    exerciseHeaderLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    collapseIcon: {
        marginRight: 8,
        marginTop: 2,
        alignSelf: 'flex-start',
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    badgesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        flexWrap: 'wrap',
        gap: 8,
    },
    exerciseActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    setsContainer: {
        marginTop: 16,
    },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    setNumber: {
        width: 40,
        fontSize: 16,
        textAlign: 'center',
    },
    inputGroup: {
        flex: 1,
        marginHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    referenceText: {
        fontSize: 11,
        textAlign: 'center',
        marginTop: 4,
    },
    emptySetsContainer: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    emptySetsText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    addSetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderStyle: 'dashed',
        marginTop: 8,
        gap: 6,
    },
    addSetText: {
        fontSize: 14,
        fontWeight: '600',
    },
    staleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef3c7',
        borderColor: '#f59e0b',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    staleBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#92400e',
    },
});

export default ExerciseCard;
