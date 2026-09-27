import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    TextInput,
    Image,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import KeyboardAwareContainer from '../KeyboardAwareContainer';
import { ThemeColors } from '../../types/theme';

export interface PhotoUploadModalProps {
    visible: boolean;
    imageUri: string | null;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    showDatePicker: boolean;
    setShowDatePicker: (show: boolean) => void;
    comment: string;
    setComment: (text: string) => void;
    uploading: boolean;
    colors: ThemeColors;
    themeMode: string;
    onClose: () => void;
    onConfirmUpload: () => void;
}

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
    visible,
    imageUri,
    selectedDate,
    setSelectedDate,
    showDatePicker,
    setShowDatePicker,
    comment,
    setComment,
    uploading,
    colors,
    themeMode,
    onClose,
    onConfirmUpload,
}) => {
    const { t, i18n } = useTranslation();
    const currentLocale = i18n.language?.startsWith('en') ? enUS : es;
    const dateFormatStr = i18n.language?.startsWith('en') ? 'MMMM d, yyyy' : "d 'de' MMMM, yyyy";

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
                        {t('physicalProgress.newPhotoTitle', 'Nueva Foto de Progreso')}
                    </Text>
                    {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}

                    <Text style={[styles.label, { color: colors.textSecondary }]}>
                        {t('physicalProgress.photoDateLabel', 'Fecha de la foto')}
                    </Text>
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
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={{ color: colors.text }}>
                            {format(selectedDate, dateFormatStr, { locale: currentLocale })}
                        </Text>
                        <MaterialIcons name="calendar-today" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={selectedDate}
                            mode="date"
                            display="spinner"
                            onChange={(_event, date) => {
                                setShowDatePicker(false);
                                if (date) {
                                    setSelectedDate(date);
                                }
                            }}
                            maximumDate={new Date()}
                            themeVariant={themeMode === 'dark' ? 'dark' : 'light'}
                            textColor={colors.text}
                            accentColor={colors.primary}
                        />
                    )}

                    <Text style={[styles.label, { color: colors.textSecondary }]}>
                        {t('physicalProgress.commentLabel', 'Comentario (opcional)')}
                    </Text>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.inputBackground,
                                borderColor: colors.border,
                                color: colors.text,
                            },
                        ]}
                        placeholder={t('physicalProgress.commentPlaceholder', 'Añade un comentario...')}
                        placeholderTextColor={colors.textSecondary}
                        value={comment}
                        onChangeText={setComment}
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
                            <Text style={[styles.buttonText, { color: colors.text }]}>
                                {t('common.cancel', 'Cancelar')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: colors.primary }]}
                            onPress={onConfirmUpload}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <ActivityIndicator color={colors.background} />
                            ) : (
                                <Text style={[styles.buttonText, { color: colors.background }]}>
                                    {t('common.save', 'Guardar')}
                                </Text>
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
    previewImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
        marginBottom: 20,
        alignSelf: 'center',
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

export default PhotoUploadModal;
