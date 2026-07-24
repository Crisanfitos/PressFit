import AsyncStorage from '@react-native-async-storage/async-storage';

// Must mock expo-notifications before importing TimerNotificationService
// because it calls setNotificationHandler at module level
jest.mock('expo-notifications', () => ({
    setNotificationHandler: jest.fn(),
    setNotificationCategoryAsync: jest.fn().mockResolvedValue(undefined),
    getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    scheduleNotificationAsync: jest.fn().mockResolvedValue('mock-notif-id'),
    dismissNotificationAsync: jest.fn().mockResolvedValue(undefined),
    cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
    addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

import {
    getElapsedSecondsFromStorage,
    checkActiveRestTimer,
} from '../../../src/services/TimerNotificationService';

// AsyncStorage is auto-mocked by the jest setup (react-native mock)
// We just need to control the return values

const TIMER_STORAGE_KEY = '@pressfit_rest_timer_start';

describe('TimerNotificationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    });

    describe('getElapsedSecondsFromStorage', () => {
        it('should return 0 when no timer is stored', async () => {
            const result = await getElapsedSecondsFromStorage();
            expect(result).toBe(0);
            expect(AsyncStorage.getItem).toHaveBeenCalledWith(TIMER_STORAGE_KEY);
        });

        it('should return elapsed seconds when timer is stored', async () => {
            const startTime = Date.now() - 120_000; // 120 seconds ago
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(String(startTime));

            const result = await getElapsedSecondsFromStorage();
            expect(result).toBeGreaterThanOrEqual(119);
            expect(result).toBeLessThanOrEqual(121);
        });

        it('should return 0 when stored timestamp is in the future', async () => {
            const futureTime = Date.now() + 60_000; // 1 minute in the future
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(String(futureTime));

            const result = await getElapsedSecondsFromStorage();
            expect(result).toBe(0);
        });

        it('should return 0 when AsyncStorage throws', async () => {
            (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

            const result = await getElapsedSecondsFromStorage();
            expect(result).toBe(0);
        });
    });

    describe('checkActiveRestTimer', () => {
        it('should return active=false when no timer is stored', async () => {
            const result = await checkActiveRestTimer();
            expect(result).toEqual({ active: false, elapsedSeconds: 0 });
        });

        it('should return active=true with elapsed seconds when timer is stored', async () => {
            const startTime = Date.now() - 90_000; // 90 seconds ago
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(String(startTime));

            const result = await checkActiveRestTimer();
            expect(result.active).toBe(true);
            expect(result.elapsedSeconds).toBeGreaterThanOrEqual(89);
            expect(result.elapsedSeconds).toBeLessThanOrEqual(91);
        });

        it('should return active=true with 0 elapsed for future timestamp', async () => {
            const futureTime = Date.now() + 10_000;
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(String(futureTime));

            const result = await checkActiveRestTimer();
            expect(result.active).toBe(true);
            expect(result.elapsedSeconds).toBe(0);
        });

        it('should return active=false when AsyncStorage throws', async () => {
            (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

            const result = await checkActiveRestTimer();
            expect(result).toEqual({ active: false, elapsedSeconds: 0 });
        });
    });
});
