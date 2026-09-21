import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet, Alert, Keyboard } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import SetInput from './SetInput';
import { HapticService } from '../services/HapticService';
import { TipoPeso, SetType, SET_TYPE_COLORS } from '../types/setTypes';
import { validateRpe } from '../utils/rpeValidation';
import SetTypePickerModal from './workout/SetTypePickerModal';
import { SetActionModal } from './workout/SetActionModal';
import PRBadge from './workout/PRBadge';

export interface SetData {
    id: string;
    ejercicio_programado_id?: string;
    numero_serie: number;
    peso_utilizado: number;
    repeticiones: number;
    rpe?: number;
    descanso_segundos?: number;
    tipo_serie?: SetType;
    is_completed?: boolean;
    completada?: boolean;
    is_pr?: boolean;
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
    canDelete?: boolean;
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
    mode?: string;
    navMode?: string;
    lastCompletedSetId?: string | null;
    restTimerVisible?: boolean;
    savedTimerSetIds?: Set<string>;
    onOpenPlateCalculator?: (weight: number, setId: string, exerciseId?: string) => void;
    onSelectSetType?: (setId: string, type: SetType) => void;
    onToggleCompleteSet?: (setId: string, isCompleted: boolean) => void;
    onSetChange: (setId: string, field: string, value: string) => void;
    onDeleteSet?: (setId: string, exerciseId: string) => void;
    onDuplicateSet?: (setId: string, exerciseId: string) => void;
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
    canDelete,
    colors,
    mode,
    navMode,
    lastCompletedSetId,
    restTimerVisible,
    savedTimerSetIds,
    onOpenPlateCalculator,
    onSelectSetType,
    onToggleCompleteSet,
    onSetChange,
    onDeleteSet,
    onDuplicateSet,
    onStartRestTimer,
}) => {
    const { t } = useTranslation();
    const isBodyweight = tipoPeso === 'corporal';
    const [isTypePickerVisible, setIsTypePickerVisible] = useState(false);
    const [isActionModalVisible, setIsActionModalVisible] = useState(false);

    const isCompleted = Boolean(set.is_completed || set.completada);
    const effectiveInputEditable = isInputEditable && !isCompleted;

    const currentSetType: SetType = set.tipo_serie || 'normal';
    const typeVisual = SET_TYPE_COLORS[currentSetType] || SET_TYPE_COLORS.normal;
    const isSpecialType = currentSetType !== 'normal';
    const canEditSetType = (isInputEditable || isStructureEditable || mode === 'PREVIEW') && !isCompleted;

    const handleLongPress = () => {
        if (HapticService.selection) {
            HapticService.selection();
        }
        setIsActionModalVisible(true);
    };

    const handleUnlockSet = () => {
        if (HapticService.selection) {
            HapticService.selection();
        }
        if (onToggleCompleteSet) {
            onToggleCompleteSet(set.id, false);
        }
        onSetChange(set.id, 'is_completed', 'false');
    };

    const promptUnlockConfirmation = () => {
        Alert.alert(
            t('workout.unlockSetTitle', 'Editar Serie'),
            t('workout.unlockSetPrompt', '¿Deseas desbloquear esta serie para modificar sus valores?'),
            [
                { text: t('common.cancel', 'Cancelar'), style: 'cancel' },
                {
                    text: t('workout.unlock', 'Desbloquear'),
                    onPress: handleUnlockSet,
                },
            ]
        );
    };

    const handleToggleComplete = () => {
        Keyboard.dismiss();
        if (isCompleted) {
            promptUnlockConfirmation();
        } else {
            if (HapticService.success) {
                HapticService.success();
            } else if (HapticService.setCompleted) {
                HapticService.setCompleted();
            }
            if (onToggleCompleteSet) {
                onToggleCompleteSet(set.id, true);
            }
            onSetChange(set.id, 'is_completed', 'true');
            if (onStartRestTimer) {
                onStartRestTimer(set.id);
            }
        }
    };

    const handleOpenSetTypePicker = () => {
        if (!canEditSetType) return;
        HapticService.selection();
        setIsTypePickerVisible(true);
    };

    const handleSelectSetType = (newType: SetType) => {
        if (onSelectSetType) {
            onSelectSetType(set.id, newType);
        } else {
            onSetChange(set.id, 'tipo_serie', newType);
        }
    };

    const handleRpeChange = (val: string) => {
        const result = validateRpe(val);
        if (result.clamped) {
            HapticService.warning();
        }
        if (result.value === null) {
            onSetChange(set.id, 'rpe', '');
        } else {
            const valStr = result.value % 1 === 0 ? String(result.value) : result.value.toFixed(1);
            onSetChange(set.id, 'rpe', valStr);
        }
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
        <TouchableOpacity
            testID={`set-row-${setIndex}`}
            delayLongPress={400}
            onLongPress={handleLongPress}
            activeOpacity={1}
            style={[
                styles.container,
                {
                    backgroundColor: isCompleted
                        ? (colors.secondaryContainer ? `${colors.secondaryContainer}25` : 'rgba(34, 197, 94, 0.08)')
                        : (colors.surfaceContainerLow || colors.surface),
                    borderColor: isCompleted
                        ? (colors.primaryContainer ? `${colors.primaryContainer}50` : 'rgba(34, 197, 94, 0.25)')
                        : (colors.outlineVariant ? `${colors.outlineVariant}60` : colors.border),
                },
                isCompleted && styles.completedContainer,
            ]}
        >
            <View style={styles.mainRow}>
                <View style={styles.setNumberWrapper}>
                    <TouchableOpacity
                        testID={`set-type-button-${setIndex}`}
                        style={[
                            styles.setTypeBadgeButton,
                            isSpecialType
                                ? {
                                    backgroundColor: typeVisual.badgeBg,
                                    borderColor: typeVisual.border,
                                }
                                : canEditSetType
                                    ? {
                                        backgroundColor: colors.surfaceContainerHighest || colors.surfaceHighlight,
                                        borderColor: colors.outlineVariant || colors.border,
                                    }
                                    : {
                                        backgroundColor: 'transparent',
                                        borderColor: 'transparent',
                                    },
                        ]}
                        onPress={handleOpenSetTypePicker}
                        disabled={!canEditSetType}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Text
                            style={[
                                styles.setNumber,
                                isSpecialType
                                    ? [styles.specialBadgeText, { color: typeVisual.badgeText }]
                                    : { color: canEditSetType ? (colors.onSurface || colors.text) : (colors.onSurfaceVariant || colors.textSecondary) },
                            ]}
                        >
                            {isSpecialType ? typeVisual.shortLabel : set.numero_serie}
                        </Text>
                    </TouchableOpacity>
                    {Boolean(set.is_pr) && (
                        <PRBadge
                            testID={`set-pr-badge-${setIndex}`}
                            size="small"
                            style={styles.prBadgeFloating}
                        />
                    )}
                </View>

                {/* Weight Column */}
                <View style={[styles.inputGroup, { maxWidth: 80 }]}>
                    {isBodyweight ? (
                        <View
                            testID={`bodyweight-placeholder-${setIndex}`}
                            style={[
                                styles.bodyweightPlaceholder,
                                {
                                    backgroundColor: colors.surfaceContainerHigh || colors.surfaceHighlight,
                                    borderColor: colors.outlineVariant || colors.border,
                                },
                            ]}
                        >
                            <Text style={{ color: colors.onSurfaceVariant || colors.textSecondary, fontSize: 13, fontWeight: '700' }}>
                                BW
                            </Text>
                        </View>
                    ) : (
                        <SetInput
                            testID={`set-weight-input-${setIndex}`}
                            value={set.peso_utilizado > 0 ? set.peso_utilizado : ''}
                            placeholder={ghostWeight ?? '-'}
                            onChange={(val) => onSetChange(set.id, 'weight', val)}
                            isEditable={effectiveInputEditable}
                            colors={colors}
                            maxLength={5}
                        />
                    )}
                </View>

                {/* Reps Column */}
                <View style={[styles.inputGroup, { maxWidth: 80 }]}>
                    <SetInput
                        testID={`set-reps-input-${setIndex}`}
                        value={set.repeticiones > 0 ? set.repeticiones : ''}
                        placeholder={ghostReps ?? '-'}
                        onChange={(val) => onSetChange(set.id, 'reps', val)}
                        isEditable={effectiveInputEditable}
                        colors={colors}
                        maxLength={3}
                    />
                </View>

                {/* RPE Column */}
                <View style={[styles.inputGroup, { maxWidth: 60 }]}>
                    <SetInput
                        testID={`set-rpe-input-${setIndex}`}
                        value={set.rpe && set.rpe > 0 ? set.rpe : ''}
                        placeholder={ghostRpe ?? '-'}
                        onChange={handleRpeChange}
                        isEditable={effectiveInputEditable}
                        colors={colors}
                        maxLength={4}
                    />
                </View>

                {/* Edit Completed Set Button */}
                {isCompleted && isInputEditable && (
                    <TouchableOpacity
                        testID={`edit-set-button-${setIndex}`}
                        style={[
                            styles.editSetButton,
                            {
                                backgroundColor: colors.surfaceContainerHigh || colors.surfaceHighlight,
                                borderColor: colors.outlineVariant || colors.border,
                            },
                        ]}
                        onPress={promptUnlockConfirmation}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <MaterialIcons name="edit" size={16} color={colors.primary} />
                    </TouchableOpacity>
                )}

                {/* Completion Checkbox Button (Stitch M3 filled when completed, outline when pending) */}
                {navMode !== 'edit' && (
                    <TouchableOpacity
                        testID={`set-complete-checkbox-${setIndex}`}
                        style={[
                            styles.completeCheckbox,
                            {
                                backgroundColor: isCompleted
                                    ? (colors.primaryContainer || '#22c55e')
                                    : (colors.surfaceContainerHigh || colors.surfaceHighlight),
                                borderColor: isCompleted
                                    ? (colors.primaryContainer || '#22c55e')
                                    : (colors.outlineVariant || colors.border),
                            },
                        ]}
                        onPress={handleToggleComplete}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <MaterialIcons
                            testID={isCompleted ? `set-completed-icon-${setIndex}` : `set-uncompleted-icon-${setIndex}`}
                            name={isCompleted ? 'check-box' : 'check-box-outline-blank'}
                            size={22}
                            color={isCompleted ? (colors.onPrimaryContainer || '#ffffff') : (colors.outline || colors.textSecondary)}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* Set Type Picker Modal */}
            <SetTypePickerModal
                visible={isTypePickerVisible}
                currentType={currentSetType}
                onSelect={handleSelectSetType}
                onClose={() => setIsTypePickerVisible(false)}
                colors={colors}
            />

            {/* Set Action Modal (Contextual long-press menu) */}
            <SetActionModal
                visible={isActionModalVisible}
                setNumber={set.numero_serie}
                setIndex={setIndex}
                setType={currentSetType}
                isBodyweight={isBodyweight}
                canDelete={(canDelete !== undefined ? canDelete : isStructureEditable) && Boolean(onDeleteSet) && !isCompleted}
                deleteTestID={`delete-set-button-${setIndex}`}
                colors={colors}
                onClose={() => setIsActionModalVisible(false)}
                onOpenTypePicker={canEditSetType ? () => setIsTypePickerVisible(true) : undefined}
                onDuplicateSet={onDuplicateSet ? () => onDuplicateSet(set.id, exerciseId) : undefined}
                onOpenPlateCalculator={onOpenPlateCalculator ? () => {
                    const currentWeight = parseFloat(String(set.peso_utilizado)) || (ghostWeight ? parseFloat(String(ghostWeight)) : 0);
                    onOpenPlateCalculator(currentWeight, set.id, exerciseId);
                } : undefined}
                onDeleteSet={onDeleteSet ? () => onDeleteSet(set.id, exerciseId) : undefined}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
    },
    completedContainer: {
        borderRadius: 10,
        borderWidth: 1,
    },
    mainRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    setNumberWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    prBadgeFloating: {
        position: 'absolute',
        top: -7,
        zIndex: 10,
    },
    setTypeBadgeButton: {
        width: 32,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        marginHorizontal: 3,
    },
    setNumber: {
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
    },
    specialBadgeText: {
        fontSize: 13,
        fontWeight: '800',
    },
    inputGroup: {
        flex: 1,
        marginHorizontal: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bodyweightPlaceholder: {
        width: '100%',
        height: 40,
        borderWidth: 1,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteSetButton: {
        padding: 4,
        marginLeft: 6,
    },
    completeCheckbox: {
        width: 38,
        height: 38,
        borderRadius: 8,
        marginLeft: 4,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1.5,
        elevation: 1,
    },
    editSetButton: {
        width: 34,
        height: 38,
        borderRadius: 8,
        marginLeft: 2,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    timerButton: {
        padding: 4,
        marginLeft: 4,
    },
});;

export const areWorkoutSetRowPropsEqual = (
    prevProps: WorkoutSetRowProps,
    nextProps: WorkoutSetRowProps
): boolean => {
    const prevSet = prevProps.set;
    const nextSet = nextProps.set;
    if (
        prevSet.id !== nextSet.id ||
        prevSet.numero_serie !== nextSet.numero_serie ||
        prevSet.peso_utilizado !== nextSet.peso_utilizado ||
        prevSet.repeticiones !== nextSet.repeticiones ||
        prevSet.rpe !== nextSet.rpe ||
        prevSet.descanso_segundos !== nextSet.descanso_segundos ||
        prevSet.tipo_serie !== nextSet.tipo_serie ||
        Boolean(prevSet.is_completed || prevSet.completada) !== Boolean(nextSet.is_completed || nextSet.completada) ||
        Boolean(prevSet.is_pr) !== Boolean(nextSet.is_pr)
    ) {
        return false;
    }

    if (
        prevProps.setIndex !== nextProps.setIndex ||
        prevProps.exerciseId !== nextProps.exerciseId ||
        prevProps.tipoPeso !== nextProps.tipoPeso ||
        prevProps.ghostWeight !== nextProps.ghostWeight ||
        prevProps.ghostReps !== nextProps.ghostReps ||
        prevProps.ghostRpe !== nextProps.ghostRpe ||
        prevProps.isInputEditable !== nextProps.isInputEditable ||
        prevProps.isStructureEditable !== nextProps.isStructureEditable ||
        prevProps.canDelete !== nextProps.canDelete ||
        prevProps.mode !== nextProps.mode ||
        prevProps.navMode !== nextProps.navMode ||
        prevProps.onOpenPlateCalculator !== nextProps.onOpenPlateCalculator ||
        prevProps.onSelectSetType !== nextProps.onSelectSetType ||
        prevProps.onToggleCompleteSet !== nextProps.onToggleCompleteSet ||
        prevProps.onDuplicateSet !== nextProps.onDuplicateSet
    ) {
        return false;
    }

    const prevIsCompleted = prevProps.lastCompletedSetId === prevSet.id;
    const nextIsCompleted = nextProps.lastCompletedSetId === nextSet.id;
    if (prevIsCompleted !== nextIsCompleted) {
        return false;
    }

    if (nextIsCompleted && prevProps.restTimerVisible !== nextProps.restTimerVisible) {
        return false;
    }

    const prevHasSavedTimer = !!prevProps.savedTimerSetIds?.has(prevSet.id);
    const nextHasSavedTimer = !!nextProps.savedTimerSetIds?.has(nextSet.id);
    if (prevHasSavedTimer !== nextHasSavedTimer) {
        return false;
    }

    if (
        prevProps.colors.background !== nextProps.colors.background ||
        prevProps.colors.surface !== nextProps.colors.surface ||
        prevProps.colors.text !== nextProps.colors.text ||
        prevProps.colors.primary !== nextProps.colors.primary ||
        prevProps.colors.border !== nextProps.colors.border
    ) {
        return false;
    }

    return true;
};

export default React.memo(WorkoutSetRow, areWorkoutSetRowPropsEqual);
