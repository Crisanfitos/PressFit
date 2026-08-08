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

export type ConflictResolutionStrategy = 'LAST_WRITE_WINS' | 'SERVER_WINS' | 'LOCAL_WINS';

export interface ConflictResolutionResult<T> {
    winner: 'LOCAL' | 'REMOTE';
    resolved: T;
    isConflict: boolean;
}

export interface TimestampedEntity {
    id: string;
    updated_at?: string | number | null;
    created_at?: string | number | null;
    timestamp?: number | null;
    [key: string]: any;
}

const SYNC_QUEUE_STORAGE_KEY = '@pressfit_sync_queue';

export const SyncService = {
    SYNC_QUEUE_STORAGE_KEY,

    /**
     * Helper to extract epoch timestamp in ms from an entity's date/timestamp fields
     */
    parseEntityTimestamp(entity: Record<string, any>): number {
        if (!entity) return 0;
        const val = entity.updated_at || entity.timestamp || entity.created_at;
        if (!val) return 0;
        if (typeof val === 'number') return val;
        const parsed = new Date(val).getTime();
        return isNaN(parsed) ? 0 : parsed;
    },

    /**
     * Resolves conflict between local and remote entity states.
     * Uses Last-Write-Wins (LWW) strategy by comparing timestamps.
     */
    resolveConflict<T extends Record<string, any>>(
        local: T | null | undefined,
        remote: T | null | undefined,
        strategy: ConflictResolutionStrategy = 'LAST_WRITE_WINS'
    ): ConflictResolutionResult<T> {
        if (!local && !remote) {
            return { winner: 'REMOTE', resolved: null as any, isConflict: false };
        }
        if (!local) {
            return { winner: 'REMOTE', resolved: remote!, isConflict: false };
        }
        if (!remote) {
            return { winner: 'LOCAL', resolved: local, isConflict: false };
        }

        if (strategy === 'LOCAL_WINS') {
            return { winner: 'LOCAL', resolved: local, isConflict: true };
        }
        if (strategy === 'SERVER_WINS') {
            return { winner: 'REMOTE', resolved: remote, isConflict: true };
        }

        // Default: LAST_WRITE_WINS
        const localTime = this.parseEntityTimestamp(local);
        const remoteTime = this.parseEntityTimestamp(remote);

        if (localTime > remoteTime) {
            return { winner: 'LOCAL', resolved: local, isConflict: true };
        } else {
            return { winner: 'REMOTE', resolved: remote, isConflict: true };
        }
    },

    /**
     * Deduplicate array of entities by unique ID, keeping the latest entity (LWW) if duplicates exist.
     */
    deduplicateEntities<T extends TimestampedEntity>(items: T[]): T[] {
        if (!items || !Array.isArray(items)) return [];

        const map = new Map<string, T>();

        for (const item of items) {
            if (!item || !item.id) continue;
            if (!map.has(item.id)) {
                map.set(item.id, item);
            } else {
                const existing = map.get(item.id)!;
                const result = this.resolveConflict(existing, item, 'LAST_WRITE_WINS');
                map.set(item.id, result.resolved);
            }
        }

        return Array.from(map.values());
    },

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
