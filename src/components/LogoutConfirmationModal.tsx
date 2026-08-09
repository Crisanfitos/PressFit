import React, { useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

interface LogoutConfirmationModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const LogoutConfirmationModal: React.FC<LogoutConfirmationModalProps> = ({ visible, onClose, onConfirm }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { colors } = theme;

    const styles = useMemo(() => StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20
        },
        modalContent: {
            backgroundColor: colors.background,
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 400,
        },
        iconContainer: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: '#fee2e2',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
            alignSelf: 'center'
        },
        modalTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: colors.text,
            textAlign: 'center',
            marginBottom: 8
        },
        modalText: {
            fontSize: 16,
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: 24,
            lineHeight: 24
        },
        buttonContainer: {
            flexDirection: 'row',
            gap: 12
        },
        cancelButton: {
            flex: 1,
            padding: 16,
            borderRadius: 12,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center'
        },
        cancelButtonText: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text
        },
        confirmButton: {
            flex: 1,
            padding: 16,
            borderRadius: 12,
            backgroundColor: '#ef4444',
            alignItems: 'center'
        },
        confirmButtonText: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#fff'
        }
    }), [colors]);

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose} testID="logout-confirmation-modal">
            <View style={styles.overlay}>
                <View style={styles.modalContent} testID="logout-confirmation-modal-content">
                    <View style={styles.iconContainer}>
                        <MaterialIcons name="logout" size={24} color="#ef4444" />
                    </View>

                    <Text style={styles.modalTitle}>{t('auth.logout')}</Text>
                    <Text style={styles.modalText}>{t('auth.logoutConfirmation')}</Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose} testID="logout-cancel-button">
                            <MaterialIcons name="close" size={28} color={colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmButton} onPress={onConfirm} testID="logout-confirm-button">
                            <MaterialIcons name="check" size={28} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default LogoutConfirmationModal;
