import AsyncStorage from '@react-native-async-storage/async-storage';
import { ServiceResponse } from '../types/models';

export const STORAGE_KEYS = {
    ROUTINES: '@pressfit_cached_routines',
    WORKOUTS: '@pressfit_cached_workouts',
    EXERCISES: '@pressfit_cached_exercises',
    HISTORY: '@pressfit_cached_history',
    TIMESTAMPS: '@pressfit_cached_timestamps',
};

export interface CacheEnvelope<T = any> {
    data: T;
    createdAt: number;
    lastAccessedAt: number;
    ttl: number;
}

export interface CacheKeyReport {
    count: number;
    approximateBytes: number;
    lastUpdated: number | null;
    isExpired: boolean;
    ttl: number;
}

export interface CacheSizeReport {
    totalKeys: number;
    totalEntries: number;
    approximateBytes: number;
    keys: Record<string, CacheKeyReport>;
}

export const DEFAULT_TTLS: Record<string, number> = {
    [STORAGE_KEYS.ROUTINES]: 24 * 60 * 60 * 1000,      // 24 hours
    [STORAGE_KEYS.WORKOUTS]: 7 * 24 * 60 * 60 * 1000,  // 7 days
    [STORAGE_KEYS.EXERCISES]: 7 * 24 * 60 * 60 * 1000, // 7 days
    [STORAGE_KEYS.HISTORY]: 7 * 24 * 60 * 60 * 1000,   // 7 days
    DEFAULT: 24 * 60 * 60 * 1000,                      // 24 hours default
};

export const DEFAULT_MAX_ENTRIES = 500;

// Internal runtime configurations
const customTTLs: Record<string, number> = {};
let maxEntriesLimit = DEFAULT_MAX_ENTRIES;
let isInitialized = false;

