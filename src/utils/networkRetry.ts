/**
 * Utility for retrying asynchronous network operations with exponential backoff.
 * Centralized for services like RoutineService and WorkoutService.
 */

export interface RetryOptions {
    /** Number of retry attempts before giving up (default: 3) */
    retries?: number;
    /** Initial delay in milliseconds before the first retry (default: 300) */
    delayMs?: number;
    /** Exponential backoff multiplier (default: 1.5) */
    backoffFactor?: number;
    /** Maximum delay allowed between retries in milliseconds (default: 5000) */
    maxDelayMs?: number;
    /** Predicate to determine whether an error is transient and retryable */
    isRetryable?: (error: unknown) => boolean;
}

/**
 * Checks if an error represents a transient network, socket, or timeout failure.
 */
export function isNetworkError(error: unknown): boolean {
    if (!error) return false;
    const errObj = error as { message?: string; name?: string; code?: string } | null;
    const msg = String(errObj?.message || errObj?.name || error).toLowerCase();

    return (
        msg.includes('network request failed') ||
        msg.includes('network') ||
        msg.includes('fetch') ||
        msg.includes('offline') ||
        msg.includes('timeout') ||
        msg.includes('socket') ||
        msg.includes('connection') ||
        errObj?.name === 'TypeError'
    );
}

/**
 * Executes an async function, retrying on transient failures with exponential backoff.
 */
export async function retryWithBackoff<T>(
    fn: () => PromiseLike<T> | Promise<T>,
    options: RetryOptions | number = {}
): Promise<T> {
    const opts: RetryOptions = typeof options === 'number' ? { retries: options } : options;
    const {
        retries = 3,
        delayMs = 300,
        backoffFactor = 1.5,
        maxDelayMs = 5000,
        isRetryable = isNetworkError,
    } = opts;

    try {
        return await fn();
    } catch (err: unknown) {
        if (retries > 0 && isRetryable(err)) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            const nextDelay = Math.min(delayMs * backoffFactor, maxDelayMs);
            return retryWithBackoff(fn, {
                retries: retries - 1,
                delayMs: nextDelay,
                backoffFactor,
                maxDelayMs,
                isRetryable,
            });
        }
        throw err;
    }
}

/**
 * Helper to retry an async network operation on transient network/socket drops (e.g. OkHttp keep-alive resets).
 * Maintained for 100% backward compatibility with RoutineService API.
 */
export const retryOnNetworkFailure = async <T>(
    fn: () => PromiseLike<T> | Promise<T>,
    retries = 3,
    delayMs = 300
): Promise<T> => {
    return retryWithBackoff(fn, { retries, delayMs, backoffFactor: 1.5 });
};
