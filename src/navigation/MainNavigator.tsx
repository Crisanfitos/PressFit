import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFocusedRouteNameFromRoute, RouteProp , useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

import WeeklyPlanNavigator from './WeeklyPlanNavigator';
import ProgressNavigator from './ProgressNavigator';
import ProfileNavigator from './ProfileNavigator';
import ErrorBoundary from '../components/ErrorBoundary';

import FloatingTimerPill from '../components/FloatingTimerPill';
import RestTimerFloatingBar from '../components/timer/RestTimerFloatingBar';
import { View } from 'react-native';

import { getActiveWorkoutParams } from '../services/TimerNotificationService';
import { useWorkoutRecovery } from '../hooks/useWorkoutRecovery';
import ResumeWorkoutModal from '../components/workout/ResumeWorkoutModal';

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

const MainNavigator: React.FC = () => {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const { colors } = theme;
    const { t } = useTranslation();
    const navigation = useNavigation<any>();

    const [isWorkoutFocused, setIsWorkoutFocused] = React.useState(false);
    const { pendingSession, handleResume, handleDiscard } = useWorkoutRecovery(navigation);

    React.useEffect(() => {
        const checkFocus = () => {
            const state = navigation.getState?.();
            if (!state) return;
            let currentRoute: any = state.routes[state.index];
            while (currentRoute?.state?.index !== undefined) {
                currentRoute = currentRoute.state.routes[currentRoute.state.index];
            }
            setIsWorkoutFocused(currentRoute?.name === 'Workout');
        };

        checkFocus();
        const unsubscribe = navigation.addListener('state', checkFocus);
        return unsubscribe;
    }, [navigation]);

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
                        backgroundColor: colors.surfaceContainerLowest || colors.tabBar,
                        borderTopColor: colors.outlineVariant || colors.border,
                        borderTopWidth: 1,
                        paddingBottom: insets.bottom,
                        height: 60 + insets.bottom,
                        elevation: 0,
                        shadowOpacity: 0,
                    },
                    tabBarActiveTintColor: colors.primary,
                    tabBarInactiveTintColor: colors.onSurfaceVariant || colors.textSecondary,
                    tabBarIndicatorStyle: {
                        backgroundColor: colors.primary,
                        height: 2,
                        top: 0,
                    },
                    tabBarShowIcon: true,
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: '600',
                        textTransform: 'none',
                        marginTop: -4,
                    },
                }}
            >
                <Tab.Screen
                    name="Semana"
                    component={WeeklyPlanNavigatorWithBoundary}
                    options={({ route }) => ({
                        swipeEnabled: getSwipeEnabled(route),
                        tabBarLabel: t('navigation.routines', 'Rutinas'),
                        tabBarIcon: ({ color }) => (
                            <MaterialIcons name="calendar-today" size={22} color={color} />
                        ),
                    })}
                />
                <Tab.Screen
                    name="Progreso"
                    component={ProgressNavigatorWithBoundary}
                    options={{
                        tabBarLabel: t('navigation.progreso', 'Progreso'),
                        tabBarIcon: ({ color }) => (
                            <MaterialIcons name="trending-up" size={24} color={color} />
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
            <RestTimerFloatingBar
                visible={isWorkoutFocused ? false : undefined}
                bottomOffset={65 + insets.bottom}
                onPress={handlePillPress}
            />
            <ResumeWorkoutModal
                visible={!isWorkoutFocused && Boolean(pendingSession)}
                session={pendingSession}
                onResume={handleResume}
                onDiscard={handleDiscard}
                colors={colors}
            />
        </View>
    );
};

export default MainNavigator;
