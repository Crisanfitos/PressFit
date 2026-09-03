import React, { useContext, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import KeyboardAwareContainer from '../components/KeyboardAwareContainer';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { useWorkoutController } from '../controllers/useWorkoutController';
import { saveActiveWorkoutParams } from '../services/TimerNotificationService';
import {
    WorkoutHeader,
    ExerciseCard,
    WorkoutActions,
    WorkoutPlaceholder,
    WorkoutModals,
    StaleWarningBanner,
    getGhostValue,
    confirmDeleteExercise,
    confirmDeleteSet,
    useWorkoutScreenState,
} from '../components/workout';

type WorkoutScreenProps = {
    navigation: any;
    route: any;
};

const WorkoutScreen: React.FC<WorkoutScreenProps> = ({ navigation, route }) => {
    const { t } = useTranslation();
    const { routineDayId, dayName, workoutId: initialWorkoutId, dayOfWeek, mode: navMode } = route.params || {};
    const { colors } = useTheme().theme;
    const user = useContext(AuthContext)?.user;

    useEffect(() => {
        if (routineDayId || initialWorkoutId) {
            saveActiveWorkoutParams({ routineDayId, workoutId: initialWorkoutId, dayName, dayOfWeek, mode: navMode });
        }
    }, [routineDayId, initialWorkoutId, dayName, dayOfWeek, navMode]);

    const {
        workout,
        exercises,
        loading: controllerLoading,
        mode,
        previousWorkout,
        addSet,
        addSets,
        updateSet,
        deleteSet,
        removeExercise,
        finishWorkout,
        updateWeightType,
        reloadExercises,
    } = useWorkoutController(initialWorkoutId || null, routineDayId, user?.id || '', dayOfWeek || 0, navMode === 'edit');

    const state = useWorkoutScreenState({
        controllerLoading,
        mode,
        exercises,
        addSets,
        updateSet,
        reloadExercises,
        navigation,
    });

    const navigateToExerciseLibrary = () => {
        state.needsRefreshRef.current = true;
        navigation.navigate('ExerciseLibrary', { routineDayId: workout?.id || routineDayId });
    };

    const handleFinishWorkout = () => {
        Alert.alert(t('workout.finishWorkout', 'Finalizar Entrenamiento'), t('workout.finishWorkoutConfirm', '¿Deseas finalizar este entrenamiento?'), [
            { text: t('common.cancel', 'Cancelar'), style: 'cancel' },
            {
                text: t('common.finish', 'Finalizar'),
                onPress: async () => {
                    state.setSaving(true);
                    const success = await finishWorkout();
                    state.setSaving(false);
                    if (success) {
                        Alert.alert(t('workout.workoutCompletedTitle', '¡Completado!'), t('workout.workoutSavedSuccess', 'Entrenamiento guardado correctamente'), [
                            { text: 'OK', onPress: () => navigation.goBack() },
                        ]);
                    } else {
                        Alert.alert(t('common.error', 'Error'), 'No se pudo finalizar el entrenamiento');
                    }
                },
            },
        ]);
    };

    const isInputEditable = mode === 'ACTIVE' || navMode === 'edit';
    const isStructureEditable = navMode === 'edit';

    if (controllerLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} testID="workout-screen">
            <WorkoutHeader
                dayName={dayName}
                fechaDia={workout?.fecha_dia}
                descripcion={workout?.descripcion}
                routineDayId={routineDayId}
                workoutId={workout?.id}
                colors={colors}
                onBack={() => navigation.goBack()}
            />
            <KeyboardAwareContainer style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
                <View style={styles.scrollView}>
                    {previousWorkout?.isStale && <StaleWarningBanner daysDiff={previousWorkout.days_diff} />}
                    {exercises.length === 0 ? (
                        <WorkoutPlaceholder isStructureEditable={isStructureEditable} colors={colors} t={t} onAddExercise={navigateToExerciseLibrary} />
                    ) : (
                        exercises.map((exercise, index) => (
                            <ExerciseCard
                                key={`${exercise.id}-${index}`}
                                exercise={exercise}
                                index={index}
                                isCollapsed={!!state.collapsedExercises[exercise.id]}
                                isInputEditable={isInputEditable}
                                isStructureEditable={isStructureEditable}
                                mode={mode}
                                navMode={navMode}
                                colors={colors}
                                previousWorkout={previousWorkout}
                                lastCompletedSetId={state.lastCompletedSetId}
                                restTimerVisible={state.restTimerVisible}
                                savedTimerSetIds={state.savedTimerSetIds}
                                onToggleCollapse={state.toggleExerciseCollapsed}
                                onUpdateWeightType={updateWeightType}
                                onNavigateDetail={(id) => navigation.navigate('ExerciseDetail', { exerciseId: id })}
                                onDeleteExercise={(id, name, reId) => confirmDeleteExercise(name, async () => { state.setSaving(true); await removeExercise(id, reId); state.setSaving(false); })}
                                onSetChange={updateSet}
                                onDeleteSet={(sId, eId) => confirmDeleteSet(async () => { state.setSaving(true); await deleteSet(sId, eId); state.setSaving(false); })}
                                onStartRestTimer={state.handleStartRestTimer}
                                onAddSet={async (id) => { state.setSaving(true); await addSet(id); state.setSaving(false); }}
                                getGhostValue={(eId, sNum, fld) => getGhostValue(previousWorkout, eId, sNum, fld)}
                            />
                        ))
                    )}
                    <WorkoutActions mode={mode} navMode={navMode} saving={state.saving} colors={colors} t={t} onFinishWorkout={handleFinishWorkout} />
                    <View style={{ height: 100 }} />
                </View>
            </KeyboardAwareContainer>
            {isStructureEditable && exercises.length > 0 && (
                <TouchableOpacity testID="add-exercise-fab" style={styles.fab} onPress={navigateToExerciseLibrary}>
                    <View style={[styles.fabButton, { backgroundColor: colors.primary }]}>
                        <MaterialIcons name="add" size={24} color={colors.background} />
                    </View>
                </TouchableOpacity>
            )}
            <WorkoutModals
                modalVisible={state.modalVisible}
                setsToAdd={state.setsToAdd}
                colors={colors}
                onCloseModal={() => state.setModalVisible(false)}
                onIncrementSets={() => state.setSetsToAdd((v) => v + 1)}
                onDecrementSets={() => state.setSetsToAdd((v) => Math.max(1, v - 1))}
                onConfirmAddSets={state.handleConfirmAddSets}
                restTimerVisible={state.restTimerVisible}
                onRestTimerDismiss={state.handleRestTimerDismiss}
                onRestTimerStop={state.handleRestTimerStop}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollView: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
    fab: { position: 'absolute', bottom: 90, right: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8 },
    fabButton: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});

export default WorkoutScreen;
