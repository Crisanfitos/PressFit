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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { RoutineService } from '../services/RoutineService';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_SIZE = (SCREEN_WIDTH - 48) / 7;

interface WeeklyRoutine {
    id: string;
    nombre: string;
    activa: boolean;
    [key: string]: any;
}

interface DayStatus {
    isCompleted: boolean;
    isInProgress: boolean;
    isMissed: boolean;
}

type MonthlyCalendarScreenProps = {
    navigation: any;
};

const MonthlyCalendarScreen: React.FC<MonthlyCalendarScreenProps> = ({ navigation }) => {
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
    const dropdownHeight = useState(new Animated.Value(0))[0];

    // Get current month info
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    // Month names in Spanish
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

    // Calculate calendar days
    const calendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
        const daysInMonth = lastDayOfMonth.getDate();

        const days: { date: Date | null; dayNumber: number | null }[] = [];

        // Add empty slots for days before the first of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push({ date: null, dayNumber: null });
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push({ date: new Date(year, month, day), dayNumber: day });
        }

        return days;
    }, [year, month]);

    // Get week number for a date (relative to month)
    const getWeekOfMonth = useCallback((date: Date) => {
        const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const firstDayWeekday = (firstDayOfMonth.getDay() + 6) % 7;
        return Math.floor((date.getDate() + firstDayWeekday - 1) / 7);
    }, []);

    // Check if date is in current week
    const isInCurrentWeek = useCallback((date: Date) => {
        const now = new Date();
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return date >= startOfWeek && date <= endOfWeek;
    }, []);

    // Load routines
    useEffect(() => {
        if (userId) {
            loadRoutines();
        }
    }, [userId]);

    // Load workout stats when routine or month changes
    useEffect(() => {
        if (selectedRoutine?.id) {
            loadWorkoutStats();
        }
    }, [selectedRoutine?.id, year, month]);

    // Reload data when screen gains focus (navigation or returning from detail)
    useFocusEffect(
        useCallback(() => {
            if (userId) {
                loadRoutines();
            }
            if (selectedRoutine?.id) {
                loadWorkoutStats();
            }
        }, [userId, selectedRoutine?.id, year, month])
    );

    const loadRoutines = async () => {
        if (!userId) return;
        const { data } = await RoutineService.getAllWeeklyRoutines(userId);
        if (data) {
            setRoutines(data);
            const active = data.find((r: WeeklyRoutine) => r.activa);
            setSelectedRoutine(active || data[0] || null);
        }
    };

    const loadWorkoutStats = async () => {
        if (!selectedRoutine?.id) return;

        // Calculate date range for current month
        const startDate = new Date(year, month, 1).toISOString();
        const endDate = new Date(year, month + 1, 0).toISOString();

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
    };

    // Toggle dropdown
    const toggleRoutineSelector = () => {
        const toValue = showRoutineSelector ? 0 : Math.min(routines.length * 56, 224);
        Animated.timing(dropdownHeight, {
            toValue,
            duration: 200,
            useNativeDriver: false,
        }).start();
        setShowRoutineSelector(!showRoutineSelector);
    };

    // Navigate month
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

    // Handle activating a routine
    const handleActivateRoutine = async (routineId: string) => {
        if (!userId) return;
        await RoutineService.setActiveRoutine(userId, routineId);
        await loadRoutines();
    };

    // Handle day press
    const handleDayPress = (date: Date | null) => {
        if (!date) return;

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate > now) {
            // Future date - no navigation
            return;
        }

        // Navigate to day detail
        navigation.navigate('WorkoutDay', {
            date: date.toISOString(),
            routineId: selectedRoutine?.id,
            isToday: selectedDate.getTime() === now.getTime(),
        });
    };

    // Get day style based on status
    const getDayStyle = (date: Date | null) => {
        if (!date) return {};

        const dateStr = date.toISOString().split('T')[0];
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const dateNorm = new Date(date);
        dateNorm.setHours(0, 0, 0, 0);

        const isToday = dateNorm.getTime() === now.getTime();
        const isPast = dateNorm < now;
        const isFuture = dateNorm > now;
        const inCurrentWeek = isInCurrentWeek(date);
        const isCompleted = completedDays.has(dateStr);
        const isInProgress = inProgressDays.has(dateStr);

        return {
            isToday,
            isPast,
            isFuture,
            inCurrentWeek,
            isCompleted,
            isInProgress,
        };
    };

    // Styles
    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            padding: 20,
            paddingTop: 10,
        },
        routineSelector: {
            backgroundColor: colors.surface,
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 20,
            borderWidth: 1,
            borderColor: colors.border,
        },
        routineSelectorButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
        },
        routineSelectorText: {
            fontSize: 18,
            fontWeight: '600',
            color: colors.text,
            flex: 1,
        },
        routineSelectorIcon: {
            marginLeft: 8,
        },
        dropdownContainer: {
            overflow: 'hidden',
            backgroundColor: colors.surface,
        },
        dropdownItem: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },
        dropdownItemText: {
            fontSize: 16,
            color: colors.text,
            flex: 1,
        },
        dropdownItemActive: {
            color: colors.primary,
            fontWeight: '600',
        },
        monthNavigator: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
        },
        monthNavButton: {
            padding: 8,
            borderRadius: 12,
            backgroundColor: colors.surface,
        },
        monthTitle: {
            fontSize: 22,
            fontWeight: 'bold',
            color: colors.text,
        },
        calendarContainer: {
            paddingHorizontal: 20,
        },
        weekDaysRow: {
            flexDirection: 'row',
            marginBottom: 8,
        },
        weekDayLabel: {
            width: DAY_SIZE,
            textAlign: 'center',
            fontSize: 12,
            fontWeight: '600',
            color: colors.textSecondary,
        },
        calendarGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
        },
        dayCell: {
            width: DAY_SIZE,
            height: DAY_SIZE,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
        },
        dayInner: {
            width: DAY_SIZE - 8,
            height: DAY_SIZE - 8,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: (DAY_SIZE - 8) / 2,
        },
        dayText: {
            fontSize: 14,
            fontWeight: '500',
        },
        todayIndicator: {
            position: 'absolute',
            bottom: 4,
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.primary,
        },
        weekHighlight: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: `${colors.primary}15`,
            borderRadius: 8,
        },
        fab: {
            position: 'absolute',
            bottom: 24,
            right: 20,
            width: 60,
            height: 60,
            borderRadius: 30,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
        },
        legendContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            paddingHorizontal: 20,
            paddingTop: 24,
            gap: 16,
        },
        legendItem: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        legendDot: {
            width: 12,
            height: 12,
            borderRadius: 6,
            marginRight: 8,
        },
        legendText: {
            fontSize: 12,
            color: colors.textSecondary,
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header with Routine Selector */}
                <View style={styles.header}>
                    {/* Routine Selector Dropdown */}
                    <View style={styles.routineSelector}>
                        <TouchableOpacity
                            style={styles.routineSelectorButton}
                            onPress={toggleRoutineSelector}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <MaterialIcons
                                name="fitness-center"
                                size={24}
                                color={colors.primary}
                            />
                            <Text style={styles.routineSelectorText}>
                                {selectedRoutine?.nombre || 'Seleccionar Rutina'}
                            </Text>
                            <MaterialIcons
                                name={showRoutineSelector ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                                size={24}
                                color={colors.textSecondary}
                                style={styles.routineSelectorIcon}
                            />
                        </TouchableOpacity>

                        <Animated.View style={[styles.dropdownContainer, { height: dropdownHeight }]}>
                            {routines.map((routine) => (
                                <View key={routine.id} style={styles.dropdownItem}>
                                    <TouchableOpacity
                                        style={{ flex: 1 }}
                                        onPress={() => {
                                            setSelectedRoutine(routine);
                                            toggleRoutineSelector();
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.dropdownItemText,
                                                routine.activa
                                                    ? { color: colors.text, fontWeight: '600' }
                                                    : { color: colors.textSecondary },
                                            ]}
                                        >
                                            {routine.nombre}
                                        </Text>
                                    </TouchableOpacity>
                                    {routine.activa ? (
                                        <MaterialIcons name="check-circle" size={22} color={colors.primary} />
                                    ) : (
                                        <TouchableOpacity
                                            onPress={() => handleActivateRoutine(routine.id)}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            <MaterialIcons name="radio-button-unchecked" size={22} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </Animated.View>
                    </View>

                    {/* Month Navigator */}
                    <View style={styles.monthNavigator}>
                        <TouchableOpacity
                            style={styles.monthNavButton}
                            onPress={() => navigateMonth('prev')}
                            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        >
                            <MaterialIcons name="chevron-left" size={28} color={colors.text} />
                        </TouchableOpacity>

                        <Text style={styles.monthTitle}>
                            {monthNames[month]} {year}
                        </Text>

                        <TouchableOpacity
                            style={styles.monthNavButton}
                            onPress={() => navigateMonth('next')}
                            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        >
                            <MaterialIcons name="chevron-right" size={28} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Calendar */}
                <View style={styles.calendarContainer}>
                    {/* Week Day Labels */}
                    <View style={styles.weekDaysRow}>
                        {weekDays.map((day, index) => (
                            <Text key={index} style={styles.weekDayLabel}>
                                {day}
                            </Text>
                        ))}
                    </View>

                    {/* Calendar Grid */}
                    <View style={styles.calendarGrid}>
                        {calendarDays.map((day, index) => {
                            const dayStyle = day.date ? getDayStyle(day.date) : null;

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.dayCell}
                                    onPress={() => handleDayPress(day.date)}
                                    disabled={!day.date || dayStyle?.isFuture}
                                    activeOpacity={dayStyle?.isFuture ? 1 : 0.7}
                                >
                                    {dayStyle?.inCurrentWeek && isCurrentMonth && (
                                        <View style={styles.weekHighlight} />
                                    )}
                                    <View
                                        style={[
                                            styles.dayInner,
                                            // Completed takes priority (including today if completed)
                                            dayStyle?.isCompleted && {
                                                backgroundColor: (colors as any).timelineCompleted || colors.statusSuccess,
                                            },
                                            // In Progress takes priority
                                            dayStyle?.isInProgress && !dayStyle?.isCompleted && {
                                                backgroundColor: (colors as any).timelineInProgress || colors.statusWarning,
                                            },
                                            // Today only if not completed and not in progress
                                            dayStyle?.isToday && !dayStyle?.isCompleted && !dayStyle?.isInProgress && {
                                                backgroundColor: colors.primary,
                                            },
                                            // Missed (past and not completed/in progress/today)
                                            dayStyle?.isPast && !dayStyle?.isCompleted && !dayStyle?.isInProgress && !dayStyle?.isToday && {
                                                backgroundColor: `${colors.statusError}30`,
                                            },
                                            dayStyle?.isFuture && {
                                                opacity: 0.4,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.dayText,
                                                { color: colors.text },
                                                // White text for colored backgrounds
                                                (dayStyle?.isCompleted || dayStyle?.isInProgress) && { color: '#fff', fontWeight: 'bold' },
                                                dayStyle?.isToday && !dayStyle?.isCompleted && !dayStyle?.isInProgress && { color: colors.background, fontWeight: 'bold' },
                                                dayStyle?.isFuture && { color: colors.textSecondary },
                                            ]}
                                        >
                                            {day.dayNumber}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Legend */}
                <View style={[styles.legendContainer, { paddingBottom: 100 }]}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                        <Text style={styles.legendText}>Hoy</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: (colors as any).timelineCompleted || colors.statusSuccess }]} />
                        <Text style={styles.legendText}>Completado</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: (colors as any).timelineInProgress || colors.statusWarning }]} />
                        <Text style={styles.legendText}>En Progreso</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: `${colors.statusError}30` }]} />
                        <Text style={styles.legendText}>Sin Hacer</Text>
                    </View>
                </View>
            </ScrollView>

            {/* FAB for Routine Editor */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('RoutineEditor')}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={[colors.primary, (colors as any).primaryDark || `${colors.primary}DD`]}
                    style={[StyleSheet.absoluteFill, { borderRadius: 30 }]}
                />
                <MaterialIcons name="edit" size={28} color={colors.background} />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

export default MonthlyCalendarScreen;
