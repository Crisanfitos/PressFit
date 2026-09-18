import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import {
    useWorkoutDayScreenState,
    WorkoutDayHeader,
    WorkoutDayExerciseList,
    WorkoutDayActionButton,
    ManualFinishWorkoutModal,
} from '../components/workoutDay';

type WorkoutDayScreenProps = {
    navigation: any;
    route: any;
};

const WorkoutDayScreen: React.FC<WorkoutDayScreenProps> = ({ navigation, route }) => {
    const { theme } = useTheme();
    const { colors } = theme;

    const {
        routineId,
        selectedDate,
        isToday,
        isPendingPreviousWorkout,
        showManualFinishModal,
        setShowManualFinishModal,
        loading,
        dayData,
        exercises,
        workoutStats,
        activeWorkout,
        formatDate,
        formatDuration,
        handleMainButtonPress,
        handleManualFinishWorkout,
    } = useWorkoutDayScreenState(navigation, route);

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
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
        <SafeAreaView style={styles.container} testID="workout-day-screen">
            <WorkoutDayHeader
                dayData={dayData}
                routineId={routineId}
                selectedDate={selectedDate}
                workoutStats={workoutStats}
                activeWorkout={activeWorkout}
                isToday={isToday}
                isPendingPreviousWorkout={isPendingPreviousWorkout}
                formatDate={formatDate}
                formatDuration={formatDuration}
                onBack={() => navigation.goBack()}
            />

            <WorkoutDayExerciseList
                exercises={exercises}
                workoutStats={workoutStats}
            />

            <WorkoutDayActionButton
                isToday={isToday}
                hasContent={exercises.length > 0 || !!dayData}
                workoutStats={workoutStats}
                activeWorkout={activeWorkout}
                isPendingPreviousWorkout={isPendingPreviousWorkout}
                onPress={handleMainButtonPress}
            />

            <ManualFinishWorkoutModal
                visible={showManualFinishModal}
                dayName={dayData?.nombre_dia}
                startTime={dayData?.hora_inicio || activeWorkout?.hora_inicio}
                workoutDate={selectedDate}
                onClose={() => setShowManualFinishModal(false)}
                onConfirm={handleManualFinishWorkout}
            />
        </SafeAreaView>
    );
};

export default WorkoutDayScreen;
