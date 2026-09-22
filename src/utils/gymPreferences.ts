import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogService } from '../services/LogService';

export type WeightUnit = 'kg' | 'lb';

export interface GymPreferences {
    weightUnit: WeightUnit;
    defaultRestSec: number;
    restSound: boolean;
    restVibration: boolean;
}

export const DEFAULT_GYM_PREFERENCES: GymPreferences = {
    weightUnit: 'kg',
    defaultRestSec: 90,
    restSound: true,
    restVibration: true,
};

export const REST_PRESETS = [60, 90, 120, 180];

const STORAGE_KEY = '@pressfit:gym_preferences:v1';

function sanitize(raw: unknown): GymPreferences {
    const r = (raw as Partial<GymPreferences>) || {};
    return {
        weightUnit: r.weightUnit === 'lb' ? 'lb' : 'kg',
        defaultRestSec: REST_PRESETS.includes(Number(r.defaultRestSec))
            ? Number(r.defaultRestSec)
            : DEFAULT_GYM_PREFERENCES.defaultRestSec,
        restSound: typeof r.restSound === 'boolean' ? r.restSound : true,
        restVibration: typeof r.restVibration === 'boolean' ? r.restVibration : true,
    };
}

export async function loadGymPreferences(): Promise<GymPreferences> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULT_GYM_PREFERENCES };
        return sanitize(JSON.parse(raw));
    } catch (error) {
        LogService.error('Error loading gym preferences:', error);
        return { ...DEFAULT_GYM_PREFERENCES };
    }
}

export async function saveGymPreferences(prefs: GymPreferences): Promise<void> {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sanitize(prefs)));
    } catch (error) {
        LogService.error('Error saving gym preferences:', error);
    }
}

export interface BackupPayload {
    kind: 'pressfit-backup';
    version: 1;
    exportedAt: string;
    gymPreferences: GymPreferences;
}

/**
 * Builds a local backup payload (gym prefs). Pure — unit tested.
 */
export function buildBackupPayload(prefs: GymPreferences, now = new Date()): BackupPayload {
    return {
        kind: 'pressfit-backup',
        version: 1,
        exportedAt: now.toISOString(),
        gymPreferences: sanitize(prefs),
    };
}

/**
 * Validates an imported backup file before restoring. Pure — unit tested.
 */
export function validateBackup(data: unknown): { valid: boolean; prefs?: GymPreferences; error?: string } {
    if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Archivo vacío o ilegible.' };
    }
    const d = data as Partial<BackupPayload>;
    if (d.kind !== 'pressfit-backup' || d.version !== 1 || !d.gymPreferences) {
        return { valid: false, error: 'No es un backup válido de PressFit (v1).' };
    }
    return { valid: true, prefs: sanitize(d.gymPreferences) };
}

export function convertWeight(valueKg: number, unit: WeightUnit): number {
    if (unit === 'lb') return Math.round(valueKg * 2.20462 * 10) / 10;
    return valueKg;
}

export default { loadGymPreferences, saveGymPreferences, buildBackupPayload, validateBackup };
