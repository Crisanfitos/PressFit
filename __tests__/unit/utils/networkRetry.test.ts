import {
    retryWithBackoff,
    retryOnNetworkFailure,
    isNetworkError,
} from '../../../src/utils/networkRetry';
import { retryOnNetworkFailure as routineRetry } from '../../../src/services/RoutineService';
import {
    isNetworkError as offlineIsNetworkError,
    WorkoutOfflineService,
} from '../../../src/services/WorkoutOfflineService';
import {
    retryWithBackoff as workoutRetryWithBackoff,
    isNetworkError as workoutIsNetworkError,
} from '../../../src/services/WorkoutService';

describe('networkRetry utility (PF-374)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('isNetworkError', () => {
        it('returns false for null, undefined or empty error', () => {
            expect(isNetworkError(null)).toBe(false);
            expect(isNetworkError(undefined)).toBe(false);
            expect(isNetworkError('')).toBe(false);
        });

        it('detects common transient network error messages', () => {
            expect(isNetworkError(new Error('Network request failed'))).toBe(true);
            expect(isNetworkError(new Error('Failed to fetch'))).toBe(true);
            expect(isNetworkError(new Error('Network error'))).toBe(true);
            expect(isNetworkError(new Error('Client is offline'))).toBe(true);
            expect(isNetworkError(new Error('Connection timeout'))).toBe(true);
            expect(isNetworkError(new Error('Socket hang up'))).toBe(true);
            expect(isNetworkError(new Error('Connection reset by peer'))).toBe(true);
        });

        it('detects TypeError which fetch throws on network drop', () => {
            const typeError = new TypeError('Failed to fetch');
            expect(isNetworkError(typeError)).toBe(true);

            const genericTypeError = new TypeError('Something else');
            expect(isNetworkError(genericTypeError)).toBe(true);
        });

        it('returns false for business logic, validation or DB errors', () => {
            expect(isNetworkError(new Error('User not found'))).toBe(false);
            expect(isNetworkError(new Error('Invalid input payload'))).toBe(false);
            expect(isNetworkError({ code: 'PGRST116', message: 'Row not found' })).toBe(false);
        });
    });

    describe('retryWithBackoff', () => {
        it('resolves immediately when operation succeeds on first attempt', async () => {
            const fn = jest.fn().mockResolvedValue('success_data');

            const promise = retryWithBackoff(fn);
            await expect(promise).resolves.toBe('success_data');
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('retries on network error and succeeds on subsequent attempt', async () => {
            const fn = jest
                .fn()
                .mockRejectedValueOnce(new Error('Network request failed'))
                .mockResolvedValueOnce('recovered_data');

            const promise = retryWithBackoff(fn, { delayMs: 100, backoffFactor: 2 });

            // Fast-forward timers for the retry delay
            await jest.advanceTimersByTimeAsync(100);

            await expect(promise).resolves.toBe('recovered_data');
            expect(fn).toHaveBeenCalledTimes(2);
        });

        it('retries up to max retries and throws if all fail', async () => {
            const fn = jest.fn().mockRejectedValue(new Error('Network request failed'));

            const promise = retryWithBackoff(fn, { retries: 2, delayMs: 50, backoffFactor: 2 });

            // Catch promise rejection handler to prevent unhandled rejection during timer advance
            let errorCaught: Error | null = null;
            promise.catch((err) => {
                errorCaught = err;
            });

            // 1st retry: 50ms
            await jest.advanceTimersByTimeAsync(50);
            // 2nd retry: 100ms
            await jest.advanceTimersByTimeAsync(100);

            await expect(promise).rejects.toThrow('Network request failed');
            expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
            expect(errorCaught).not.toBeNull();
        });

        it('does not retry when error is not retryable', async () => {
            const fn = jest.fn().mockRejectedValue(new Error('Unauthorized access'));

            const promise = retryWithBackoff(fn, { retries: 3 });

            await expect(promise).rejects.toThrow('Unauthorized access');
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('respects custom isRetryable predicate', async () => {
            const customIsRetryable = jest.fn((err: unknown) => {
                return (err as Error).message === 'CUSTOM_RETRYABLE';
            });

            const fn = jest
                .fn()
                .mockRejectedValueOnce(new Error('CUSTOM_RETRYABLE'))
                .mockResolvedValueOnce('custom_recovered');

            const promise = retryWithBackoff(fn, {
                retries: 2,
                delayMs: 50,
                isRetryable: customIsRetryable,
            });

            await jest.advanceTimersByTimeAsync(50);

            await expect(promise).resolves.toBe('custom_recovered');
            expect(fn).toHaveBeenCalledTimes(2);
            expect(customIsRetryable).toHaveBeenCalled();
        });

        it('supports passing numeric retries count directly as options', async () => {
            const fn = jest
                .fn()
                .mockRejectedValueOnce(new Error('offline'))
                .mockResolvedValueOnce('ok');

            const promise = retryWithBackoff(fn, 2);

            await jest.advanceTimersByTimeAsync(300);

            await expect(promise).resolves.toBe('ok');
            expect(fn).toHaveBeenCalledTimes(2);
        });

        it('caps delay at maxDelayMs', async () => {
            const fn = jest
                .fn()
                .mockRejectedValueOnce(new Error('timeout'))
                .mockRejectedValueOnce(new Error('timeout'))
                .mockResolvedValueOnce('capped_ok');

            const promise = retryWithBackoff(fn, {
                retries: 3,
                delayMs: 1000,
                backoffFactor: 3,
                maxDelayMs: 1500, // 1000 * 3 = 3000, but capped at 1500
            });

            // 1st delay: 1000ms
            await jest.advanceTimersByTimeAsync(1000);
            // 2nd delay: capped at 1500ms (instead of 3000ms)
            await jest.advanceTimersByTimeAsync(1500);

            await expect(promise).resolves.toBe('capped_ok');
            expect(fn).toHaveBeenCalledTimes(3);
        });
    });

    describe('retryOnNetworkFailure alias', () => {
        it('retries using default parameters for backwards compatibility', async () => {
            const fn = jest
                .fn()
                .mockRejectedValueOnce(new Error('Network request failed'))
                .mockResolvedValueOnce('compat_ok');

            const promise = retryOnNetworkFailure(fn, 2, 200);

            await jest.advanceTimersByTimeAsync(200);

            await expect(promise).resolves.toBe('compat_ok');
            expect(fn).toHaveBeenCalledTimes(2);
        });
    });

    describe('Service integrations', () => {
        it('RoutineService re-exports retryOnNetworkFailure matching the centralized utility', async () => {
            const fn = jest
                .fn()
                .mockRejectedValueOnce(new Error('Network request failed'))
                .mockResolvedValueOnce('routine_ok');

            const promise = routineRetry(fn, 1, 100);
            await jest.advanceTimersByTimeAsync(100);

            await expect(promise).resolves.toBe('routine_ok');
            expect(fn).toHaveBeenCalledTimes(2);
        });

        it('WorkoutOfflineService delegates isNetworkError to centralized utility', () => {
            expect(offlineIsNetworkError(new Error('Network request failed'))).toBe(true);
            expect(WorkoutOfflineService.isNetworkError(new Error('Failed to fetch'))).toBe(true);
            expect(WorkoutOfflineService.isNetworkError(new Error('Business error'))).toBe(false);
            expect(typeof WorkoutOfflineService.retryWithBackoff).toBe('function');
        });

        it('WorkoutService re-exports retryWithBackoff and isNetworkError', () => {
            expect(typeof workoutRetryWithBackoff).toBe('function');
            expect(typeof workoutIsNetworkError).toBe('function');
            expect(workoutIsNetworkError(new Error('offline'))).toBe(true);
        });
    });
});
