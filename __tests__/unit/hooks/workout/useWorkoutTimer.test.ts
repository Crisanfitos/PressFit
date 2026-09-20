import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useWorkoutTimer } from '../../../../src/hooks/workout/useWorkoutTimer';

describe('useWorkoutTimer', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('initializes with default seconds and stopped state', async () => {
        const hook = await renderHook(() => useWorkoutTimer());
        await waitFor(() => expect(hook.result.current).not.toBeNull());
        expect(hook.result.current.timer).toBe(0);
        expect(hook.result.current.isTimerRunning).toBe(false);
    });

    it('initializes with custom initial seconds', async () => {
        const hook = await renderHook(() => useWorkoutTimer(120));
        await waitFor(() => expect(hook.result.current).not.toBeNull());
        expect(hook.result.current.timer).toBe(120);
        expect(hook.result.current.isTimerRunning).toBe(false);
    });

    it('increments timer every second when started', async () => {
        const hook = await renderHook(() => useWorkoutTimer(0));
        await waitFor(() => expect(hook.result.current).not.toBeNull());

        await act(async () => {
            hook.result.current.startTimer();
        });
        expect(hook.result.current.isTimerRunning).toBe(true);

        await act(async () => {
            jest.advanceTimersByTime(3000);
        });
        expect(hook.result.current.timer).toBe(3);
    });

    it('stops incrementing when stopped', async () => {
        const hook = await renderHook(() => useWorkoutTimer(10));
        await waitFor(() => expect(hook.result.current).not.toBeNull());

        await act(async () => {
            hook.result.current.startTimer();
        });
        await act(async () => {
            jest.advanceTimersByTime(2000);
        });
        expect(hook.result.current.timer).toBe(12);

        await act(async () => {
            hook.result.current.stopTimer();
        });
        expect(hook.result.current.isTimerRunning).toBe(false);

        await act(async () => {
            jest.advanceTimersByTime(2000);
        });
        expect(hook.result.current.timer).toBe(12);
    });

    it('resets timer to 0 and stops running', async () => {
        const hook = await renderHook(() => useWorkoutTimer(50));
        await waitFor(() => expect(hook.result.current).not.toBeNull());

        await act(async () => {
            hook.result.current.startTimer();
        });
        await act(async () => {
            jest.advanceTimersByTime(5000);
        });
        expect(hook.result.current.timer).toBe(55);

        await act(async () => {
            hook.result.current.resetTimer();
        });
        expect(hook.result.current.timer).toBe(0);
        expect(hook.result.current.isTimerRunning).toBe(false);
    });
});
