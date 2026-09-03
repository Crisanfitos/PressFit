import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../types/theme';

export interface PhotoSourceModalProps {
    visible: boolean;
    colors: ThemeColors;
    t: (key: string, fallback: string) => string;
    onClose: () => void;
    onPickFromCamera: () => void;
    onPickFromGallery: () => void;
}

export const PhotoSourceModal: React.FC<PhotoSourceModalProps> = ({
    visible,
    colors,
    t,
    onClose,
    onPickFromCamera,
    onPickFromGallery,
}) => {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                        {t('physicalProgress.addPhoto', 'Añadir Foto')}
                    </Text>
                    <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 20, fontSize: 14 }}>
                        {t('common.choosePhotoSource', 'Elige de dónde quieres obtener la foto')}
                    </Text>

                    <TouchableOpacity
                        style={[
                            styles.sourceOption,
                            { backgroundColor: colors.inputBackground, borderColor: colors.border },
                        ]}
                        onPress={onPickFromCamera}
                    >
                        <View
                            style={[
                                styles.iconContainer,
                                { backgroundColor: `${colors.primary}20` },
                            ]}
                        >
                            <MaterialIcons name="camera-alt" size={24} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={[styles.optionTitle, { color: colors.text }]}>
                                {t('common.camera', 'Cámara')}
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                                {t('common.takePhotoNow', 'Tomar una foto ahora')}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.sourceOption,
                            { backgroundColor: colors.inputBackground, borderColor: colors.border },
                        ]}
                        onPress={onPickFromGallery}
                    >
                        <View
                            style={[
                                styles.iconContainer,
                                { backgroundColor: `${colors.primary}20` },
                            ]}
                        >
                            <MaterialIcons name="photo-library" size={24} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={[styles.optionTitle, { color: colors.text }]}>
                                {t('common.gallery', 'Galería')}
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                                {t('common.chooseFromPhotos', 'Seleccionar de tus fotos')}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', marginTop: 6 }}>
                        <TouchableOpacity
                            style={[
                                styles.cancelButton,
                                { backgroundColor: colors.inputBackground, borderColor: colors.border },
                            ]}
                            onPress={onClose}
                        >
                            <Text style={[styles.buttonText, { color: colors.text }]}>
                                {t('common.cancel', 'Cancelar')}
                            </Text>
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
        padding: 20,
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
    sourceOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        flex: 1,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
    },
    buttonText: {
        fontWeight: '600',
    },
});

export default PhotoSourceModal;
