import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import {
  PlateSettingsService,
  UserPlateSettings,
} from '../services/PlateSettingsService';
import {
  PlateInventoryItem,
  WeightUnit,
  DEFAULT_BAR_WEIGHT_KG,
  DEFAULT_BAR_WEIGHT_LB,
  calculatePlates,
} from '../utils/plateCalculator';
import { PlateVisualizer } from '../components/workout/PlateVisualizer';
import { HapticService } from '../services/HapticService';

interface PlateSettingsScreenProps {
  navigation: any;
}

const BAR_PRESETS_KG = [
  { label: '20 kg', value: 20, desc: 'Olímpica estándar' },
  { label: '15 kg', value: 15, desc: 'Olímpica técnica' },
  { label: '10 kg', value: 10, desc: 'Multipower / Smith' },
];

const BAR_PRESETS_LB = [
  { label: '45 lb', value: 45, desc: 'Olímpica estándar' },
  { label: '35 lb', value: 35, desc: 'Olímpica técnica' },
  { label: '25 lb', value: 25, desc: 'Multipower / Smith' },
];

export const PlateSettingsScreen: React.FC<PlateSettingsScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { colors } = theme;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [settings, setSettings] = useState<UserPlateSettings | null>(null);
  const [isCustomBar, setIsCustomBar] = useState(false);
  const [customBarText, setCustomBarText] = useState('');

  // Cargar configuración inicial
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await PlateSettingsService.getSettings();
      setSettings(data);
      checkIfCustom(data.defaultBarWeight, data.unit);
    } catch (error) {
      console.error('[PlateSettingsScreen] Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfCustom = (barWeight: number, unit: WeightUnit) => {
    const presets = unit === 'kg' ? BAR_PRESETS_KG : BAR_PRESETS_LB;
    const isPreset = presets.some(p => p.value === barWeight);
    setIsCustomBar(!isPreset);
    setCustomBarText(barWeight.toString());
  };

  const currentUnit = settings?.unit ?? 'kg';
  const barPresets = currentUnit === 'kg' ? BAR_PRESETS_KG : BAR_PRESETS_LB;
  const currentPlates: PlateInventoryItem[] = useMemo(() => {
    if (!settings) return [];
    return currentUnit === 'kg' ? settings.platesKg : settings.platesLb;
  }, [settings, currentUnit]);

  // Cambiar Unidad
  const handleUnitChange = async (unit: WeightUnit) => {
    if (!settings || settings.unit === unit) return;
    HapticService.selection();

    const updated = await PlateSettingsService.updateUnit(unit);
    setSettings(updated);
    checkIfCustom(updated.defaultBarWeight, unit);
  };

  // Cambiar Preset de Barra
  const handleBarPresetSelect = async (value: number) => {
    if (!settings) return;
    HapticService.light();

    setIsCustomBar(false);
    setCustomBarText(value.toString());

    const updated = await PlateSettingsService.updateBarWeight(value, currentUnit);
    setSettings(updated);
  };

  // Personalizar Peso de Barra
  const handleCustomBarChange = (text: string) => {
    setCustomBarText(text);
    const num = parseFloat(text);
    if (!isNaN(num) && num > 0 && settings) {
      const updated: UserPlateSettings = {
        ...settings,
        defaultBarWeight: num,
        ...(currentUnit === 'kg' ? { customBarWeightKg: num } : { customBarWeightLb: num }),
      };
      setSettings(updated);
      PlateSettingsService.saveSettings(updated);
    }
  };

  // Alternar Inclusión de Disco (Switch)
  const handleTogglePlate = async (weight: number, enabled: boolean) => {
    if (!settings) return;
    HapticService.selection();

    // enabled = true -> undefined (ilimitado por defecto), enabled = false -> 0 (desactivado)
    const newPairs = enabled ? undefined : 0;
    const updated = await PlateSettingsService.updatePlateItem(currentUnit, weight, {
      availablePairs: newPairs,
    });
    setSettings(updated);
  };

  // Ajustar Cantidad de Pares (Incremento/Decremento)
  const handleAdjustPairs = async (plate: PlateInventoryItem, delta: number) => {
    if (!settings) return;
    HapticService.light();

    let currentPairs = plate.availablePairs;
    let nextPairs: number | undefined;

    if (currentPairs === undefined) {
      // Si era ilimitado y decrementa, baja a 4 pares
      nextPairs = delta < 0 ? 4 : undefined;
    } else {
      const candidate = currentPairs + delta;
      if (candidate <= 0) {
        nextPairs = 0; // Desactivado
      } else if (candidate > 20) {
        nextPairs = undefined; // Pasa a ilimitado
      } else {
        nextPairs = candidate;
      }
    }

    const updated = await PlateSettingsService.updatePlateItem(currentUnit, plate.weight, {
      availablePairs: nextPairs,
    });
    setSettings(updated);
  };

  // Establecer Ilimitado
  const handleSetUnlimited = async (weight: number) => {
    if (!settings) return;
    HapticService.light();

    const updated = await PlateSettingsService.updatePlateItem(currentUnit, weight, {
      availablePairs: undefined,
    });
    setSettings(updated);
  };

  // Restablecer Valores de Fábrica
  const handleResetDefaults = () => {
    Alert.alert(
      t('plateSettings.resetConfirmTitle', 'Restablecer Ajustes'),
      t('plateSettings.resetConfirmMsg', '¿Deseas restaurar todas las denominaciones de discos y pesos de barra por defecto?'),
      [
        { text: t('common.cancel', 'Cancelar'), style: 'cancel' },
        {
          text: t('common.confirm', 'Restablecer'),
          style: 'destructive',
          onPress: async () => {
            HapticService.medium();
            const defaults = await PlateSettingsService.resetToDefaults();
            setSettings(defaults);
            checkIfCustom(defaults.defaultBarWeight, defaults.unit);
          },
        },
      ]
    );
  };

  // Guardado manual explícito (además del auto-save)
  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await PlateSettingsService.saveSettings(settings);
      HapticService.light();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (e) {
      Alert.alert(t('common.error', 'Error'), t('plateSettings.saveError', 'No se pudieron guardar los ajustes.'));
    } finally {
      setSaving(false);
    }
  };

  // Vista previa de barra calculada con el inventario configurado
  const previewCalculation = useMemo(() => {
    if (!settings) return null;
    const bar = settings.defaultBarWeight;
    const sampleTarget = currentUnit === 'kg' ? Math.max(bar + 40, 60) : Math.max(bar + 90, 135);
    return calculatePlates({
      targetWeight: sampleTarget,
      barWeight: bar,
      unit: currentUnit,
      customPlates: currentPlates,
    });
  }, [settings, currentUnit, currentPlates]);

  if (loading || !settings) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} testID="plate-settings-screen">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} testID="plate-settings-screen">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          testID="back-button"
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('plateSettings.title', 'Discos y Barras')}
        </Text>
        <TouchableOpacity
          testID="reset-defaults-button"
          style={styles.headerButton}
          onPress={handleResetDefaults}
        >
          <MaterialIcons name="refresh" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Selector de Unidad */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('plateSettings.unitTitle', 'Unidad de Medida')}
          </Text>
          <View style={styles.unitSelectorContainer}>
            <TouchableOpacity
              testID="unit-selector-kg"
              style={[
                styles.unitTab,
                currentUnit === 'kg' && { backgroundColor: colors.primary },
              ]}
              onPress={() => handleUnitChange('kg')}
            >
              <Text
                style={[
                  styles.unitTabText,
                  { color: currentUnit === 'kg' ? colors.textOnPrimary : colors.textSecondary },
                ]}
              >
                Kilogramos (kg)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="unit-selector-lb"
              style={[
                styles.unitTab,
                currentUnit === 'lb' && { backgroundColor: colors.primary },
              ]}
              onPress={() => handleUnitChange('lb')}
            >
              <Text
                style={[
                  styles.unitTabText,
                  { color: currentUnit === 'lb' ? colors.textOnPrimary : colors.textSecondary },
                ]}
              >
                Libras (lb)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Peso de Barra por Defecto */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons name="fitness-center" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 8 }]}>
              {t('plateSettings.barWeightTitle', 'Peso de Barra por Defecto')}
            </Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            {t('plateSettings.barWeightSubtitle', 'Selecciona el peso de tu barra habitual o ingresa un valor exacto.')}
          </Text>

          <View style={styles.presetsGrid}>
            {barPresets.map((preset) => {
              const isSelected = !isCustomBar && settings.defaultBarWeight === preset.value;
              return (
                <TouchableOpacity
                  key={preset.value}
                  testID={`bar-preset-${preset.value}`}
                  style={[
                    styles.presetButton,
                    { borderColor: isSelected ? colors.primary : colors.border },
                    isSelected && { backgroundColor: `${colors.primary}15` },
                  ]}
                  onPress={() => handleBarPresetSelect(preset.value)}
                >
                  <Text style={[styles.presetValue, { color: isSelected ? colors.primary : colors.text }]}>
                    {preset.label}
                  </Text>
                  <Text style={[styles.presetDesc, { color: colors.textSecondary }]}>
                    {preset.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Opción Personalizada */}
            <TouchableOpacity
              testID="bar-preset-custom"
              style={[
                styles.presetButton,
                { borderColor: isCustomBar ? colors.primary : colors.border },
                isCustomBar && { backgroundColor: `${colors.primary}15` },
              ]}
              onPress={() => {
                HapticService.light();
                setIsCustomBar(true);
              }}
            >
              <Text style={[styles.presetValue, { color: isCustomBar ? colors.primary : colors.text }]}>
                {t('common.custom', 'Personalizado')}
              </Text>
              <Text style={[styles.presetDesc, { color: colors.textSecondary }]}>
                {t('plateSettings.customDesc', 'Cualquier peso')}
              </Text>
            </TouchableOpacity>
          </View>

          {isCustomBar && (
            <View style={[styles.customInputRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.customInputLabel, { color: colors.text }]}>
                {t('plateSettings.customBarWeight', 'Peso exacto de la barra')}:
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  testID="custom-bar-input"
                  style={[
                    styles.customInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                  keyboardType="numeric"
                  value={customBarText}
                  onChangeText={handleCustomBarChange}
                  placeholder="20"
                  placeholderTextColor={colors.textSecondary}
                />
                <Text style={[styles.inputUnitLabel, { color: colors.textSecondary }]}>
                  {currentUnit}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Vista Previa de Barra */}
        {previewCalculation && previewCalculation.success && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <MaterialIcons name="visibility" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 8 }]}>
                {t('plateSettings.previewTitle', 'Vista Previa en Barra')}
              </Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Ejemplo de carga con tus discos activos ({previewCalculation.totalWeight} {currentUnit})
            </Text>

            <View style={styles.visualizerWrapper}>
              <PlateVisualizer
                platesPerSide={previewCalculation.platesPerSide}
                unit={currentUnit}
                barWeight={settings.defaultBarWeight}
                colors={colors}
                testID="plate-visualizer"
              />
            </View>
          </View>
        )}

        {/* Inventario de Discos */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons name="inventory-2" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 8 }]}>
              {t('plateSettings.inventoryTitle', 'Inventario de Discos')}
            </Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            {t(
              'plateSettings.inventorySubtitle',
              'Activa los discos disponibles en tu gimnasio y fija el límite de pares si no son infinitos.'
            )}
          </Text>

          <View style={styles.platesList}>
            {currentPlates.map((plate) => {
              const isEnabled = plate.availablePairs === undefined || plate.availablePairs > 0;
              const isUnlimited = plate.availablePairs === undefined;

              return (
                <View
                  key={plate.weight}
                  testID={`plate-item-${plate.weight}`}
                  style={[
                    styles.plateRow,
                    { borderBottomColor: colors.border },
                    !isEnabled && { opacity: 0.5 },
                  ]}
                >
                  {/* Badge de Disco con Color Oficial */}
                  <View style={styles.plateLeftInfo}>
                    <View style={[styles.colorBadge, { backgroundColor: plate.color }]}>
                      <Text
                        style={[
                          styles.colorBadgeText,
                          {
                            color:
                              plate.color.toUpperCase() === '#F3F4F6' ||
                              plate.color.toUpperCase() === '#EAB308'
                                ? '#1F2937'
                                : '#FFFFFF',
                          },
                        ]}
                      >
                        {plate.weight}
                      </Text>
                    </View>
                    <View style={styles.plateLabelContainer}>
                      <Text style={[styles.plateWeightText, { color: colors.text }]}>
                        {plate.weight} {currentUnit}
                      </Text>
                      <Text style={[styles.platePairsDesc, { color: colors.textSecondary }]}>
                        {isUnlimited
                          ? t('plateSettings.unlimited', 'Pares ilimitados')
                          : isEnabled
                          ? `${plate.availablePairs} ${plate.availablePairs === 1 ? 'par' : 'pares'}`
                          : t('plateSettings.disabled', 'Desactivado')}
                      </Text>
                    </View>
                  </View>

                  {/* Controles de Disponibilidad y Pares */}
                  <View style={styles.plateControls}>
                    {isEnabled && (
                      <View style={styles.stepperContainer}>
                        <TouchableOpacity
                          testID={`plate-pair-decrement-${plate.weight}`}
                          style={[styles.stepperButton, { borderColor: colors.border }]}
                          onPress={() => handleAdjustPairs(plate, -1)}
                        >
                          <MaterialIcons name="remove" size={16} color={colors.text} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          testID={`plate-unlimited-button-${plate.weight}`}
                          style={[
                            styles.pairCountBadge,
                            isUnlimited && { backgroundColor: `${colors.primary}20` },
                          ]}
                          onPress={() => handleSetUnlimited(plate.weight)}
                        >
                          <Text
                            style={[
                              styles.pairCountText,
                              { color: isUnlimited ? colors.primary : colors.text },
                            ]}
                          >
                            {isUnlimited ? '∞' : plate.availablePairs}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          testID={`plate-pair-increment-${plate.weight}`}
                          style={[styles.stepperButton, { borderColor: colors.border }]}
                          onPress={() => handleAdjustPairs(plate, 1)}
                        >
                          <MaterialIcons name="add" size={16} color={colors.text} />
                        </TouchableOpacity>
                      </View>
                    )}

                    <Switch
                      testID={`plate-switch-${plate.weight}`}
                      value={isEnabled}
                      onValueChange={(val) => handleTogglePlate(plate.weight, val)}
                      trackColor={{ false: colors.border, true: `${colors.primary}60` }}
                      thumbColor={isEnabled ? colors.primary : colors.textSecondary}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Botón de Guardado Explícito */}
        <TouchableOpacity
          testID="save-settings-button"
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.textOnPrimary} />
          ) : savedSuccess ? (
            <View style={styles.saveContentRow}>
              <MaterialIcons name="check" size={20} color={colors.textOnPrimary} />
              <Text style={[styles.saveButtonText, { color: colors.textOnPrimary }]}>
                {t('common.saved', 'Ajustes Guardados')}
              </Text>
            </View>
          ) : (
            <View style={styles.saveContentRow}>
              <MaterialIcons name="save" size={20} color={colors.textOnPrimary} />
              <Text style={[styles.saveButtonText, { color: colors.textOnPrimary }]}>
                {t('common.saveChanges', 'Guardar Configuración')}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default PlateSettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  unitSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    borderRadius: 10,
    padding: 4,
    marginTop: 8,
  },
  unitTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  unitTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetButton: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  presetValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  presetDesc: {
    fontSize: 12,
  },
  customInputRow: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customInputLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customInput: {
    width: 80,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputUnitLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  visualizerWrapper: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  platesList: {
    gap: 12,
  },
  plateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  plateLeftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  colorBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  colorBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  plateLabelContainer: {
    justifyContent: 'center',
  },
  plateWeightText: {
    fontSize: 15,
    fontWeight: '700',
  },
  platePairsDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  plateControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pairCountBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  pairCountText: {
    fontSize: 14,
    fontWeight: '700',
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
