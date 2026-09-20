import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useWorkoutPR } from '../../../../src/hooks/workout/useWorkoutPR';
import { PersonalRecordService } from '../../../../src/services/PersonalRecordService';
import { HapticService } from '../../../../src/services/HapticService';

jest.mock('../../../../src/services/PersonalRecordService', () => ({
    PersonalRecordService: {
        getHistoricalPRs: jest.fn(),
        checkSetForPR: jest.fn(),
    },
}));

jest.mock('../../../../src/services/HapticService', () => ({
    HapticService: {
        prCelebration: jest.fn(),
    },
}));

describe('useWorkoutPR', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('initializes with null activePRCelebration', async () => {
        const hook = await renderHook(() => useWorkoutPR('user-1'));
        await waitFor(() => expect(hook.result.current).not.toBeNull());
        expect(hook.result.current.activePRCelebration).toBeNull();
    });

    it('prefetches PRs for unique exercises', async () => {
        (PersonalRecordService.getHistoricalPRs as jest.Mock).mockResolvedValue({
            data: { maxWeight: 100, maxVolume: 1000, max1RM: 120 },
            error: null,
        });

        const hook = await renderHook(() => useWorkoutPR('user-1'));
        await waitFor(() => expect(hook.result.current).not.toBeNull());

        await act(async () => {
            await hook.result.current.prefetchPRs([{ id: 'ex-1' }, { id: 'ex-2' }, { id: 'ex-1' }]);
        });

        expect(PersonalRecordService.getHistoricalPRs).toHaveBeenCalledTimes(2);
        expect(hook.result.current.exercisePRsRef.current['ex-1']).toEqual({ maxWeight: 100, maxVolume: 1000, max1RM: 120 });
    });

    it('detects a PR, triggers haptic and sets active celebration', async () => {
        (PersonalRecordService.getHistoricalPRs as jest.Mock).mockResolvedValue({
            data: { maxWeight: 80, maxVolume: 800, max1RM: 100 },
            error: null,
        });

        (PersonalRecordService.checkSetForPR as jest.Mock).mockReturnValue({
            isPR: true,
            brokenPRs: [{ type: 'weight', oldValue: 80, newValue: 90 }],
        });

        const hook = await renderHook(() => useWorkoutPR('user-1'));
        await waitFor(() => expect(hook.result.current).not.toBeNull());

        let checkRes: any;
        await act(async () => {
            checkRes = await hook.result.current.checkAndCelebratePR(
                { id: 'ex-1', titulo: 'Bench Press' },
                { id: 'set-1', peso_utilizado: 90, repeticiones: 10 }
            );
        });

        expect(checkRes.isPR).toBe(true);
        expect(hook.result.current.activePRCelebration).toEqual({
            exerciseName: 'Bench Press',
            brokenPRs: [{ type: 'weight', oldValue: 80, newValue: 90 }],
            setId: 'set-1',
        });
        expect(HapticService.prCelebration).toHaveBeenCalled();

        await act(async () => {
            hook.result.current.dismissPRCelebration();
        });
        expect(hook.result.current.activePRCelebration).toBeNull();
    });

    it('returns isPR: false when not a PR and does not trigger haptic', async () => {
        (PersonalRecordService.getHistoricalPRs as jest.Mock).mockResolvedValue({
            data: { maxWeight: 100, maxVolume: 1000, max1RM: 120 },
            error: null,
        });

        (PersonalRecordService.checkSetForPR as jest.Mock).mockReturnValue({
            isPR: false,
            brokenPRs: [],
        });

        const hook = await renderHook(() => useWorkoutPR('user-1'));
        await waitFor(() => expect(hook.result.current).not.toBeNull());

        let checkRes: any;
        await act(async () => {
            checkRes = await hook.result.current.checkAndCelebratePR(
                { id: 'ex-1', titulo: 'Bench Press' },
                { id: 'set-1', peso_utilizado: 80, repeticiones: 10 }
            );
        });

        expect(checkRes.isPR).toBe(false);
        expect(hook.result.current.activePRCelebration).toBeNull();
        expect(HapticService.prCelebration).not.toHaveBeenCalled();
    });
});
