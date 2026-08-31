import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import SetInput from './SetInput';
import { HapticService } from '../services/HapticService';
import { TipoPeso } from '../types/setTypes';

export interface SetData {
    id: string;
    ejercicio_programado_id?: string;
    numero_serie: number;
    peso_utilizado: number;
    repeticiones: number;
    rpe?: number;
    descanso_segundos?: number;
}

export interface WorkoutSetRowProps {
    set: SetData;
    setIndex: number;
    exerciseId: string;
    tipoPeso: TipoPeso;
    ghostWeight?: string | null;
    ghostReps?: string | null;
    ghostRpe?: string | null;
    isInputEditable: boolean;
    isStructureEditable: boolean;
    colors: {
        background: string;
        surface: string;
        surfaceHighlight: string;
        text: string;
        textSecondary: string;
        primary: string;
        border: string;
        inputBackground?: string;
        [key: string]: any;
    };
    navMode?: string;
    lastCompletedSetId?: string | null;
    restTimerVisible?: boolean;
    savedTimerSetIds?: Set<string>;
    onSetChange: (setId: string, field: string, value: string) => void;
    onDeleteSet?: (setId: string, exerciseId: string) => void;
    onStartRestTimer?: (setId: string) => void;
}

const WorkoutSetRow: React.FC<WorkoutSetRowProps> = ({
    set,
    setIndex,
    exerciseId,
    tipoPeso,
    ghostWeight,
    ghostReps,
    ghostRpe,
    isInputEditable,
    isStructureEditable,
    colors,
    navMode,
    lastCompletedSetId,
    restTimerVisible,
    savedTimerSetIds,
    onSetChange,
    onDeleteSet,
    onStartRestTimer,
}) => {
    const isBodyweight = tipoPeso === 'corporal';

    const handleQuickAdjustWeight = (delta: number) => {
        HapticService.selection();
        const current = set.peso_utilizado > 0
            ? set.peso_utilizado
            : (ghostWeight ? parseFloat(ghostWeight) || 0 : 0);
        const nextVal = Math.max(0, parseFloat((current + delta).toFixed(1)));
        const valStr = nextVal % 1 === 0 ? String(nextVal) : String(nextVal);
        onSetChange(set.id, 'weight', valStr);
    };

    const handleQuickAdjustReps = (delta: number) => {
        HapticService.selection();
        const current = set.repeticiones > 0
            ? set.repeticiones
            : (ghostReps ? parseInt(ghostReps, 10) || 0 : 0);
        const nextVal = Math.max(0, current + delta);
        onSetChange(set.id, 'reps', String(nextVal));
    };

    const isActiveTimer = lastCompletedSetId === set.id && restTimerVisible;
    const hasSavedTimerValue = set.descanso_segundos && set.descanso_segundos > 0;
    const isSaved = Boolean(hasSavedTimerValue);
    const isLocallySaved = savedTimerSetIds ? savedTimerSetIds.has(set.id) : false;
    const disableInteraction = isSaved || isLocallySaved;

    const timerColor = isActiveTimer
        ? colors.primary
        : disableInteraction
            ? '#22c55e'
            : colors.textSecondary;

    return (
        <View style={styles.container} testID={`set-row-${setIndex}`}>
            <View style={styles.mainRow}>
                <Text style={[styles.setNumber, { color: colors.textSecondary }]}>
                    {set.numero_serie}
                </Text>

                {/* Weight Column */}
                <View style={[styles.inputGroup, { maxWidth: 80 }]}>
                    {isBodyweight ? (
                        <View
                            style={[
                                styles.bodyweightPlaceholder,
                                { backgroundColor: colors.surfaceHighlight, borderColor: colors.border },
                            ]}
                        >
                            <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '600' }}>
                                BW
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.inputWithControls}>
                            <SetInput
                                testID={`set-weight-input-${setIndex}`}
                                value={set.peso_utilizado > 0 ? set.peso_utilizado : ''}
                                placeholder={ghostWeight ?? '-'}
                                onChange={(val) => onSetChange(set.id, 'weight', val)}
                                isEditable={isInputEditable}
                                colors={colors}
                                maxLength={5}
                            />
                            {isInputEditable && (
                                <View style={styles.quickAdjustRow}>
                                    <TouchableOpacity
                                        testID={`quick-adjust-weight-minus-${setIndex}`}
                                        style={[
                                            styles.quickAdjustBtn,
                                            { backgroundColor: colors.surfaceHighlight, borderColor: colors.border },
                                        ]}
                                        onPress={() => handleQuickAdjustWeight(-2.5)}
                                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                    >
                                        <Text style={[styles.quickAdjustText, { color: colors.primary }]}>-2.5</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        testID={`quick-adjust-weight-plus-${setIndex}`}
                                        style={[
                                            styles.quickAdjustBtn,
                                            { backgroundColor: colors.surfaceHighlight, borderColor: colors.border },
                                        ]}
                                        onPress={() => handleQuickAdjustWeight(2.5)}
                                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                    >
                                        <Text style={[styles.quickAdjustText, { color: colors.primary }]}>+2.5</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Reps Column */}
                <View style={[styles.inputGroup, { maxWidth: 80 }]}>
                    <View style={styles.inputWithControls}>
                        <SetInput
                            testID={`set-reps-input-${setIndex}`}
                            value={set.repeticiones > 0 ? set.repeticiones : ''}
                            placeholder={ghostReps ?? '-'}
                            onChange={(val) => onSetChange(set.id, 'reps', val)}
                            isEditable={isInputEditable}
                            colors={colors}
                            maxLength={3}
                        />
                        {isInputEditable && (
                            <View style={styles.quickAdjustRow}>
                                <TouchableOpacity
                                    testID={`quick-adjust-reps-minus-${setIndex}`}
                                    style={[
                                        styles.quickAdjustBtn,
                                        { backgroundColor: colors.surfaceHighlight, borderColor: colors.border },
                                    ]}
                                    onPress={() => handleQuickAdjustReps(-1)}
                                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                >
                                    <Text style={[styles.quickAdjustText, { color: colors.primary }]}>-1</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    testID={`quick-adjust-reps-plus-${setIndex}`}
                                    style={[
                                        styles.quickAdjustBtn,
                                        { backgroundColor: colors.surfaceHighlight, borderColor: colors.border },
                                    ]}
                                    onPress={() => handleQuickAdjustReps(1)}
                                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                >
                                    <Text style={[styles.quickAdjustText, { color: colors.primary }]}>+1</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                {/* RPE Column */}
                <View style={[styles.inputGroup, { maxWidth: 60 }]}>
                    <SetInput
                        testID={`set-rpe-input-${setIndex}`}
                        value={set.rpe && set.rpe > 0 ? set.rpe : ''}
                        placeholder={ghostRpe ?? '-'}
                        onChange={(val) => onSetChange(set.id, 'rpe', val)}
                        isEditable={isInputEditable}
                        colors={colors}
                        maxLength={2}
                    />
                </View>

                {/* Delete Set Button */}
                {isStructureEditable && onDeleteSet && (
                    <TouchableOpacity
                        testID={`delete-set-button-${setIndex}`}
                        style={styles.deleteSetButton}
                        onPress={() => onDeleteSet(set.id, exerciseId)}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    >
                        <MaterialIcons name="close" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                )}

                {/* Rest Timer Button */}
                {navMode !== 'edit' && onStartRestTimer && (
                    <TouchableOpacity
                        testID={`set-complete-checkbox-${setIndex}`}
                        style={styles.timerButton}
                        onPress={() => onStartRestTimer(set.id)}
                        disabled={disableInteraction}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <MaterialIcons
                            name={disableInteraction ? 'timer-off' : 'timer'}
                            size={18}
                            color={timerColor}
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
    },
    mainRow: {
        flexDirection: 'row',
        alignItems: 'center',
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
    inputWithControls: {
        width: '100%',
        alignItems: 'center',
    },
    bodyweightPlaceholder: {
        width: '100%',
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickAdjustRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 4,
        gap: 4,
    },
    quickAdjustBtn: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 4,
        paddingVertical: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickAdjustText: {
        fontSize: 10,
        fontWeight: '700',
    },
    deleteSetButton: {
        padding: 4,
        marginLeft: 6,
    },
    timerButton: {
        padding: 4,
        marginLeft: 4,
    },
});

export default WorkoutSetRow;
