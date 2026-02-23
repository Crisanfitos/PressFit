import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    TextInput,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Keyboard,
    ScrollView,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import { useExerciseNote } from '../hooks/useExerciseNote';
import { useTheme } from '../context/ThemeContext';

interface PersonalNoteButtonProps {
    exerciseId: string;
}

export const PersonalNoteButton: React.FC<PersonalNoteButtonProps> = ({ exerciseId }) => {
    const { theme, themeMode } = useTheme();
    const { colors } = theme;
    const { note, loading, saving, saveNote } = useExerciseNote(exerciseId);
    const [modalVisible, setModalVisible] = useState(false);
    const [tempNote, setTempNote] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const TEXT_LIMIT = 150;

    useEffect(() => {
        if (note !== null) {
            setTempNote(note);
        }
    }, [note]);

    const handleSave = async () => {
        Keyboard.dismiss();
        if (!tempNote.trim()) {
            setModalVisible(false);
            return;
        }
        const { success, error } = await saveNote(tempNote);
        if (success) {
            setModalVisible(false);
        } else {
            const errorMessage = typeof error === 'object' ? JSON.stringify(error) : String(error) || 'Error desconocido';
            Alert.alert('Error al guardar', errorMessage);
        }
    };

    if (loading && !note) return null;

    const renderNoteContent = () => {
        if (!note) {
            return (
                <TouchableOpacity
                    style={styles.contentRow}
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.placeholderText, { color: colors.textSecondary, opacity: 0.7 }]}>
                        Añadir nota personal...
                    </Text>
                    <Text style={{ marginLeft: 6, opacity: 0.7, fontSize: 12 }}>📝</Text>
                </TouchableOpacity>
            );
        }

        const isLongText = note.length > TEXT_LIMIT;
        const displayText = isExpanded || !isLongText ? note : note.substring(0, TEXT_LIMIT).trim() + '... ';

        return (
            <View style={styles.contentRow}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                        {displayText}
                        {isLongText && (
                            <Text
                                style={{ color: colors.primary, fontWeight: 'bold' }}
                                onPress={() => setIsExpanded(!isExpanded)}
                            >
                                {isExpanded ? ' Ver menos' : 'Ver más'}
                            </Text>
                        )}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    style={{ paddingLeft: 8, paddingVertical: 2 }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Text style={{ fontSize: 14 }}>✏️</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.noteContainer}>{renderNoteContent()}</View>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View
                        style={[
                            styles.modalContent,
                            {
                                backgroundColor: themeMode === 'dark' ? '#18181b' : '#ffffff',
                                borderColor: colors.border,
                                borderWidth: 1,
                            },
                        ]}
                    >
                        <ScrollView
                            contentContainerStyle={{ flexGrow: 0 }}
                            keyboardShouldPersistTaps="handled"
                            style={{ maxHeight: 300 }}
                        >
                            <View onStartShouldSetResponder={() => true}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Nota Personal</Text>
                                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                                    Esta nota aparecerá siempre que realices este ejercicio.
                                </Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: colors.surface,
                                            color: colors.text,
                                            borderColor: colors.border,
                                            borderWidth: 1,
                                        },
                                    ]}
                                    multiline
                                    placeholder="Ej: Controlar la bajada, codos cerrados..."
                                    placeholderTextColor={colors.textSecondary}
                                    value={tempNote}
                                    onChangeText={setTempNote}
                                    autoFocus
                                />
                            </View>
                        </ScrollView>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={[styles.buttonTextCancel, { color: colors.textSecondary }]}>
                                    Cancelar
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]}
                                onPress={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#000" />
                                ) : (
                                    <Text style={[styles.buttonTextSave, { color: '#000' }]}>Guardar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {},
    noteContainer: {},
    contentRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    noteText: {
        fontSize: 12,
        fontStyle: 'italic',
        lineHeight: 18,
    },
    placeholderText: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxHeight: '80%',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 13,
        marginBottom: 20,
        lineHeight: 18,
    },
    input: {
        borderRadius: 12,
        padding: 12,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 20,
        fontSize: 14,
    },
    modalButtons: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: 'transparent',
    },
    saveButton: {},
    buttonTextCancel: {
        fontWeight: '600',
    },
    buttonTextSave: {
        fontWeight: '600',
    },
});

export default PersonalNoteButton;
