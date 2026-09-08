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
    onSwapExercise?: (exercise: any) => void;
    getGhostValue: (exerciseId: string, setNumber: number, field: 'weight' | 'reps' | 'rpe') => string | null;
}

const ExerciseCardComponent: React.FC<ExerciseCardProps> = ({
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
    onSwapExercise,
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
                        {onSwapExercise && (
                            <TouchableOpacity
                                testID={`swap-exercise-button-${index}`}
                                style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                onPress={() => onSwapExercise(exercise)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <MaterialIcons name="swap-horiz" size={20} color={colors.primary} />
                            </TouchableOpacity>
                        )}
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

export const areExerciseCardPropsEqual = (
    prevProps: ExerciseCardProps,
    nextProps: ExerciseCardProps
): boolean => {
    // 1. Primitive and UI state comparisons
    if (
        prevProps.index !== nextProps.index ||
        prevProps.isCollapsed !== nextProps.isCollapsed ||
        prevProps.isInputEditable !== nextProps.isInputEditable ||
        prevProps.isStructureEditable !== nextProps.isStructureEditable ||
        prevProps.mode !== nextProps.mode ||
        prevProps.navMode !== nextProps.navMode
    ) {
        return false;
    }

    // 2. Exercise basic attributes
    const prevEx = prevProps.exercise;
    const nextEx = nextProps.exercise;
    if (
        prevEx.id !== nextEx.id ||
        prevEx.titulo !== nextEx.titulo ||
        prevEx.tipo_peso !== nextEx.tipo_peso ||
        prevEx.routine_exercise_id !== nextEx.routine_exercise_id
    ) {
        return false;
    }

    // 3. Theme colors comparison
    if (
        prevProps.colors.surface !== nextProps.colors.surface ||
        prevProps.colors.border !== nextProps.colors.border ||
        prevProps.colors.primary !== nextProps.colors.primary ||
        prevProps.colors.text !== nextProps.colors.text ||
        prevProps.colors.textSecondary !== nextProps.colors.textSecondary
    ) {
        return false;
    }

    // 4. Previous workout metadata (stale warning, etc.)
    if (
        prevProps.previousWorkout?.isStale !== nextProps.previousWorkout?.isStale ||
        prevProps.previousWorkout?.days_diff !== nextProps.previousWorkout?.days_diff
    ) {
        return false;
    }

    // 5. Sets list comparison
    const prevSets = prevEx.sets || prevEx.series || [];
    const nextSets = nextEx.sets || nextEx.series || [];

    if (prevSets.length !== nextSets.length) {
        return false;
    }

    for (let i = 0; i < nextSets.length; i++) {
        const p = prevSets[i];
        const n = nextSets[i];
        if (
            p.id !== n.id ||
            p.numero_serie !== n.numero_serie ||
            p.peso_utilizado !== n.peso_utilizado ||
            p.repeticiones !== n.repeticiones ||
            p.rpe !== n.rpe ||
            p.descanso_segundos !== n.descanso_segundos
        ) {
            return false;
        }
    }

    // 6. Rest timer & lastCompletedSetId localization
    // Only invalidate if this exercise contains the set that was marked completed
    const prevHadCompleted = prevProps.lastCompletedSetId
        ? prevSets.some((s: any) => s.id === prevProps.lastCompletedSetId)
        : false;
    const nextHasCompleted = nextProps.lastCompletedSetId
        ? nextSets.some((s: any) => s.id === nextProps.lastCompletedSetId)
        : false;

    if (prevHadCompleted !== nextHasCompleted) {
        return false;
    }

    if (nextHasCompleted) {
        if (
            prevProps.lastCompletedSetId !== nextProps.lastCompletedSetId ||
            prevProps.restTimerVisible !== nextProps.restTimerVisible
        ) {
            return false;
        }
    }

    // 7. savedTimerSetIds localization
    for (const set of nextSets) {
        if (set.id) {
            const wasSaved = prevProps.savedTimerSetIds?.has(set.id);
            const isSaved = nextProps.savedTimerSetIds?.has(set.id);
            if (wasSaved !== isSaved) {
                return false;
            }
        }
    }

    return true;
};

export const ExerciseCard: React.FC<ExerciseCardProps> = React.memo(
    ExerciseCardComponent,
    areExerciseCardPropsEqual
);

export default ExerciseCard;

