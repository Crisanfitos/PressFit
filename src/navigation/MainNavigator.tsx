import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFocusedRouteNameFromRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

import WeeklyPlanNavigator from './WeeklyPlanNavigator';
import ProgressNavigator from './ProgressNavigator';
import ProfileNavigator from './ProfileNavigator';

export type MainTabParamList = {
    Semana: undefined;
    Progreso: undefined;
    Perfil: undefined;
};

const Tab = createMaterialTopTabNavigator<MainTabParamList>();

const MainNavigator: React.FC = () => {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const { colors } = theme;

    const getSwipeEnabled = (route: RouteProp<MainTabParamList, keyof MainTabParamList>) => {
        const routeName = getFocusedRouteNameFromRoute(route) ?? 'MonthlyCalendar';
        // Disabled swipe on detail screens across all subnavigators
        const disabledScreens = ['Workout', 'WorkoutDay', 'ExerciseLibrary', 'ExerciseDetail', 'RoutineEditor', 'RoutineDetail', 'WeeklyCalendarV2', 'ExerciseTracking'];
        return !disabledScreens.includes(routeName);
    };

    return (
        <Tab.Navigator
            tabBarPosition="bottom"
            initialRouteName="Semana"
            screenOptions={{
                swipeEnabled: true,
                tabBarStyle: {
                    backgroundColor: colors.tabBar,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    paddingBottom: insets.bottom,
                    height: 60 + insets.bottom,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarIndicatorStyle: {
                    backgroundColor: colors.primary,
                    top: 0,
                },
                tabBarShowIcon: true,
                tabBarLabelStyle: {
                    fontSize: 10,
                    textTransform: 'none',
                    marginTop: -5,
                },
            }}
        >
            <Tab.Screen
                name="Semana"
                component={WeeklyPlanNavigator}
                options={({ route }) => ({
                    swipeEnabled: getSwipeEnabled(route),
                    tabBarLabel: 'Semana',
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons name="calendar-today" size={24} color={color} />
                    ),
                })}
            />
            <Tab.Screen
                name="Progreso"
                component={ProgressNavigator}
                options={{
                    tabBarLabel: 'Progreso',
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons name="bar-chart" size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Perfil"
                component={ProfileNavigator}
                options={{
                    tabBarLabel: 'Perfil',
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons name="person" size={24} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

export default MainNavigator;
