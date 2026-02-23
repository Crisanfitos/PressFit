import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MonthlyCalendarScreen from '../screens/MonthlyCalendarScreen';
import WorkoutDayScreen from '../screens/WorkoutDayScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import ExerciseLibraryScreen from '../screens/ExerciseLibraryScreen';
import ExerciseDetailScreen from '../screens/ExerciseDetailScreen';
import RoutineEditorScreen from '../screens/RoutineEditorScreen';
import RoutineDetailScreen from '../screens/RoutineDetailScreen';

export type WeeklyPlanStackParamList = {
    MonthlyCalendar: undefined;
    WorkoutDay: { date: string; routineId: string; isToday: boolean };
    Workout: { workoutId: string; dayName: string; routineDayId: string };
    ExerciseLibrary: { routineDayId: string; workoutId?: string; mode?: 'add' | 'view' };
    ExerciseDetail: { exerciseId: string };
    RoutineEditor: undefined;
    RoutineDetail: { routineId: string };
};

const Stack = createNativeStackNavigator<WeeklyPlanStackParamList>();

const WeeklyPlanNavigator: React.FC = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MonthlyCalendar" component={MonthlyCalendarScreen} />
            <Stack.Screen name="WorkoutDay" component={WorkoutDayScreen} />
            <Stack.Screen name="Workout" component={WorkoutScreen} />
            <Stack.Screen name="ExerciseLibrary" component={ExerciseLibraryScreen} />
            <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
            <Stack.Screen name="RoutineEditor" component={RoutineEditorScreen} />
            <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} />
        </Stack.Navigator>
    );
};

export default WeeklyPlanNavigator;
