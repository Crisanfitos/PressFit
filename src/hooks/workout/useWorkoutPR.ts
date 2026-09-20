import { useState, useRef, useCallback } from 'react';
import { PersonalRecordService, ExercisePRs, BrokenPRDetail } from '../../services/PersonalRecordService';
import { HapticService } from '../../services/HapticService';

export interface ActivePRCelebration {
    exerciseName: string;
    brokenPRs: BrokenPRDetail[];
    setId: string;
}

export interface UseWorkoutPRReturn {
    activePRCelebration: ActivePRCelebration | null;
    setActivePRCelebration: React.Dispatch<React.SetStateAction<ActivePRCelebration | null>>;
    dismissPRCelebration: () => void;
    prefetchPRs: (exerciseList: { id: string }[]) => Promise<void>;
    checkAndCelebratePR: (
        targetEx: { id: string; titulo: string },
        targetSet: { id: string; peso_utilizado: number; repeticiones: number }
    ) => Promise<{ isPR: boolean; celebrationData: ActivePRCelebration | null }>;
    exercisePRsRef: React.MutableRefObject<Record<string, ExercisePRs>>;
}

export const useWorkoutPR = (userId: string): UseWorkoutPRReturn => {
    const [activePRCelebration, setActivePRCelebration] = useState<ActivePRCelebration | null>(null);
    const exercisePRsRef = useRef<Record<string, ExercisePRs>>({});

    const dismissPRCelebration = useCallback(() => {
        setActivePRCelebration(null);
    }, []);

    const prefetchPRs = useCallback(async (exerciseList: { id: string }[]) => {
        if (!userId) return;
        const uniqueExerciseIds = Array.from(new Set(exerciseList.map((e) => e.id).filter(Boolean)));
        await Promise.all(
            uniqueExerciseIds.map(async (exId) => {
                if (!exercisePRsRef.current[exId]) {
                    const res = await PersonalRecordService.getHistoricalPRs(userId, exId);
                    if (res.data) {
                        exercisePRsRef.current[exId] = res.data;
                    }
                }
            })
        );
    }, [userId]);

    const checkAndCelebratePR = useCallback(async (
        targetEx: { id: string; titulo: string },
        targetSet: { id: string; peso_utilizado: number; repeticiones: number }
    ) => {
        const exId = targetEx.id;
        let currentPRs = exercisePRsRef.current[exId];

        if (!currentPRs && userId) {
            const prRes = await PersonalRecordService.getHistoricalPRs(userId, exId);
            if (prRes.data) {
                exercisePRsRef.current[exId] = prRes.data;
                currentPRs = prRes.data;
            }
        }

        const prResult = PersonalRecordService.checkSetForPR(
            { weight: targetSet.peso_utilizado, reps: targetSet.repeticiones },
            currentPRs
        );

        if (prResult.isPR) {
            const celebrationData: ActivePRCelebration = {
                exerciseName: targetEx.titulo,
                brokenPRs: prResult.brokenPRs,
                setId: targetSet.id,
            };

            const w = Number(targetSet.peso_utilizado) || 0;
            const r = Number(targetSet.repeticiones) || 0;
            const v = w * r;
            const est1rm = prResult.brokenPRs.find((b) => b.type === '1rm')?.newValue;

            exercisePRsRef.current[exId] = {
                maxWeight: Math.max(currentPRs?.maxWeight || 0, w),
                maxVolume: Math.max(currentPRs?.maxVolume || 0, v),
                max1RM: Math.max(currentPRs?.max1RM || 0, est1rm || (currentPRs?.max1RM || 0)),
            };

            if (HapticService.prCelebration) {
                HapticService.prCelebration();
            }

            setActivePRCelebration(celebrationData);
            return { isPR: true, celebrationData };
        }

        return { isPR: false, celebrationData: null };
    }, [userId]);

    return {
        activePRCelebration,
        setActivePRCelebration,
        dismissPRCelebration,
        prefetchPRs,
        checkAndCelebratePR,
        exercisePRsRef,
    };
};
