import React, { useState, useContext, useMemo } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
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

    const calculateIMC = (weightKg: number, heightCm: number) => {
        if (!weightKg || !heightCm) return null;
        const heightM = heightCm / 100;
        return (weightKg / (heightM * heightM)).toFixed(1);
    };

    const handleSave = async () => {
        if (!weight || !height) {
            Alert.alert('Error', 'Peso y altura son requeridos');
            return;
        }

        const weightNum = parseFloat(weight);
        const heightNum = parseFloat(height);

        if (isNaN(weightNum) || isNaN(heightNum)) {
            Alert.alert('Error', 'Por favor ingresa valores numéricos válidos');
            return;
        }

        if (weightNum <= 0 || heightNum <= 0) {
            Alert.alert('Error', 'Los valores deben ser mayores a 0');
            return;
        }

        setLoading(true);
        try {
            await onSave({ weight: weightNum, height: heightNum, bodyFatPercentage: null });
            onClose();
        } catch (error) {
            console.error('Error saving metrics:', error);
            Alert.alert('Error', 'Ocurrió un error al guardar los datos');
        } finally {
            setLoading(false);
        }
    };

    const styles = useMemo(() => StyleSheet.create({
        modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' },
        modalContent: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
        modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
        modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
        form: { marginBottom: 24 },
        inputGroup: { marginBottom: 20 },
        label: { fontSize: 14, fontWeight: '500', color: colors.textSecondary, marginBottom: 8 },
        input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 16, fontSize: 16, color: colors.text },
        imcPreview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 8, backgroundColor: `${colors.primary}20`, borderWidth: 1, borderColor: colors.primary },
        imcLabel: { fontSize: 16, fontWeight: '500', color: colors.primary },
        imcValue: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
        buttonContainer: { flexDirection: 'row', gap: 12 },
        cancelButton: { flex: 1, padding: 16, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
        cancelButtonText: { fontSize: 16, fontWeight: '600', color: colors.text },
        saveButton: { flex: 1, padding: 16, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center' },
        saveButtonDisabled: { opacity: 0.6 },
        saveButtonText: { fontSize: 16, fontWeight: 'bold', color: themeMode === 'dark' ? colors.background : colors.text },
    }), [colors, themeMode]);

    const imc = weight && height ? calculateIMC(parseFloat(weight), parseFloat(height)) : null;

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
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
                            <Text style={styles.label}>Altura (cm) *</Text>
                            <TextInput
                                style={styles.input}
                                value={height}
                                onChangeText={setHeight}
                                keyboardType="decimal-pad"
                                placeholder="178"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>

                        {imc && (
                            <View style={styles.imcPreview}>
                                <Text style={styles.imcLabel}>IMC calculado:</Text>
                                <Text style={styles.imcValue}>{imc}</Text>
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
            </View>
        </Modal>
    );
};

export default EditProfileModal;
