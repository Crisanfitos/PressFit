import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../types/theme';

export interface ProgressCustomAlertData {
    visible: boolean;
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
}

export interface ProgressCustomAlertModalProps {
    alert: ProgressCustomAlertData;
    colors: ThemeColors;
    onClose: () => void;
}

export const ProgressCustomAlertModal: React.FC<ProgressCustomAlertModalProps> = ({
    alert,
    colors,
    onClose,
}) => {
    return (
        <Modal visible={alert.visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={[styles.modalOverlay, { padding: 40 }]}>
                <View
                    style={[
                        styles.modalContent,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                >
                    <View
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 28,
                            alignSelf: 'center',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 16,
                            backgroundColor:
                                alert.type === 'success'
                                    ? '#dcfce7'
                                    : alert.type === 'error'
                                    ? '#fee2e2'
                                    : '#fef3c7',
                        }}
                    >
                        <MaterialIcons
                            name={
                                alert.type === 'success'
                                    ? 'check'
                                    : alert.type === 'error'
                                    ? 'close'
                                    : 'warning'
                            }
                            size={32}
                            color={
                                alert.type === 'success'
                                    ? '#22c55e'
                                    : alert.type === 'error'
                                    ? '#ef4444'
                                    : '#f59e0b'
                            }
                        />
                    </View>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>{alert.title}</Text>
                    <Text
                        style={{
                            fontSize: 16,
                            color: colors.textSecondary,
                            textAlign: 'center',
                            marginBottom: 24,
                            lineHeight: 22,
                        }}
                    >
                        {alert.message}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        {alert.type === 'warning' && (
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    {
                                        backgroundColor: colors.inputBackground,
                                        borderColor: colors.border,
                                        borderWidth: 1,
                                    },
                                ]}
                                onPress={alert.onCancel}
                            >
                                <MaterialIcons
                                    name="close"
                                    size={24}
                                    color={colors.text}
                                    style={{ alignSelf: 'center' }}
                                />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[
                                styles.modalButton,
                                {
                                    backgroundColor: alert.type === 'warning' ? '#ef4444' : colors.primary,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                },
                            ]}
                            onPress={alert.onConfirm}
                        >
                            <MaterialIcons name="check" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
    },
    modalContent: {
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        maxWidth: 350,
        alignSelf: 'center',
        width: '100%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalButton: {
        flex: 1,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
});

export default ProgressCustomAlertModal;
