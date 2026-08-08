import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { SyncService, PendingSyncOperation } from '../../../src/services/SyncService';

jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
    addEventListener: jest.fn(),
    fetch: jest.fn(),
}));

describe('SyncService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
        (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
        (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('getQueue', () => {
        it('should return empty queue when no operations stored', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const res = await SyncService.getQueue();
            expect(res.data).toEqual([]);
            expect(res.error).toBeNull();
        });

        it('should return parsed queue when operations exist', async () => {
            const queue: PendingSyncOperation[] = [
                { id: 'op1', type: 'WORKOUT_START', payload: { id: 'w1' }, timestamp: 123, attempts: 0 },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(queue));

            const res = await SyncService.getQueue();
            expect(res.data).toEqual(queue);
        });

        it('should handle storage error gracefully', async () => {
            const err = new Error('AsyncStorage read error');
            (AsyncStorage.getItem as jest.Mock).mockRejectedValue(err);

            const res = await SyncService.getQueue();
            expect(res.data).toEqual([]);
            expect(res.error).toBe(err);
        });
    });

    describe('enqueueOperation', () => {
        it('should append new operation to queue and persist it', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            const res = await SyncService.enqueueOperation('SET_UPSERT', { set_id: 's1', reps: 10 });
            expect(res.data).not.toBeNull();
            expect(res.data?.type).toBe('SET_UPSERT');
            expect(res.data?.payload).toEqual({ set_id: 's1', reps: 10 });
            expect(res.data?.attempts).toBe(0);
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                SyncService.SYNC_QUEUE_STORAGE_KEY,
                expect.stringContaining('SET_UPSERT')
            );
        });

        it('should handle enqueue storage failure', async () => {
            const err = new Error('Write error');
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
            (AsyncStorage.setItem as jest.Mock).mockRejectedValue(err);

            const res = await SyncService.enqueueOperation('WORKOUT_COMPLETE', { workout_id: 'w1' });
            expect(res.data).toBeNull();
            expect(res.error).toBe(err);
        });
    });

    describe('dequeueOperation', () => {
        it('should remove target operation by ID', async () => {
            const queue: PendingSyncOperation[] = [
                { id: 'op1', type: 'WORKOUT_START', payload: {}, timestamp: 1, attempts: 0 },
                { id: 'op2', type: 'WORKOUT_COMPLETE', payload: {}, timestamp: 2, attempts: 0 },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(queue));

            const res = await SyncService.dequeueOperation('op1');
            expect(res.data).toBe(true);
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                SyncService.SYNC_QUEUE_STORAGE_KEY,
                JSON.stringify([queue[1]])
            );
        });
    });

    describe('clearQueue', () => {
        it('should remove sync queue key from storage', async () => {
            (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

            const res = await SyncService.clearQueue();
            expect(res.data).toBe(true);
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith(SyncService.SYNC_QUEUE_STORAGE_KEY);
        });
    });

    describe('processQueue', () => {
        it('should return 0 processed/failed if queue is empty', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const res = await SyncService.processQueue();
            expect(res.data).toEqual({ processed: 0, failed: 0 });
        });

        it('should process operations in FIFO order and remove successful ones', async () => {
            const queue: PendingSyncOperation[] = [
                { id: 'op1', type: 'SET_UPSERT', payload: { id: 1 }, timestamp: 1, attempts: 0 },
                { id: 'op2', type: 'SET_UPSERT', payload: { id: 2 }, timestamp: 2, attempts: 0 },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(queue));

            const mockExecutor = jest.fn()
                .mockResolvedValueOnce(true) // op1 succeeds
                .mockResolvedValueOnce(false); // op2 fails

            const res = await SyncService.processQueue(mockExecutor);
            expect(res.data).toEqual({ processed: 1, failed: 1 });

            // op2 should remain in storage with attempts incremented to 1
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                SyncService.SYNC_QUEUE_STORAGE_KEY,
                JSON.stringify([{ ...queue[1], attempts: 1 }])
            );
        });
    });

    describe('initNetworkListener', () => {
        it('should subscribe to NetInfo and trigger processQueue on connection', () => {
            let listenerCb: any = null;
            (NetInfo.addEventListener as jest.Mock).mockImplementation((cb) => {
                listenerCb = cb;
                return jest.fn();
            });

            const processSpy = jest.spyOn(SyncService, 'processQueue').mockImplementation();

            const unsubscribe = SyncService.initNetworkListener();
            expect(NetInfo.addEventListener).toHaveBeenCalled();

            // Simulate network reconnect
            listenerCb({ isConnected: true, isInternetReachable: true });
            expect(processSpy).toHaveBeenCalled();

            unsubscribe();
        });
    });
});
