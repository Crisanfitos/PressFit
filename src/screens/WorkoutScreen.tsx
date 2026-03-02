import React, { useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Modal,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { useWorkoutController } from '../controllers/useWorkoutController';
import SetInput from '../components/SetInput';
import { PersonalNoteButton } from '../components/PersonalNoteButton';
import RestTimer from '../components/RestTimer';
import { WorkoutService } from '../services/WorkoutService';

type WorkoutScreenProps = {
    navigation: any;
    route: any;
};

const WorkoutScreen: React.FC<WorkoutScreenProps> = ({ navigation, route }) => {
    const { routineDayId, dayName, workoutId: initialWorkoutId, dayOfWeek, mode: navMode } = route.params || {};
    const authContext = useContext(AuthContext);
    const user = authContext?.user;
    const { theme } = useTheme();
    const { colors } = theme;

    const {
        workout,
        exercises,
        loading: controllerLoading,
        mode,
        previousWorkout,
        startWorkout,
        addSet,
        addSets,
        updateSet,
        deleteSet,
        removeExercise,
        finishWorkout,
        loadSeriesForExercise,
        reloadExercises,
    } = useWorkoutController(
        initialWorkoutId || null,
        routineDayId,
        user?.id || '',
        dayOfWeek || 0,
        navMode === 'edit'  // isEditingTemplate
    );

    const [collapsedExercises, setCollapsedExercises] = useState<Record<string, boolean>>({});
    const [saving, setSaving] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [setsToAdd, setSetsToAdd] = useState(1);
    const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
    const [restTimerVisible, setRestTimerVisible] = useState(false);
    const [lastCompletedSetId, setLastCompletedSetId] = useState<string | null>(null);

    const hasInitializedCollapse = useRef(false);

    useEffect(() => {
        if (!controllerLoading && exercises.length > 0 && !hasInitializedCollapse.current) {
            hasInitializedCollapse.current = true;
            const initial: Record<string, boolean> = {};
            exercises.slice(1).forEach((ex) => (initial[ex.id] = true));
            setCollapsedExercises(initial);
        }
    }, [controllerLoading, exercises.length]);

    // Flag to track if we need to refresh exercises when returning from ExerciseLibrary
    const needsRefreshRef = useRef(false);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (needsRefreshRef.current) {
                needsRefreshRef.current = false;
                reloadExercises();
            }
        });
        return unsubscribe;
    }, [navigation, reloadExercises]);

    const navigateToExerciseLibrary = () => {
        needsRefreshRef.current = true;
        navigation.navigate('ExerciseLibrary', { routineDayId: workout?.id });
    };

    const openAddSetsModal = (exerciseId: string) => {
        setSelectedExerciseId(exerciseId);
        setSetsToAdd(1);
        setModalVisible(true);
    };

    const handleConfirmAddSets = async () => {
        if (!selectedExerciseId) return;
        setModalVisible(false);
        setSaving(true);
        await addSets(selectedExerciseId, setsToAdd);
        setSaving(false);
        setSelectedExerciseId(null);
    };

    const toggleExerciseCollapsed = (exerciseId: string) => {
        setCollapsedExercises((prev) => ({
            ...prev,
            [exerciseId]: !prev[exerciseId],
        }));
    };

    const getGhostValue = (exerciseId: string, setNumber: number, field: 'weight' | 'reps') => {
        if (!previousWorkout?.ejercicios_programados) return null;
        const prevExercise = previousWorkout.ejercicios_programados.find(
            (ep: any) => ep.ejercicio_id === exerciseId
        );
        if (!prevExercise?.series) return null;
        const prevSet = prevExercise.series.find((s: any) => s.numero_serie === setNumber);
        if (!prevSet) return null;
        return field === 'reps' ? `${prevSet.repeticiones || ''}` : `${prevSet.peso_utilizado || ''}`;
    };

    const handleSetChange = async (setId: string, field: string, value: string) => {
        await updateSet(setId, field, value);
    };

    const handleDeleteExercise = (exerciseId: string, exerciseName: string, routineExerciseId: string) => {
        Alert.alert('Eliminar Ejercicio', `¿Estás seguro de eliminar "${exerciseName}"?`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                    setSaving(true);
                    await removeExercise(exerciseId, routineExerciseId);
                    setSaving(false);
                },
            },
        ]);
    };

    const handleAddSet = async (exerciseId: string) => {
        setSaving(true);
        await addSet(exerciseId);
        setSaving(false);
    };

    const handleDeleteSet = (setId: string, exerciseId: string) => {
        Alert.alert('Eliminar Serie', '¿Estás seguro de eliminar esta serie?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                    setSaving(true);
                    await deleteSet(setId, exerciseId);
                    setSaving(false);
                },
            },
        ]);
    };

    const handleStartRestTimer = (setId: string) => {
        setLastCompletedSetId(setId);
        setRestTimerVisible(true);
    };

    const handleRestTimerStop = async (seconds: number) => {
        if (lastCompletedSetId && seconds > 0) {
            await WorkoutService.updateSet(lastCompletedSetId, { descanso_segundos: seconds });
        }
        setLastCompletedSetId(null);
    };

    const handleFinishWorkout = () => {
        Alert.alert('Finalizar Entrenamiento', '¿Estás seguro de que quieres finalizar?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Finalizar',
                onPress: async () => {
                    setSaving(true);
                    const success = await finishWorkout();
                    setSaving(false);
                    if (success) {
                        Alert.alert('¡Completado!', 'Entrenamiento guardado correctamente', [
                            { text: 'OK', onPress: () => navigation.goBack() },
                        ]);
                    } else {
                        Alert.alert('Error', 'No se pudo finalizar el entrenamiento');
                    }
                },
            },
        ]);
    };

    const isInputEditable = mode === 'ACTIVE' || navMode === 'edit';
    const isStructureEditable = navMode === 'edit';

    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: { flex: 1, backgroundColor: colors.background },
                header: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                },
                backButton: { padding: 8, marginLeft: -8 },
                headerText: { fontSize: 18, fontWeight: '600', color: colors.text },
                loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
                scrollView: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
                exerciseCard: {
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                },
                exerciseHeader: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                },
                exerciseHeaderLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
                exerciseName: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 },
                exerciseActions: { flexDirection: 'row', gap: 8 },
                actionButton: {
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                setsContainer: { marginTop: 16 },
                setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
                setNumber: { width: 40, fontSize: 16, color: colors.textSecondary, textAlign: 'center' },
                inputGroup: { flex: 1, marginHorizontal: 4 },
                referenceText: { fontSize: 11, color: colors.primary, textAlign: 'center', marginTop: 4 },
                deleteSetButton: { padding: 4, marginLeft: 6 },
                addSetButton: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: `${colors.primary}20`,
                    borderWidth: 1,
                    borderColor: colors.primary,
                    borderStyle: 'dashed',
                    marginTop: 8,
                    gap: 6,
                },
                addSetText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
                finishButtonContainer: { padding: 16, marginBottom: 20 },
                finishButton: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.primary,
                    paddingVertical: 16,
                    borderRadius: 12,
                },
                finishButtonText: { fontSize: 16, fontWeight: '600', color: colors.background, marginLeft: 8 },
                placeholderContainer: {
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingVertical: 60,
                    paddingHorizontal: 20,
                },
                placeholderIconContainer: {
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: `${colors.primary}20`,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 24,
                },
                placeholderTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 12, textAlign: 'center' },
                placeholderText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 32, lineHeight: 24 },
                addExerciseButton: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.primary,
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    borderRadius: 9999,
                },
                addExerciseButtonText: { fontSize: 16, fontWeight: '600', color: colors.background, marginLeft: 8 },
                fab: {
                    position: 'absolute',
                    bottom: 90,
                    right: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4.65,
                    elevation: 8,
                },
                fabButton: {
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                modalOverlay: {
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 20,
                },
                modalContent: {
                    width: '100%',
                    maxWidth: 340,
                    borderRadius: 20,
                    padding: 20,
                    backgroundColor: colors.surface,
                },
                modalHeader: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 20,
                },
                modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
                counterContainer: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 24,
                    marginBottom: 24,
                },
                counterButton: {
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: colors.border,
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                counterText: { fontSize: 32, fontWeight: 'bold', color: colors.text, minWidth: 40, textAlign: 'center' },
                confirmAddButton: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#22c55e' },
                confirmAddButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
            }),
        [colors]
    );

    if (controllerLoading) {
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
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                        <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={{ marginLeft: 12 }}>
                        <Text style={styles.headerText}>
                            {dayName || 'Entrenamiento'}
                            {workout?.fecha_dia ? ` — ${new Date(workout.fecha_dia + 'T00:00:00').getDate()}/${(new Date(workout.fecha_dia + 'T00:00:00').getMonth() + 1).toString().padStart(2, '0')}` : ''}
                        </Text>
                        {workout?.descripcion ? (
                            <Text style={{ fontSize: 12, color: colors.primary, fontStyle: 'italic', marginTop: 2 }}>
                                {workout.descripcion}
                            </Text>
                        ) : null}
                    </View>
                </View>
            </View>

            {/* Content */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {exercises.length === 0 ? (
                        <View style={styles.placeholderContainer}>
                            <View style={styles.placeholderIconContainer}>
                                <MaterialIcons name="fitness-center" size={40} color={colors.primary} />
                            </View>
                            <Text style={styles.placeholderTitle}>¡Día libre de ejercicios!</Text>
                            <Text style={styles.placeholderText}>
                                No hay ejercicios programados.{isStructureEditable && ' Añade ejercicios para comenzar.'}
                            </Text>
                            {isStructureEditable && (
                                <TouchableOpacity
                                    style={styles.addExerciseButton}
                                    onPress={navigateToExerciseLibrary}
                                >
                                    <MaterialIcons name="add" size={24} color={colors.background} />
                                    <Text style={styles.addExerciseButtonText}>Añadir Ejercicio</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        exercises.map((exercise, index) => {
                            const isCollapsed = collapsedExercises[exercise.id];

                            return (
                                <View key={`${exercise.id}-${index}`} style={styles.exerciseCard}>
                                    <TouchableOpacity onPress={() => toggleExerciseCollapsed(exercise.id)} activeOpacity={0.7}>
                                        <View style={styles.exerciseHeader}>
                                            <View style={styles.exerciseHeaderLeft}>
                                                <MaterialIcons
                                                    name={isCollapsed ? 'expand-more' : 'expand-less'}
                                                    size={24}
                                                    color={colors.primary}
                                                    style={{ marginRight: 8, marginTop: 2, alignSelf: 'flex-start' }}
                                                />
                                                <View style={{ flex: 1, flexDirection: 'column' }}>
                                                    <Text style={styles.exerciseName}>{exercise.titulo}</Text>
                                                    <View style={{ marginTop: 4 }}>
                                                        <PersonalNoteButton exerciseId={exercise.id} />
                                                    </View>
                                                </View>
                                            </View>
                                            <View style={styles.exerciseActions}>
                                                <TouchableOpacity
                                                    style={styles.actionButton}
                                                    onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: exercise.id })}
                                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                >
                                                    <MaterialIcons name="info-outline" size={20} color={colors.textSecondary} />
                                                </TouchableOpacity>
                                                {isStructureEditable && (
                                                    <TouchableOpacity
                                                        style={[styles.actionButton, { borderColor: '#fee2e2' }]}
                                                        onPress={() => handleDeleteExercise(exercise.id, exercise.titulo, exercise.routine_exercise_id)}
                                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                    >
                                                        <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                    </TouchableOpacity>

                                    {!isCollapsed && (
                                        <View style={styles.setsContainer}>
                                            {/* Header Row */}
                                            <View style={[styles.setRow, { marginBottom: 8 }]}>
                                                <Text style={[styles.setNumber, { fontSize: 12 }]}>Serie</Text>
                                                <View style={styles.inputGroup}>
                                                    <Text style={styles.referenceText}>KG</Text>
                                                </View>
                                                <View style={styles.inputGroup}>
                                                    <Text style={styles.referenceText}>REPS</Text>
                                                </View>
                                                {isStructureEditable && <View style={{ width: 28 }} />}
                                            </View>

                                            {(exercise.sets || []).length === 0 ? (
                                                <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                                                    <Text style={{ color: colors.textSecondary, fontSize: 14, fontStyle: 'italic' }}>
                                                        No hay series todavía
                                                    </Text>
                                                </View>
                                            ) : (
                                                (exercise.sets || []).map((set, setIndex) => {
                                                    const ghostWeight = getGhostValue(exercise.id, set.numero_serie, 'weight');
                                                    const ghostReps = getGhostValue(exercise.id, set.numero_serie, 'reps');

                                                    return (
                                                        <View key={set.id || setIndex} style={styles.setRow}>
                                                            <Text style={styles.setNumber}>{set.numero_serie}</Text>
                                                            <View style={styles.inputGroup}>
                                                                <SetInput
                                                                    value={set.peso_utilizado > 0 ? set.peso_utilizado : ''}
                                                                    placeholder={ghostWeight || '-'}
                                                                    onChange={(val) => handleSetChange(set.id, 'weight', val)}
                                                                    isEditable={isInputEditable}
                                                                    colors={colors}
                                                                />
                                                            </View>
                                                            <View style={styles.inputGroup}>
                                                                <SetInput
                                                                    value={set.repeticiones > 0 ? set.repeticiones : ''}
                                                                    placeholder={ghostReps || '-'}
                                                                    onChange={(val) => handleSetChange(set.id, 'reps', val)}
                                                                    isEditable={isInputEditable}
                                                                    colors={colors}
                                                                />
                                                            </View>
                                                            {isStructureEditable && (
                                                                <TouchableOpacity
                                                                    style={styles.deleteSetButton}
                                                                    onPress={() => handleDeleteSet(set.id, exercise.id)}
                                                                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                                                                >
                                                                    <MaterialIcons name="close" size={20} color={colors.textSecondary} />
                                                                </TouchableOpacity>
                                                            )}
                                                            {mode === 'ACTIVE' && navMode !== 'edit' && (
                                                                <TouchableOpacity
                                                                    style={{ padding: 4, marginLeft: 4 }}
                                                                    onPress={() => handleStartRestTimer(set.id)}
                                                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                                >
                                                                    <MaterialIcons name="timer" size={18} color={colors.textSecondary} />
                                                                </TouchableOpacity>
                                                            )}
                                                        </View>
                                                    );
                                                })
                                            )}

                                            {/* Always show add series button in editable modes */}
                                            {(isStructureEditable || isInputEditable) && (
                                                <TouchableOpacity style={styles.addSetButton} onPress={() => openAddSetsModal(exercise.id)}>
                                                    <MaterialIcons name="add" size={16} color={colors.primary} />
                                                    <Text style={styles.addSetText}>Añadir Series</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}
                                </View>
                            );
                        })
                    )}

                    {/* Action Buttons */}


                    {mode === 'ACTIVE' && navMode !== 'edit' && (
                        <View style={styles.finishButtonContainer}>
                            <TouchableOpacity style={styles.finishButton} onPress={handleFinishWorkout} disabled={saving}>
                                {saving ? (
                                    <ActivityIndicator color={colors.background} />
                                ) : (
                                    <>
                                        <MaterialIcons name="check-circle" size={24} color={colors.background} />
                                        <Text style={styles.finishButtonText}>Finalizar Entrenamiento</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* FAB */}
            {isStructureEditable && exercises.length > 0 && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={navigateToExerciseLibrary}
                >
                    <View style={styles.fabButton}>
                        <MaterialIcons name="add" size={24} color={colors.background} />
                    </View>
                </TouchableOpacity>
            )}

            {/* Add Sets Modal */}
            <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Añadir Series</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.counterContainer}>
                            <TouchableOpacity style={styles.counterButton} onPress={() => setSetsToAdd(Math.max(1, setsToAdd - 1))}>
                                <MaterialIcons name="remove" size={24} color={colors.primary} />
                            </TouchableOpacity>
                            <Text style={styles.counterText}>{setsToAdd}</Text>
                            <TouchableOpacity style={styles.counterButton} onPress={() => setSetsToAdd(setsToAdd + 1)}>
                                <MaterialIcons name="add" size={24} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.confirmAddButton} onPress={handleConfirmAddSets}>
                            <Text style={styles.confirmAddButtonText}>Añadir</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Rest Timer */}
            <RestTimer
                visible={restTimerVisible}
                onDismiss={() => setRestTimerVisible(false)}
                onTimerStop={handleRestTimerStop}
                colors={colors}
            />
        </SafeAreaView>
    );
};

export default WorkoutScreen;
