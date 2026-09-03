import { useState, useEffect, useRef } from 'react';
import { HapticService } from '../../services/HapticService';
import { checkActiveRestTimer, saveActiveWorkoutParams, getActiveWorkoutParams } from '../../services/TimerNotificationService';

export interface UseWorkoutScreenStateParams {
    controllerLoading: boolean;
    mode: string;
    exercises: any[];
    addSets: (exerciseId: string, count: number) => Promise<void>;
    updateSet: (setId: string, field: string, value: any) => Promise<void>;
    reloadExercises: () => void;
    navigation: any;
}

export const useWorkoutScreenState = ({
    controllerLoading,
    mode,
    exercises,
    addSets,
    updateSet,
    reloadExercises,
    navigation,
}: UseWorkoutScreenStateParams) => {
    const [collapsedExercises, setCollapsedExercises] = useState<Record<string, boolean>>({});
    const [saving, setSaving] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [setsToAdd, setSetsToAdd] = useState(1);
    const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
    const [restTimerVisible, setRestTimerVisible] = useState(false);
    const [lastCompletedSetId, setLastCompletedSetId] = useState<string | null>(null);
    const [savedTimerSetIds, setSavedTimerSetIds] = useState<Set<string>>(new Set());

    const hasInitializedCollapse = useRef(false);
    const needsRefreshRef = useRef(false);

    useEffect(() => {
        if (!controllerLoading && exercises.length > 0 && !hasInitializedCollapse.current) {
            hasInitializedCollapse.current = true;
            const initial: Record<string, boolean> = {};
            exercises.slice(1).forEach((ex) => (initial[ex.id] = true));
            setCollapsedExercises(initial);
        }
    }, [controllerLoading, exercises.length]);

    useEffect(() => {
        if (!controllerLoading && mode === 'ACTIVE') {
            (async () => {
                const { active } = await checkActiveRestTimer();
                const savedParams = await getActiveWorkoutParams();
                if (savedParams?.activeSetId) setLastCompletedSetId(savedParams.activeSetId);
                if (active) setRestTimerVisible(true);
            })();
        }
    }, [controllerLoading, mode]);

    useEffect(() => {
        return navigation.addListener('focus', async () => {
            if (needsRefreshRef.current) {
                needsRefreshRef.current = false;
                reloadExercises();
            }
            const { active } = await checkActiveRestTimer();
            const savedParams = await getActiveWorkoutParams();
            if (savedParams?.activeSetId) setLastCompletedSetId(savedParams.activeSetId);
            if (active) setRestTimerVisible(true);
        });
    }, [navigation, reloadExercises]);

    const handleConfirmAddSets = async () => {
        if (!selectedExerciseId) return;
        setModalVisible(false);
        setSaving(true);
        await addSets(selectedExerciseId, setsToAdd);
        setSaving(false);
        setSelectedExerciseId(null);
    };

    const handleStartRestTimer = (setId: string) => {
        HapticService.setCompleted();
        setLastCompletedSetId(setId);
        saveActiveWorkoutParams({ activeSetId: setId });
        setRestTimerVisible(true);
    };

    const handleRestTimerStop = async (seconds: number) => {
        const savedParams = await getActiveWorkoutParams();
        const targetSetId = lastCompletedSetId || savedParams?.activeSetId;
        if (targetSetId && seconds > 0) {
            await updateSet(targetSetId, 'descanso_segundos', seconds);
            setSavedTimerSetIds((prev) => new Set(prev).add(targetSetId));
        }
        setLastCompletedSetId(null);
        await saveActiveWorkoutParams({ activeSetId: null });
    };

    const handleRestTimerDismiss = async () => {
        setRestTimerVisible(false);
        setLastCompletedSetId(null);
        await saveActiveWorkoutParams({ activeSetId: null });
    };

    const toggleExerciseCollapsed = (id: string) => {
        setCollapsedExercises((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    return {
        collapsedExercises,
        saving,
        setSaving,
        modalVisible,
        setModalVisible,
        setsToAdd,
        setSetsToAdd,
        selectedExerciseId,
        setSelectedExerciseId,
        restTimerVisible,
        setRestTimerVisible,
        lastCompletedSetId,
        setLastCompletedSetId,
        savedTimerSetIds,
        needsRefreshRef,
        handleConfirmAddSets,
        handleStartRestTimer,
        handleRestTimerStop,
        handleRestTimerDismiss,
        toggleExerciseCollapsed,
    };
};
