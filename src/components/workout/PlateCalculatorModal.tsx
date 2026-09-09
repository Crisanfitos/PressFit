import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  calculatePlates,
  PlateCalculationResult,
  WeightUnit,
  DEFAULT_BAR_WEIGHT_KG,
  DEFAULT_BAR_WEIGHT_LB,
} from '../../utils/plateCalculator';
import { ThemeColors } from '../../types/theme';
import PlateVisualizer from './PlateVisualizer';
import { HapticService } from '../../services/HapticService';

export interface PlateCalculatorModalProps {
  visible: boolean;
  onClose: () => void;
  initialWeight?: number;
  unit?: WeightUnit;
  colors: ThemeColors;
  onApplyWeight?: (weight: number) => void;
  testID?: string;
}

const BAR_PRESETS_KG = [20, 15, 10];
const BAR_PRESETS_LB = [45, 35, 25];

export const PlateCalculatorModal: React.FC<PlateCalculatorModalProps> = ({
  visible,
  onClose,
  initialWeight = 20,
  unit = 'kg',
  colors,
  onApplyWeight,
  testID = 'plate-calculator-modal',
}) => {
  if (!visible) return null;

  const defaultBar = unit === 'kg' ? DEFAULT_BAR_WEIGHT_KG : DEFAULT_BAR_WEIGHT_LB;
  const barPresets = unit === 'kg' ? BAR_PRESETS_KG : BAR_PRESETS_LB;

  const [targetWeightInput, setTargetWeightInput] = useState<string>(
    initialWeight > 0 ? String(initialWeight) : String(defaultBar)
  );
  const [barWeight, setBarWeight] = useState<number>(defaultBar);

  useEffect(() => {
    if (visible) {
      const weightToSet = initialWeight > 0 ? initialWeight : defaultBar;
      setTargetWeightInput(String(weightToSet));
      setBarWeight(defaultBar);
    }
  }, [visible, initialWeight, defaultBar]);

  const parsedTargetWeight = useMemo(() => {
    const parsed = parseFloat(targetWeightInput.replace(',', '.'));
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }, [targetWeightInput]);

  const result: PlateCalculationResult = useMemo(() => {
    return calculatePlates({
      targetWeight: parsedTargetWeight,
      barWeight,
      unit,
    });
  }, [parsedTargetWeight, barWeight, unit]);

  const handleAdjustWeight = (delta: number) => {
    HapticService.selection();
    const nextVal = Math.max(0, Math.round((parsedTargetWeight + delta) * 10) / 10);
    const valStr = nextVal % 1 === 0 ? String(nextVal) : nextVal.toFixed(1);
    setTargetWeightInput(valStr);
  };

  const handleSelectBar = (weight: number) => {
    HapticService.selection();
    setBarWeight(weight);
  };

  const handleApply = () => {
    HapticService.selection();
    if (onApplyWeight) {
      onApplyWeight(result.totalWeight);
    }
    onClose();
  };

  const getWarningMessage = () => {
    if (!result.warning) return null;
    switch (result.warning) {
      case 'TARGET_BELOW_BAR':
        return `El peso objetivo (${result.targetWeight} ${unit}) es menor que la barra (${result.barWeight} ${unit}).`;
      case 'INSUFFICIENT_PLATES':
        return 'No hay suficientes discos en el inventario para alcanzar este peso.';
      case 'FRACTIONAL_REMAINDER':
        return `Peso inexacto. Queda un resto de ${result.remainder} ${unit} sin cubrir.`;
      default:
        return null;
    }
  };

  const warningMessage = getWarningMessage();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID={testID}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          testID="plate-calculator-card"
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleContainer}>
              <MaterialIcons name="fitness-center" size={22} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.title, { color: colors.text }]}>
                Calculadora de Discos
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              testID="close-plate-calculator-btn"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.closeBtn}
            >
              <MaterialIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View
            style={styles.scrollBody}
          >
            {/* Target Weight Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                PESO TOTAL OBJETIVO ({unit.toUpperCase()})
              </Text>
              <View style={styles.weightControlRow}>
                <TouchableOpacity
                  testID="plate-calc-minus-5"
                  style={[styles.stepperBtn, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}
                  onPress={() => handleAdjustWeight(-5)}
                >
                  <Text style={[styles.stepperText, { color: colors.primary }]}>-5</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="plate-calc-minus-2-5"
                  style={[styles.stepperBtn, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}
                  onPress={() => handleAdjustWeight(-2.5)}
                >
                  <Text style={[styles.stepperText, { color: colors.primary }]}>-2.5</Text>
                </TouchableOpacity>

                <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <TextInput
                    testID="plate-calc-target-input"
                    value={targetWeightInput}
                    onChangeText={setTargetWeightInput}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                    style={[styles.weightInput, { color: colors.text }]}
                    maxLength={6}
                  />
                  <Text style={[styles.unitText, { color: colors.textSecondary }]}>{unit}</Text>
                </View>

                <TouchableOpacity
                  testID="plate-calc-plus-2-5"
                  style={[styles.stepperBtn, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}
                  onPress={() => handleAdjustWeight(2.5)}
                >
                  <Text style={[styles.stepperText, { color: colors.primary }]}>+2.5</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="plate-calc-plus-5"
                  style={[styles.stepperBtn, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}
                  onPress={() => handleAdjustWeight(5)}
                >
                  <Text style={[styles.stepperText, { color: colors.primary }]}>+5</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bar Weight Selector */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                PESO DE LA BARRA
              </Text>
              <View style={styles.barPresetsRow}>
                {barPresets.map((preset) => {
                  const isSelected = barWeight === preset;
                  return (
                    <TouchableOpacity
                      key={`bar-${preset}`}
                      testID={`bar-preset-${preset}`}
                      style={[
                        styles.barChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surfaceHighlight,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => handleSelectBar(preset)}
                    >
                      <Text
                        style={[
                          styles.barChipText,
                          {
                            color: isSelected ? '#FFFFFF' : colors.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {preset} {unit} {preset === 20 ? '(Estándar)' : preset === 15 ? '(Técnica)' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Plate Visualizer Canvas */}
            <View style={[styles.visualizerCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <PlateVisualizer
                platesPerSide={result.platesPerSide}
                unit={result.unit}
                barWeight={result.barWeight}
                colors={colors}
              />
            </View>

            {/* Summary Text Banner */}
            <View style={[styles.summaryCard, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
              <Text style={[styles.summaryTitle, { color: colors.text }]} testID="plate-summary-text">
                {result.summary}
              </Text>

              {/* Metrics Grid */}
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Barra</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{result.barWeight} {unit}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Por lado</Text>
                  <Text style={[styles.metricValue, { color: colors.primary }]}>{result.weightPerSide} {unit}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Discos</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{result.totalPlateWeight} {unit}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{result.totalWeight} {unit}</Text>
                </View>
              </View>
            </View>

            {/* Warnings */}
            {warningMessage && (
              <View style={styles.warningBox} testID="plate-calc-warning">
                <MaterialIcons name="warning" size={18} color="#D97706" style={{ marginRight: 6 }} />
                <Text style={styles.warningText}>{warningMessage}</Text>
              </View>
            )}
          </View>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              testID="cancel-plate-calc-btn"
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cerrar</Text>
            </TouchableOpacity>

            {onApplyWeight && (
              <TouchableOpacity
                testID="apply-plate-calc-btn"
                style={[styles.applyBtn, { backgroundColor: colors.primary }]}
                onPress={handleApply}
              >
                <MaterialIcons name="check" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.applyBtnText}>
                  Aplicar {result.totalWeight} {unit}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    paddingBottom: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  weightControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  stepperBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
  },
  stepperText: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  weightInput: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 60,
  },
  unitText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  barPresetsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  barChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  barChipText: {
    fontSize: 12,
  },
  visualizerCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 8,
    marginBottom: 14,
    overflow: 'hidden',
  },
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.15)',
    paddingTop: 10,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  warningText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.15)',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default PlateCalculatorModal;
