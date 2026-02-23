import { useState, useCallback } from 'react';
import { ProgressService } from '../services/ProgressService';

interface DailyStats {
    exercises: number;
    sets: number;
    totalWeight: number;
    duration: number;
    workoutDetails: any;
}

interface WeeklyData {
    weekNumber: number;
    weekLabel: string;
    durationMinutes: number;
    startDate: string | null;
    endDate: string | null;
    workoutCount: number;
}

interface ProcessedMonthlyData {
    totalDurationMinutes: number;
    totalHours: number;
    totalMinutes: number;
    totalWorkouts: number;
    weeklyData: WeeklyData[];
}

export const useProgressController = (userId: string | undefined) => {
    const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
    const [weeklyStats, setWeeklyStats] = useState<any[] | null>(null);
    const [monthlyStats, setMonthlyStats] = useState<any[] | null>(null);
    const [processedMonthlyData, setProcessedMonthlyData] = useState<ProcessedMonthlyData | null>(null);
    const [progressPhotos, setProgressPhotos] = useState<any[]>([]);
    const [exerciseHistory, setExerciseHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDailyProgress = useCallback(async (date: Date = new Date()) => {
        if (!userId) return;
        setLoading(true);
        try {
            const { data } = await ProgressService.getDailyProgress(userId, date);
            if (data && data.length > 0) {
                const workout = data[0];
                const sets = workout.ejercicios_programados?.flatMap((ep: any) => ep.series || []) || [];
                const exercises = new Set(workout.ejercicios_programados?.map((ep: any) => ep.ejercicio_id)).size;
                const totalWeight = sets.reduce((sum: number, set: any) => sum + ((set.peso_utilizado || 0) * (set.repeticiones || 0)), 0);

                let duration = 0;
                if (workout.hora_inicio && workout.hora_fin) {
                    duration = (new Date(workout.hora_fin).getTime() - new Date(workout.hora_inicio).getTime()) / 1000 / 60;
                }

                setDailyStats({ exercises, sets: sets.length, totalWeight: Math.round(totalWeight), duration: Math.round(duration), workoutDetails: workout });
            } else {
                setDailyStats(null);
            }
        } catch (error) {
            console.error('Error fetching daily progress:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const fetchWeeklyProgress = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const { data } = await ProgressService.getWeeklyProgress(userId);
            setWeeklyStats(data || []);
        } catch (error) {
            console.error('Error fetching weekly progress:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const fetchMonthlyProgress = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const { data } = await ProgressService.getMonthlyProgress(userId);
            setMonthlyStats(data || []);
        } catch (error) {
            console.error('Error fetching monthly progress:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const fetchMonthlyProgressByDate = useCallback(async (year: number, month: number) => {
        if (!userId) return;
        setLoading(true);
        try {
            const { data } = await ProgressService.getMonthlyProgress(userId, year, month);

            if (!data || data.length === 0) {
                setProcessedMonthlyData({
                    totalDurationMinutes: 0,
                    totalHours: 0,
                    totalMinutes: 0,
                    totalWorkouts: 0,
                    weeklyData: [
                        { weekNumber: 1, weekLabel: 'Semana 1', durationMinutes: 0, startDate: null, endDate: null, workoutCount: 0 },
                        { weekNumber: 2, weekLabel: 'Semana 2', durationMinutes: 0, startDate: null, endDate: null, workoutCount: 0 },
                        { weekNumber: 3, weekLabel: 'Semana 3', durationMinutes: 0, startDate: null, endDate: null, workoutCount: 0 },
                        { weekNumber: 4, weekLabel: 'Semana 4', durationMinutes: 0, startDate: null, endDate: null, workoutCount: 0 },
                    ],
                });
                return;
            }

            let totalDurationMinutes = 0;
            data.forEach((workout: any) => {
                if (workout.hora_inicio && workout.hora_fin) {
                    const start = new Date(workout.hora_inicio);
                    const end = new Date(workout.hora_fin);
                    const duration = (end.getTime() - start.getTime()) / 1000 / 60;
                    totalDurationMinutes += Math.round(duration);
                }
            });

            const totalHours = Math.floor(totalDurationMinutes / 60);
            const totalMinutes = totalDurationMinutes % 60;

            const weeklyData: WeeklyData[] = [];
            for (let i = 0; i < 4; i++) {
                const weekStart = new Date(year, month, 1 + i * 7);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                weekEnd.setHours(23, 59, 59, 999);

                const weekWorkouts = data.filter((w: any) => {
                    const date = new Date(w.hora_fin);
                    return date >= weekStart && date <= weekEnd;
                });

                const weekDuration = weekWorkouts.reduce((acc: number, w: any) => {
                    if (w.hora_inicio && w.hora_fin) {
                        const start = new Date(w.hora_inicio);
                        const end = new Date(w.hora_fin);
                        const duration = (end.getTime() - start.getTime()) / 1000 / 60;
                        return acc + Math.round(duration);
                    }
                    return acc;
                }, 0);

                weeklyData.push({
                    weekNumber: i + 1,
                    weekLabel: `Semana ${i + 1}`,
                    durationMinutes: weekDuration,
                    startDate: weekStart.toISOString(),
                    endDate: weekEnd.toISOString(),
                    workoutCount: weekWorkouts.length,
                });
            }

            setProcessedMonthlyData({ totalDurationMinutes, totalHours, totalMinutes, totalWorkouts: data.length, weeklyData });
        } catch (error) {
            console.error('Error fetching monthly progress by date:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const fetchPhotos = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const { data } = await ProgressService.getProgressPhotos(userId);
            setProgressPhotos(data || []);
        } catch (error) {
            console.error('Error fetching photos:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const fetchExerciseHistory = useCallback(async (exerciseId: string) => {
        if (!userId || !exerciseId) return;
        setLoading(true);
        try {
            const { data } = await ProgressService.getExerciseHistory(userId, exerciseId);
            setExerciseHistory(data || []);
        } catch (error) {
            console.error('Error fetching exercise history:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const uploadPhoto = async (uri: string, date: Date, comment: string) => {
        if (!userId) return false;
        try {
            const { data } = await ProgressService.uploadProgressPhoto(userId, uri, date, comment);
            if (data) {
                setProgressPhotos((prev) => [data, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error uploading photo:', error);
            return false;
        }
    };

    const deletePhotos = async (photoIds: string[]) => {
        if (!userId || !photoIds || photoIds.length === 0) return false;
        try {
            const { success } = await ProgressService.deleteProgressPhotos(photoIds);
            if (success) {
                setProgressPhotos((prev) => prev.filter((photo) => !photoIds.includes(photo.id)));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting photos:', error);
            return false;
        }
    };

    const updatePhoto = async (photoId: string, updates: { comentario?: string; created_at?: string }) => {
        try {
            const { data } = await ProgressService.updateProgressPhoto(photoId, updates);
            if (data) {
                setProgressPhotos((prev) =>
                    prev.map((photo) => (photo.id === photoId ? { ...photo, ...data } : photo))
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                );
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating photo:', error);
            return false;
        }
    };

    return {
        loading,
        dailyStats,
        weeklyStats,
        monthlyStats,
        processedMonthlyData,
        progressPhotos,
        exerciseHistory,
        fetchDailyProgress,
        fetchWeeklyProgress,
        fetchMonthlyProgress,
        fetchMonthlyProgressByDate,
        fetchPhotos,
        fetchExerciseHistory,
        uploadPhoto,
        deletePhotos,
        updatePhoto,
    };
};
