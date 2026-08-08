import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineStorageService } from '../../../src/services/OfflineStorageService';

jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    multiRemove: jest.fn(),
}));

describe('OfflineStorageService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('saveRoutines and getCachedRoutines', () => {
        it('should save routines and update timestamp', async () => {
            const routines = [{ id: 'rot-1', nombre: 'Leg Day' }];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            const res = await OfflineStorageService.saveRoutines(routines);
            expect(res.data).toBe(true);
            expect(res.error).toBeNull();
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                OfflineStorageService.STORAGE_KEYS.ROUTINES,
                JSON.stringify(routines)
            );
        });

        it('should return cached routines when available', async () => {
            const routines = [{ id: 'rot-1', nombre: 'Leg Day' }];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(routines));

            const res = await OfflineStorageService.getCachedRoutines();
            expect(res.data).toEqual(routines);
            expect(res.error).toBeNull();
        });

        it('should return null data when cache is empty', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const res = await OfflineStorageService.getCachedRoutines();
            expect(res.data).toBeNull();
            expect(res.error).toBeNull();
        });

        it('should handle errors gracefully', async () => {
            const mockError = new Error('AsyncStorage error');
            (AsyncStorage.setItem as jest.Mock).mockRejectedValue(mockError);

            const res = await OfflineStorageService.saveRoutines([]);
            expect(res.data).toBe(false);
            expect(res.error).toBe(mockError);
        });
    });

    describe('saveWorkouts and getCachedWorkouts', () => {
        it('should save workouts successfully', async () => {
            const workouts = [{ id: 'w-1', completado: true }];
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            const res = await OfflineStorageService.saveWorkouts(workouts);
            expect(res.data).toBe(true);
            expect(res.error).toBeNull();
        });

        it('should retrieve cached workouts', async () => {
            const workouts = [{ id: 'w-1', completado: true }];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(workouts));

            const res = await OfflineStorageService.getCachedWorkouts();
            expect(res.data).toEqual(workouts);
        });
    });

    describe('saveExercises and getCachedExercises', () => {
        it('should save and get exercises', async () => {
            const exercises = [{ id: 'ex-1', titulo: 'Bench Press' }];
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(exercises));

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
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(history));

            const saveRes = await OfflineStorageService.saveHistory(history);
            expect(saveRes.data).toBe(true);

            const getRes = await OfflineStorageService.getCachedHistory();
            expect(getRes.data).toEqual(history);
        });
    });

    describe('getCacheTimestamp', () => {
        it('should return timestamp for a valid cached key', async () => {
            const timestamps = { [OfflineStorageService.STORAGE_KEYS.ROUTINES]: 1234567890 };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(timestamps));

            const res = await OfflineStorageService.getCacheTimestamp(OfflineStorageService.STORAGE_KEYS.ROUTINES);
            expect(res.data).toBe(1234567890);
        });

        it('should return null if timestamps store is empty', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const res = await OfflineStorageService.getCacheTimestamp(OfflineStorageService.STORAGE_KEYS.ROUTINES);
            expect(res.data).toBeNull();
        });
    });

    describe('clearAllCache', () => {
        it('should multiRemove all cache keys', async () => {
            (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

            const res = await OfflineStorageService.clearAllCache();
            expect(res.data).toBe(true);
            expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(
                Object.values(OfflineStorageService.STORAGE_KEYS)
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
