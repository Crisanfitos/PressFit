import AsyncStorage from '@react-native-async-storage/async-storage';
import { ServiceResponse } from '../types/models';

const STORAGE_KEYS = {
    ROUTINES: '@pressfit_cached_routines',
    WORKOUTS: '@pressfit_cached_workouts',
    EXERCISES: '@pressfit_cached_exercises',
    HISTORY: '@pressfit_cached_history',
    TIMESTAMPS: '@pressfit_cached_timestamps',
};

export const OfflineStorageService = {
    STORAGE_KEYS,

    /**
     * Helper to update timestamp for a key
     */
    async _updateTimestamp(key: string): Promise<void> {
        try {
            const rawTimestamps = await AsyncStorage.getItem(STORAGE_KEYS.TIMESTAMPS);
            const timestamps = rawTimestamps ? JSON.parse(rawTimestamps) : {};
            timestamps[key] = Date.now();
            await AsyncStorage.setItem(STORAGE_KEYS.TIMESTAMPS, JSON.stringify(timestamps));
        } catch {
            // Non-critical timestamp failure fallback
        }
    },

    /**
     * Returns the timestamp (in ms) when the given cache key was last updated.
     */
    async getCacheTimestamp(key: string): Promise<ServiceResponse<number | null>> {
        try {
            const rawTimestamps = await AsyncStorage.getItem(STORAGE_KEYS.TIMESTAMPS);
            if (!rawTimestamps) return { data: null, error: null };
            const timestamps = JSON.parse(rawTimestamps);
            return { data: timestamps[key] || null, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    /**
     * Cache weekly routines
     */
    async saveRoutines(routines: any[]): Promise<ServiceResponse<boolean>> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
            await this._updateTimestamp(STORAGE_KEYS.ROUTINES);
            return { data: true, error: null };
        } catch (error) {
            return { data: false, error };
        }
    },

    /**
     * Get cached weekly routines
     */
    async getCachedRoutines(): Promise<ServiceResponse<any[] | null>> {
        try {
            const rawData = await AsyncStorage.getItem(STORAGE_KEYS.ROUTINES);
            if (!rawData) return { data: null, error: null };
            return { data: JSON.parse(rawData), error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    /**
     * Cache workouts
     */
    async saveWorkouts(workouts: any[]): Promise<ServiceResponse<boolean>> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
            await this._updateTimestamp(STORAGE_KEYS.WORKOUTS);
            return { data: true, error: null };
        } catch (error) {
            return { data: false, error };
        }
    },

    /**
     * Get cached workouts
     */
    async getCachedWorkouts(): Promise<ServiceResponse<any[] | null>> {
        try {
            const rawData = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUTS);
            if (!rawData) return { data: null, error: null };
            return { data: JSON.parse(rawData), error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    /**
     * Cache exercises
     */
    async saveExercises(exercises: any[]): Promise<ServiceResponse<boolean>> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(exercises));
            await this._updateTimestamp(STORAGE_KEYS.EXERCISES);
            return { data: true, error: null };
        } catch (error) {
            return { data: false, error };
        }
    },

    /**
     * Get cached exercises
     */
    async getCachedExercises(): Promise<ServiceResponse<any[] | null>> {
        try {
            const rawData = await AsyncStorage.getItem(STORAGE_KEYS.EXERCISES);
            if (!rawData) return { data: null, error: null };
            return { data: JSON.parse(rawData), error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    /**
     * Cache exercise weight history
     */
    async saveHistory(history: any[]): Promise<ServiceResponse<boolean>> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
            await this._updateTimestamp(STORAGE_KEYS.HISTORY);
            return { data: true, error: null };
        } catch (error) {
            return { data: false, error };
        }
    },

    /**
     * Get cached exercise weight history
     */
    async getCachedHistory(): Promise<ServiceResponse<any[] | null>> {
        try {
            const rawData = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
            if (!rawData) return { data: null, error: null };
            return { data: JSON.parse(rawData), error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    /**
     * Clear all cached data
     */
    async clearAllCache(): Promise<ServiceResponse<boolean>> {
        try {
            const keys = Object.values(STORAGE_KEYS);
            await AsyncStorage.multiRemove(keys);
            return { data: true, error: null };
        } catch (error) {
            return { data: false, error };
        }
    },
};
