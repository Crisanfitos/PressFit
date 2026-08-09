import AsyncStorage from '@react-native-async-storage/async-storage';
import { SyncService, PendingSyncOperation } from '../../../src/services/SyncService';
import { NetworkService } from '../../../src/services/NetworkService';

jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
}));

jest.mock('../../../src/services/NetworkService', () => ({
    NetworkService: {
        addNetworkListener: jest.fn(),
        getNetworkState: jest.fn(),
        isOffline: jest.fn(),
    },
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

            const res = await SyncService.enqueueOperation('WORKOUT_START', { id: 'w1' });
            expect(res.error).toBeNull();
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                SyncService.SYNC_QUEUE_STORAGE_KEY,
                expect.stringContaining('WORKOUT_START')
            );
        });
    });

    describe('dequeueOperation', () => {
        it('should remove target operation by ID', async () => {
            const queue: PendingSyncOperation[] = [
                { id: 'op1', type: 'WORKOUT_START', payload: {}, timestamp: 1, attempts: 0 },
                { id: 'op2', type: 'SET_UPSERT', payload: {}, timestamp: 2, attempts: 0 },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(queue));

            const res = await SyncService.dequeueOperation('op1');
            expect(res.error).toBeNull();
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                SyncService.SYNC_QUEUE_STORAGE_KEY,
                JSON.stringify([{ id: 'op2', type: 'SET_UPSERT', payload: {}, timestamp: 2, attempts: 0 }])
            );
        });
    });

    describe('clearQueue', () => {
        it('should remove sync queue key from storage', async () => {
            const res = await SyncService.clearQueue();
            expect(res.error).toBeNull();
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
                { id: 'op1', type: 'WORKOUT_START', payload: {}, timestamp: 1, attempts: 0 },
                { id: 'op2', type: 'SET_UPSERT', payload: {}, timestamp: 2, attempts: 0 },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(queue));

            const executorMock = jest.fn().mockImplementation(async (op: PendingSyncOperation) => {
                return op.id === 'op1';
            });

            const res = await SyncService.processQueue(executorMock);
            expect(res.data).toEqual({ processed: 1, failed: 1 });
            expect(executorMock).toHaveBeenCalledTimes(2);
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                SyncService.SYNC_QUEUE_STORAGE_KEY,
                expect.stringContaining('op2')
            );
        });
    });

    describe('initNetworkListener', () => {
        it('should subscribe to NetworkService and trigger processQueue on connection', () => {
            let listenerCb: any = null;
            (NetworkService.addNetworkListener as jest.Mock).mockImplementation((cb) => {
                listenerCb = cb;
                return jest.fn();
            });

            const processSpy = jest.spyOn(SyncService, 'processQueue').mockImplementation();

            const unsubscribe = SyncService.initNetworkListener();
            expect(NetworkService.addNetworkListener).toHaveBeenCalled();

            // Simulate network reconnect
            listenerCb({ isConnected: true, isOffline: false });
            expect(processSpy).toHaveBeenCalled();

            unsubscribe();
        });
    });
});
