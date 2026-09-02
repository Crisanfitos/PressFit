import { LinkingOptions } from '@react-navigation/native';
import { Linking } from 'react-native';
import * as Notifications from 'expo-notifications';

export const linkingConfig: LinkingOptions<any> = {
    prefixes: ['pressfit://', 'https://pressfit.app', 'http://pressfit.app'],
    config: {
        screens: {
            Semana: {
                initialRouteName: 'MonthlyCalendar',
                screens: {
                    MonthlyCalendar: 'calendar',
                    Workout: 'workout/:routineDayId',
                    WorkoutDay: 'workout-day/:routineId/:date',
                    ExerciseDetail: 'exercise/:exerciseId',
                    ExerciseLibrary: 'exercise-library',
                    RoutineEditor: 'routine-editor',
                    RoutineDetail: 'routine/:routineId',
                    ExerciseCatalog: 'exercise-catalog',
                    PresetRoutines: 'preset-routines',
                },
            },
            Progreso: {
                initialRouteName: 'ProgressMain',
                screens: {
                    ProgressMain: 'progress',
                    MonthlyProgress: 'progress/monthly',
                    WeeklyProgress: 'progress/weekly',
                    DailyProgress: 'progress/daily',
                    ExerciseTracking: 'progress/exercise-tracking',
                    ExerciseProgressDetail: 'progress/exercise/:exerciseId',
                    PhysicalProgress: 'progress/physical',
                },
            },
            Perfil: {
                initialRouteName: 'ProfileMain',
                screens: {
                    ProfileMain: 'profile',
                    PhysicalProgress: 'profile/physical',
                },
            },
            Welcome: 'welcome',
            Login: 'login',
            SignUp: 'signup',
        },
    },
    async getInitialURL() {
        try {
            // 1. URL from native deep link
            const url = await Linking.getInitialURL();
            if (url) return url;

            // 2. URL from push/local notification response
            const response = await Notifications.getLastNotificationResponseAsync();
            const notifUrl = response?.notification?.request?.content?.data?.url;
            if (typeof notifUrl === 'string') {
                return notifUrl;
            }
        } catch (e) {
            console.warn('[Linking] Error getting initial URL:', e);
        }
        return null;
    },
    subscribe(listener: (url: string) => void) {
        // Deep link event listener
        const onReceiveURL = ({ url }: { url: string }) => listener(url);
        const eventSubscription = Linking.addEventListener('url', onReceiveURL);

        // Expo notification response listener
        const notifSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
            const url = response?.notification?.request?.content?.data?.url;
            if (typeof url === 'string') {
                listener(url);
            }
        });

        return () => {
            eventSubscription?.remove?.();
            notifSubscription?.remove?.();
        };
    },
};

export default linkingConfig;
