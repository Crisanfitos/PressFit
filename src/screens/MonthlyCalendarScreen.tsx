import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Animated,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { RoutineService } from '../services/RoutineService';
import { formatLocalDateKey } from '../utils/dateUtils';
import { SideDrawer, MenuItem } from '../components/SideDrawer';
import {
    WeeklyRoutine,
    getCalendarDays,
    getMonthNames,
    getWeekDays,
    isInCurrentWeek,
    MonthNavigator,
    CalendarGrid,
    CalendarLegend,
    RoutineSelectorDropdown,
    CalendarFab,
    WeeklyDayPillsCarousel,
    TodayRoutineHeroCard,
    WeeklyRoutineDayCard,
    DayPillData,
} from '../components/calendar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_SIZE = (SCREEN_WIDTH - 48) / 7;

const DAY_NAMES_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

type MonthlyCalendarScreenProps = {
    navigation: any;
};

const MonthlyCalendarScreen: React.FC<MonthlyCalendarScreenProps> = ({ navigation }) => {
    const { t, i18n } = useTranslation();
    const { theme } = useTheme();
    const { colors } = theme;
    const authContext = useContext(AuthContext);
    const userId = authContext?.user?.id;

    // View mode: 'weekly' or 'monthly'
    const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');

    // State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedRoutine, setSelectedRoutine] = useState<WeeklyRoutine | null>(null);
    const [fullRoutine, setFullRoutine] = useState<any>(null);
    const [routines, setRoutines] = useState<WeeklyRoutine[]>([]);
    const [showRoutineSelector, setShowRoutineSelector] = useState(false);
    const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
    const [inProgressDays, setInProgressDays] = useState<Set<string>>(new Set());
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const dropdownHeight = useState(new Animated.Value(0))[0];

    const drawerMenuItems: MenuItem[] = useMemo(() => [
        {
            icon: 'stars',
            label: t('drawer.presetRoutines', 'Plantillas Prémium'),
            onPress: () => navigation.navigate('PresetRoutines'),
            testID: 'drawer-item-preset-routines',
        },
        {
            icon: 'library-books',
            label: t('drawer.exerciseCatalog', 'Catálogo de Ejercicios'),
            onPress: () => navigation.navigate('ExerciseCatalog'),
            testID: 'drawer-item-exercise-catalog',
        },
    ], [navigation, t]);

    // Current month info
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = useMemo(() => new Date(), []);
    const todayKey = useMemo(() => formatLocalDateKey(today), [today]);
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    const currentLang = i18n.language?.startsWith('en') ? 'en' : 'es';
    const monthNames = useMemo(() => getMonthNames(currentLang), [currentLang]);
    const weekDays = useMemo(() => getWeekDays(currentLang), [currentLang]);
    const calendarDays = useMemo(() => getCalendarDays(year, month), [year, month]);

    // Current week Monday to Sunday
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

    const loadRoutines = useCallback(async () => {
        if (!userId) return;
        const { data } = await RoutineService.getAllWeeklyRoutines(userId);
        if (data) {
            setRoutines(data);
            const active = data.find((r: WeeklyRoutine) => r.activa);
            const chosen = active || data[0] || null;
            setSelectedRoutine(chosen);

            if (chosen && RoutineService.getWeeklyRoutineWithDays) {
                const { data: detailed } = await RoutineService.getWeeklyRoutineWithDays(chosen.id);
                if (detailed) {
                    setFullRoutine(detailed);
                }
            }
        }
    }, [userId]);

    const loadWorkoutStats = useCallback(async () => {
        if (!selectedRoutine?.id) return;

        const startDate = formatLocalDateKey(new Date(year, month, 1));
        const endDate = formatLocalDateKey(new Date(year, month + 1, 0));

        const { data: workouts } = await RoutineService.getWorkoutsForDateRange(
            [selectedRoutine.id],
            startDate,
            endDate
        );

        if (workouts) {
            const completed = new Set<string>();
            const inProgress = new Set<string>();

            workouts.forEach((workout: any) => {
                if (workout.fecha_dia) {
                    if (workout.completada) {
                        completed.add(workout.fecha_dia);
                    } else if (workout.hora_inicio && !workout.hora_fin) {
                        inProgress.add(workout.fecha_dia);
                    }
                }
            });

            setCompletedDays(completed);
            setInProgressDays(inProgress);
        }
    }, [selectedRoutine?.id, year, month]);

    // Initial load
    useEffect(() => {
        if (userId) {
            loadRoutines();
        }
    }, [userId, loadRoutines]);

    // Reload workout stats when routine or month changes
    useEffect(() => {
        if (selectedRoutine?.id) {
            loadWorkoutStats();
        }
    }, [selectedRoutine?.id, loadWorkoutStats]);

    // Focus reload
    useFocusEffect(
        useCallback(() => {
            if (userId) {
                loadRoutines();
            }
            if (selectedRoutine?.id) {
                loadWorkoutStats();
            }
        }, [userId, selectedRoutine?.id, loadRoutines, loadWorkoutStats])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        if (userId) {
            await loadRoutines();
        }
        if (selectedRoutine?.id) {
            await loadWorkoutStats();
        }
        setRefreshing(false);
    }, [userId, selectedRoutine?.id, loadRoutines, loadWorkoutStats]);

    const toggleRoutineSelector = () => {
        const toValue = showRoutineSelector ? 0 : Math.min(routines.length * 56, 224);
        Animated.timing(dropdownHeight, {
            toValue,
            duration: 200,
            useNativeDriver: false,
        }).start();
        setShowRoutineSelector(!showRoutineSelector);
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (direction === 'prev') {
                newDate.setMonth(newDate.getMonth() - 1);
            } else {
                newDate.setMonth(newDate.getMonth() + 1);
            }
            return newDate;
        });
    };

    const handleActivateRoutine = async (routineId: string) => {
        if (!userId) return;
        await RoutineService.setActiveRoutine(userId, routineId);
        await loadRoutines();
    };

    const handleDayPress = (date: Date | null) => {
        if (!date) return;

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate > now) {
            return;
        }

        navigation.navigate('WorkoutDay', {
            date: formatLocalDateKey(date),
            routineId: selectedRoutine?.id,
            isToday: selectedDate.getTime() === now.getTime(),
        });
    };

    // Day Pills for Weekly Carousel
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
    const todayIndex = (today.getDay() + 6) % 7;
    const todayDayName = DAY_NAMES_ES[todayIndex];
    const routineDaysList = fullRoutine?.rutinas_diarias || [];
    const todayRoutineDay = useMemo(() => {
        return routineDaysList.find(
            (rd: any) => rd.nombre_dia?.toLowerCase() === todayDayName.toLowerCase() || rd.orden_dia === (todayIndex + 1)
        );
    }, [routineDaysList, todayDayName, todayIndex]);

    // Hero metrics
    const heroMetrics = useMemo(() => {
        if (!todayRoutineDay) {
            return {
                title: 'Descanso Activo / Recuperación',
                description: 'Día de descanso programado. Realiza movilidad o estiramientos suaves.',
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
            title: todayRoutineDay.nombre_dia || selectedRoutine?.nombre || 'Entrenamiento de Hoy',
            description: todayRoutineDay.descripcion || 'Enfoque de hipertrofia mecánica con énfasis en sobrecargas progresivas.',
            estimatedMinutes: todayRoutineDay.duracion_estimada || 55,
            exerciseCount: exerciseCount || 5,
            totalSets: totalSets || 16,
            estimatedLoad: '4,850 kg',
            targetRpe: '8.5 / 10',
            muscles: Array.from(muscleSet).slice(0, 3),
            status: status as any,
        };
    }, [todayRoutineDay, selectedRoutine, completedDays, inProgressDays, todayKey]);

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

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} testID="monthly-calendar-screen">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                        testID="calendar-refresh-control"
                    />
                }
            >
                {/* Stitch Header with Hamburger, Cycle Badge, Mis Rutinas, and Nueva Rutina Button */}
                <View style={styles.header}>
                    <View style={styles.headerTopRow}>
                        <TouchableOpacity
                            style={styles.hamburgerButton}
                            onPress={() => setDrawerVisible(true)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            testID="hamburger-button"
                        >
                            <MaterialIcons name="menu" size={26} color={colors.text} />
                        </TouchableOpacity>

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
                                    Semana Activa • {selectedRoutine?.nombre || 'Ciclo de Rutinas'}
                                </Text>
                            </View>
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
                            testID="header-new-routine-btn"
                        >
                            <MaterialIcons name="add" size={16} color={colors.primary} />
                            <Text style={[styles.newRoutineBtnText, { color: colors.primary }]}>
                                Nueva
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.screenTitle, { color: colors.onSurface || colors.text }]}>
                        Mis Rutinas
                    </Text>

                    {/* View Switcher: Plan Semanal | Calendario */}
                    <View
                        style={[
                            styles.segmentedContainer,
                            { backgroundColor: colors.surfaceContainerLow || colors.surfaceContainer },
                        ]}
                        testID="calendar-view-mode-toggle"
                    >
                        <TouchableOpacity
                            style={[
                                styles.segmentButton,
                                viewMode === 'weekly' && [
                                    styles.segmentButtonActive,
                                    { backgroundColor: colors.surfaceContainerLowest || colors.surface },
                                ],
                            ]}
                            onPress={() => setViewMode('weekly')}
                            testID="toggle-weekly-view"
                        >
                            <MaterialIcons
                                name="view-week"
                                size={18}
                                color={viewMode === 'weekly' ? (colors.primary || colors.text) : colors.textSecondary}
                            />
                            <Text
                                style={[
                                    styles.segmentButtonText,
                                    {
                                        color: viewMode === 'weekly' ? (colors.primary || colors.text) : colors.textSecondary,
                                        fontWeight: viewMode === 'weekly' ? '700' : '500',
                                    },
                                ]}
                            >
                                Plan Semanal
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.segmentButton,
                                viewMode === 'monthly' && [
                                    styles.segmentButtonActive,
                                    { backgroundColor: colors.surfaceContainerLowest || colors.surface },
                                ],
                            ]}
                            onPress={() => setViewMode('monthly')}
                            testID="toggle-monthly-view"
                        >
                            <MaterialIcons
                                name="calendar-month"
                                size={18}
                                color={viewMode === 'monthly' ? (colors.primary || colors.text) : colors.textSecondary}
                            />
                            <Text
                                style={[
                                    styles.segmentButtonText,
                                    {
                                        color: viewMode === 'monthly' ? (colors.primary || colors.text) : colors.textSecondary,
                                        fontWeight: viewMode === 'monthly' ? '700' : '500',
                                    },
                                ]}
                            >
                                Calendario
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Routine Dropdown for Quick Switching */}
                <View style={styles.dropdownSection}>
                    <RoutineSelectorDropdown
                        selectedRoutine={selectedRoutine}
                        routines={routines}
                        showRoutineSelector={showRoutineSelector}
                        dropdownHeight={dropdownHeight}
                        colors={colors}
                        placeholderText={t('calendar.selectRoutine', 'Seleccionar Rutina')}
                        onToggle={toggleRoutineSelector}
                        onSelectRoutine={(routine) => {
                            setSelectedRoutine(routine);
                            if (RoutineService.getWeeklyRoutineWithDays) {
                                RoutineService.getWeeklyRoutineWithDays(routine.id).then((res) => {
                                    if (res.data) setFullRoutine(res.data);
                                });
                            }
                        }}
                        onActivateRoutine={handleActivateRoutine}
                    />
                </View>

                {/* Plan Semanal View */}
                {viewMode === 'weekly' ? (
                    <View style={styles.weeklyContent}>
                        {/* Weekly Day Pills Carousel */}
                        <WeeklyDayPillsCarousel
                            days={dayPills}
                            onSelectDay={(pill) => handleDayPress(pill.date)}
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
                        <View style={styles.weeklyListSection}>
                            <View style={styles.weeklyListHeader}>
                                <Text style={[styles.weeklyListTitle, { color: colors.onSurface || colors.text }]}>
                                    Rutinas de la Semana
                                </Text>
                                <Text style={[styles.weeklyListCount, { color: colors.onSurfaceVariant || colors.textSecondary }]}>
                                    {dayPills.filter((p) => p.status === 'completed').length} de 5 completadas
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
                                        onPress={() => handleDayPress(date)}
                                        colors={colors}
                                        testID={`weekly-day-card-${dateKey}`}
                                    />
                                );
                            })}
                        </View>
                    </View>
                ) : (
                    /* Calendario Mensual View */
                    <View style={styles.monthlyContent}>
                        <MonthNavigator
                            monthTitle={`${monthNames[month]} ${year}`}
                            colors={colors}
                            onPrevMonth={() => navigateMonth('prev')}
                            onNextMonth={() => navigateMonth('next')}
                        />

                        <CalendarGrid
                            calendarDays={calendarDays}
                            weekDays={weekDays}
                            completedDays={completedDays}
                            inProgressDays={inProgressDays}
                            isCurrentMonth={isCurrentMonth}
                            daySize={DAY_SIZE}
                            colors={colors}
                            isInCurrentWeekFn={isInCurrentWeek}
                            onDayPress={handleDayPress}
                        />
                    </View>
                )}

                {/* Calendar Legend (Rendered on both views for quick color reference and test compatibility) */}
                <View style={styles.legendContainer}>
                    <CalendarLegend
                        colors={colors}
                        labels={{
                            today: t('calendar.today', 'Hoy'),
                            completed: t('calendar.completed', 'Completado'),
                            inProgress: t('calendar.inProgress', 'En Progreso'),
                            missed: t('calendar.missed', 'Sin Hacer'),
                        }}
                    />
                </View>
            </ScrollView>

            <CalendarFab
                colors={colors}
                onPress={() => navigation.navigate('RoutineEditor')}
            />

            <SideDrawer
                visible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
                menuItems={drawerMenuItems}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    header: {
        paddingTop: 8,
        paddingBottom: 4,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    hamburgerButton: {
        padding: 4,
    },
    cycleBadgeRow: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 8,
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
    newRoutineBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
    },
    newRoutineBtnText: {
        fontSize: 11,
        fontWeight: '700',
    },
    screenTitle: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginVertical: 4,
    },
    segmentedContainer: {
        flexDirection: 'row',
        borderRadius: 14,
        padding: 4,
        marginTop: 8,
        marginBottom: 6,
    },
    segmentButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 10,
        gap: 6,
    },
    segmentButtonActive: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    segmentButtonText: {
        fontSize: 13,
    },
    dropdownSection: {
        marginBottom: 6,
    },
    weeklyContent: {
        width: '100%',
    },
    weeklyListSection: {
        marginTop: 14,
        gap: 6,
    },
    weeklyListHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    weeklyListTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    weeklyListCount: {
        fontSize: 13,
        fontWeight: '500',
    },
    monthlyContent: {
        width: '100%',
        marginTop: 6,
    },
    legendContainer: {
        marginTop: 14,
    },
});

export default MonthlyCalendarScreen;
