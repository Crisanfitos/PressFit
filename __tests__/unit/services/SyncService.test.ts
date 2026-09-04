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

        it('should log failed attempt details and set nextRetryTimestamp with exponential backoff', async () => {
            const queue: PendingSyncOperation[] = [
                { id: 'op_fail', type: 'WORKOUT_START', payload: {}, timestamp: 1, attempts: 0 },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(queue));

            const executorMock = jest.fn().mockRejectedValue(new Error('Network timeout 504'));

            const beforeTime = Date.now();
            const res = await SyncService.processQueue(executorMock);
            expect(res.data).toEqual({ processed: 0, failed: 1 });

            // Expect AsyncStorage.setItem with updated operation
            const lastCall = (AsyncStorage.setItem as jest.Mock).mock.calls.find(
                (call) => call[0] === SyncService.SYNC_QUEUE_STORAGE_KEY
            );
            expect(lastCall).toBeDefined();
            const savedQueue: PendingSyncOperation[] = JSON.parse(lastCall[1]);
            expect(savedQueue).toHaveLength(1);
            expect(savedQueue[0].attempts).toBe(1);
            expect(savedQueue[0].lastError).toBe('Network timeout 504');
            expect(savedQueue[0].retryLogs).toHaveLength(1);
            expect(savedQueue[0].retryLogs![0]).toEqual(
                expect.objectContaining({
                    attempt: 1,
                    error: 'Network timeout 504',
                })
            );
            expect(savedQueue[0].nextRetryTimestamp).toBeGreaterThanOrEqual(beforeTime + 2000);
        });

        it('should NOT block subsequent operations when an earlier operation is waiting for backoff', async () => {
            const futureTime = Date.now() + 10000;
            const queue: PendingSyncOperation[] = [
                {
                    id: 'op_waiting',
                    type: 'WORKOUT_START',
                    payload: {},
                    timestamp: 1,
                    attempts: 1,
                    nextRetryTimestamp: futureTime,
                },
                {
                    id: 'op_ready',
                    type: 'SET_UPSERT',
                    payload: {},
                    timestamp: 2,
                    attempts: 0,
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(queue));

            const executorMock = jest.fn().mockImplementation(async (op: PendingSyncOperation) => {
                return op.id === 'op_ready';
            });

            const res = await SyncService.processQueue(executorMock);
            // op_waiting was skipped without executing, op_ready succeeded
            expect(executorMock).toHaveBeenCalledTimes(1);
            expect(executorMock).toHaveBeenCalledWith(expect.objectContaining({ id: 'op_ready' }));
            expect(res.data).toEqual({ processed: 1, failed: 0 });

            // remaining queue should still contain op_waiting
            const lastCall = (AsyncStorage.setItem as jest.Mock).mock.calls.find(
                (call) => call[0] === SyncService.SYNC_QUEUE_STORAGE_KEY
            );
            const savedQueue: PendingSyncOperation[] = JSON.parse(lastCall[1]);
            expect(savedQueue).toHaveLength(1);
            expect(savedQueue[0].id).toBe('op_waiting');
        });

        it('should move operation to Dead Letter Queue when reaching MAX_SYNC_RETRIES (5)', async () => {
            const queue: PendingSyncOperation[] = [
                {
                    id: 'op_doomed',
                    type: 'WORKOUT_UPDATE',
                    payload: {},
                    timestamp: 1,
                    attempts: 4, // 5th attempt will fail and trigger DLQ
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
                if (key === SyncService.SYNC_QUEUE_STORAGE_KEY) {
                    return JSON.stringify(queue);
                }
                if (key === SyncService.DEAD_LETTER_QUEUE_STORAGE_KEY) {
                    return JSON.stringify([]);
                }
                return null;
            });

            const executorMock = jest.fn().mockResolvedValue(false);

            const res = await SyncService.processQueue(executorMock);
            expect(res.data).toEqual({ processed: 0, failed: 1 });

            // Active queue should now be empty
            const activeQueueCall = (AsyncStorage.setItem as jest.Mock).mock.calls.find(
                (call) => call[0] === SyncService.SYNC_QUEUE_STORAGE_KEY
            );
            expect(JSON.parse(activeQueueCall[1])).toEqual([]);

            // DLQ should have received op_doomed with attempts = 5
            const dlqCall = (AsyncStorage.setItem as jest.Mock).mock.calls.find(
                (call) => call[0] === SyncService.DEAD_LETTER_QUEUE_STORAGE_KEY
            );
            expect(dlqCall).toBeDefined();
            const savedDlq: PendingSyncOperation[] = JSON.parse(dlqCall[1]);
            expect(savedDlq).toHaveLength(1);
            expect(savedDlq[0].id).toBe('op_doomed');
            expect(savedDlq[0].attempts).toBe(5);
            expect(savedDlq[0].lastError).toBe('Executor returned false');
            expect(savedDlq[0].retryLogs).toHaveLength(1);
        });
    });

    describe('calculateBackoff', () => {
        it('should calculate exponential backoff from 2s to 32s and cap at 60s', () => {
            expect(SyncService.calculateBackoff(0)).toBe(2000);   // 2s
            expect(SyncService.calculateBackoff(1)).toBe(4000);   // 4s
            expect(SyncService.calculateBackoff(2)).toBe(8000);   // 8s
            expect(SyncService.calculateBackoff(3)).toBe(16000);  // 16s
            expect(SyncService.calculateBackoff(4)).toBe(32000);  // 32s
            expect(SyncService.calculateBackoff(5)).toBe(60000);  // 60s cap
            expect(SyncService.calculateBackoff(10)).toBe(60000); // capped at 60s
        });
    });

    describe('Dead Letter Queue (DLQ)', () => {
        it('should get empty array when no items in DLQ', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const res = await SyncService.getDeadLetterQueue();
            expect(res.data).toEqual([]);
            expect(res.error).toBeNull();
        });

        it('should return parsed DLQ items', async () => {
            const dlqItems: PendingSyncOperation[] = [
                { id: 'dead_1', type: 'CUSTOM', payload: {}, timestamp: 100, attempts: 5 },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(dlqItems));

            const res = await SyncService.getDeadLetterQueue();
            expect(res.data).toEqual(dlqItems);
            expect(res.error).toBeNull();
        });

        it('should handle error when reading DLQ', async () => {
            const err = new Error('AsyncStorage read error');
            (AsyncStorage.getItem as jest.Mock).mockRejectedValue(err);

            const res = await SyncService.getDeadLetterQueue();
            expect(res.data).toEqual([]);
            expect(res.error).toBe(err);
        });

        it('should clear DLQ using clearDeadLetterQueue', async () => {
            const res = await SyncService.clearDeadLetterQueue();
            expect(res.data).toBe(true);
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith(SyncService.DEAD_LETTER_QUEUE_STORAGE_KEY);
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
