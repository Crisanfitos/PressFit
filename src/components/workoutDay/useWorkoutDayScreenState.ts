import { useState, useEffect, useContext, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import { RoutineService } from '../../services/RoutineService';
import { WorkoutService } from '../../services/WorkoutService';
import { formatLocalDateKey, parseDateKeyAsLocalDate } from '../../utils/dateUtils';
import { WorkoutDayExercise, WorkoutStats } from './types';

export const useWorkoutDayScreenState = (navigation: any, route: any) => {
    const { t, i18n } = useTranslation();
    const authContext = useContext(AuthContext);
    const userId = authContext?.user?.id;

    const { date, routineId, isToday } = route?.params || {};
    const selectedDate = date ? parseDateKeyAsLocalDate(date) : new Date();

    const [loading, setLoading] = useState(true);
    const [dayData, setDayData] = useState<any>(null);
    const [exercises, setExercises] = useState<WorkoutDayExercise[]>([]);
    const [workoutStats, setWorkoutStats] = useState<WorkoutStats | null>(null);
    const [activeWorkout, setActiveWorkout] = useState<any>(null);
    const [showManualFinishModal, setShowManualFinishModal] = useState<boolean>(false);

    const isPendingPreviousWorkout = Boolean(
        !isToday &&
        dayData?.hora_inicio &&
        !dayData?.completada &&
        !dayData?.hora_fin
    );

    const formatDate = (d: Date) => {
        const isEn = i18n.language?.startsWith('en');
        const daysEs = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const monthsEs = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const days = isEn ? daysEn : daysEs;
        const months = isEn ? monthsEn : monthsEs;
        return isEn
            ? `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`
            : `${days[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    const formatDuration = (minutes: number | null) => {
        if (minutes === null) return '-';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const formattedHours = hours.toString().padStart(2, '0');
        const formattedMins = mins.toString().padStart(2, '0');
        return `${formattedHours}:${formattedMins}`;
    };

    const loadDayData = async () => {
        if (!userId || !routineId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            const selectedDateStr = formatLocalDateKey(selectedDate);

            let { data: targetDay } = await RoutineService.getRoutineDayByDate(
                routineId,
                selectedDateStr
            );

            if (!targetDay) {
                const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                const targetDayName = dayNames[selectedDate.getDay()];

                const { data: templateDay } = await RoutineService.getRoutineDayByName(
                    routineId,
                    targetDayName
                );

                if (templateDay) {
                    targetDay = templateDay;
                }
            }

            if (targetDay) {
                setDayData(targetDay);
                setExercises((targetDay.ejercicios_programados as any) || []);

                const exerciseCount = new Set(
                    targetDay.ejercicios_programados?.map((ex: any) => ex.ejercicio_id) || []
                ).size;

                let duration: number | null = null;
                if (targetDay.hora_inicio && targetDay.hora_fin) {
                    const start = new Date(targetDay.hora_inicio);
                    const end = new Date(targetDay.hora_fin);
                    const durationMs = end.getTime() - start.getTime();
                    const durationMinutes = Math.round(durationMs / 1000 / 60);
                    if (durationMinutes >= 1) {
                        duration = durationMinutes;
                    } else if (durationMinutes >= 0) {
                        duration = 1;
                    }
                }

                setWorkoutStats({
                    exerciseCount,
                    duration,
                    isCompleted: !!(targetDay.completada || targetDay.hora_fin),
                    startTime: targetDay.hora_inicio || null,
                    endTime: targetDay.hora_fin || null,
                });

                if (targetDay.hora_inicio && !targetDay.completada && !targetDay.hora_fin) {
                    setActiveWorkout(targetDay);
                } else {
                    setActiveWorkout(null);
                }
            } else {
                setDayData(null);
                setExercises([]);
                setWorkoutStats(null);
                setActiveWorkout(null);
            }
        } catch (error) {
            console.error('Error loading day data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDayData();
    }, [date, routineId]);

    useFocusEffect(
        useCallback(() => {
            loadDayData();
        }, [date, routineId, userId])
    );

    const handleStartWorkout = async () => {
        if (!dayData) return;
        setLoading(true);
        try {
            const now = new Date();
            const { data: newWorkout, error } = await RoutineService.startDailyWorkout(
                dayData.id,
                formatLocalDateKey(now),
                now.toISOString()
            );

            if (error) {
                Alert.alert('Error', 'No se pudo crear el entrenamiento');
                return;
            }

            if (newWorkout) {
                navigation.navigate('Workout', {
                    workoutId: newWorkout.id,
                    dayName: dayData.nombre_dia,
                    routineDayId: dayData.id,
                    dayOfWeek: selectedDate.getDay(),
                });
            } else {
                Alert.alert('Error', 'No se recibió datos del entrenamiento creado');
            }
        } catch {
            Alert.alert('Error', 'Error inesperado al crear entrenamiento');
        } finally {
            setLoading(false);
        }
    };

    const handleContinueWorkout = () => {
        if (!activeWorkout || !dayData) return;
        navigation.navigate('Workout', {
            workoutId: activeWorkout.id,
            dayName: dayData.nombre_dia,
            routineDayId: dayData.id,
            dayOfWeek: selectedDate.getDay(),
        });
    };

    const handleMainButtonPress = () => {
        if (isPendingPreviousWorkout) {
            setShowManualFinishModal(true);
            return;
        }
        if (workoutStats?.isCompleted && dayData) {
            navigation.navigate('Workout', {
                workoutId: dayData.id,
                dayName: dayData.nombre_dia,
                routineDayId: dayData.id,
                dayOfWeek: selectedDate.getDay(),
            });
        } else if (activeWorkout && dayData) {
            handleContinueWorkout();
        } else {
            handleStartWorkout();
        }
    };

    const handleManualFinishWorkout = async (endTime: Date): Promise<{ success: boolean; error?: string }> => {
        if (!dayData || !dayData.hora_inicio) {
            return { success: false, error: 'No hay datos de inicio de la rutina.' };
        }

        const start = new Date(dayData.hora_inicio);
        const diffMs = endTime.getTime() - start.getTime();

        if (diffMs < 60 * 1000) {
            return {
                success: false,
                error: t(
                    'workout.invalidEndTimeMinDuration',
                    'La hora final debe ser como mínimo un minuto posterior a la hora inicial.'
                ),
            };
        }

        const durationMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
        const endTimeIso = endTime.toISOString();

        try {
            const res = await WorkoutService.completeWorkout(dayData.id, durationMinutes, endTimeIso);
            if (res.error) {
                return { success: false, error: 'Error al completar el entrenamiento en el servicio.' };
            }

            setDayData((prev: any) => ({
                ...prev,
                completada: true,
                hora_fin: endTimeIso,
            }));

            setWorkoutStats((prev) => ({
                exerciseCount: prev?.exerciseCount || 0,
                duration: durationMinutes,
                isCompleted: true,
                startTime: dayData.hora_inicio,
                endTime: endTimeIso,
            }));

            setActiveWorkout(null);
            setShowManualFinishModal(false);

            return { success: true };
        } catch (err: any) {
            console.error('Error completing manual pending workout:', err);
            return { success: false, error: err?.message || 'Error inesperado al finalizar la rutina.' };
        }
    };

    return {
        t,
        routineId,
        selectedDate,
        isToday,
        isPendingPreviousWorkout,
        showManualFinishModal,
        setShowManualFinishModal,
        loading,
        dayData,
        exercises,
        workoutStats,
        activeWorkout,
        formatDate,
        formatDuration,
        handleMainButtonPress,
        handleManualFinishWorkout,
    };
};
