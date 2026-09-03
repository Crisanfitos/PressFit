import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    TextInput,
    ActivityIndicator,
    Alert,
    StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import KeyboardAwareContainer from '../KeyboardAwareContainer';
import { ThemeColors } from '../../types/theme';

export interface PhotoEditModalProps {
    visible: boolean;
    editDate: Date;
    setEditDate: (date: Date) => void;
    editComment: string;
    setEditComment: (text: string) => void;
    saving: boolean;
    colors: ThemeColors;
    onClose: () => void;
    onSave: () => void;
}

export const PhotoEditModal: React.FC<PhotoEditModalProps> = ({
    visible,
    editDate,
    setEditDate,
    editComment,
    setEditComment,
    saving,
    colors,
    onClose,
    onSave,
}) => {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAwareContainer
                style={styles.modalOverlay}
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                dismissOnClickOutside={false}
            >
                <View
                    style={[
                        styles.modalContent,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                >
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                        Editar Detalles de Foto
                    </Text>

                    <Text style={[styles.label, { color: colors.textSecondary }]}>Fecha</Text>
                    <TouchableOpacity
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.inputBackground,
                                borderColor: colors.border,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            },
                        ]}
                        onPress={() => {
                            Alert.alert('Cambiar Fecha', 'Selecciona una opción', [
                                { text: 'Hoy', onPress: () => setEditDate(new Date()) },
                                {
                                    text: 'Ayer',
                                    onPress: () => {
                                        const d = new Date();
                                        d.setDate(d.getDate() - 1);
                                        setEditDate(d);
                                    },
                                },
                                {
                                    text: 'Hace 1 semana',
                                    onPress: () => {
                                        const d = new Date();
                                        d.setDate(d.getDate() - 7);
                                        setEditDate(d);
                                    },
                                },
                                { text: 'Cancelar', style: 'cancel' },
                            ]);
                        }}
                    >
                        <Text style={{ color: colors.text }}>{editDate.toLocaleDateString()}</Text>
                        <MaterialIcons name="calendar-today" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <Text style={[styles.label, { color: colors.textSecondary }]}>Comentario</Text>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.inputBackground,
                                borderColor: colors.border,
                                color: colors.text,
                            },
                        ]}
                        placeholder="Añade un comentario..."
                        placeholderTextColor={colors.textSecondary}
                        value={editComment}
                        onChangeText={setEditComment}
                        multiline
                    />
                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={[
                                styles.modalButton,
                                { backgroundColor: colors.inputBackground, borderColor: colors.border, borderWidth: 1 },
                            ]}
                            onPress={onClose}
                        >
                            <Text style={[styles.buttonText, { color: colors.text }]}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: colors.primary }]}
                            onPress={onSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color={colors.background} />
                            ) : (
                                <Text style={[styles.buttonText, { color: colors.background }]}>Guardar</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAwareContainer>
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
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    modalButton: {
        flex: 1,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        fontWeight: '600',
    },
});

export default PhotoEditModal;
