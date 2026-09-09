import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PlateInventoryItem,
  DEFAULT_PLATES_KG,
  DEFAULT_PLATES_LB,
  DEFAULT_BAR_WEIGHT_KG,
  DEFAULT_BAR_WEIGHT_LB,
  WeightUnit,
} from '../utils/plateCalculator';

export const PLATE_SETTINGS_STORAGE_KEY = '@pressfit_plate_settings';

export interface UserPlateSettings {
  defaultBarWeight: number;
  unit: WeightUnit;
  platesKg: PlateInventoryItem[];
  platesLb: PlateInventoryItem[];
  customBarWeightKg?: number;
  customBarWeightLb?: number;
}

export const getDefaultPlateSettings = (): UserPlateSettings => ({
  defaultBarWeight: DEFAULT_BAR_WEIGHT_KG,
  unit: 'kg',
  platesKg: DEFAULT_PLATES_KG.map(p => ({ ...p })),
  platesLb: DEFAULT_PLATES_LB.map(p => ({ ...p })),
  customBarWeightKg: DEFAULT_BAR_WEIGHT_KG,
  customBarWeightLb: DEFAULT_BAR_WEIGHT_LB,
});

let memoryCache: UserPlateSettings | null = null;

export const PlateSettingsService = {
  /**
   * Obtiene los ajustes predeterminados en memoria (sin persistir).
   */
  getDefaults(): UserPlateSettings {
    return getDefaultPlateSettings();
  },

  /**
   * Carga los ajustes de inventario y barra del usuario desde el almacenamiento local.
   * Si no existen o están corruptos, devuelve y almacena los ajustes predeterminados.
   */
  async getSettings(): Promise<UserPlateSettings> {
    if (memoryCache) {
      return { ...memoryCache };
    }

    try {
      const raw = await AsyncStorage.getItem(PLATE_SETTINGS_STORAGE_KEY);
      if (!raw) {
        const defaults = getDefaultPlateSettings();
        memoryCache = defaults;
        return { ...defaults };
      }

      const parsed: Partial<UserPlateSettings> = JSON.parse(raw);
      const defaults = getDefaultPlateSettings();

      const merged: UserPlateSettings = {
        defaultBarWeight: typeof parsed.defaultBarWeight === 'number' && parsed.defaultBarWeight > 0
          ? parsed.defaultBarWeight
          : defaults.defaultBarWeight,
        unit: parsed.unit === 'lb' ? 'lb' : 'kg',
        platesKg: Array.isArray(parsed.platesKg) && parsed.platesKg.length > 0
          ? parsed.platesKg
          : defaults.platesKg,
        platesLb: Array.isArray(parsed.platesLb) && parsed.platesLb.length > 0
          ? parsed.platesLb
          : defaults.platesLb,
        customBarWeightKg: parsed.customBarWeightKg ?? defaults.customBarWeightKg,
        customBarWeightLb: parsed.customBarWeightLb ?? defaults.customBarWeightLb,
      };

      memoryCache = merged;
      return { ...merged };
    } catch (error) {
      console.warn('[PlateSettingsService] Error loading plate settings, using defaults:', error);
      const defaults = getDefaultPlateSettings();
      memoryCache = defaults;
      return { ...defaults };
    }
  },

  /**
   * Persiste la configuración completa de discos y barra en el almacenamiento local.
   */
  async saveSettings(settings: UserPlateSettings): Promise<void> {
    try {
      memoryCache = { ...settings };
      await AsyncStorage.setItem(PLATE_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('[PlateSettingsService] Error saving plate settings:', error);
      throw error;
    }
  },

  /**
   * Restablece los ajustes a las denominaciones estándar y barra oficial.
   */
  async resetToDefaults(): Promise<UserPlateSettings> {
    const defaults = getDefaultPlateSettings();
    await this.saveSettings(defaults);
    return { ...defaults };
  },

  /**
   * Actualiza el peso de barra predeterminado según la unidad indicada o activa.
   */
  async updateBarWeight(barWeight: number, unit?: WeightUnit): Promise<UserPlateSettings> {
    const current = await this.getSettings();
    const activeUnit = unit ?? current.unit;

    const updated: UserPlateSettings = {
      ...current,
      defaultBarWeight: barWeight,
      ...(activeUnit === 'kg'
        ? { customBarWeightKg: barWeight }
        : { customBarWeightLb: barWeight }),
    };

    await this.saveSettings(updated);
    return updated;
  },

  /**
   * Alterna la unidad de trabajo (kg o lb) sincronizando la barra por defecto adecuada.
   */
  async updateUnit(unit: WeightUnit): Promise<UserPlateSettings> {
    const current = await this.getSettings();
    if (current.unit === unit) {
      return current;
    }

    const newBarWeight = unit === 'kg'
      ? (current.customBarWeightKg ?? DEFAULT_BAR_WEIGHT_KG)
      : (current.customBarWeightLb ?? DEFAULT_BAR_WEIGHT_LB);

    const updated: UserPlateSettings = {
      ...current,
      unit,
      defaultBarWeight: newBarWeight,
    };

    await this.saveSettings(updated);
    return updated;
  },

  /**
   * Habilita/deshabilita o modifica los pares disponibles para un disco concreto en kg o lb.
   * Si enabled es false, se elimina de los discos activos o availablePairs se marca en 0.
   */
  async updatePlateItem(
    unit: WeightUnit,
    weight: number,
    options: { enabled?: boolean; availablePairs?: number }
  ): Promise<UserPlateSettings> {
    const current = await this.getSettings();
    const isKg = unit === 'kg';
    const targetList = isKg ? [...current.platesKg] : [...current.platesLb];

    const itemIndex = targetList.findIndex(p => p.weight === weight);
    if (itemIndex >= 0) {
      const existing = targetList[itemIndex];
      let updatedPairs: number | undefined;

      if (options.enabled === false) {
        updatedPairs = 0;
      } else if ('availablePairs' in options) {
        updatedPairs = options.availablePairs;
      } else if (options.enabled === true && existing.availablePairs === 0) {
        updatedPairs = undefined;
      } else {
        updatedPairs = existing.availablePairs;
      }

      targetList[itemIndex] = {
        ...existing,
        availablePairs: updatedPairs,
      };
    }

    const updated: UserPlateSettings = {
      ...current,
      ...(isKg ? { platesKg: targetList } : { platesLb: targetList }),
    };

    await this.saveSettings(updated);
    return updated;
  },

  /**
   * Limpia la memoria caché (útil para aislamiento de pruebas unitarias).
   */
  _clearMemoryCache(): void {
    memoryCache = null;
  },
};
