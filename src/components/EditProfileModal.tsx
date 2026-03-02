import React, { useState, useContext, useMemo, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    currentMetrics: { peso?: number; altura?: number } | null;
    onSave: (metrics: { weight: number; height: number; bodyFatPercentage: number | null }) => Promise<void>;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, onClose, currentMetrics, onSave }) => {
    const authContext = useContext(AuthContext);
    const { theme, themeMode } = useTheme();
    const { colors } = theme;
    const [loading, setLoading] = useState(false);
    const [weight, setWeight] = useState(currentMetrics?.peso?.toString() || '');
    const [height, setHeight] = useState(currentMetrics?.altura?.toString() || '');

    // Sync state when currentMetrics changes (e.g. on modal open)
    useEffect(() => {
        if (visible) {
            setWeight(currentMetrics?.peso?.toString() || '');
            setHeight(currentMetrics?.altura?.toString() || '');
        }
    }, [visible, currentMetrics]);

    const hasExistingHeight = !!currentMetrics?.altura;

    const calculateIMC = (weightKg: number, heightCm: number) => {
        if (!weightKg || !heightCm) return null;
        const heightM = heightCm / 100;
        return (weightKg / (heightM * heightM)).toFixed(1);
    };

    // Show IMC preview only when inputs have enough digits to produce a valid result.
    // If height not set yet: require 3-digit height AND some weight
    // If height already exists: show IMC when weight has at least 2 digits
    const showImcPreview = (() => {
        const heightStr = height.replace('.', '').replace(',', '');
        const weightStr = weight.replace('.', '').replace(',', '');

        if (hasExistingHeight) {
            // Height already on record – show IMC when weight has >= 2 meaningful digits
            const effectiveHeight = height.length >= 3 ? height : currentMetrics?.altura?.toString() || '';
            return weightStr.length >= 2 && effectiveHeight.length >= 3;
        } else {
            // No height yet – need 3-digit height AND any weight
            return heightStr.length >= 3 && weightStr.length >= 1;
        }
    })();

    const imcValue = (() => {
        const w = parseFloat(weight);
        const h = height.length >= 3 ? parseFloat(height) : (hasExistingHeight ? currentMetrics!.altura! : 0);
        return w && h ? calculateIMC(w, h) : null;
    })();

    const handleSave = async () => {
        const weightNum = parseFloat(weight);
        const effectiveHeight = height || (hasExistingHeight ? currentMetrics!.altura!.toString() : '');
        const heightNum = parseFloat(effectiveHeight);

        // Height is required only if not already recorded
        if (!hasExistingHeight && !height) {
            Alert.alert('Error', 'La altura es requerida la primera vez que introduces tus datos');
            return;
        }

        if (!weight) {
            Alert.alert('Error', 'Introduce tu peso para guardar');
            return;
        }

        if (isNaN(weightNum) || (height && isNaN(heightNum))) {
            Alert.alert('Error', 'Por favor ingresa valores numéricos válidos');
            return;
        }

        if (weightNum <= 0 || (heightNum && heightNum <= 0)) {
            Alert.alert('Error', 'Los valores deben ser mayores a 0');
            return;
        }

        setLoading(true);
        try {
            await onSave({
                weight: weightNum,
                height: heightNum || currentMetrics?.altura || 0,
                bodyFatPercentage: null,
            });
            onClose();
        } catch (error) {
            console.error('Error saving metrics:', error);
            Alert.alert('Error', 'Ocurrió un error al guardar los datos');
        } finally {
            setLoading(false);
        }
    };

    const styles = useMemo(() => StyleSheet.create({
        overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' },
        kavContainer: { justifyContent: 'flex-end' },
        modalContent: {
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        },
        modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
        modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
        form: { marginBottom: 20 },
        inputGroup: { marginBottom: 16 },
        label: { fontSize: 14, fontWeight: '500', color: colors.textSecondary, marginBottom: 8 },
        input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 16, fontSize: 16, color: colors.text },
        optionalHint: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
        imcPreview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 8, backgroundColor: `${colors.primary}20`, borderWidth: 1, borderColor: colors.primary, marginTop: 4 },
        imcLabel: { fontSize: 16, fontWeight: '500', color: colors.primary },
        imcValue: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
        buttonContainer: { flexDirection: 'row', gap: 12 },
        cancelButton: { flex: 1, padding: 16, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
        cancelButtonText: { fontSize: 16, fontWeight: '600', color: colors.text },
        saveButton: { flex: 1, padding: 16, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center' },
        saveButtonDisabled: { opacity: 0.6 },
        saveButtonText: { fontSize: 16, fontWeight: 'bold', color: themeMode === 'dark' ? colors.background : colors.text },
    }), [colors, themeMode]);

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.kavContainer}
                >
                    <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Editar Datos Físicos</Text>
                                <TouchableOpacity onPress={onClose}>
                                    <MaterialIcons name="close" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.form}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Peso (kg) *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={weight}
                                        onChangeText={setWeight}
                                        keyboardType="decimal-pad"
                                        placeholder="72.5"
                                        placeholderTextColor={colors.textSecondary}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>
                                        Altura (cm){hasExistingHeight ? ' (opcional)' : ' *'}
                                    </Text>
                                    <TextInput
                                        style={styles.input}
                                        value={height}
                                        onChangeText={setHeight}
                                        keyboardType="decimal-pad"
                                        placeholder={hasExistingHeight ? `${currentMetrics?.altura} cm (actual)` : '178'}
                                        placeholderTextColor={colors.textSecondary}
                                    />
                                    {hasExistingHeight && (
                                        <Text style={styles.optionalHint}>
                                            Déjalo vacío para mantener {currentMetrics?.altura} cm
                                        </Text>
                                    )}
                                </View>

                                {showImcPreview && imcValue && (
                                    <View style={styles.imcPreview}>
                                        <Text style={styles.imcLabel}>IMC calculado:</Text>
                                        <Text style={styles.imcValue}>{imcValue}</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={loading}>
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.saveButton, loading && styles.saveButtonDisabled]} onPress={handleSave} disabled={loading}>
                                    {loading ? (
                                        <ActivityIndicator size="small" color={colors.background} />
                                    ) : (
                                        <Text style={styles.saveButtonText}>Guardar</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

export default EditProfileModal;
