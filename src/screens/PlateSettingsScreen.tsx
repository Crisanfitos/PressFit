import React, { useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { PlateVisualizer } from '../components/workout/PlateVisualizer';
import { HapticService } from '../services/HapticService';
import { usePlateSettingsController } from '../controllers/usePlateSettingsController';
import { styles } from './plateSettingsStyles';

interface PlateSettingsScreenProps {
  navigation: any;
}

export const PlateSettingsScreen: React.FC<PlateSettingsScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { colors } = theme;
  const auth = useContext(AuthContext);
  const userId = auth?.user?.id;

  const {
    loading, saving, savedSuccess, settings, isCustomBar, customBarText,
    currentUnit, barPresets, currentPlates, previewCalculation,
    setIsCustomBar, handleUnitChange, handleBarPresetSelect, handleCustomBarChange,
    handleTogglePlate, handleAdjustPairs, handleSetUnlimited, handleResetDefaults, handleSave,
  } = usePlateSettingsController(userId);

  const getPresetDesc = (preset: { value: number; desc: string }) => {
    if (preset.value === 20 || preset.value === 45) {
      return t('plateSettings.presets.standardOlympic', preset.desc);
    }
    if (preset.value === 15 || preset.value === 35) {
      return t('plateSettings.presets.technicalOlympic', preset.desc);
    }
    if (preset.value === 10 || preset.value === 25) {
      return t('plateSettings.presets.smithMachine', preset.desc);
    }
    return preset.desc;
  };

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
          onPress={() =>
            handleResetDefaults(
              t('plateSettings.resetConfirmTitle', 'Restablecer Ajustes'),
              t(
                'plateSettings.resetConfirmMsg',
                '¿Deseas restaurar todas las denominaciones de discos y pesos de barra por defecto?'
              ),
              t('common.cancel', 'Cancelar'),
              t('common.confirm', 'Restablecer')
            )
          }
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
                {t('plateSettings.kilograms', 'Kilogramos (kg)')}
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
                {t('plateSettings.pounds', 'Libras (lb)')}
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
                    {getPresetDesc(preset)}
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
        {previewCalculation && previewCalculation.platesPerSide.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <MaterialIcons name="visibility" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 8 }]}>
                {t('plateSettings.previewTitle', 'Vista Previa en Barra')}
              </Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              {t(
                'plateSettings.previewSubtitle',
                'Ejemplo de carga con tus discos activos ({{weight}} {{unit}})',
                {
                  weight: previewCalculation.totalWeight,
                  unit: currentUnit,
                }
              )}
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
                    <View style={[styles.colorBadge, { backgroundColor: plate.color || '#6B7280' }]}>
                      <Text
                        style={[
                          styles.colorBadgeText,
                          {
                            color:
                              (plate.color || '').toUpperCase() === '#F3F4F6' ||
                              (plate.color || '').toUpperCase() === '#EAB308'
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
                          ? plate.availablePairs === 1
                            ? t('plateSettings.singlePair', '1 par')
                            : t('plateSettings.pairCount', '{{count}} pares', {
                                count: plate.availablePairs,
                              })
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
          onPress={() =>
            handleSave(
              t('common.error', 'Error'),
              t('plateSettings.saveError', 'No se pudieron guardar los ajustes.')
            )
          }
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

