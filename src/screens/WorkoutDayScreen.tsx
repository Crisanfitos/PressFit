import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { RoutineService } from '../services/RoutineService';
import { WorkoutService } from '../services/WorkoutService';
import { LinearGradient } from 'expo-linear-gradient';

interface Exercise {
    id: string;
    ejercicio_id: string;
    ejercicio: {
        titulo: string;
        grupo_muscular?: string;
        imagen_url?: string;
    };
    series?: any[];
}

type WorkoutDayScreenProps = {
    navigation: any;
    route: any;
};

const WorkoutDayScreen: React.FC<WorkoutDayScreenProps> = ({ navigation, route }) => {
    const { theme } = useTheme();
    const { colors } = theme;
    const authContext = useContext(AuthContext);
    const userId = authContext?.user?.id;

    const { date, routineId, isToday } = route.params || {};
    const selectedDate = date ? new Date(date) : new Date();

    const [loading, setLoading] = useState(true);
    const [dayData, setDayData] = useState<any>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [workoutStats, setWorkoutStats] = useState<any>(null);
    const [activeWorkout, setActiveWorkout] = useState<any>(null);

    // Format date for display
    const formatDate = (d: Date) => {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${days[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    useEffect(() => {
        loadDayData();
    }, [date, routineId]);

    // Reload data when screen gains focus (returning from workout detail)
    useFocusEffect(
        useCallback(() => {
            loadDayData();
        }, [date, routineId, userId])
    );

    const loadDayData = async () => {
        if (!userId || !routineId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            // Format date as yyyy-mm-dd for direct query
            const selectedDateStr = selectedDate.toISOString().split('T')[0];

            // Try to find an instance for this specific date first
            let { data: targetDay } = await RoutineService.getRoutineDayByDate(
                routineId,
                selectedDateStr
            );

            // If no instance for this date, fall back to template (by day name)
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
                setExercises(targetDay.ejercicios_programados || []);

                // Calculate workout stats directly from the loaded data
                const exerciseCount = new Set(
                    targetDay.ejercicios_programados?.map((ex: any) => ex.ejercicio_id) || []
                ).size;

                let duration: number | null = null;
                // Duration only requires start and end times, not completada flag
                if (targetDay.hora_inicio && targetDay.hora_fin) {
                    const start = new Date(targetDay.hora_inicio);
                    const end = new Date(targetDay.hora_fin);
                    const durationMs = end.getTime() - start.getTime();
                    const durationMinutes = Math.round(durationMs / 1000 / 60);
                    if (durationMinutes >= 5) {
                        duration = durationMinutes;
                    }
                }

                setWorkoutStats({
                    exerciseCount,
                    duration,
                    // Consider completed if either flag is true OR hora_fin exists
                    isCompleted: !!(targetDay.completada || targetDay.hora_fin),
                    startTime: targetDay.hora_inicio || null,
                    endTime: targetDay.hora_fin || null,
                });

                // Check for active workout (has start time but NOT completed and NO end time)
                if (targetDay.hora_inicio && !targetDay.completada && !targetDay.hora_fin) {
                    setActiveWorkout(targetDay);
                } else {
                    setActiveWorkout(null);
                }
            } else {
                // No workout instance or template for this day - clear state
                setDayData(null);
                setExercises([]);
                setWorkoutStats(null);
                setActiveWorkout(null);
            }
        } catch (error) {
            console.error('Error loading day data:', error);
        }

        setLoading(false);
    };

    const handleStartWorkout = async () => {
        if (!dayData) return;
        setLoading(true);
        try {
            const now = new Date();
            const { data: newWorkout, error } = await RoutineService.startDailyWorkout(
                dayData.id,
                now.toISOString(),
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

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        backRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
        },
        backButton: {
            marginRight: 12,
        },
        dateText: {
            fontSize: 16,
            color: colors.textSecondary,
        },
        dayTitle: {
            fontSize: 28,
            fontWeight: 'bold',
            color: colors.text,
        },
        dayDescription: {
            fontSize: 14,
            color: colors.primary,
            marginTop: 4,
            fontStyle: 'italic',
        },
        statusBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            marginTop: 12,
        },
        statusText: {
            fontSize: 14,
            fontWeight: '600',
            marginLeft: 6,
        },
        content: {
            flex: 1,
            padding: 20,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 16,
        },
        exerciseCard: {
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
        },
        exerciseIcon: {
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: `${colors.primary}20`,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
        },
        exerciseInfo: {
            flex: 1,
        },
        exerciseName: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 4,
        },
        exerciseMuscle: {
            fontSize: 14,
            color: colors.textSecondary,
        },
        exerciseSets: {
            alignItems: 'center',
        },
        setsNumber: {
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.primary,
        },
        setsLabel: {
            fontSize: 12,
            color: colors.textSecondary,
        },
        emptyState: {
            alignItems: 'center',
            paddingVertical: 40,
        },
        emptyText: {
            fontSize: 16,
            color: colors.textSecondary,
            marginTop: 12,
            textAlign: 'center',
        },
        bottomButton: {
            margin: 20,
            borderRadius: 16,
            overflow: 'hidden',
        },
        buttonGradient: {
            paddingVertical: 18,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
        },
        buttonText: {
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.background,
            marginLeft: 8,
        },
        historySection: {
            marginTop: 24,
            paddingTop: 24,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },
        historyTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.textSecondary,
            marginBottom: 12,
        },
        historyCard: {
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
        },
        historyRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 8,
        },
        historyLabel: {
            fontSize: 14,
            color: colors.textSecondary,
        },
        historyValue: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.text,
        },
        loadingContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
        },
    });

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.backRow}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    >
                        <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
                </View>

                <Text style={styles.dayTitle}>
                    {dayData?.nombre_dia || 'Sin entrenar'}
                </Text>

                {dayData?.descripcion ? (
                    <Text style={styles.dayDescription}>{dayData.descripcion}</Text>
                ) : null}

                {workoutStats?.isCompleted && (
                    <View style={[styles.statusBadge, { backgroundColor: `${colors.statusSuccess}20` }]}>
                        <MaterialIcons name="check-circle" size={18} color={colors.statusSuccess} />
                        <Text style={[styles.statusText, { color: colors.statusSuccess }]}>
                            Completado
                        </Text>
                    </View>
                )}

                {activeWorkout && !workoutStats?.isCompleted && (
                    <View style={[styles.statusBadge, { backgroundColor: `${colors.statusWarning}20` }]}>
                        <MaterialIcons name="play-circle" size={18} color={colors.statusWarning} />
                        <Text style={[styles.statusText, { color: colors.statusWarning }]}>
                            En Progreso
                        </Text>
                    </View>
                )}
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
                <Text style={styles.sectionTitle}>
                    Ejercicios ({exercises.length})
                </Text>

                {exercises.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="fitness-center" size={48} color={colors.textSecondary} />
                        <Text style={styles.emptyText}>
                            No hay ejercicios programados para este día.
                            {'\n'}Edita tu rutina para añadir ejercicios.
                        </Text>
                    </View>
                ) : (
                    exercises.map((exercise, index) => (
                        <View key={exercise.id || index} style={styles.exerciseCard}>
                            <View style={styles.exerciseIcon}>
                                <MaterialIcons name="fitness-center" size={24} color={colors.primary} />
                            </View>
                            <View style={styles.exerciseInfo}>
                                <Text style={styles.exerciseName}>
                                    {exercise.ejercicio?.titulo || 'Ejercicio'}
                                </Text>
                                <Text style={styles.exerciseMuscle}>
                                    {exercise.ejercicio?.grupo_muscular || 'Sin grupo'}
                                </Text>
                            </View>
                            <View style={styles.exerciseSets}>
                                <Text style={styles.setsNumber}>
                                    {exercise.series?.length || 0}
                                </Text>
                                <Text style={styles.setsLabel}>series</Text>
                            </View>
                        </View>
                    ))
                )}

                {/* Workout Summary - shows for all completed workouts */}
                {workoutStats?.isCompleted && (
                    <View style={styles.historySection}>
                        <Text style={styles.historyTitle}>Resumen del entrenamiento</Text>
                        <View style={styles.historyCard}>
                            <View style={styles.historyRow}>
                                <Text style={styles.historyLabel}>Ejercicios</Text>
                                <Text style={styles.historyValue}>{workoutStats.exerciseCount}</Text>
                            </View>
                            <View style={styles.historyRow}>
                                <Text style={styles.historyLabel}>Duración</Text>
                                <Text style={styles.historyValue}>
                                    {workoutStats.duration ? `${workoutStats.duration} min` : '-'}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Action Button (only for today and not completed) */}
            {isToday && exercises.length > 0 && !workoutStats?.isCompleted && (
                <TouchableOpacity
                    style={styles.bottomButton}
                    onPress={activeWorkout ? handleContinueWorkout : handleStartWorkout}
                >
                    <LinearGradient
                        colors={[colors.primary, `${colors.primary}CC`]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
                    >
                        <MaterialIcons
                            name={activeWorkout ? 'play-arrow' : 'play-circle-filled'}
                            size={24}
                            color={colors.background}
                        />
                        <Text style={styles.buttonText}>
                            {activeWorkout ? 'Continuar Entrenamiento' : 'Empezar Entrenamiento'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
};

export default WorkoutDayScreen;
