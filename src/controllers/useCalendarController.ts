import { useState, useEffect, useCallback, useRef } from 'react';
import { RoutineService } from '../services/RoutineService';

interface CalendarDay {
    type: 'week-header' | 'day';
    weekKey?: string;
    weekOffset?: number;
    label?: string;
    isCurrentWeek?: boolean;
    date?: Date;
    dateKey?: string;
    dayOfWeek?: number;
    dayName?: string;
    dateDisplay?: string;
    isToday?: boolean;
    isPast?: boolean;
}

interface WorkoutStats {
    workoutId: string;
    exerciseCount: number;
    duration: number | null;
    isCompleted: boolean;
    startTime: string | null;
    endTime: string | null;
}

interface DayStatus {
    status: 'COMPLETED' | 'MISSED' | 'ACTIVE' | 'PENDING';
    label: string;
    icon: string;
    color: string;
}

export const useCalendarController = (userId: string | undefined, routineId: string | null = null) => {
    const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
    const [workoutStats, setWorkoutStats] = useState<Record<string, WorkoutStats>>({});
    const [routineTemplates, setRoutineTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [weekRange, setWeekRange] = useState({ min: -1, max: 3 });
    const todayIndexRef = useRef(0);

    // Helper: Get Monday of a week offset from current week
    const getMondayOfWeek = (weekOffset: number): Date => {
        const now = new Date();
        const currentDay = now.getDay();
        const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
        const monday = new Date(now);
        monday.setDate(now.getDate() + diffToMonday + weekOffset * 7);
        monday.setHours(0, 0, 0, 0);
        return monday;
    };

    const getSundayOfWeek = (monday: Date): Date => {
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return sunday;
    };

    const formatDateKey = (date: Date): string => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatDateDisplay = (date: Date): string => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${month}`;
    };

    const formatWeekHeader = (monday: Date): string => {
        const sunday = getSundayOfWeek(monday);
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const startDay = monday.getDate();
        const endDay = sunday.getDate();
        const startMonth = months[monday.getMonth()];
        const endMonth = months[sunday.getMonth()];
        if (startMonth === endMonth) {
            return `${startDay} - ${endDay} ${endMonth}`;
        }
        return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
    };

    const generateDaysForWeekRange = useCallback((minWeek: number, maxWeek: number): CalendarDay[] => {
        const days: CalendarDay[] = [];
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayKey = formatDateKey(today);
        let foundTodayIndex = -1;

        for (let weekOffset = minWeek; weekOffset <= maxWeek; weekOffset++) {
            const monday = getMondayOfWeek(weekOffset);
            const weekKey = `${monday.getFullYear()}-W${Math.ceil((monday.getTime() - new Date(monday.getFullYear(), 0, 1).getTime()) / 604800000)}`;

            days.push({
                type: 'week-header',
                weekKey,
                weekOffset,
                label: formatWeekHeader(monday),
                isCurrentWeek: weekOffset === 0,
            });

            for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
                const date = new Date(monday);
                date.setDate(monday.getDate() + dayOffset);
                const dateKey = formatDateKey(date);
                const dayOfWeek = date.getDay();
                const isToday = dateKey === todayKey;

                if (isToday) foundTodayIndex = days.length;

                days.push({
                    type: 'day',
                    date,
                    dateKey,
                    dayOfWeek,
                    dayName: dayNames[dayOfWeek],
                    dateDisplay: formatDateDisplay(date),
                    weekKey,
                    isToday,
                    isPast: date < today,
                });
            }
        }

        todayIndexRef.current = foundTodayIndex;
        return days;
    }, []);

    const fetchRoutineTemplates = useCallback(async (): Promise<any[]> => {
        if (!userId) return [];
        try {
            let data: any[] = [];
            if (routineId) {
                const result = await RoutineService.getWeeklyRoutineWithDays(routineId);
                data = result.data ? [result.data] : [];
            } else {
                const result = await RoutineService.getUserRoutines(userId);
                data = result.data || [];
            }
            return data;
        } catch (error) {
            console.error('Error fetching routine templates:', error);
            return [];
        }
    }, [userId, routineId]);

    const fetchStatsForRange = useCallback(async (templates: any[], minWeek: number, maxWeek: number): Promise<Record<string, WorkoutStats>> => {
        if (!templates || templates.length === 0) return {};

        const startDate = getMondayOfWeek(minWeek).toISOString();
        const endDate = getSundayOfWeek(getMondayOfWeek(maxWeek)).toISOString();
        const routineIds = templates.map((t) => t.id);

        const { data: workouts } = await RoutineService.getWorkoutsForDateRange(routineIds, startDate, endDate);

        const allStats: Record<string, WorkoutStats> = {};

        if (workouts) {
            workouts.forEach((workout: any) => {
                const dateKey = workout.fecha_dia;
                const existingStats = allStats[dateKey];

                if (existingStats?.isCompleted && !workout.completada) return;

                const exerciseCount = workout.ejercicios_programados?.length || 0;
                let duration: number | null = null;

                if (workout.completada && workout.hora_inicio && workout.hora_fin) {
                    const start = new Date(workout.hora_inicio);
                    const end = new Date(workout.hora_fin);
                    const durationMs = end.getTime() - start.getTime();
                    const durationMinutes = Math.round(durationMs / 1000 / 60);
                    if (durationMinutes >= 5) duration = durationMinutes;
                }

                allStats[dateKey] = {
                    workoutId: workout.id,
                    exerciseCount,
                    duration,
                    isCompleted: !!workout.completada,
                    startTime: workout.hora_inicio,
                    endTime: workout.hora_fin,
                };
            });
        }

        return allStats;
    }, []);

    const initialize = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const templates = await fetchRoutineTemplates();
            setRoutineTemplates(templates);

            const days = generateDaysForWeekRange(weekRange.min, weekRange.max);
            setCalendarDays(days);

            const stats = await fetchStatsForRange(templates, weekRange.min, weekRange.max);
            setWorkoutStats(stats);
        } catch (error) {
            console.error('Error initializing calendar:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [weekRange, fetchRoutineTemplates, generateDaysForWeekRange, fetchStatsForRange]);

    const onRefresh = async () => {
        setRefreshing(true);
        await initialize();
        setRefreshing(false);
    };

    const loadPreviousWeeks = async (count = 2) => {
        setLoadingMore(true);
        try {
            const newMin = weekRange.min - count;
            const newDays = generateDaysForWeekRange(newMin, weekRange.max);
            const stats = await fetchStatsForRange(routineTemplates, newMin, weekRange.min - 1);

            setWeekRange((prev) => ({ ...prev, min: newMin }));
            setCalendarDays(newDays);
            setWorkoutStats((prev) => ({ ...prev, ...stats }));
        } finally {
            setLoadingMore(false);
        }
    };

    const loadNextWeeks = async (count = 2) => {
        setLoadingMore(true);
        try {
            const newMax = weekRange.max + count;
            const newDays = generateDaysForWeekRange(weekRange.min, newMax);
            const stats = await fetchStatsForRange(routineTemplates, weekRange.max + 1, newMax);

            setWeekRange((prev) => ({ ...prev, max: newMax }));
            setCalendarDays(newDays);
            setWorkoutStats((prev) => ({ ...prev, ...stats }));
        } finally {
            setLoadingMore(false);
        }
    };

    const getRoutineDayForName = (dayName: string) => {
        for (const routine of routineTemplates) {
            if (!routine.rutinas_diarias) continue;
            const rd = routine.rutinas_diarias.find((r: any) => r.nombre_dia === dayName);
            if (rd) return { routine, routineDay: rd };
        }
        return null;
    };

    const getDayStatus = (stats: WorkoutStats | undefined, isToday: boolean, isPast: boolean): DayStatus => {
        if (!stats) {
            if (isPast) {
                return { status: 'MISSED', label: 'No Realizado', icon: 'close', color: 'error' };
            }
            return { status: 'PENDING', label: 'Empezar', icon: 'play-arrow', color: 'primary' };
        }

        const hasStarted = stats.startTime != null;
        const hasEnded = stats.endTime != null;
        const isCompleted = stats.isCompleted === true;

        if (isCompleted) {
            return { status: 'COMPLETED', label: 'Completado', icon: 'check-circle', color: 'success' };
        }

        if (hasStarted && !hasEnded) {
            return { status: 'ACTIVE', label: 'Continuar', icon: 'play-circle-filled', color: 'warning' };
        }

        if (isPast) {
            return { status: 'MISSED', label: 'No Realizado', icon: 'close', color: 'error' };
        }

        return { status: 'PENDING', label: 'Empezar', icon: 'play-arrow', color: 'primary' };
    };

    useEffect(() => {
        if (userId) initialize();
    }, [userId, initialize]);

    return {
        calendarDays,
        workoutStats,
        routineTemplates,
        loading,
        refreshing,
        loadingMore,
        todayIndex: todayIndexRef.current,
        onRefresh,
        refreshData: (silent?: boolean) => initialize(silent),
        loadPreviousWeeks,
        loadNextWeeks,
        getRoutineDayForName,
        getDayStatus,
    };
};
