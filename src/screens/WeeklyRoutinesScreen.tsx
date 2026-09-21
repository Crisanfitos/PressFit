import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { RoutineService } from '../services/RoutineService';
import { formatLocalDateKey } from '../utils/dateUtils';
import {
    WeeklyDayPillsCarousel,
    TodayRoutineHeroCard,
    WeeklyRoutineDayCard,
    DayPillData,
} from '../components/calendar';

const DAY_NAMES_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export const WeeklyRoutinesScreen: React.FC<any> = ({ navigation }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { colors } = theme;
    const authContext = useContext(AuthContext);
    const userId = authContext?.user?.id;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedRoutine, setSelectedRoutine] = useState<any>(null);
    const [fullRoutine, setFullRoutine] = useState<any>(null);
    const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
    const [inProgressDays, setInProgressDays] = useState<Set<string>>(new Set());

    const today = useMemo(() => new Date(), []);
    const todayKey = useMemo(() => formatLocalDateKey(today), [today]);

    // Calculate current week Monday to Sunday
    const weekDates = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setDate(now.getDate() + diffToMonday);

        const dates: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            dates.push(d);
        }
        return dates;
    }, []);

    const loadData = useCallback(async () => {
        if (!userId) return;
        try {
            const { data: routines } = await RoutineService.getAllWeeklyRoutines(userId);
            if (routines && routines.length > 0) {
                const active = routines.find((r: any) => r.activa) || routines[0];
                setSelectedRoutine(active);

                if (RoutineService.getWeeklyRoutineWithDays && active?.id) {
                    const { data: detailed } = await RoutineService.getWeeklyRoutineWithDays(active.id);
                    if (detailed) {
                        setFullRoutine(detailed);
                    }
                }

                const startDate = formatLocalDateKey(weekDates[0]);
                const endDate = formatLocalDateKey(weekDates[6]);
                const { data: workouts } = await RoutineService.getWorkoutsForDateRange(
                    [active.id],
                    startDate,
                    endDate
                );

                if (workouts) {
                    const completed = new Set<string>();
                    const inProgress = new Set<string>();
                    workouts.forEach((w: any) => {
                        if (w.fecha_dia) {
                            if (w.completada) completed.add(w.fecha_dia);
                            else if (w.hora_inicio && !w.hora_fin) inProgress.add(w.fecha_dia);
                        }
                    });
                    setCompletedDays(completed);
                    setInProgressDays(inProgress);
                }
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userId, weekDates]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
    }, [loadData]);

    // Build DayPillData list for carousel
    const dayPills: DayPillData[] = useMemo(() => {
        const routineDays = fullRoutine?.rutinas_diarias || [];

        return weekDates.map((d, idx) => {
            const dayKey = formatLocalDateKey(d);
            const isToday = dayKey === todayKey;
            const isCompleted = completedDays.has(dayKey);
            const dayName = DAY_NAMES_ES[idx];

            const matchDay = routineDays.find(
                (rd: any) => rd.nombre_dia?.toLowerCase() === dayName.toLowerCase() || rd.orden_dia === (idx + 1)
            );

            let status: 'completed' | 'active' | 'scheduled' | 'rest' = 'scheduled';
            if (isCompleted) {
                status = 'completed';
            } else if (isToday) {
                status = 'active';
            } else if (matchDay?.es_descanso || (!matchDay && (idx === 3 || idx === 6))) {
                status = 'rest';
            }

            return {
                dayKey,
                dayLetter: DAY_LETTERS[idx],
                dayNumber: d.getDate(),
                isToday,
                status,
                date: d,
            };
        });
    }, [weekDates, todayKey, completedDays, fullRoutine]);

    // Find today's routine day
    const todayIndex = (today.getDay() + 6) % 7; // 0 for Monday, 6 for Sunday
    const todayDayName = DAY_NAMES_ES[todayIndex];
    const routineDaysList = fullRoutine?.rutinas_diarias || [];
    const todayRoutineDay = useMemo(() => {
        return routineDaysList.find(
            (rd: any) => rd.nombre_dia?.toLowerCase() === todayDayName.toLowerCase() || rd.orden_dia === (todayIndex + 1)
        );
    }, [routineDaysList, todayDayName, todayIndex]);

    // Compute metrics for today's hero card
    const heroMetrics = useMemo(() => {
        if (!todayRoutineDay) {
            return {
                title: 'Descanso Activo / Recuperación',
                description: 'Día de descanso programado. Realiza movilidad o estiramientos ligeros.',
                estimatedMinutes: 30,
                exerciseCount: 0,
                totalSets: 0,
                estimatedLoad: '0 kg',
                targetRpe: '5 / 10',
                muscles: ['Recuperación', 'Movilidad'],
                status: 'rest' as const,
            };
        }

        const scheduledExercises = todayRoutineDay.ejercicios_programados || [];
        const exerciseCount = scheduledExercises.length;
        let totalSets = 0;
        const muscleSet = new Set<string>();

        scheduledExercises.forEach((ex: any) => {
            totalSets += ex.series?.length || 3;
            if (ex.ejercicio?.grupo_muscular) muscleSet.add(ex.ejercicio.grupo_muscular);
            else if (ex.ejercicio?.categoria) muscleSet.add(ex.ejercicio.categoria);
        });

        const isCompleted = completedDays.has(todayKey);
        const isInProgress = inProgressDays.has(todayKey);
        const status = isCompleted ? 'completed' : isInProgress ? 'in_progress' : todayRoutineDay.es_descanso ? 'rest' : 'scheduled';

        return {
            title: todayRoutineDay.nombre_dia || 'Entrenamiento de Hoy',
            description: todayRoutineDay.descripcion || 'Enfoque de sobrecarga progresiva y estímulo hipertrófico.',
            estimatedMinutes: todayRoutineDay.duracion_estimada || 55,
            exerciseCount: exerciseCount || 5,
            totalSets: totalSets || 15,
            estimatedLoad: '4,850 kg',
            targetRpe: '8.5 / 10',
            muscles: Array.from(muscleSet).slice(0, 3),
            status: status as any,
        };
    }, [todayRoutineDay, completedDays, inProgressDays, todayKey]);

    const handleStartWorkout = () => {
        if (todayRoutineDay?.id) {
            navigation.navigate('Workout', {
                workoutId: '',
                dayName: todayRoutineDay.nombre_dia,
                routineDayId: todayRoutineDay.id,
            });
        } else {
            navigation.navigate('WorkoutDay', {
                date: todayKey,
                routineId: selectedRoutine?.id,
                isToday: true,
            });
        }
    };

    const handleDayPress = (dateKey: string) => {
        const isToday = dateKey === todayKey;
        navigation.navigate('WorkoutDay', {
            date: dateKey,
            routineId: selectedRoutine?.id,
            isToday,
        });
    };

    const completedCount = useMemo(() => {
        return dayPills.filter((p) => p.status === 'completed').length;
    }, [dayPills]);

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
            testID="weekly-routines-screen"
        >
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                        testID="weekly-routines-refresh-control"
                    />
                }
            >
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.headerTitleRow}>
                        <View style={styles.headerTextGroup}>
                            <View style={styles.cycleBadgeRow}>
                                <View
                                    style={[
                                        styles.cycleBadge,
                                        { backgroundColor: colors.surfaceContainerHigh || colors.surface },
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.pulseDot,
                                            { backgroundColor: colors.secondaryContainer || colors.primary },
                                        ]}
                                    />
                                    <Text
                                        style={[
                                            styles.cycleBadgeText,
                                            { color: colors.primary || colors.text },
                                        ]}
                                    >
                                        Semana Activa • {selectedRoutine?.nombre || 'Rutina Principal'}
                                    </Text>
                                </View>
                            </View>
                            <Text style={[styles.screenTitle, { color: colors.onSurface || colors.text }]}>
                                Mis Rutinas
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.newRoutineBtn,
                                {
                                    backgroundColor: colors.surfaceContainerLowest || colors.surface,
                                    borderColor: colors.outlineVariant || colors.border,
                                },
                            ]}
                            onPress={() => navigation.navigate('RoutineEditor')}
                            testID="btn-new-routine"
                        >
                            <MaterialIcons name="add" size={18} color={colors.primary} />
                            <Text style={[styles.newRoutineBtnText, { color: colors.primary }]}>
                                Nueva Rutina
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Weekly Carousel */}
                <WeeklyDayPillsCarousel
                    days={dayPills}
                    onSelectDay={(pill) => handleDayPress(pill.dayKey)}
                    colors={colors}
                />

                {/* Bento Hero Card 'Rutina de Hoy' */}
                <TodayRoutineHeroCard
                    dayName={`HOY • ${todayDayName}`}
                    routineTitle={heroMetrics.title}
                    description={heroMetrics.description}
                    estimatedMinutes={heroMetrics.estimatedMinutes}
                    exerciseCount={heroMetrics.exerciseCount}
                    totalSets={heroMetrics.totalSets}
                    estimatedLoad={heroMetrics.estimatedLoad}
                    targetRpe={heroMetrics.targetRpe}
                    targetMuscles={heroMetrics.muscles}
                    status={heroMetrics.status}
                    onStartPress={handleStartWorkout}
                    colors={colors}
                />

                {/* Weekly Routine List */}
                <View style={styles.listSection}>
                    <View style={styles.listHeaderRow}>
                        <Text style={[styles.listSectionTitle, { color: colors.onSurface || colors.text }]}>
                            Rutinas de la Semana
                        </Text>
                        <Text style={[styles.listCounter, { color: colors.onSurfaceVariant || colors.textSecondary }]}>
                            {completedCount} de 5 completadas
                        </Text>
                    </View>

                    {weekDates.map((date, idx) => {
                        const dayName = DAY_NAMES_ES[idx];
                        const dateKey = formatLocalDateKey(date);
                        const isCompleted = completedDays.has(dateKey);
                        const matchDay = routineDaysList.find(
                            (rd: any) => rd.nombre_dia?.toLowerCase() === dayName.toLowerCase() || rd.orden_dia === (idx + 1)
                        );

                        const isRest = matchDay?.es_descanso || (!matchDay && (idx === 3 || idx === 6));
                        const status: 'completed' | 'scheduled' | 'rest' = isCompleted
                            ? 'completed'
                            : isRest
                            ? 'rest'
                            : 'scheduled';

                        const title = matchDay?.nombre_dia || (isRest ? 'Descanso Activo / Movilidad' : `${dayName} - Fuerza`);
                        const dateDisplay = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;

                        return (
                            <WeeklyRoutineDayCard
                                key={dateKey}
                                dayName={dayName}
                                dateDisplay={dateDisplay}
                                routineTitle={title}
                                status={status}
                                exerciseCount={matchDay?.ejercicios_programados?.length || (isRest ? 0 : 5)}
                                durationMinutes={matchDay?.duracion_estimada || (isRest ? null : 60)}
                                totalVolumeKg={isCompleted ? 4850 : null}
                                description={matchDay?.descripcion}
                                onPress={() => handleDayPress(dateKey)}
                                colors={colors}
                                testID={`weekly-day-card-${dateKey}`}
                            />
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    header: {
        paddingTop: 10,
        paddingBottom: 6,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTextGroup: {
        flex: 1,
    },
    cycleBadgeRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    cycleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 9999,
        gap: 6,
    },
    pulseDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
    },
    cycleBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    screenTitle: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    newRoutineBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
    },
    newRoutineBtnText: {
        fontSize: 12,
        fontWeight: '700',
    },
    listSection: {
        marginTop: 16,
        gap: 8,
    },
    listHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    listSectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    listCounter: {
        fontSize: 13,
        fontWeight: '500',
    },
});

export default WeeklyRoutinesScreen;
