import React, { useContext, useMemo } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import SplashScreen from '../screens/SplashScreen';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const RootNavigator: React.FC = () => {
    const authContext = useContext(AuthContext);
    const { theme } = useTheme();

    // Create navigation theme based on app theme
    const navigationTheme = useMemo(() => {
        const baseTheme = theme.mode === 'dark' ? DarkTheme : DefaultTheme;
        return {
            ...baseTheme,
            colors: {
                ...baseTheme.colors,
                background: theme.colors.background,
                card: theme.colors.surface,
                text: theme.colors.text,
                border: theme.colors.border,
                primary: theme.colors.primary,
            },
        };
    }, [theme]);

    if (!authContext) {
        return null;
    }

    const { isAuthenticated, isLoading } = authContext;

    if (isLoading) {
        return (
            <>
                <StatusBar
                    barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
                    backgroundColor={theme.colors.background}
                />
                <SplashScreen />
            </>
        );
    }

    return (
        <>
            <StatusBar
                barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={theme.colors.background}
            />
            <NavigationContainer theme={navigationTheme}>
                {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
            </NavigationContainer>
        </>
    );
};

export default RootNavigator;
