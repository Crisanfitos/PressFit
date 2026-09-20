import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import {
  PlateSettingsService,
  UserPlateSettings,
} from '../services/PlateSettingsService';
import {
  PlateInventoryItem,
  WeightUnit,
  calculatePlates,
  PlateCalculationResult,
} from '../utils/plateCalculator';
import { HapticService } from '../services/HapticService';

export interface BarPreset {
  label: string;
  value: number;
  desc: string;
}

export const BAR_PRESETS_KG: BarPreset[] = [
  { label: '20 kg', value: 20, desc: 'Olímpica estándar' },
  { label: '15 kg', value: 15, desc: 'Olímpica técnica' },
  { label: '10 kg', value: 10, desc: 'Multipower / Smith' },
];

export const BAR_PRESETS_LB: BarPreset[] = [
  { label: '45 lb', value: 45, desc: 'Olímpica estándar' },
  { label: '35 lb', value: 35, desc: 'Olímpica técnica' },
  { label: '25 lb', value: 25, desc: 'Multipower / Smith' },
];

export const usePlateSettingsController = (userId?: string) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [settings, setSettings] = useState<UserPlateSettings | null>(null);
  const [isCustomBar, setIsCustomBar] = useState(false);
  const [customBarText, setCustomBarText] = useState('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const checkIfCustom = useCallback((barWeight: number, unit: WeightUnit) => {
    const presets = unit === 'kg' ? BAR_PRESETS_KG : BAR_PRESETS_LB;
    const isPreset = presets.some(p => p.value === barWeight);
    setIsCustomBar(!isPreset);
    setCustomBarText(barWeight.toString());
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await PlateSettingsService.getSettings(userId);
      setSettings(data);
      checkIfCustom(data.defaultBarWeight, data.unit);
    } catch (error) {
      console.error('[usePlateSettingsController] Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, checkIfCustom]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const currentUnit: WeightUnit = settings?.unit ?? 'kg';
  const barPresets = currentUnit === 'kg' ? BAR_PRESETS_KG : BAR_PRESETS_LB;

  const currentPlates: PlateInventoryItem[] = useMemo(() => {
    if (!settings) return [];
    return currentUnit === 'kg' ? settings.platesKg : settings.platesLb;
  }, [settings, currentUnit]);

  const handleUnitChange = async (unit: WeightUnit) => {
    if (!settings || settings.unit === unit) return;
    HapticService.selection();

    const updated = await PlateSettingsService.updateUnit(unit, userId);
    setSettings(updated);
    checkIfCustom(updated.defaultBarWeight, unit);
  };

  const handleBarPresetSelect = async (value: number) => {
    if (!settings) return;
    HapticService.light();

    setIsCustomBar(false);
    setCustomBarText(value.toString());

    const updated = await PlateSettingsService.updateBarWeight(value, currentUnit, userId);
    setSettings(updated);
  };

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
      PlateSettingsService.saveSettings(updated, userId);
    }
  };

  const handleTogglePlate = async (weight: number, enabled: boolean) => {
    if (!settings) return;
    HapticService.selection();

    const newPairs = enabled ? undefined : 0;
    const updated = await PlateSettingsService.updatePlateItem(
      currentUnit,
      weight,
      { availablePairs: newPairs },
      userId
    );
    setSettings(updated);
  };

  const handleAdjustPairs = async (plate: PlateInventoryItem, delta: number) => {
    if (!settings) return;
    HapticService.light();

    let currentPairs = plate.availablePairs;
    let nextPairs: number | undefined;

    if (currentPairs === undefined) {
      nextPairs = delta < 0 ? 4 : undefined;
    } else {
      const candidate = currentPairs + delta;
      if (candidate <= 0) {
        nextPairs = 0;
      } else if (candidate > 20) {
        nextPairs = undefined;
      } else {
        nextPairs = candidate;
      }
    }

    const updated = await PlateSettingsService.updatePlateItem(
      currentUnit,
      plate.weight,
      { availablePairs: nextPairs },
      userId
    );
    setSettings(updated);
  };

  const handleSetUnlimited = async (weight: number) => {
    if (!settings) return;
    HapticService.light();

    const updated = await PlateSettingsService.updatePlateItem(
      currentUnit,
      weight,
      { availablePairs: undefined },
      userId
    );
    setSettings(updated);
  };

  const resetToDefaults = async (): Promise<UserPlateSettings> => {
    HapticService.medium();
    const defaults = await PlateSettingsService.resetToDefaults(userId);
    setSettings(defaults);
    checkIfCustom(defaults.defaultBarWeight, defaults.unit);
    return defaults;
  };

  const handleResetDefaults = (
    confirmTitle?: any,
    confirmMsg?: string,
    cancelText?: string,
    confirmText?: string
  ) => {
    const title = typeof confirmTitle === 'string' ? confirmTitle : 'Restablecer Ajustes';
    const msg =
      typeof confirmMsg === 'string'
        ? confirmMsg
        : '¿Deseas restaurar todas las denominaciones de discos y pesos de barra por defecto?';
    const cancel = typeof cancelText === 'string' ? cancelText : 'Cancelar';
    const confirm = typeof confirmText === 'string' ? confirmText : 'Restablecer';

    Alert.alert(
      title,
      msg,
      [
        { text: cancel, style: 'cancel' },
        {
          text: confirm,
          style: 'destructive',
          onPress: async () => {
            await resetToDefaults();
          },
        },
      ]
    );
  };

  const handleSave = async (
    errorTitle?: any,
    errorMsg?: string
  ) => {
    const title = typeof errorTitle === 'string' ? errorTitle : 'Error';
    const msg = typeof errorMsg === 'string' ? errorMsg : 'No se pudieron guardar los ajustes.';

    if (!settings) return;
    setSaving(true);
    try {
      await PlateSettingsService.saveSettings(settings, userId);
      HapticService.light();
      setSavedSuccess(true);
      saveTimeoutRef.current = setTimeout(() => setSavedSuccess(false), 2000);
    } catch (e) {
      Alert.alert(title, msg);
    } finally {
      setSaving(false);
    }
  };

  const previewCalculation: PlateCalculationResult | null = useMemo(() => {
    if (!settings) return null;
    const bar = settings.defaultBarWeight;
    const sampleTarget = currentUnit === 'kg' ? Math.max(bar + 40, 60) : Math.max(bar + 90, 135);
    return calculatePlates({
      targetWeight: sampleTarget,
      barWeight: bar,
      unit: currentUnit,
      availablePlates: currentPlates,
    });
  }, [settings, currentUnit, currentPlates]);

  return {
    loading,
    saving,
    savedSuccess,
    settings,
    isCustomBar,
    customBarText,
    currentUnit,
    barPresets,
    currentPlates,
    previewCalculation,
    setIsCustomBar,
    setCustomBarText,
    loadSettings,
    handleUnitChange,
    handleBarPresetSelect,
    handleCustomBarChange,
    handleTogglePlate,
    handleAdjustPairs,
    handleSetUnlimited,
    resetToDefaults,
    handleResetDefaults,
    handleSave,
  };
};