export const OfflineStorageService = {
    STORAGE_KEYS,
    DEFAULT_TTLS,
    DEFAULT_MAX_ENTRIES,

    /**
     * Set a custom TTL (in milliseconds) for a specific cache key.
     */
    setTTL(key: string, ttlMs: number): void {
        customTTLs[key] = ttlMs;
    },

    /**
     * Get the configured TTL for a specific cache key.
     */
    getTTL(key: string): number {
        if (customTTLs[key] !== undefined) {
            return customTTLs[key];
        }
        return DEFAULT_TTLS[key] ?? DEFAULT_TTLS.DEFAULT;
    },

    /**
     * Set the maximum number of entries permitted per cached collection.
     */
    setMaxEntries(limit: number): void {
        maxEntriesLimit = limit > 0 ? limit : DEFAULT_MAX_ENTRIES;
    },

    /**
     * Get current maximum entries allowed per collection.
     */
    getMaxEntries(): number {
        return maxEntriesLimit;
    },

    /**
     * Helper to update timestamp for a key in the legacy timestamps hash
     */
    async _updateTimestamp(key: string, timestamp = Date.now()): Promise<void> {
        try {
            const rawTimestamps = await AsyncStorage.getItem(STORAGE_KEYS.TIMESTAMPS);
            const timestamps = rawTimestamps ? JSON.parse(rawTimestamps) : {};
            timestamps[key] = timestamp;
            await AsyncStorage.setItem(STORAGE_KEYS.TIMESTAMPS, JSON.stringify(timestamps));
        } catch {
            // Non-critical timestamp failure fallback
        }
    },

    /**
     * Internal generic save with metadata envelope and LRU / capacity limits
     */
    async _saveCacheItem<T>(key: string, data: T, customTTL?: number): Promise<ServiceResponse<boolean>> {
        try {
            const now = Date.now();
            const ttl = customTTL ?? this.getTTL(key);

            let processedData: any = data;
            // If data is an array and exceeds max entries, keep the most recent entries (LRU / tail)
            if (Array.isArray(data) && data.length > maxEntriesLimit) {
                processedData = data.slice(-maxEntriesLimit);
            }

            const envelope: CacheEnvelope<any> = {
                data: processedData,
                createdAt: now,
                lastAccessedAt: now,
                ttl,
            };

            await AsyncStorage.setItem(key, JSON.stringify(envelope));
            await this._updateTimestamp(key, now);
            return { data: true, error: null };
        } catch (error) {
            return { data: false, error };
        }
    },

    /**
     * Internal generic get with TTL expiration check and backward compatibility
     */
    async _getCachedItem<T>(key: string): Promise<ServiceResponse<T | null>> {
        try {
            const rawData = await AsyncStorage.getItem(key);
            if (!rawData) return { data: null, error: null };

            let parsed: any;
            try {
                parsed = JSON.parse(rawData);
            } catch {
                return { data: null, error: null };
            }

            const now = Date.now();

            // Check if stored data uses the CacheEnvelope format
            const isEnvelope =
                parsed &&
                typeof parsed === 'object' &&
                'data' in parsed &&
                'createdAt' in parsed &&
                'ttl' in parsed;

            if (isEnvelope) {
                const envelope = parsed as CacheEnvelope<T>;
                // Check if entry has expired
                if (now - envelope.createdAt > envelope.ttl) {
                    await AsyncStorage.removeItem(key);
                    return { data: null, error: null };
                }

                // Update last accessed time asynchronously
                envelope.lastAccessedAt = now;
                AsyncStorage.setItem(key, JSON.stringify(envelope)).catch(() => {});

                return { data: envelope.data, error: null };
            }

            // Backward compatibility fallback for legacy raw cached data
            const tsRes = await this.getCacheTimestamp(key);
            const ttl = this.getTTL(key);
            if (tsRes.data && now - tsRes.data > ttl) {
                await AsyncStorage.removeItem(key);
                return { data: null, error: null };
            }

            return { data: parsed as T, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    /**
     * Returns the timestamp (in ms) when the given cache key was last updated.
     */
    async getCacheTimestamp(key: string): Promise<ServiceResponse<number | null>> {
        try {
            // First check legacy timestamps hash
            const rawTimestamps = await AsyncStorage.getItem(STORAGE_KEYS.TIMESTAMPS);
            if (rawTimestamps) {
                const timestamps = JSON.parse(rawTimestamps);
                if (timestamps[key]) {
                    return { data: timestamps[key], error: null };
                }
            }

            // Fallback: check entry envelope directly
            const rawData = await AsyncStorage.getItem(key);
            if (rawData) {
                const parsed = JSON.parse(rawData);
                if (parsed && typeof parsed === 'object' && 'createdAt' in parsed) {
                    return { data: parsed.createdAt, error: null };
                }
            }

            return { data: null, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    /**
     * Purges all expired cache entries from AsyncStorage.
     */
    async purgeExpired(): Promise<ServiceResponse<{ purgedKeys: string[]; purgedCount: number }>> {
        try {
            const keysToInspect = [
                STORAGE_KEYS.ROUTINES,
                STORAGE_KEYS.WORKOUTS,
                STORAGE_KEYS.EXERCISES,
                STORAGE_KEYS.HISTORY,
            ];

            const purgedKeys: string[] = [];
            const now = Date.now();

            for (const key of keysToInspect) {
                const rawData = await AsyncStorage.getItem(key);
                if (!rawData) continue;

                try {
                    const parsed = JSON.parse(rawData);
                    const isEnvelope =
                        parsed &&
                        typeof parsed === 'object' &&
                        'data' in parsed &&
                        'createdAt' in parsed &&
                        'ttl' in parsed;

                    if (isEnvelope) {
                        if (now - parsed.createdAt > parsed.ttl) {
                            await AsyncStorage.removeItem(key);
                            purgedKeys.push(key);
                        }
                    } else {
                        // Check legacy timestamp
                        const tsRes = await this.getCacheTimestamp(key);
                        const ttl = this.getTTL(key);
                        if (tsRes.data && now - tsRes.data > ttl) {
                            await AsyncStorage.removeItem(key);
                            purgedKeys.push(key);
                        }
                    }
                } catch {
                    // Invalid JSON entry, remove it
                    await AsyncStorage.removeItem(key);
                    purgedKeys.push(key);
                }
            }

            return {
                data: {
                    purgedKeys,
                    purgedCount: purgedKeys.length,
                },
                error: null,
            };
        } catch (error) {
            return {
                data: { purgedKeys: [], purgedCount: 0 },
                error,
            };
        }
    },

    /**
     * Initializes OfflineStorageService and triggers automatic purge of expired items.
     */
    async initialize(): Promise<ServiceResponse<{ purgedCount: number }>> {
        try {
            const purgeRes = await this.purgeExpired();
            isInitialized = true;
            return {
                data: { purgedCount: purgeRes.data?.purgedCount ?? 0 },
                error: null,
            };
        } catch (error) {
            return { data: { purgedCount: 0 }, error };
        }
    },

    /**
     * Returns a detailed report of current cache volume, entry count, and byte size.
     */
    async getCacheSize(): Promise<ServiceResponse<CacheSizeReport>> {
        try {
            const managedKeys = [
                STORAGE_KEYS.ROUTINES,
                STORAGE_KEYS.WORKOUTS,
                STORAGE_KEYS.EXERCISES,
                STORAGE_KEYS.HISTORY,
            ];

            const now = Date.now();
            let totalEntries = 0;
            let totalBytes = 0;
            const keysReport: Record<string, CacheKeyReport> = {};

            for (const key of managedKeys) {
                const raw = await AsyncStorage.getItem(key);
                if (!raw) {
                    keysReport[key] = {
                        count: 0,
                        approximateBytes: 0,
                        lastUpdated: null,
                        isExpired: false,
                        ttl: this.getTTL(key),
                    };
                    continue;
                }

                const bytes = raw.length; // Approximate UTF-8 bytes
                totalBytes += bytes;

                let count = 0;
                let lastUpdated: number | null = null;
                let isExpired = false;
                const ttl = this.getTTL(key);

                try {
                    const parsed = JSON.parse(raw);
                    if (parsed && typeof parsed === 'object' && 'data' in parsed && 'createdAt' in parsed) {
                        lastUpdated = parsed.createdAt;
                        isExpired = now - parsed.createdAt > (parsed.ttl || ttl);
                        if (Array.isArray(parsed.data)) {
                            count = parsed.data.length;
                        } else if (parsed.data !== null && parsed.data !== undefined) {
                            count = 1;
                        }
                    } else if (Array.isArray(parsed)) {
                        count = parsed.length;
                        const tsRes = await this.getCacheTimestamp(key);
                        lastUpdated = tsRes.data;
                        if (lastUpdated) isExpired = now - lastUpdated > ttl;
                    } else if (parsed !== null && parsed !== undefined) {
                        count = 1;
                    }
                } catch {
                    count = 0;
                }

                totalEntries += count;
                keysReport[key] = {
                    count,
                    approximateBytes: bytes,
                    lastUpdated,
                    isExpired,
                    ttl,
                };
            }

            return {
                data: {
                    totalKeys: managedKeys.length,
                    totalEntries,
                    approximateBytes: totalBytes,
                    keys: keysReport,
                },
                error: null,
            };
        } catch (error) {
            return {
                data: {
                    totalKeys: 0,
                    totalEntries: 0,
                    approximateBytes: 0,
                    keys: {},
                },
                error,
            };
        }
    },

    /**
     * Cache weekly routines
     */
    async saveRoutines(routines: any[]): Promise<ServiceResponse<boolean>> {
        return this._saveCacheItem(STORAGE_KEYS.ROUTINES, routines);
    },

    /**
     * Get cached weekly routines
     */
    async getCachedRoutines(): Promise<ServiceResponse<any[] | null>> {
        return this._getCachedItem<any[]>(STORAGE_KEYS.ROUTINES);
    },

    /**
     * Cache workouts
     */
    async saveWorkouts(workouts: any[]): Promise<ServiceResponse<boolean>> {
        return this._saveCacheItem(STORAGE_KEYS.WORKOUTS, workouts);
    },

    /**
     * Get cached workouts
     */
    async getCachedWorkouts(): Promise<ServiceResponse<any[] | null>> {
        return this._getCachedItem<any[]>(STORAGE_KEYS.WORKOUTS);
    },

    /**
     * Cache exercises
     */
    async saveExercises(exercises: any[]): Promise<ServiceResponse<boolean>> {
        return this._saveCacheItem(STORAGE_KEYS.EXERCISES, exercises);
    },

    /**
     * Get cached exercises
     */
    async getCachedExercises(): Promise<ServiceResponse<any[] | null>> {
        return this._getCachedItem<any[]>(STORAGE_KEYS.EXERCISES);
    },

    /**
     * Cache exercise weight history
     */
    async saveHistory(history: any[]): Promise<ServiceResponse<boolean>> {
        return this._saveCacheItem(STORAGE_KEYS.HISTORY, history);
    },

    /**
     * Get cached exercise weight history
     */
    async getCachedHistory(): Promise<ServiceResponse<any[] | null>> {
        return this._getCachedItem<any[]>(STORAGE_KEYS.HISTORY);
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
