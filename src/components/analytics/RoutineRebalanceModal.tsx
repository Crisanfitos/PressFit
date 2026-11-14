import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import {
    RebalanceMuscleAction,
    RebalanceOperation,
    RebalancePlan,
    recalculatePlanSummaries,
} from '../../utils/routineRebalancePlanner';

export interface RoutineRebalanceModalProps {
    visible: boolean;
    plan: RebalancePlan | null;
    weekLabel?: string;
    loading?: boolean;
    saving?: boolean;
    onClose: () => void;
    onConfirm: (params: {
        plan: RebalancePlan;
        customName: string;
        activateImmediately: boolean;
    }) => void;
}

export const RoutineRebalanceModal: React.FC<RoutineRebalanceModalProps> = ({
    visible,
    plan,
    weekLabel,
    loading = false,
    saving = false,
    onClose,
    onConfirm,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { colors } = theme;

    const [editablePlan, setEditablePlan] = useState<RebalancePlan | null>(plan);
    const [customName, setCustomName] = useState<string>(plan?.suggestedName || '');
    const [activateImmediately, setActivateImmediately] = useState<boolean>(true);

    useEffect(() => {
        if (plan) {
            setEditablePlan(plan);
            setCustomName(plan.suggestedName);
        } else {
            setEditablePlan(null);
            setCustomName('');
        }
    }, [plan]);

    const dynamicSummaries = useMemo(() => {
        if (!editablePlan) return [];
        return recalculatePlanSummaries(editablePlan);
    }, [editablePlan]);

    const enabledOperationsCount = useMemo(
        () => editablePlan?.operations.filter((op) => op.enabled).length || 0,
        [editablePlan]
    );

    const operationsByDay = useMemo(() => {
        if (!editablePlan) return [];
        const groups = new Map<string, { dayId: string; dayName: string; ops: RebalanceOperation[] }>();
        for (const op of editablePlan.operations) {
            const existing = groups.get(op.dayId);
            if (existing) {
                existing.ops.push(op);
            } else {
                groups.set(op.dayId, {
                    dayId: op.dayId,
                    dayName: op.dayName,
                    ops: [op],
                });
            }
        }
        return Array.from(groups.values());
    }, [editablePlan]);

    const handleToggleOperation = (opId: string) => {
        setEditablePlan((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                operations: prev.operations.map((op) =>
                    op.id === opId ? { ...op, enabled: !op.enabled } : op
                ),
            };
        });
    };

    const getActionBadge = (action: RebalanceMuscleAction) => {
        if (action === 'boost') {
            return {
                label: t('rebalance.actionBoost', 'Subir'),
                color: '#10B981',
                icon: 'arrow-upward' as const,
            };
        }
        if (action === 'reduce') {
            return {
                label: t('rebalance.actionReduce', 'Bajar'),
                color: '#F59E0B',
                icon: 'arrow-downward' as const,
            };
        }
        return {
            label: t('rebalance.actionKeep', 'Mantener'),
            color: '#3B82F6',
            icon: 'remove' as const,
        };
    };

    const formatOperationDescription = (op: RebalanceOperation): string => {
        if (op.type === 'add_exercise') {
            return t('rebalance.opAddExercise', {
                sets: op.proposedSets,
                defaultValue: `Nuevo ejercicio · ${op.proposedSets} series`,
            });
        }
        if (op.deltaSets > 0) {
            return t('rebalance.opAddSets', {
                delta: op.deltaSets,
                from: op.currentSets,
                to: op.proposedSets,
                defaultValue: `+${op.deltaSets} series (${op.currentSets} → ${op.proposedSets})`,
            });
        }
        return t('rebalance.opRemoveSets', {
            delta: op.deltaSets,
            from: op.currentSets,
            to: op.proposedSets,
            defaultValue: `${op.deltaSets} series (${op.currentSets} → ${op.proposedSets})`,
        });
    };

    const styles = useMemo(
        () =>
            StyleSheet.create({
                overlay: {
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    justifyContent: 'flex-end',
                },
                sheet: {
                    backgroundColor: colors.surface,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    maxHeight: '90%',
                    paddingBottom: 24,
                },
                header: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                },
                headerTitle: {
                    fontSize: 18,
                    fontWeight: '700',
                    color: colors.text,
                },
                headerSubtitle: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginTop: 2,
                },
                content: {
                    paddingHorizontal: 20,
                    paddingTop: 16,
                },
                sectionTitle: {
                    fontSize: 13,
                    fontWeight: '700',
                    color: colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                    marginBottom: 8,
                    marginTop: 14,
                },
                input: {
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: colors.text,
                    fontSize: 15,
                    fontWeight: '600',
                },
                muscleRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: colors.background,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                muscleName: {
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.text,
                },
                muscleSets: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginTop: 2,
                },
                badge: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                },
                badgeText: {
                    fontSize: 12,
                    fontWeight: '700',
                },
                dayCard: {
                    backgroundColor: colors.background,
                    borderRadius: 14,
                    padding: 12,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                dayTitle: {
                    fontSize: 14,
                    fontWeight: '700',
                    color: colors.text,
                    marginBottom: 8,
                },
                opRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 6,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: colors.border,
                },
                opInfo: {
                    flex: 1,
                    paddingRight: 10,
                },
                opExercise: {
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.text,
                },
                opDetail: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginTop: 2,
                },
                switchRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: colors.background,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    marginTop: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                switchLabel: {
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.text,
                    flex: 1,
                    paddingRight: 12,
                },
                footer: {
                    flexDirection: 'row',
                    gap: 12,
                    paddingHorizontal: 20,
                    paddingTop: 16,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                },
                cancelBtn: {
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                cancelText: {
                    fontSize: 15,
                    fontWeight: '600',
                    color: colors.text,
                },
                confirmBtn: {
                    flex: 2,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.primary,
                },
                confirmBtnDisabled: {
                    opacity: 0.5,
                },
                confirmText: {
                    fontSize: 15,
                    fontWeight: '700',
                    color: '#FFFFFF',
                },
                emptyState: {
                    alignItems: 'center',
                    paddingVertical: 32,
                    paddingHorizontal: 16,
                },
                emptyTitle: {
                    fontSize: 16,
                    fontWeight: '700',
                    color: colors.text,
                    marginTop: 12,
                    textAlign: 'center',
                },
                emptyDesc: {
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginTop: 6,
                    textAlign: 'center',
                    lineHeight: 20,
                },
            }),
        [colors]
    );

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay} testID="routine-rebalance-modal">
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <View style={{ flex: 1, paddingRight: 12 }}>
                            <Text style={styles.headerTitle}>
                                {t('rebalance.modalTitle', 'Plan de Rebalanceo')}
                            </Text>
                            {Boolean(weekLabel) && (
                                <Text style={styles.headerSubtitle}>
                                    {t('rebalance.basedOnWeek', {
                                        week: weekLabel,
                                        defaultValue: `Basado en semana: ${weekLabel}`,
                                    })}
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            testID="rebalance-close-button"
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <MaterialIcons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.emptyState}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={styles.emptyDesc}>
                                {t('rebalance.analyzing', 'Analizando tu rutina activa y volumen semanal...')}
                            </Text>
                        </View>
                    ) : !editablePlan || editablePlan.status === 'no_active_routine' ? (
                        <View style={styles.emptyState} testID="rebalance-no-active-routine">
                            <MaterialIcons name="event-busy" size={44} color={colors.textSecondary} />
                            <Text style={styles.emptyTitle}>
                                {t('rebalance.noActiveTitle', 'No hay rutina semanal activa')}
                            </Text>
                            <Text style={styles.emptyDesc}>
                                {t(
                                    'rebalance.noActiveDesc',
                                    'Activa una rutina semanal en Mis Rutinas para poder generar una copia optimizada.'
                                )}
                            </Text>
                        </View>
                    ) : editablePlan.status === 'already_balanced' ? (
                        <View style={styles.emptyState} testID="rebalance-already-balanced">
                            <MaterialIcons name="check-circle" size={44} color="#10B981" />
                            <Text style={styles.emptyTitle}>
                                {t('rebalance.balancedTitle', 'Tu rutina ya está equilibrada')}
                            </Text>
                            <Text style={styles.emptyDesc}>
                                {t(
                                    'rebalance.balancedDesc',
                                    'Todos los grupos musculares analizados se encuentran en rango óptimo de adaptación (MAV).'
                                )}
                            </Text>
                        </View>
                    ) : (
                        <>
                            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                                <Text style={styles.sectionTitle}>
                                    {t('rebalance.newRoutineNameLabel', 'Nombre de la nueva copia')}
                                </Text>
                                <TextInput
                                    style={styles.input}
                                    value={customName}
                                    onChangeText={setCustomName}
                                    placeholder={editablePlan.suggestedName}
                                    placeholderTextColor={colors.textSecondary}
                                    testID="rebalance-routine-name-input"
                                />

                                <Text style={styles.sectionTitle}>
                                    {t('rebalance.muscleSummaryTitle', 'Resumen por grupo muscular')}
                                </Text>
                                {dynamicSummaries.map((item) => {
                                    const badge = getActionBadge(item.action);
                                    return (
                                        <View
                                            key={item.muscleKey}
                                            style={styles.muscleRow}
                                            testID={`rebalance-muscle-${item.muscleKey}`}
                                        >
                                            <View>
                                                <Text style={styles.muscleName}>{item.muscleLabel}</Text>
                                                <Text style={styles.muscleSets}>
                                                    {item.currentSets} → {item.projectedSets}{' '}
                                                    {t('rebalance.effectiveSetsUnit', 'series')}
                                                </Text>
                                            </View>
                                            <View
                                                style={[
                                                    styles.badge,
                                                    { backgroundColor: `${badge.color}20` },
                                                ]}
                                            >
                                                <MaterialIcons
                                                    name={badge.icon}
                                                    size={14}
                                                    color={badge.color}
                                                />
                                                <Text style={[styles.badgeText, { color: badge.color }]}>
                                                    {badge.label}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}

                                <Text style={styles.sectionTitle}>
                                    {t('rebalance.dayChangesTitle', 'Ajustes propuestos por día')}
                                </Text>
                                {operationsByDay.map((group) => (
                                    <View key={group.dayId} style={styles.dayCard}>
                                        <Text style={styles.dayTitle}>{group.dayName}</Text>
                                        {group.ops.map((op) => (
                                            <View key={op.id} style={styles.opRow}>
                                                <View style={styles.opInfo}>
                                                    <Text style={styles.opExercise}>
                                                        {op.exerciseName}
                                                    </Text>
                                                    <Text style={styles.opDetail}>
                                                        {op.muscleLabel} · {formatOperationDescription(op)}
                                                    </Text>
                                                </View>
                                                <Switch
                                                    value={op.enabled}
                                                    onValueChange={() => handleToggleOperation(op.id)}
                                                    testID={`rebalance-op-toggle-${op.id}`}
                                                />
                                            </View>
                                        ))}
                                    </View>
                                ))}

                                <View style={styles.switchRow}>
                                    <Text style={styles.switchLabel}>
                                        {t(
                                            'rebalance.activateImmediately',
                                            'Activar esta copia como rutina semanal actual'
                                        )}
                                    </Text>
                                    <Switch
                                        value={activateImmediately}
                                        onValueChange={setActivateImmediately}
                                        testID="rebalance-activate-switch"
                                    />
                                </View>
                                <View style={{ height: 16 }} />
                            </ScrollView>

                            <View style={styles.footer}>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={onClose}
                                    disabled={saving}
                                    testID="rebalance-cancel-button"
                                >
                                    <Text style={styles.cancelText}>
                                        {t('common.cancel', 'Cancelar')}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.confirmBtn,
                                        (saving || enabledOperationsCount === 0) &&
                                            styles.confirmBtnDisabled,
                                    ]}
                                    disabled={saving || enabledOperationsCount === 0}
                                    onPress={() =>
                                        onConfirm({
                                            plan: editablePlan,
                                            customName:
                                                customName.trim() || editablePlan.suggestedName,
                                            activateImmediately,
                                        })
                                    }
                                    testID="rebalance-confirm-button"
                                >
                                    {saving ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.confirmText}>
                                            {activateImmediately
                                                ? t('rebalance.confirmAndActivate', 'Crear y Activar')
                                                : t('rebalance.confirmSaveOnly', 'Guardar Copia')}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
};

export default RoutineRebalanceModal;
