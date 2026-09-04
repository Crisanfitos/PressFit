import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
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
} from '../components/calendar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_SIZE = (SCREEN_WIDTH - 48) / 7;

type MonthlyCalendarScreenProps = {
    navigation: any;
};

const MonthlyCalendarScreen: React.FC<MonthlyCalendarScreenProps> = ({ navigation }) => {
    const { t, i18n } = useTranslation();
    const { theme } = useTheme();
    const { colors } = theme;
    const authContext = useContext(AuthContext);
    const userId = authContext?.user?.id;

    // State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedRoutine, setSelectedRoutine] = useState<WeeklyRoutine | null>(null);
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
        },
        {
            icon: 'library-books',
            label: t('drawer.exerciseCatalog', 'Catálogo de Ejercicios'),
            onPress: () => navigation.navigate('ExerciseCatalog'),
        },
    ], [navigation, t]);

    // Current month info
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    const currentLang = i18n.language?.startsWith('en') ? 'en' : 'es';
    const monthNames = useMemo(() => getMonthNames(currentLang), [currentLang]);
    const weekDays = useMemo(() => getWeekDays(currentLang), [currentLang]);
    const calendarDays = useMemo(() => getCalendarDays(year, month), [year, month]);

    const loadRoutines = useCallback(async () => {
        if (!userId) return;
        const { data } = await RoutineService.getAllWeeklyRoutines(userId);
        if (data) {
            setRoutines(data);
            const active = data.find((r: WeeklyRoutine) => r.activa);
            setSelectedRoutine(active || data[0] || null);
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

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} testID="monthly-calendar-screen">
            <ScrollView
                showsVerticalScrollIndicator={false}
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
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.hamburgerButton}
                        onPress={() => setDrawerVisible(true)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        testID="hamburger-button"
                    >
                        <MaterialIcons name="menu" size={28} color={colors.text} />
                    </TouchableOpacity>

                    <RoutineSelectorDropdown
                        selectedRoutine={selectedRoutine}
                        routines={routines}
                        showRoutineSelector={showRoutineSelector}
                        dropdownHeight={dropdownHeight}
                        colors={colors}
                        placeholderText={t('calendar.selectRoutine', 'Seleccionar Rutina')}
                        onToggle={toggleRoutineSelector}
                        onSelectRoutine={(routine) => setSelectedRoutine(routine)}
                        onActivateRoutine={handleActivateRoutine}
                    />

                    <MonthNavigator
                        monthTitle={`${monthNames[month]} ${year}`}
                        colors={colors}
                        onPrevMonth={() => navigateMonth('prev')}
                        onNextMonth={() => navigateMonth('next')}
                    />
                </View>

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

                <CalendarLegend
                    colors={colors}
                    labels={{
                        today: t('calendar.today', 'Hoy'),
                        completed: t('calendar.completed', 'Completado'),
                        inProgress: t('calendar.inProgress', 'En Progreso'),
                        missed: t('calendar.missed', 'Sin Hacer'),
                    }}
                />
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
    header: {
        padding: 20,
        paddingTop: 10,
    },
    hamburgerButton: {
        marginBottom: 12,
    },
});

export default MonthlyCalendarScreen;
