import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { ServiceResponse } from '../types/models';

export type SyncOperationType =
    | 'WORKOUT_START'
    | 'WORKOUT_UPDATE'
    | 'WORKOUT_COMPLETE'
    | 'SET_UPSERT'
    | 'SET_DELETE'
    | 'CUSTOM';

export interface PendingSyncOperation {
    id: string;
    type: SyncOperationType;
    payload: any;
    timestamp: number;
    attempts: number;
}

const SYNC_QUEUE_STORAGE_KEY = '@pressfit_sync_queue';

export const SyncService = {
    SYNC_QUEUE_STORAGE_KEY,

    /**
     * Get all pending operations currently stored in the queue (FIFO order)
     */
    async getQueue(): Promise<ServiceResponse<PendingSyncOperation[]>> {
        try {
            const raw = await AsyncStorage.getItem(SYNC_QUEUE_STORAGE_KEY);
            if (!raw) return { data: [], error: null };
            const queue: PendingSyncOperation[] = JSON.parse(raw);
            return { data: queue, error: null };
        } catch (error) {
            return { data: [], error };
        }
    },

    /**
     * Enqueue a new mutation operation for deferred offline sync
     */
    async enqueueOperation(
        type: SyncOperationType,
        payload: any
    ): Promise<ServiceResponse<PendingSyncOperation>> {
        try {
            const queueRes = await SyncService.getQueue();
            const currentQueue = queueRes.data || [];

            const newOp: PendingSyncOperation = {
                id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                type,
                payload,
                timestamp: Date.now(),
                attempts: 0,
            };

            const updatedQueue = [...currentQueue, newOp];
            await AsyncStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(updatedQueue));
            return { data: newOp, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    /**
     * Remove a specific operation by ID from the queue
     */
    async dequeueOperation(id: string): Promise<ServiceResponse<boolean>> {
        try {
            const queueRes = await SyncService.getQueue();
            const currentQueue = queueRes.data || [];
            const updatedQueue = currentQueue.filter((op) => op.id !== id);
            await AsyncStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(updatedQueue));
            return { data: true, error: null };
        } catch (error) {
            return { data: false, error };
        }
    },

    /**
     * Clear all pending sync operations
     */
    async clearQueue(): Promise<ServiceResponse<boolean>> {
        try {
            await AsyncStorage.removeItem(SYNC_QUEUE_STORAGE_KEY);
            return { data: true, error: null };
        } catch (error) {
            return { data: false, error };
        }
    },

    /**
     * Process pending operations in strict FIFO order using a provided executor function.
     * Failed operations increment `attempts` counter.
     */
    async processQueue(
        executorFn?: (op: PendingSyncOperation) => Promise<boolean>
    ): Promise<ServiceResponse<{ processed: number; failed: number }>> {
        try {
            const queueRes = await SyncService.getQueue();
            const queue = queueRes.data || [];

            if (queue.length === 0) {
                return { data: { processed: 0, failed: 0 }, error: null };
            }

            let processedCount = 0;
            let failedCount = 0;

            const remainingQueue: PendingSyncOperation[] = [];

            for (const op of queue) {
                let success = false;
                if (executorFn) {
                    try {
                        success = await executorFn(op);
                    } catch {
                        success = false;
                    }
                } else {
                    // Default fallback: simulate successful processing
                    success = true;
                }

                if (success) {
                    processedCount++;
                } else {
                    failedCount++;
                    remainingQueue.push({
                        ...op,
                        attempts: op.attempts + 1,
                    });
                }
            }

            await AsyncStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(remainingQueue));
            return { data: { processed: processedCount, failed: failedCount }, error: null };
        } catch (error) {
            return { data: { processed: 0, failed: 0 }, error };
        }
    },

    /**
     * Listen to NetInfo network status changes and trigger processQueue when internet becomes reachable
     */
    initNetworkListener(
        executorFn?: (op: PendingSyncOperation) => Promise<boolean>
    ): () => void {
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            if (state.isConnected && state.isInternetReachable !== false) {
                SyncService.processQueue(executorFn);
            }
        });
        return unsubscribe;
    },
};
