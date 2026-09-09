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

export const getPlateSettingsStorageKey = (userId?: string): string => {
  return userId ? `@pressfit_plate_settings_${userId}` : PLATE_SETTINGS_STORAGE_KEY;
};

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

let memoryCache: Record<string, UserPlateSettings> = {};

const getCacheKey = (userId?: string): string => userId || '__default__';

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
   * Aislado por userId para evitar compartir configuraciones entre diferentes cuentas.
   */
  async getSettings(userId?: string): Promise<UserPlateSettings> {
    const cacheKey = getCacheKey(userId);
    if (memoryCache[cacheKey]) {
      return { ...memoryCache[cacheKey] };
    }

    try {
      const storageKey = getPlateSettingsStorageKey(userId);
      let raw = await AsyncStorage.getItem(storageKey);

      // Si no existe para este usuario específico pero existe la clave global antigua,
      // no la cargamos si se trata de un usuario distinto o aislamos siempre por defecto.
      if (!raw) {
        const defaults = getDefaultPlateSettings();
        memoryCache[cacheKey] = defaults;
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

      memoryCache[cacheKey] = merged;
      return { ...merged };
    } catch (error) {
      console.warn('[PlateSettingsService] Error loading plate settings, using defaults:', error);
      const defaults = getDefaultPlateSettings();
      memoryCache[cacheKey] = defaults;
      return { ...defaults };
    }
  },

  /**
   * Persiste la configuración completa de discos y barra en el almacenamiento local para el usuario dado.
   */
  async saveSettings(settings: UserPlateSettings, userId?: string): Promise<void> {
    const cacheKey = getCacheKey(userId);
    const storageKey = getPlateSettingsStorageKey(userId);
    try {
      memoryCache[cacheKey] = { ...settings };
      await AsyncStorage.setItem(storageKey, JSON.stringify(settings));
    } catch (error) {
      console.error('[PlateSettingsService] Error saving plate settings:', error);
      throw error;
    }
  },

  /**
   * Restablece los ajustes a las denominaciones estándar y barra oficial para el usuario.
   */
  async resetToDefaults(userId?: string): Promise<UserPlateSettings> {
    const defaults = getDefaultPlateSettings();
    await this.saveSettings(defaults, userId);
    return { ...defaults };
  },

  /**
   * Actualiza el peso de barra predeterminado según la unidad indicada o activa.
   */
  async updateBarWeight(barWeight: number, unit?: WeightUnit, userId?: string): Promise<UserPlateSettings> {
    const current = await this.getSettings(userId);
    const activeUnit = unit ?? current.unit;

    const updated: UserPlateSettings = {
      ...current,
      defaultBarWeight: barWeight,
      ...(activeUnit === 'kg'
        ? { customBarWeightKg: barWeight }
        : { customBarWeightLb: barWeight }),
    };

    await this.saveSettings(updated, userId);
    return updated;
  },

  /**
   * Alterna la unidad de trabajo (kg o lb) sincronizando la barra por defecto adecuada.
   */
  async updateUnit(unit: WeightUnit, userId?: string): Promise<UserPlateSettings> {
    const current = await this.getSettings(userId);
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

    await this.saveSettings(updated, userId);
    return updated;
  },

  /**
   * Habilita/deshabilita o modifica los pares disponibles para un disco concreto en kg o lb.
   * Si enabled es false, se elimina de los discos activos o availablePairs se marca en 0.
   */
  async updatePlateItem(
    unit: WeightUnit,
    weight: number,
    options: { enabled?: boolean; availablePairs?: number },
    userId?: string
  ): Promise<UserPlateSettings> {
    const current = await this.getSettings(userId);
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

    await this.saveSettings(updated, userId);
    return updated;
  },

  /**
   * Limpia la memoria caché (útil para aislamiento de pruebas unitarias o cambio de sesión).
   */
  _clearMemoryCache(userId?: string): void {
    if (userId) {
      delete memoryCache[getCacheKey(userId)];
    } else {
      memoryCache = {};
    }
  },
};
