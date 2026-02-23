import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { RoutineService } from '../services/RoutineService';

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

type RoutineDetailScreenProps = {
    navigation: any;
    route: any;
};

const RoutineDetailScreen: React.FC<RoutineDetailScreenProps> = ({ navigation, route }) => {
    const { theme } = useTheme();
    const { colors } = theme;
    const authContext = useContext(AuthContext);
    const userId = authContext?.user?.id;

    const { routineId } = route.params || {};

    const [routine, setRoutine] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (routineId) {
            loadRoutine();
        }
    }, [routineId]);

    // Reload data when screen gains focus (navigating back from day detail)
    useFocusEffect(
        useCallback(() => {
            if (routineId) {
                loadRoutine();
            }
        }, [routineId])
    );

    const loadRoutine = async () => {
        setLoading(true);
        const { data } = await RoutineService.getWeeklyRoutineWithDays(routineId);
        if (data) {
            setRoutine(data);
        }
        setLoading(false);
    };

    const getDayData = (dayName: string) => {
        if (!routine?.rutinas_diarias) return null;

        // First try to find a template (no fecha_dia)
        const template = routine.rutinas_diarias.find(
            (d: any) => d.nombre_dia === dayName && !d.fecha_dia
        );
        if (template) return template;

        // If no template, find the most recent instance with this day name
        const instances = routine.rutinas_diarias
            .filter((d: any) => d.nombre_dia === dayName && d.fecha_dia)
            .sort((a: any, b: any) => new Date(b.fecha_dia).getTime() - new Date(a.fecha_dia).getTime());

        return instances[0] || null;
    };

    const getDayExerciseCount = (dayName: string) => {
        const day = getDayData(dayName);
        return day?.ejercicios_programados?.length || 0;
    };

    const getDayId = (dayName: string) => {
        const day = getDayData(dayName);
        return day?.id;
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        backButton: {
            marginRight: 16,
        },
        headerContent: {
            flex: 1,
        },
        headerTitle: {
            fontSize: 22,
            fontWeight: 'bold',
            color: colors.text,
        },
        headerSubtitle: {
            fontSize: 14,
            color: colors.textSecondary,
            marginTop: 4,
        },
        content: {
            flex: 1,
            padding: 20,
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.textSecondary,
            marginBottom: 16,
            textTransform: 'uppercase',
        },
        dayCard: {
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
        },
        dayInfo: {
            flex: 1,
        },
        dayName: {
            fontSize: 18,
            fontWeight: '600',
            color: colors.text,
        },
        dayExercises: {
            fontSize: 14,
            color: colors.textSecondary,
            marginTop: 4,
        },
        dayArrow: {
            padding: 8,
        },
        emptyDay: {
            opacity: 0.6,
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>
                        {routine?.nombre || 'Rutina'}
                    </Text>
                    {routine?.objetivo && (
                        <Text style={styles.headerSubtitle}>{routine.objetivo}</Text>
                    )}
                </View>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
                <Text style={styles.sectionTitle}>Días de la Semana</Text>

                {DAY_NAMES.map((dayName) => {
                    const exerciseCount = getDayExerciseCount(dayName);
                    const dayId = getDayId(dayName);

                    return (
                        <TouchableOpacity
                            key={dayName}
                            style={[styles.dayCard, exerciseCount === 0 && styles.emptyDay]}
                            onPress={async () => {
                                let targetDayId = dayId;

                                // If day doesn't exist, create it first
                                if (!targetDayId && userId) {
                                    const dayIndex = DAY_NAMES.indexOf(dayName);
                                    const dayOfWeek = dayIndex === 6 ? 0 : dayIndex + 1; // Convert to Sunday=0 format
                                    const { data } = await RoutineService.getOrCreateRoutineDay(userId, dayOfWeek);
                                    if (data) {
                                        targetDayId = data.id;
                                        // Reload routine to get updated data
                                        loadRoutine();
                                    }
                                }

                                if (targetDayId) {
                                    navigation.navigate('Workout', {
                                        routineDayId: targetDayId,
                                        dayName: dayName,
                                        mode: 'edit',
                                    });
                                }
                            }}
                        >
                            <View style={styles.dayInfo}>
                                <Text style={styles.dayName}>{dayName}</Text>
                                <Text style={styles.dayExercises}>
                                    {exerciseCount > 0
                                        ? `${exerciseCount} ejercicio${exerciseCount > 1 ? 's' : ''}`
                                        : 'Sin ejercicios - Toca para añadir'}
                                </Text>
                            </View>
                            <View style={styles.dayArrow}>
                                <MaterialIcons
                                    name="chevron-right"
                                    size={24}
                                    color={colors.textSecondary}
                                />
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
};

export default RoutineDetailScreen;
