import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ExerciseService, CustomExerciseInput } from '../services/ExerciseService';

interface CreateCustomExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (newExercise: any) => void;
}

const MUSCLE_GROUPS = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Abdomen', 'Fullbody'];
const DIFFICULTIES = ['Principiante', 'Intermedio', 'Avanzado'];
const EQUIPMENT_OPTIONS = ['Barra', 'Mancuernas', 'Máquina', 'Polea', 'Peso Corporal', 'Kettlebell', 'Bandas'];

export const CreateCustomExerciseModal: React.FC<CreateCustomExerciseModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  const [titulo, setTitulo] = useState('');
  const [grupoMuscular, setGrupoMuscular] = useState('Pecho');
  const [equipamiento, setEquipamiento] = useState('Barra');
  const [dificultad, setDificultad] = useState('Intermedio');
  const [descripcion, setDescripcion] = useState('');
  const [instrucciones, setInstrucciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetForm = () => {
    setTitulo('');
    setGrupoMuscular('Pecho');
    setEquipamiento('Barra');
    setDificultad('Intermedio');
    setDescripcion('');
    setInstrucciones('');
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!titulo.trim()) {
      setErrorMsg('El título del ejercicio es obligatorio.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const payload: CustomExerciseInput = {
        titulo: titulo.trim(),
        grupo_muscular: grupoMuscular,
        musculos_primarios: grupoMuscular,
        equipamiento,
        dificultad,
        descripcion: descripcion.trim(),
        instrucciones: instrucciones.trim() ? instrucciones.trim().split('\n').filter(Boolean) : [],
      };

      const { data, error } = await ExerciseService.createCustomExercise(payload);

      if (error) {
        throw error;
      }

      resetForm();
      if (onSuccess && data) {
        onSuccess(data);
      }
      onClose();
    } catch (err: any) {
      console.error('Error al crear ejercicio personalizado:', err);
      setErrorMsg(err.message || 'No se pudo crear el ejercicio. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      testID="create-custom-exercise-modal"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Nuevo Ejercicio Personalizado
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              testID="custom-exercise-close-button"
            >
              <MaterialIcons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <ScrollView
            style={styles.formContainer}
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            {errorMsg && (
              <View style={[styles.errorBanner, { backgroundColor: `${colors.error}20` }]}>
                <MaterialIcons name="error-outline" size={20} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
              </View>
            )}

            {/* Nombre/Título */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Nombre del Ejercicio <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Ej. Dominadas Lastradas"
                placeholderTextColor={colors.textSecondary}
                value={titulo}
                onChangeText={setTitulo}
                testID="custom-exercise-name-input"
              />
            </View>

            {/* Grupo Muscular */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Grupo Muscular Principal</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsContainer}
              >
                {MUSCLE_GROUPS.map((mg) => {
                  const isSelected = grupoMuscular === mg;
                  return (
                    <TouchableOpacity
                      key={mg}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? `${colors.primary}20` : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setGrupoMuscular(mg)}
                      testID={`custom-exercise-muscle-chip-${mg.toLowerCase()}`}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: isSelected ? colors.primary : colors.textSecondary },
                        ]}
                      >
                        {mg}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Equipamiento */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Equipamiento</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsContainer}
              >
                {EQUIPMENT_OPTIONS.map((eq) => {
                  const isSelected = equipamiento === eq;
                  return (
                    <TouchableOpacity
                      key={eq}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? `${colors.primary}20` : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setEquipamiento(eq)}
                      testID={`custom-exercise-equipment-chip-${eq.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: isSelected ? colors.primary : colors.textSecondary },
                        ]}
                      >
                        {eq}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Dificultad */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Dificultad</Text>
              <View style={styles.rowContainer}>
                {DIFFICULTIES.map((dif) => {
                  const isSelected = dificultad === dif;
                  return (
                    <TouchableOpacity
                      key={dif}
                      style={[
                        styles.chipRow,
                        {
                          backgroundColor: isSelected ? `${colors.primary}20` : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setDificultad(dif)}
                      testID={`custom-exercise-difficulty-chip-${dif.toLowerCase()}`}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: isSelected ? colors.primary : colors.textSecondary },
                        ]}
                      >
                        {dif}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Descripción */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Descripción (Opcional)</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Descripción general del ejercicio..."
                placeholderTextColor={colors.textSecondary}
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                numberOfLines={3}
                testID="custom-exercise-description-input"
              />
            </View>

            {/* Instrucciones */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Instrucciones (1 por línea)</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Paso 1: Agarrar la barra&#10;Paso 2: Subir con fuerza"
                placeholderTextColor={colors.textSecondary}
                value={instrucciones}
                onChangeText={setInstrucciones}
                multiline
                numberOfLines={3}
                testID="custom-exercise-instructions-input"
              />
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.button, styles.cancelBtn, { borderColor: colors.border }]}
              onPress={handleClose}
              disabled={loading}
              testID="custom-exercise-cancel-button"
            >
              <Text style={[styles.buttonText, { color: colors.textSecondary }]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitBtn, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              disabled={loading}
              testID="custom-exercise-submit-button"
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={[styles.buttonText, { color: '#FFF' }]}>Guardar Ejercicio</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  chipsContainer: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  chipRow: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  submitBtn: {
    elevation: 2,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
