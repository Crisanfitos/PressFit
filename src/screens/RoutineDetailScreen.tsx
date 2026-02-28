import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Modal,
    Alert,
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
    const [editingDayId, setEditingDayId] = useState<string | null>(null);
    const [editDescription, setEditDescription] = useState('');

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

    const getDayDescription = (dayName: string) => {
        const day = getDayData(dayName);
        return day?.descripcion || '';
    };

    const handleEditDescription = (dayName: string) => {
        const dayId = getDayId(dayName);
        if (!dayId) return;
        setEditingDayId(dayId);
        setEditDescription(getDayDescription(dayName));
    };

    const handleSaveDescription = async () => {
        if (!editingDayId) return;
        const { error } = await RoutineService.updateRoutineDayDescription(
            editingDayId,
            editDescription.trim()
        );
        if (error) {
            Alert.alert('Error', 'No se pudo guardar la descripción');
        } else {
            await loadRoutine();
        }
        setEditingDayId(null);
        setEditDescription('');
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
        dayDescription: {
            fontSize: 13,
            color: colors.primary,
            marginTop: 2,
            fontStyle: 'italic',
        },
        dayArrow: {
            padding: 8,
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            padding: 24,
        },
        modalContent: {
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
        },
        modalTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 12,
        },
        modalInput: {
            backgroundColor: colors.background,
            borderRadius: 10,
            padding: 12,
            color: colors.text,
            fontSize: 15,
            borderWidth: 1,
            borderColor: colors.border,
            minHeight: 44,
        },
        modalButtons: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginTop: 16,
            gap: 12,
        },
        modalButtonCancel: {
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 10,
        },
        modalButtonSave: {
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: colors.primary,
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
                            onLongPress={() => handleEditDescription(dayName)}
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
                                {getDayDescription(dayName) ? (
                                    <Text style={styles.dayDescription}>{getDayDescription(dayName)}</Text>
                                ) : null}
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

            {/* Modal for editing day description */}
            <Modal
                visible={editingDayId !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setEditingDayId(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Descripción del día</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={editDescription}
                            onChangeText={setEditDescription}
                            placeholder="Ej: Día de Piernas - Enfoque cuádriceps"
                            placeholderTextColor={colors.textSecondary}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalButtonCancel}
                                onPress={() => setEditingDayId(null)}
                            >
                                <Text style={{ color: colors.textSecondary }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalButtonSave}
                                onPress={handleSaveDescription}
                            >
                                <Text style={{ color: '#fff', fontWeight: '600' }}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default RoutineDetailScreen;
