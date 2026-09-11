import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    Pressable,
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { HapticService } from '../../services/HapticService';
import { SetType, SET_TYPE_COLORS } from '../../types/setTypes';

export interface SetActionModalProps {
    visible: boolean;
    setNumber: number;
    setIndex?: number;
    deleteTestID?: string;
    setType?: SetType;
    isBodyweight?: boolean;
    canDelete?: boolean;
    colors: {
        background?: string;
        surface: string;
        surfaceHighlight: string;
        text: string;
        textSecondary: string;
        primary: string;
        border: string;
        [key: string]: any;
    };
    onClose: () => void;
    onOpenTypePicker?: () => void;
    onDuplicateSet?: () => void;
    onOpenPlateCalculator?: () => void;
    onDeleteSet?: () => void;
}

export const SetActionModal: React.FC<SetActionModalProps> = ({
    visible,
    setNumber,
    setType = 'normal',
    isBodyweight = false,
    canDelete = true,
    deleteTestID,
    colors,
    onClose,
    onOpenTypePicker,
    onDuplicateSet,
    onOpenPlateCalculator,
    onDeleteSet,
}) => {
    if (!visible) return null;

    const typeConfig = SET_TYPE_COLORS[setType] || SET_TYPE_COLORS.normal;

    const handleClose = () => {
        if (HapticService.selection) {
            HapticService.selection();
        }
        onClose();
    };

    const handleSelectType = () => {
        handleClose();
        if (onOpenTypePicker) {
            onOpenTypePicker();
        }
    };

    const handleDuplicate = () => {
        handleClose();
        if (HapticService.selection) {
            HapticService.selection();
        }
        if (onDuplicateSet) {
            onDuplicateSet();
        }
    };

    const handlePlateCalculator = () => {
        handleClose();
        if (HapticService.selection) {
            HapticService.selection();
        }
        if (onOpenPlateCalculator) {
            onOpenPlateCalculator();
        }
    };

    const handleDelete = () => {
        if (!onDeleteSet) return;
        handleClose();
        if (HapticService.warning) {
            HapticService.warning();
        }
        onDeleteSet();
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={handleClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <Pressable
                    testID="set-action-modal-backdrop"
                    style={styles.backdrop}
                    onPress={handleClose}
                />

                <View
                    testID="set-action-modal-container"
                    style={[
                        styles.modalContainer,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.titleRow}>
                            <View
                                style={[
                                    styles.badgeChip,
                                    { backgroundColor: typeConfig.badgeBg, borderColor: typeConfig.border },
                                ]}
                            >
                                <Text style={[styles.badgeText, { color: typeConfig.badgeText }]}>
                                    {typeConfig.shortLabel || setNumber}
                                </Text>
                            </View>
                            <Text style={[styles.title, { color: colors.text }]}>
                                Opciones de Serie {setNumber}
                            </Text>
                        </View>
                        <TouchableOpacity
                            testID="set-action-modal-close-button"
                            style={[styles.closeButton, { backgroundColor: colors.surfaceHighlight }]}
                            onPress={handleClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <MaterialIcons name="close" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Actions List */}
                    <View style={styles.actionsList}>
                        {/* 1. Cambiar tipo de serie */}
                        {onOpenTypePicker && (
                            <TouchableOpacity
                                testID="action-change-set-type"
                                style={[styles.actionItem, { backgroundColor: colors.surfaceHighlight }]}
                                onPress={handleSelectType}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.iconBox, { backgroundColor: `${colors.primary}20` }]}>
                                    <MaterialIcons name="tune" size={20} color={colors.primary} />
                                </View>
                                <View style={styles.actionTextBox}>
                                    <Text style={[styles.actionTitle, { color: colors.text }]}>
                                        Tipo de Serie
                                    </Text>
                                    <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                                        Actualmente: {typeConfig.label}
                                    </Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        )}

                        {/* 2. Duplicar serie */}
                        {onDuplicateSet && (
                            <TouchableOpacity
                                testID="action-duplicate-set"
                                style={[styles.actionItem, { backgroundColor: colors.surfaceHighlight }]}
                                onPress={handleDuplicate}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                                    <MaterialIcons name="content-copy" size={20} color="#3b82f6" />
                                </View>
                                <View style={styles.actionTextBox}>
                                    <Text style={[styles.actionTitle, { color: colors.text }]}>
                                        Duplicar Serie
                                    </Text>
                                    <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                                        Crea una nueva serie con los mismos valores
                                    </Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        )}

                        {/* 3. Calculadora de discos */}
                        {!isBodyweight && onOpenPlateCalculator && (
                            <TouchableOpacity
                                testID="action-plate-calculator"
                                style={[styles.actionItem, { backgroundColor: colors.surfaceHighlight }]}
                                onPress={handlePlateCalculator}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.iconBox, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
                                    <MaterialIcons name="fitness-center" size={20} color="#eab308" />
                                </View>
                                <View style={styles.actionTextBox}>
                                    <Text style={[styles.actionTitle, { color: colors.text }]}>
                                        Calculadora de Discos
                                    </Text>
                                    <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                                        Distribución visual de carga en la barra
                                    </Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        )}

                        {/* 4. Eliminar serie */}
                        {canDelete && onDeleteSet && (
                            <TouchableOpacity
                                testID={deleteTestID || "action-delete-set"}
                                style={[styles.actionItem, styles.deleteActionItem]}
                                onPress={handleDelete}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                                    <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
                                </View>
                                <View style={styles.actionTextBox}>
                                    <Text style={[styles.actionTitle, { color: '#ef4444' }]}>
                                        Eliminar Serie
                                    </Text>
                                    <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                                        Borra esta serie de la sesión de entrenamiento
                                    </Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={20} color="#ef4444" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Cancel button */}
                    <TouchableOpacity
                        testID="set-action-modal-cancel-button"
                        style={[styles.cancelButton, { borderColor: colors.border }]}
                        onPress={handleClose}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                            Cancelar
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContainer: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderWidth: 1,
        borderBottomWidth: 0,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    badgeChip: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionsList: {
        gap: 10,
        marginBottom: 16,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
    },
    deleteActionItem: {
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
    },
    iconBox: {
        width: 38,
        height: 38,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    actionTextBox: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    actionSubtitle: {
        fontSize: 12,
    },
    cancelButton: {
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
});

export default SetActionModal;
