import { useState, useCallback, useEffect } from 'react';
import { RoutineService } from '../services/RoutineService';

interface Routine {
    id: string;
    nombre: string;
    activa: boolean;
    usuario_id: string;
    rutinas_diarias?: any[];
}

interface WorkoutStats {
    exerciseCount: number;
    duration: number | null;
    isCompleted: boolean;
    startTime?: string | null;
    endTime?: string | null;
}

interface DayStatus {
    status: 'COMPLETED' | 'MISSED' | 'ACTIVE' | 'PENDING';
    label: string;
    icon: string;
    isDisabled: boolean;
    action: string;
}

export const useRoutineController = (userId: string | undefined, routineId: string | null = null) => {
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [workoutStats, setWorkoutStats] = useState<Record<string, WorkoutStats>>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRoutines = useCallback(async (isRefresh = false) => {
        if (!userId) return;

        try {
            if (!isRefresh) setLoading(true);

            let data: Routine[] = [];
            if (routineId) {
                const result = await RoutineService.getWeeklyRoutineWithDays(routineId);
                data = result.data ? [result.data] : [];
            } else {
                const result = await RoutineService.getUserRoutines(userId);
                data = result.data || [];
            }

            setRoutines(data);

            // Load stats for each routine day
            if (data && data.length > 0) {
                const statsPromises: Promise<any>[] = [];
                const routineDayIds: string[] = [];

                data.forEach((routine) => {
                    routine.rutinas_diarias?.forEach((rd) => {
                        routineDayIds.push(rd.id);
                        statsPromises.push(RoutineService.getWorkoutStatsForRoutineDay(userId, rd.id));
                    });
                });

                const statsResults = await Promise.all(statsPromises);
                const statsMap: Record<string, WorkoutStats> = {};
                routineDayIds.forEach((id, index) => {
                    statsMap[id] = statsResults[index].data;
                });
                setWorkoutStats(statsMap);
            }
        } catch (error) {
            console.error('Error fetching routines:', error);
        } finally {
            if (!isRefresh) setLoading(false);
        }
    }, [userId, routineId]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchRoutines(true);
        setRefreshing(false);
    };

    const handleDayPress = async (
        dayOfWeek: number,
        existingRoutineDay: any | null,
        navigation: any
    ) => {
        try {
            let routineDay = existingRoutineDay;

            if (!routineDay) {
                const { data, error } = await RoutineService.getOrCreateRoutineDay(userId!, dayOfWeek);
                if (error) throw error;
                routineDay = data;
                fetchRoutines(true);
            }

            const { data: activeWorkout } = await RoutineService.getActiveWorkout(userId!, routineDay.id);

            navigation.navigate('Workout', {
                routineDayId: routineDay.id,
                routineDayName: routineDay.nombre_dia,
                workoutId: activeWorkout?.id,
                isPending: !!activeWorkout,
                dayOfWeek,
            });
        } catch (error) {
            console.error('Error handling day press:', error);
        }
    };

    const startWeeklyPlan = async (weeklyRoutineId: string, routineDayId: string, dayOfWeek: number) => {
        try {
            const result = await RoutineService.getWeeklyRoutineWithDays(weeklyRoutineId);
            const routine = result.data;
            if (!routine) throw new Error('Routine not found');

            const now = new Date();
            const nowISO = now.toISOString();

            // Calculate Monday of current week
            const todayDay = now.getDay();
            const todayDiffFromMon = todayDay === 0 ? 6 : todayDay - 1;
            const mondayDate = new Date(now);
            mondayDate.setDate(now.getDate() - todayDiffFromMon);
            mondayDate.setHours(0, 0, 0, 0);

            await RoutineService.startWeeklySession(weeklyRoutineId, mondayDate.toISOString());

            if (routineDayId) {
                const dayDate = nowISO.split('T')[0];
                await RoutineService.startDailyWorkout(routineDayId, dayDate, nowISO);
            }

            await fetchRoutines(true);
            return true;
        } catch (error) {
            console.error('Error starting weekly plan:', error);
            return false;
        }
    };

    const getDayStatus = (stats: WorkoutStats | undefined, isToday: boolean, isPast: boolean): DayStatus => {
        const hasStarted = stats?.startTime != null;
        const hasEnded = stats?.endTime != null;
        const isCompleted = stats?.isCompleted === true && hasEnded;

        if (isCompleted) {
            return { status: 'COMPLETED', label: 'Completado', icon: 'check-circle', isDisabled: true, action: 'none' };
        }

        if (isPast && !hasStarted && !hasEnded) {
            return { status: 'MISSED', label: 'No Realizado', icon: 'close', isDisabled: true, action: 'none' };
        }

        if (hasStarted && !hasEnded && !stats?.isCompleted) {
            return { status: 'ACTIVE', label: 'Continuar', icon: 'play-circle-filled', isDisabled: false, action: 'continue' };
        }

        return { status: 'PENDING', label: 'Empezar', icon: 'play-arrow', isDisabled: false, action: 'start' };
    };

    useEffect(() => {
        if (userId) fetchRoutines();
    }, [userId, fetchRoutines]);

    return {
        routines,
        workoutStats,
        loading,
        refreshing,
        fetchRoutines,
        onRefresh,
        handleDayPress,
        startWeeklyPlan,
        getDayStatus,
    };
};
