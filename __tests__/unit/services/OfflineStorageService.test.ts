import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    OfflineStorageService,
    STORAGE_KEYS,
    DEFAULT_TTLS,
    DEFAULT_MAX_ENTRIES,
} from '../../../src/services/OfflineStorageService';

jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    multiRemove: jest.fn(),
}));

describe('OfflineStorageService (PF-275)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset custom configs
        OfflineStorageService.setMaxEntries(DEFAULT_MAX_ENTRIES);
        OfflineStorageService.setTTL(STORAGE_KEYS.ROUTINES, DEFAULT_TTLS[STORAGE_KEYS.ROUTINES]);
        OfflineStorageService.setTTL(STORAGE_KEYS.WORKOUTS, DEFAULT_TTLS[STORAGE_KEYS.WORKOUTS]);
        OfflineStorageService.setTTL(STORAGE_KEYS.EXERCISES, DEFAULT_TTLS[STORAGE_KEYS.EXERCISES]);
        OfflineStorageService.setTTL(STORAGE_KEYS.HISTORY, DEFAULT_TTLS[STORAGE_KEYS.HISTORY]);
    });

    describe('saveRoutines and getCachedRoutines with TTL', () => {
        it('should save routines inside an envelope with timestamps and TTL', async () => {
            const routines = [{ id: 'rot-1', nombre: 'Leg Day' }];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            const res = await OfflineStorageService.saveRoutines(routines);
            expect(res.data).toBe(true);
            expect(res.error).toBeNull();

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                STORAGE_KEYS.ROUTINES,
                expect.stringContaining('"data":[{"id":"rot-1","nombre":"Leg Day"}]')
            );
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                STORAGE_KEYS.ROUTINES,
                expect.stringContaining('"ttl":86400000')
            );
        });

        it('should return cached routines when TTL is still valid', async () => {
            const routines = [{ id: 'rot-1', nombre: 'Leg Day' }];
            const envelope = {
                data: routines,
                createdAt: Date.now() - 1000, // 1 second ago
                lastAccessedAt: Date.now() - 1000,
                ttl: 86400000, // 24 hours
            };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(envelope));

            const res = await OfflineStorageService.getCachedRoutines();
            expect(res.data).toEqual(routines);
            expect(res.error).toBeNull();
        });

        it('should return null and purge item when TTL has expired', async () => {
            const routines = [{ id: 'rot-1', nombre: 'Leg Day' }];
            const envelope = {
                data: routines,
                createdAt: Date.now() - 90000000, // expired (> 24 hours)
                lastAccessedAt: Date.now() - 90000000,
                ttl: 86400000,
            };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(envelope));
            (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

            const res = await OfflineStorageService.getCachedRoutines();
            expect(res.data).toBeNull();
            expect(res.error).toBeNull();
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.ROUTINES);
        });

        it('should return null data when cache is empty', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const res = await OfflineStorageService.getCachedRoutines();
            expect(res.data).toBeNull();
            expect(res.error).toBeNull();
        });

        it('should support backward compatibility with legacy un-enveloped arrays', async () => {
            const legacyRoutines = [{ id: 'rot-old', nombre: 'Old Routine' }];
            (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
                if (key === STORAGE_KEYS.ROUTINES) {
                    return Promise.resolve(JSON.stringify(legacyRoutines));
                }
                if (key === STORAGE_KEYS.TIMESTAMPS) {
                    // Valid unexpired legacy timestamp
                    return Promise.resolve(JSON.stringify({ [STORAGE_KEYS.ROUTINES]: Date.now() - 5000 }));
                }
                return Promise.resolve(null);
            });

            const res = await OfflineStorageService.getCachedRoutines();
            expect(res.data).toEqual(legacyRoutines);
            expect(res.error).toBeNull();
        });

        it('should purge legacy un-enveloped data if legacy timestamp is expired', async () => {
            const legacyRoutines = [{ id: 'rot-old', nombre: 'Old Routine' }];
            (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
                if (key === STORAGE_KEYS.ROUTINES) {
                    return Promise.resolve(JSON.stringify(legacyRoutines));
                }
                if (key === STORAGE_KEYS.TIMESTAMPS) {
                    // Expired legacy timestamp (more than 24h)
                    return Promise.resolve(JSON.stringify({ [STORAGE_KEYS.ROUTINES]: Date.now() - 100000000 }));
                }
                return Promise.resolve(null);
            });
            (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

            const res = await OfflineStorageService.getCachedRoutines();
            expect(res.data).toBeNull();
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.ROUTINES);
        });

        it('should handle errors gracefully during save', async () => {
            const mockError = new Error('AsyncStorage write error');
            (AsyncStorage.setItem as jest.Mock).mockRejectedValue(mockError);

            const res = await OfflineStorageService.saveRoutines([]);
            expect(res.data).toBe(false);
            expect(res.error).toBe(mockError);
        });
    });

    describe('saveWorkouts and getCachedWorkouts', () => {
        it('should save workouts successfully with 7-day default TTL', async () => {
            const workouts = [{ id: 'w-1', completado: true }];
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            const res = await OfflineStorageService.saveWorkouts(workouts);
            expect(res.data).toBe(true);
            expect(res.error).toBeNull();
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                STORAGE_KEYS.WORKOUTS,
                expect.stringContaining('"ttl":604800000') // 7 days
            );
        });

        it('should retrieve cached workouts when valid', async () => {
            const workouts = [{ id: 'w-1', completado: true }];
            const envelope = {
                data: workouts,
                createdAt: Date.now(),
                lastAccessedAt: Date.now(),
                ttl: 604800000,
            };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(envelope));

            const res = await OfflineStorageService.getCachedWorkouts();
            expect(res.data).toEqual(workouts);
        });
    });

    describe('saveExercises and getCachedExercises', () => {
        it('should save and get exercises', async () => {
            const exercises = [{ id: 'ex-1', titulo: 'Bench Press' }];
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
            const envelope = {
                data: exercises,
                createdAt: Date.now(),
                lastAccessedAt: Date.now(),
                ttl: 604800000,
            };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(envelope));

            const saveRes = await OfflineStorageService.saveExercises(exercises);
            expect(saveRes.data).toBe(true);

            const getRes = await OfflineStorageService.getCachedExercises();
            expect(getRes.data).toEqual(exercises);
        });
    });

    describe('saveHistory and getCachedHistory', () => {
        it('should save and get history', async () => {
            const history = [{ id: 'h-1', peso_kg: 100 }];
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
            const envelope = {
                data: history,
                createdAt: Date.now(),
                lastAccessedAt: Date.now(),
                ttl: 604800000,
            };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(envelope));

            const saveRes = await OfflineStorageService.saveHistory(history);
            expect(saveRes.data).toBe(true);

            const getRes = await OfflineStorageService.getCachedHistory();
            expect(getRes.data).toEqual(history);
        });
    });

    describe('TTL configuration and custom limits', () => {
        it('should allow setting and retrieving custom TTL per key', () => {
            OfflineStorageService.setTTL(STORAGE_KEYS.ROUTINES, 3600000); // 1 hour
            expect(OfflineStorageService.getTTL(STORAGE_KEYS.ROUTINES)).toBe(3600000);
            // Non-customized key should return default
            expect(OfflineStorageService.getTTL(STORAGE_KEYS.WORKOUTS)).toBe(DEFAULT_TTLS[STORAGE_KEYS.WORKOUTS]);
        });

        it('should allow setting and retrieving maximum entries limit', () => {
            OfflineStorageService.setMaxEntries(200);
            expect(OfflineStorageService.getMaxEntries()).toBe(200);

            // Invalid limits should fallback to default
            OfflineStorageService.setMaxEntries(0);
            expect(OfflineStorageService.getMaxEntries()).toBe(DEFAULT_MAX_ENTRIES);
        });

        it('should enforce LRU eviction when array size exceeds max entries limit', async () => {
            OfflineStorageService.setMaxEntries(3);

            const items = [
                { id: 1, name: 'one' },
                { id: 2, name: 'two' },
                { id: 3, name: 'three' },
                { id: 4, name: 'four' },
                { id: 5, name: 'five' },
            ];

            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            await OfflineStorageService.saveWorkouts(items);

            // Check that only the last 3 items were saved (LRU tail)
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                STORAGE_KEYS.WORKOUTS,
                expect.stringContaining(
                    JSON.stringify([
                        { id: 3, name: 'three' },
                        { id: 4, name: 'four' },
                        { id: 5, name: 'five' },
                    ])
                )
            );
        });
    });

    describe('purgeExpired and initialize', () => {
        it('should purge expired keys and keep unexpired keys', async () => {
            const now = Date.now();
            const expiredEnvelope = JSON.stringify({
                data: [{ id: 'old' }],
                createdAt: now - 99999999, // expired
                ttl: 86400000,
            });
            const validEnvelope = JSON.stringify({
                data: [{ id: 'new' }],
                createdAt: now - 1000, // fresh
                ttl: 86400000,
            });

            (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
                if (key === STORAGE_KEYS.ROUTINES) return Promise.resolve(expiredEnvelope);
                if (key === STORAGE_KEYS.WORKOUTS) return Promise.resolve(validEnvelope);
                return Promise.resolve(null);
            });
            (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

            const res = await OfflineStorageService.purgeExpired();
            expect(res.data?.purgedCount).toBe(1);
            expect(res.data?.purgedKeys).toEqual([STORAGE_KEYS.ROUTINES]);
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.ROUTINES);
            expect(AsyncStorage.removeItem).not.toHaveBeenCalledWith(STORAGE_KEYS.WORKOUTS);
        });

        it('should initialize and run automatic purge', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const res = await OfflineStorageService.initialize();
            expect(res.data?.purgedCount).toBe(0);
            expect(res.error).toBeNull();
        });

        it('should purge corrupted JSON cache entries safely', async () => {
            (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
                if (key === STORAGE_KEYS.ROUTINES) return Promise.resolve('INVALID_JSON{{{');
                return Promise.resolve(null);
            });
            (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

            const res = await OfflineStorageService.purgeExpired();
            expect(res.data?.purgedCount).toBe(1);
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.ROUTINES);
        });
    });

    describe('getCacheSize', () => {
        it('should report correct cache size, entry count, and expiry status', async () => {
            const routinesEnvelope = JSON.stringify({
                data: [{ id: 1 }, { id: 2 }],
                createdAt: Date.now() - 500,
                ttl: 86400000,
            });

            (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
                if (key === STORAGE_KEYS.ROUTINES) return Promise.resolve(routinesEnvelope);
                return Promise.resolve(null);
            });

            const res = await OfflineStorageService.getCacheSize();
            expect(res.error).toBeNull();
            expect(res.data?.totalKeys).toBe(4);
            expect(res.data?.totalEntries).toBe(2);
            expect(res.data?.approximateBytes).toBe(routinesEnvelope.length);
            expect(res.data?.keys[STORAGE_KEYS.ROUTINES].count).toBe(2);
            expect(res.data?.keys[STORAGE_KEYS.ROUTINES].isExpired).toBe(false);
        });
    });

    describe('getCacheTimestamp', () => {
        it('should return timestamp from legacy hash if available', async () => {
            const timestamps = { [STORAGE_KEYS.ROUTINES]: 1234567890 };
            (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
                if (key === STORAGE_KEYS.TIMESTAMPS) return Promise.resolve(JSON.stringify(timestamps));
                return Promise.resolve(null);
            });

            const res = await OfflineStorageService.getCacheTimestamp(STORAGE_KEYS.ROUTINES);
            expect(res.data).toBe(1234567890);
        });

        it('should return timestamp from envelope when legacy timestamps hash is absent', async () => {
            const envelope = { data: [], createdAt: 987654321, ttl: 86400000 };
            (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
                if (key === STORAGE_KEYS.TIMESTAMPS) return Promise.resolve(null);
                if (key === STORAGE_KEYS.ROUTINES) return Promise.resolve(JSON.stringify(envelope));
                return Promise.resolve(null);
            });

            const res = await OfflineStorageService.getCacheTimestamp(STORAGE_KEYS.ROUTINES);
            expect(res.data).toBe(987654321);
        });

        it('should return null if timestamps store and envelope are missing', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const res = await OfflineStorageService.getCacheTimestamp(STORAGE_KEYS.ROUTINES);
            expect(res.data).toBeNull();
        });
    });

    describe('clearAllCache', () => {
        it('should multiRemove all cache keys', async () => {
            (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

            const res = await OfflineStorageService.clearAllCache();
            expect(res.data).toBe(true);
            expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(
                Object.values(STORAGE_KEYS)
            );
        });

        it('should handle clear failure', async () => {
            const mockErr = new Error('Storage write error');
            (AsyncStorage.multiRemove as jest.Mock).mockRejectedValue(mockErr);

            const res = await OfflineStorageService.clearAllCache();
            expect(res.data).toBe(false);
            expect(res.error).toBe(mockErr);
        });
    });
});
