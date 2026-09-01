import React from 'react';
import { Platform, useColorScheme } from 'react-native';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from 'expo-navigation-bar';
import { ThemeProvider, useTheme } from '../../../src/context/ThemeContext';
import { themes } from '../../../src/theme/colors';

jest.mock('expo-navigation-bar', () => ({
    setBackgroundColorAsync: jest.fn().mockResolvedValue(undefined),
    setButtonStyleAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('ThemeContext (PF-265)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        AsyncStorage.clear();
        (NavigationBar.setBackgroundColorAsync as jest.Mock).mockResolvedValue(undefined);
        (NavigationBar.setButtonStyleAsync as jest.Mock).mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('useTheme hook', () => {
        it('throws an error when used outside of a ThemeProvider', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            await expect(async () => {
                await renderHook(() => useTheme());
            }).rejects.toThrow('useTheme must be used within a ThemeProvider');

            consoleSpy.mockRestore();
        });
    });

    describe('ThemeProvider lifecycle and persistence', () => {
        it('defaults to dark theme when no saved preference exists', async () => {
            const hook = await renderHook(() => useTheme(), {
                wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
            });

            await waitFor(() => {
                expect(hook.result.current.themeMode).toBe('dark');
            });

            expect(hook.result.current.theme).toEqual(themes.dark);
        });

        it('loads saved light theme from AsyncStorage', async () => {
            await AsyncStorage.setItem('@pressfit_theme_mode', 'light');

            const hook = await renderHook(() => useTheme(), {
                wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
            });

            await waitFor(() => {
                expect(hook.result.current.themeMode).toBe('light');
            });

            expect(hook.result.current.theme).toEqual(themes.light);
        });

        it('resolves system mode using useColorScheme (light mode)', async () => {
            await AsyncStorage.setItem('@pressfit_theme_mode', 'system');
            (useColorScheme as jest.Mock).mockReturnValue('light');

            const hook = await renderHook(() => useTheme(), {
                wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
            });

            await waitFor(() => {
                expect(hook.result.current.themeMode).toBe('system');
            });

            expect(hook.result.current.theme).toEqual(themes.light);
        });

        it('resolves system mode using useColorScheme (dark mode fallback)', async () => {
            await AsyncStorage.setItem('@pressfit_theme_mode', 'system');
            (useColorScheme as jest.Mock).mockReturnValue('dark');

            const hook = await renderHook(() => useTheme(), {
                wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
            });

            await waitFor(() => {
                expect(hook.result.current.themeMode).toBe('system');
            });

            expect(hook.result.current.theme).toEqual(themes.dark);
        });

        it('ignores invalid saved value and falls back to default dark mode', async () => {
            await AsyncStorage.setItem('@pressfit_theme_mode', 'neon-cyberpunk-invalid');

            const hook = await renderHook(() => useTheme(), {
                wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
            });

            await waitFor(() => {
                expect(hook.result.current.themeMode).toBe('dark');
            });

            expect(hook.result.current.theme).toEqual(themes.dark);
        });

        it('handles error during initial AsyncStorage.getItem load gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('AsyncStorage read failure'));

            const hook = await renderHook(() => useTheme(), {
                wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
            });

            await waitFor(() => {
                expect(hook.result.current.themeMode).toBe('dark');
            });

            expect(consoleSpy).toHaveBeenCalledWith('Error loading theme:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe('setThemeMode and toggleTheme', () => {
        it('persists and updates theme when setThemeMode is called', async () => {
            const hook = await renderHook(() => useTheme(), {
                wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
            });

            await waitFor(() => {
                expect(hook.result.current.themeMode).toBe('dark');
            });

            await act(async () => {
                await hook.result.current.setThemeMode('light');
            });

            expect(hook.result.current.themeMode).toBe('light');
            expect(hook.result.current.theme).toEqual(themes.light);

            const saved = await AsyncStorage.getItem('@pressfit_theme_mode');
            expect(saved).toBe('light');
        });

        it('handles AsyncStorage.setItem failure during setThemeMode gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Disk full'));

            const hook = await renderHook(() => useTheme(), {
                wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
            });

            await waitFor(() => {
                expect(hook.result.current.themeMode).toBe('dark');
            });

            await act(async () => {
                await hook.result.current.setThemeMode('light');
            });

            expect(hook.result.current.themeMode).toBe('light');
            expect(consoleSpy).toHaveBeenCalledWith('Error saving theme:', expect.any(Error));
            consoleSpy.mockRestore();
        });

        it('toggles from dark to light', async () => {
            const hook = await renderHook(() => useTheme(), {
                wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
            });

            await waitFor(() => {
                expect(hook.result.current.themeMode).toBe('dark');
            });

            await act(async () => {
                hook.result.current.toggleTheme();
            });

            expect(hook.result.current.themeMode).toBe('light');
            expect(hook.result.current.theme).toEqual(themes.light);
        });

        it('toggles from light to dark', async () => {
            await AsyncStorage.setItem('@pressfit_theme_mode', 'light');

            const hook = await renderHook(() => useTheme(), {
                wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
            });

            await waitFor(() => {
                expect(hook.result.current.themeMode).toBe('light');
            });

            await act(async () => {
                hook.result.current.toggleTheme();
            });

            expect(hook.result.current.themeMode).toBe('dark');
            expect(hook.result.current.theme).toEqual(themes.dark);
        });
    });

    describe('Android NavigationBar synchronization', () => {
        const originalPlatform = Platform.OS;
        const originalVersion = Platform.Version;

        afterEach(() => {
            Object.defineProperty(Platform, 'OS', { value: originalPlatform, configurable: true });
            Object.defineProperty(Platform, 'Version', { value: originalVersion, configurable: true });
        });

        it('calls setBackgroundColorAsync and setButtonStyleAsync on Android API < 30', async () => {
            Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
            Object.defineProperty(Platform, 'Version', { value: 28, configurable: true });

            const hook = await renderHook(() => useTheme(), {
                wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
            });

            await waitFor(() => {
                expect(hook.result.current.themeMode).toBe('dark');
            });

            expect(NavigationBar.setBackgroundColorAsync).toHaveBeenCalledWith(themes.dark.colors.background);
            expect(NavigationBar.setButtonStyleAsync).toHaveBeenCalledWith('light');
        });

        it('parses string version for Android API < 30', async () => {
            Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
            Object.defineProperty(Platform, 'Version', { value: '29', configurable: true });

            const hook = await renderHook(() => useTheme(), {
                wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
            });

            await waitFor(() => {
                expect(hook.result.current.themeMode).toBe('dark');
            });

            expect(NavigationBar.setBackgroundColorAsync).toHaveBeenCalledWith(themes.dark.colors.background);
        });

        it('skips setBackgroundColorAsync on Android API 30+ (edge-to-edge mode)', async () => {
            Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
            Object.defineProperty(Platform, 'Version', { value: 33, configurable: true });

            const hook = await renderHook(() => useTheme(), {
                wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
            });

            await waitFor(() => {
                expect(hook.result.current.themeMode).toBe('dark');
            });

            expect(NavigationBar.setBackgroundColorAsync).not.toHaveBeenCalled();
            expect(NavigationBar.setButtonStyleAsync).toHaveBeenCalledWith('light');
        });

        it('sets button style to dark when active theme is light on Android', async () => {
            Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
            Object.defineProperty(Platform, 'Version', { value: 33, configurable: true });
            await AsyncStorage.setItem('@pressfit_theme_mode', 'light');

            const hook = await renderHook(() => useTheme(), {
                wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
            });

            await waitFor(() => {
                expect(hook.result.current.themeMode).toBe('light');
            });

            expect(NavigationBar.setButtonStyleAsync).toHaveBeenCalledWith('dark');
        });

        it('sets button style to light when system mode resolves to dark on Android', async () => {
            Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
            Object.defineProperty(Platform, 'Version', { value: 33, configurable: true });
            (useColorScheme as jest.Mock).mockReturnValue('dark');
            await AsyncStorage.setItem('@pressfit_theme_mode', 'system');

            const hook = await renderHook(() => useTheme(), {
                wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
            });

            await waitFor(() => {
                expect(hook.result.current.themeMode).toBe('system');
            });

            expect(NavigationBar.setButtonStyleAsync).toHaveBeenCalledWith('light');
        });

        it('handles NavigationBar rejection without throwing', async () => {
            Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
            Object.defineProperty(Platform, 'Version', { value: 28, configurable: true });

            (NavigationBar.setBackgroundColorAsync as jest.Mock).mockRejectedValueOnce(new Error('Nav error'));
            (NavigationBar.setButtonStyleAsync as jest.Mock).mockRejectedValueOnce(new Error('Style error'));

            const hook = await renderHook(() => useTheme(), {
                wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
            });

            await waitFor(() => {
                expect(hook.result.current.themeMode).toBe('dark');
            });

            expect(hook.result.current.themeMode).toBe('dark');
        });
    });
});
