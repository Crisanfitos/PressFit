import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MonthlyCalendarScreen from '../screens/MonthlyCalendarScreen';
import WorkoutDayScreen from '../screens/WorkoutDayScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import ExerciseLibraryScreen from '../screens/ExerciseLibraryScreen';
import ExerciseDetailScreen from '../screens/ExerciseDetailScreen';
import RoutineEditorScreen from '../screens/RoutineEditorScreen';
import RoutineDetailScreen from '../screens/RoutineDetailScreen';
import ExerciseCatalogScreen from '../screens/ExerciseCatalogScreen';
import { PresetRoutinesScreen } from '../screens/PresetRoutinesScreen';
import { SwapExerciseScreen } from '../screens/SwapExerciseScreen';

export type WeeklyPlanStackParamList = {
    MonthlyCalendar: undefined;
    WorkoutDay: { date: string; routineId: string; isToday: boolean };
    Workout: { workoutId: string; dayName: string; routineDayId: string };
    ExerciseLibrary: { routineDayId: string; workoutId?: string; mode?: 'add' | 'view' };
    ExerciseDetail: { exerciseId: string };
    RoutineEditor: undefined;
    RoutineDetail: { routineId: string };
    ExerciseCatalog: undefined;
    PresetRoutines: undefined;
    SwapExercise: {
        workoutId: string;
        routineDayId?: string;
        oldExercise: {
            id: string;
            titulo: string;
            routine_exercise_id: string;
            target_sets?: number;
            sets?: any[];
            series?: any[];
            grupo_muscular?: string;
            tipo_peso?: any;
            imagen_url?: string;
        };
    };
};

const Stack = createNativeStackNavigator<WeeklyPlanStackParamList>();

const WeeklyPlanNavigator: React.FC = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="MonthlyCalendar" component={MonthlyCalendarScreen} />
            <Stack.Screen name="WorkoutDay" component={WorkoutDayScreen} />
            <Stack.Screen name="Workout" component={WorkoutScreen} />
            <Stack.Screen name="ExerciseLibrary" component={ExerciseLibraryScreen} />
            <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
            <Stack.Screen name="RoutineEditor" component={RoutineEditorScreen} />
            <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} />
            <Stack.Screen name="ExerciseCatalog" component={ExerciseCatalogScreen} />
            <Stack.Screen name="PresetRoutines" component={PresetRoutinesScreen} />
            <Stack.Screen name="SwapExercise" component={SwapExerciseScreen} />
        </Stack.Navigator>
    );
};


export default WeeklyPlanNavigator;
