import { useState, useEffect, useCallback } from 'react';
import { WorkoutRecoveryService, RecoverySession } from '../services/WorkoutRecoveryService';

export function useWorkoutRecovery(navigation?: any) {
    const [pendingSession, setPendingSession] = useState<RecoverySession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkForPendingSession = useCallback(async () => {
        try {
            setIsLoading(true);
            const session = await WorkoutRecoveryService.checkPendingWorkoutSession();
            setPendingSession(session);
        } catch (error) {
            console.error('Failed to check recovery session:', error);
            setPendingSession(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkForPendingSession();
    }, [checkForPendingSession]);

    const handleResume = useCallback(() => {
        if (!pendingSession) return;
        const session = pendingSession;
        setPendingSession(null);

        if (navigation) {
            navigation.navigate('Semana', {
                screen: 'Workout',
                params: {
                    workoutId: session.workoutId,
                    routineDayId: session.routineDayId,
                    dayName: session.dayName,
                    dayOfWeek: session.dayOfWeek,
                    mode: 'ACTIVE',
                },
            });
        }
    }, [navigation, pendingSession]);

    const handleDiscard = useCallback(async () => {
        setPendingSession(null);
        await WorkoutRecoveryService.discardRecoverySession();
    }, []);

    return {
        pendingSession,
        isLoading,
        checkForPendingSession,
        handleResume,
        handleDiscard,
    };
}

export default useWorkoutRecovery;
