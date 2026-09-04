import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkService, NetworkState } from './NetworkService';
import { ServiceResponse } from '../types/models';

export type SyncOperationType =
    | 'WORKOUT_START'
    | 'WORKOUT_UPDATE'
    | 'WORKOUT_COMPLETE'
    | 'SET_UPSERT'
    | 'SET_DELETE'
    | 'CUSTOM';

export interface RetryLogEntry {
    timestamp: number;
    attempt: number;
    error: string;
}

export interface PendingSyncOperation {
    id: string;
    type: SyncOperationType;
    payload: any;
    timestamp: number;
    attempts: number;
    nextRetryTimestamp?: number;
    retryLogs?: RetryLogEntry[];
    lastError?: string;
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

export const SYNC_QUEUE_STORAGE_KEY = '@pressfit_sync_queue';
export const DEAD_LETTER_QUEUE_STORAGE_KEY = '@pressfit_dead_letter_queue';
export const MAX_SYNC_RETRIES = 5;
export const BASE_BACKOFF_DELAY_MS = 2000;
export const MAX_BACKOFF_DELAY_MS = 60000;

export const SyncService = {
    SYNC_QUEUE_STORAGE_KEY,
    DEAD_LETTER_QUEUE_STORAGE_KEY,
    MAX_SYNC_RETRIES,
    BASE_BACKOFF_DELAY_MS,
    MAX_BACKOFF_DELAY_MS,

    /**
     * Calculate exponential backoff delay in ms based on attempts count:
     * 2s -> 4s -> 8s -> 16s -> 32s (capped at 60s)
     */
    calculateBackoff(attempts: number): number {
        const exponent = Math.max(0, attempts);
        const delay = BASE_BACKOFF_DELAY_MS * Math.pow(2, exponent);
        return Math.min(delay, MAX_BACKOFF_DELAY_MS);
    },

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
     * Retrieve all operations moved to Dead Letter Queue
     */
    async getDeadLetterQueue(): Promise<ServiceResponse<PendingSyncOperation[]>> {
        try {
            const raw = await AsyncStorage.getItem(DEAD_LETTER_QUEUE_STORAGE_KEY);
            if (!raw) return { data: [], error: null };
            const dlq: PendingSyncOperation[] = JSON.parse(raw);
            return { data: dlq, error: null };
        } catch (error) {
            return { data: [], error };
        }
    },

    /**
     * Clear all dead-lettered sync operations
     */
    async clearDeadLetterQueue(): Promise<ServiceResponse<boolean>> {
        try {
            await AsyncStorage.removeItem(DEAD_LETTER_QUEUE_STORAGE_KEY);
            return { data: true, error: null };
        } catch (error) {
            return { data: false, error };
        }
    },

    /**
     * Append an operation to Dead Letter Queue
     */
    async addToDeadLetterQueue(op: PendingSyncOperation): Promise<ServiceResponse<boolean>> {
        try {
            const dlqRes = await SyncService.getDeadLetterQueue();
            const currentDlq = dlqRes.data || [];
            const updatedDlq = [...currentDlq, op];
            await AsyncStorage.setItem(DEAD_LETTER_QUEUE_STORAGE_KEY, JSON.stringify(updatedDlq));
            return { data: true, error: null };
        } catch (error) {
            return { data: false, error };
        }
    },

    /**
     * Process pending operations in queue using a provided executor function.
     * Failed operations increment attempts counter, calculate exponential backoff (2s -> 4s -> 8s -> 16s -> 32s, max 60s),
     * log failed attempts, and move to dead-letter queue if exceeding MAX_SYNC_RETRIES (5).
     * Operations waiting for backoff do not block subsequent operations.
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
                const now = Date.now();
                if (op.nextRetryTimestamp && now < op.nextRetryTimestamp) {
                    // Backoff delay has not elapsed yet; keep in queue and do NOT block other operations
                    remainingQueue.push(op);
                    continue;
                }

                let success = false;
                let failureError = 'Execution failed';
                if (executorFn) {
                    try {
                        success = await executorFn(op);
                        if (!success) {
                            failureError = 'Executor returned false';
                        }
                    } catch (err: any) {
                        success = false;
                        failureError = err?.message || String(err);
                    }
                } else {
                    // Default fallback: simulate successful processing
                    success = true;
                }

                if (success) {
                    processedCount++;
                } else {
                    failedCount++;
                    const newAttempts = (op.attempts || 0) + 1;
                    const logEntry: RetryLogEntry = {
                        timestamp: Date.now(),
                        attempt: newAttempts,
                        error: failureError,
                    };
                    const updatedLogs = [...(op.retryLogs || []), logEntry];

                    if (newAttempts >= MAX_SYNC_RETRIES) {
                        // Max retries reached -> move to Dead Letter Queue
                        await SyncService.addToDeadLetterQueue({
                            ...op,
                            attempts: newAttempts,
                            retryLogs: updatedLogs,
                            lastError: failureError,
                        });
                    } else {
                        const backoffDelay = SyncService.calculateBackoff(op.attempts || 0);
                        remainingQueue.push({
                            ...op,
                            attempts: newAttempts,
                            nextRetryTimestamp: Date.now() + backoffDelay,
                            retryLogs: updatedLogs,
                            lastError: failureError,
                        });
                    }
                }
            }

            await AsyncStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(remainingQueue));
            return { data: { processed: processedCount, failed: failedCount }, error: null };
        } catch (error) {
            return { data: { processed: 0, failed: 0 }, error };
        }
    },

    /**
     * Listen to NetworkService status changes and trigger processQueue when internet becomes reachable
     */
    initNetworkListener(
        executorFn?: (op: PendingSyncOperation) => Promise<boolean>
    ): () => void {
        const unsubscribe = NetworkService.addNetworkListener((state: NetworkState) => {
            if (state.isConnected && !state.isOffline) {
                SyncService.processQueue(executorFn);
            }
        });
        return unsubscribe;
    },
};
