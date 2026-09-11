import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { HapticService } from '../../services/HapticService';
import {
    SetType,
    SET_TYPES,
    SET_TYPE_COLORS,
    SET_TYPE_DESCRIPTIONS,
} from '../../types/setTypes';

export interface SetTypePickerModalProps {
    visible: boolean;
    currentType?: SetType;
    onSelect: (type: SetType) => void;
    onClose: () => void;
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
}

export const SetTypePickerModal: React.FC<SetTypePickerModalProps> = ({
    visible,
    currentType = 'normal',
    onSelect,
    onClose,
    colors,
}) => {
    if (!visible) return null;

    const handleSelectOption = (type: SetType) => {
        HapticService.selection();
        onSelect(type);
        onClose();
    };

    const handleClose = () => {
        HapticService.selection();
        onClose();
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
                    testID="set-type-picker-backdrop"
                    style={styles.backdrop}
                    onPress={handleClose}
                />

                <View
                    testID="set-type-picker-modal"
                    style={[
                        styles.modalContainer,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.titleRow}>
                            <MaterialIcons name="tune" size={20} color={colors.primary} style={styles.titleIcon} />
                            <Text style={[styles.title, { color: colors.text }]}>Tipo de Serie</Text>
                        </View>
                        <TouchableOpacity
                            testID="set-type-picker-close-button"
                            style={[styles.closeButton, { backgroundColor: colors.surfaceHighlight }]}
                            onPress={handleClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <MaterialIcons name="close" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Elige la clasificación adecuada para esta serie
                    </Text>

                    {/* Options list */}
                    <View style={styles.optionsList}>
                        {SET_TYPES.map((type) => {
                            const config = SET_TYPE_COLORS[type];
                            const isSelected = currentType === type;
                            const description = SET_TYPE_DESCRIPTIONS[type];

                            return (
                                <TouchableOpacity
                                    key={type}
                                    testID={`set-type-option-${type}`}
                                    style={[
                                        styles.optionCard,
                                        {
                                            backgroundColor: isSelected
                                                ? `${config.border}15`
                                                : colors.surfaceHighlight,
                                            borderColor: isSelected ? config.border : colors.border,
                                        },
                                    ]}
                                    onPress={() => handleSelectOption(type)}
                                    activeOpacity={0.7}
                                >
                                    {/* Visual badge chip */}
                                    <View
                                        style={[
                                            styles.badge,
                                            {
                                                backgroundColor: config.badgeBg,
                                                borderColor: config.border,
                                            },
                                        ]}
                                    >
                                        <Text style={[styles.badgeText, { color: config.badgeText }]}>
                                            {config.shortLabel}
                                        </Text>
                                    </View>

                                    {/* Labels column */}
                                    <View style={styles.textColumn}>
                                        <View style={styles.labelRow}>
                                            <Text
                                                style={[
                                                    styles.optionLabel,
                                                    { color: isSelected ? config.badgeText : colors.text },
                                                ]}
                                            >
                                                {config.label}
                                            </Text>
                                        </View>
                                        <Text
                                            style={[styles.optionDescription, { color: colors.textSecondary }]}
                                            numberOfLines={2}
                                        >
                                            {description}
                                        </Text>
                                    </View>

                                    {/* Selection indicator */}
                                    <MaterialIcons
                                        name={isSelected ? 'check-circle' : 'radio-button-unchecked'}
                                        size={22}
                                        color={isSelected ? config.border : `${colors.textSecondary}60`}
                                    />
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 380,
        borderRadius: 20,
        borderWidth: 1,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    titleIcon: {
        marginRight: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    closeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subtitle: {
        fontSize: 13,
        marginBottom: 16,
        lineHeight: 18,
    },
    optionsList: {
        gap: 10,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: 1.5,
    },
    badge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    badgeText: {
        fontSize: 15,
        fontWeight: '800',
    },
    textColumn: {
        flex: 1,
        marginRight: 8,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    optionLabel: {
        fontSize: 15,
        fontWeight: '700',
    },
    optionDescription: {
        fontSize: 12,
        lineHeight: 16,
    },
});

export default SetTypePickerModal;
