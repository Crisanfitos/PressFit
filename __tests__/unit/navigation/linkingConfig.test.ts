import { linkingConfig } from '../../../src/navigation/linkingConfig';
import { Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getStateFromPath } from '@react-navigation/native';

jest.mock('expo-notifications', () => ({
    getLastNotificationResponseAsync: jest.fn(),
    addNotificationResponseReceivedListener: jest.fn(),
}));

describe('linkingConfig (PF-279)', () => {
    let getInitialUrlSpy: jest.SpyInstance;
    let addEventListenerSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        getInitialUrlSpy = jest.spyOn(Linking, 'getInitialURL').mockImplementation(() => Promise.resolve(null));
        addEventListenerSpy = jest.spyOn(Linking, 'addEventListener').mockImplementation(() => ({
            remove: jest.fn(),
        } as any));
    });

    afterEach(() => {
        getInitialUrlSpy.mockRestore();
        addEventListenerSpy.mockRestore();
    });

    describe('prefixes and configuration', () => {
        it('includes pressfit:// and domain prefixes', () => {
            expect(linkingConfig.prefixes).toContain('pressfit://');
            expect(linkingConfig.prefixes).toContain('https://pressfit.app');
            expect(linkingConfig.prefixes).toContain('http://pressfit.app');
        });

        it('has valid screens configuration for Semana, Progreso, and Perfil', () => {
            const screens = linkingConfig.config?.screens as any;
            expect(screens).toBeDefined();

            // Semana stack
            expect(screens.Semana.screens.Workout).toBe('workout/:routineDayId');
            expect(screens.Semana.screens.ExerciseDetail).toBe('exercise/:exerciseId');
            expect(screens.Semana.screens.MonthlyCalendar).toBe('calendar');
            expect(screens.Semana.screens.WorkoutDay).toBe('workout-day/:routineId/:date');

            // Progreso stack
            expect(screens.Progreso.screens.ProgressMain).toBe('progress');

            // Perfil stack
            expect(screens.Perfil.screens.ProfileMain).toBe('profile');
        });
    });

    describe('getStateFromPath parsing', () => {
        it('resolves workout/:routineDayId to Workout screen with params', () => {
            const state = getStateFromPath('workout/day-leg-1', linkingConfig.config);
            expect(state).toBeDefined();
            const semanaRoute = state?.routes.find((r) => r.name === 'Semana');
            expect(semanaRoute).toBeDefined();
            const nestedState: any = semanaRoute?.state;
            const workoutRoute = nestedState?.routes.find((r: any) => r.name === 'Workout');
            expect(workoutRoute).toBeDefined();
            expect(workoutRoute.params).toEqual({ routineDayId: 'day-leg-1' });
        });

        it('resolves exercise/:exerciseId to ExerciseDetail screen with params', () => {
            const state = getStateFromPath('exercise/bench-press-101', linkingConfig.config);
            expect(state).toBeDefined();
            const semanaRoute = state?.routes.find((r) => r.name === 'Semana');
            expect(semanaRoute).toBeDefined();
            const nestedState: any = semanaRoute?.state;
            const exerciseRoute = nestedState?.routes.find((r: any) => r.name === 'ExerciseDetail');
            expect(exerciseRoute).toBeDefined();
            expect(exerciseRoute.params).toEqual({ exerciseId: 'bench-press-101' });
        });

        it('resolves calendar to MonthlyCalendar screen', () => {
            const state = getStateFromPath('calendar', linkingConfig.config);
            expect(state).toBeDefined();
            const semanaRoute = state?.routes.find((r) => r.name === 'Semana');
            expect(semanaRoute).toBeDefined();
            const nestedState: any = semanaRoute?.state;
            const calendarRoute = nestedState?.routes.find((r: any) => r.name === 'MonthlyCalendar');
            expect(calendarRoute).toBeDefined();
        });

        it('resolves progress to ProgressMain screen', () => {
            const state = getStateFromPath('progress', linkingConfig.config);
            expect(state).toBeDefined();
            const progresoRoute = state?.routes.find((r) => r.name === 'Progreso');
            expect(progresoRoute).toBeDefined();
            const nestedState: any = progresoRoute?.state;
            const progressMainRoute = nestedState?.routes.find((r: any) => r.name === 'ProgressMain');
            expect(progressMainRoute).toBeDefined();
        });

        it('resolves profile to ProfileMain screen', () => {
            const state = getStateFromPath('profile', linkingConfig.config);
            expect(state).toBeDefined();
            const perfilRoute = state?.routes.find((r) => r.name === 'Perfil');
            expect(perfilRoute).toBeDefined();
            const nestedState: any = perfilRoute?.state;
            const profileMainRoute = nestedState?.routes.find((r: any) => r.name === 'ProfileMain');
            expect(profileMainRoute).toBeDefined();
        });
    });

    describe('getInitialURL', () => {
        it('returns native deep link URL if available', async () => {
            getInitialUrlSpy.mockResolvedValueOnce('pressfit://workout/day-42');

            const url = await linkingConfig.getInitialURL?.();
            expect(url).toBe('pressfit://workout/day-42');
            expect(Notifications.getLastNotificationResponseAsync).not.toHaveBeenCalled();
        });

        it('falls back to notification URL if native Linking returns null', async () => {
            getInitialUrlSpy.mockResolvedValueOnce(null);
            (Notifications.getLastNotificationResponseAsync as jest.Mock).mockResolvedValueOnce({
                notification: {
                    request: {
                        content: {
                            data: { url: 'pressfit://exercise/bench-press' },
                        },
                    },
                },
            });

            const url = await linkingConfig.getInitialURL?.();
            expect(url).toBe('pressfit://exercise/bench-press');
        });

        it('returns null if neither native URL nor notification URL is found', async () => {
            getInitialUrlSpy.mockResolvedValueOnce(null);
            (Notifications.getLastNotificationResponseAsync as jest.Mock).mockResolvedValueOnce(null);

            const url = await linkingConfig.getInitialURL?.();
            expect(url).toBeNull();
        });

        it('handles exceptions gracefully and returns null', async () => {
            getInitialUrlSpy.mockRejectedValueOnce(new Error('Native error'));

            const url = await linkingConfig.getInitialURL?.();
            expect(url).toBeNull();
        });
    });

    describe('subscribe', () => {
        it('registers URL listener and triggers callback on event', () => {
            let registeredUrlHandler: any;
            addEventListenerSpy.mockImplementationOnce((event: string, handler: any) => {
                registeredUrlHandler = handler;
                return { remove: jest.fn() };
            });
            (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValueOnce({
                remove: jest.fn(),
            });

            const listener = jest.fn();
            linkingConfig.subscribe?.(listener);

            expect(addEventListenerSpy).toHaveBeenCalledWith('url', expect.any(Function));
            registeredUrlHandler({ url: 'pressfit://calendar' });
            expect(listener).toHaveBeenCalledWith('pressfit://calendar');
        });

        it('triggers listener when notification contains a deep link url', () => {
            addEventListenerSpy.mockReturnValueOnce({ remove: jest.fn() });
            let registeredNotifHandler: any;
            (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementationOnce(
                (handler: any) => {
                    registeredNotifHandler = handler;
                    return { remove: jest.fn() };
                }
            );

            const listener = jest.fn();
            linkingConfig.subscribe?.(listener);

            registeredNotifHandler({
                notification: {
                    request: {
                        content: {
                            data: { url: 'pressfit://workout/day-99' },
                        },
                    },
                },
            });

            expect(listener).toHaveBeenCalledWith('pressfit://workout/day-99');
        });

        it('unsubscribes listeners cleanly on cleanup', () => {
            const removeUrlMock = jest.fn();
            const removeNotifMock = jest.fn();

            addEventListenerSpy.mockReturnValueOnce({ remove: removeUrlMock });
            (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValueOnce({
                remove: removeNotifMock,
            });

            const cleanup = linkingConfig.subscribe?.(jest.fn());
            cleanup?.();

            expect(removeUrlMock).toHaveBeenCalled();
            expect(removeNotifMock).toHaveBeenCalled();
        });
    });
});
