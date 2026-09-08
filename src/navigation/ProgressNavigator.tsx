import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProgressScreen from '../screens/ProgressScreen';
import MonthlyProgressScreen from '../screens/MonthlyProgressScreen';
import WeeklyProgressScreen from '../screens/WeeklyProgressScreen';
import DailyProgressScreen from '../screens/DailyProgressScreen';
import ExerciseTrackingScreen from '../screens/ExerciseTrackingScreen';
import PhysicalProgressScreen from '../screens/PhysicalProgressScreen';
import HypertrophyVolumeScreen from '../screens/HypertrophyVolumeScreen';

export type ProgressStackParamList = {
    ProgressMain: undefined;
    MonthlyProgress: undefined;
    WeeklyProgress: undefined;
    DailyProgress: { date?: string };
    ExerciseTracking: { exerciseId?: string };
    ExerciseProgressDetail: { exerciseId: string };
    PhysicalProgress: undefined;
    HypertrophyVolume: undefined;
};

const Stack = createNativeStackNavigator<ProgressStackParamList>();

const ProgressNavigator: React.FC = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="ProgressMain" component={ProgressScreen} />
            <Stack.Screen name="MonthlyProgress" component={MonthlyProgressScreen} />
            <Stack.Screen name="WeeklyProgress" component={WeeklyProgressScreen} />
            <Stack.Screen name="DailyProgress" component={DailyProgressScreen} />
            <Stack.Screen name="ExerciseTracking" component={ExerciseTrackingScreen} />
            <Stack.Screen name="ExerciseProgressDetail" component={require('../screens/ExerciseProgressDetailScreen').default} />
            <Stack.Screen name="PhysicalProgress" component={PhysicalProgressScreen} />
            <Stack.Screen name="HypertrophyVolume" component={HypertrophyVolumeScreen} />
        </Stack.Navigator>
    );
};

export default ProgressNavigator;
