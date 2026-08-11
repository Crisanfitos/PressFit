import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFocusedRouteNameFromRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

import WeeklyPlanNavigator from './WeeklyPlanNavigator';
import ProgressNavigator from './ProgressNavigator';
import ProfileNavigator from './ProfileNavigator';
import ErrorBoundary from '../components/ErrorBoundary';

const withErrorBoundary = <P extends object>(
    Component: React.ComponentType<P>
): React.FC<P> => {
    return (props: P) => (
        <ErrorBoundary>
            <Component {...props} />
        </ErrorBoundary>
    );
};

const WeeklyPlanNavigatorWithBoundary = withErrorBoundary(WeeklyPlanNavigator);
const ProgressNavigatorWithBoundary = withErrorBoundary(ProgressNavigator);
const ProfileNavigatorWithBoundary = withErrorBoundary(ProfileNavigator);

export type MainTabParamList = {
    Semana: undefined;
    Progreso: undefined;
    Perfil: undefined;
};

const Tab = createMaterialTopTabNavigator<MainTabParamList>();

import FloatingTimerPill from '../components/FloatingTimerPill';
import { View } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { getActiveWorkoutParams } from '../services/TimerNotificationService';

const MainNavigator: React.FC = () => {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const { colors } = theme;
    const { t } = useTranslation();
    const navigation = useNavigation<any>();

    const isWorkoutFocused = useNavigationState((state) => {
        if (!state) return false;
        let currentRoute: any = state.routes[state.index];
        while (currentRoute?.state?.index !== undefined) {
            currentRoute = currentRoute.state.routes[currentRoute.state.index];
        }
        return currentRoute?.name === 'Workout';
    });

    const getSwipeEnabled = (route: RouteProp<MainTabParamList, keyof MainTabParamList>) => {
        const routeName = getFocusedRouteNameFromRoute(route) ?? 'MonthlyCalendar';
        // Disabled swipe on detail screens across all subnavigators
        const disabledScreens = ['Workout', 'WorkoutDay', 'ExerciseLibrary', 'ExerciseDetail', 'RoutineEditor', 'RoutineDetail', 'WeeklyCalendarV2', 'ExerciseTracking', 'ExerciseCatalog'];
        return !disabledScreens.includes(routeName);
    };

    const handlePillPress = async () => {
        const params = await getActiveWorkoutParams();
        if (params && (params.routineDayId || params.workoutId)) {
            navigation.navigate('Semana', {
                screen: 'Workout',
                params,
            });
        } else {
            navigation.navigate('Semana');
        }
    };

    return (
        <View style={{ flex: 1 }}>
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
                    component={WeeklyPlanNavigatorWithBoundary}
                    options={({ route }) => ({
                        swipeEnabled: getSwipeEnabled(route),
                        tabBarLabel: t('navigation.semana', 'Semana'),
                        tabBarIcon: ({ color }) => (
                            <MaterialIcons name="calendar-today" size={24} color={color} />
                        ),
                    })}
                />
                <Tab.Screen
                    name="Progreso"
                    component={ProgressNavigatorWithBoundary}
                    options={{
                        tabBarLabel: t('navigation.progreso', 'Progreso'),
                        tabBarIcon: ({ color }) => (
                            <MaterialIcons name="bar-chart" size={24} color={color} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="Perfil"
                    component={ProfileNavigatorWithBoundary}
                    options={{
                        tabBarLabel: t('navigation.perfil', 'Perfil'),
                        tabBarIcon: ({ color }) => (
                            <MaterialIcons name="person" size={24} color={color} />
                        ),
                    }}
                />
            </Tab.Navigator>
            <FloatingTimerPill visible={isWorkoutFocused ? false : undefined} onPress={handlePillPress} />
        </View>
    );
};

export default MainNavigator;
