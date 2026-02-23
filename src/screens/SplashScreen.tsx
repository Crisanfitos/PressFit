import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const SplashScreen: React.FC = () => {
    const { theme } = useTheme();
    const { colors } = theme;

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
            alignItems: 'center',
            justifyContent: 'center',
        },
        icon: {
            marginBottom: 24,
        },
        title: {
            fontSize: 36,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: 8,
        },
        subtitle: {
            fontSize: 16,
            color: colors.textSecondary,
            marginBottom: 48,
        },
        loader: {
            marginTop: 24,
        },
    });

    return (
        <View style={styles.container}>
            <MaterialIcons
                name="fitness-center"
                size={80}
                color={colors.primary}
                style={styles.icon}
            />
            <Text style={styles.title}>PressFit</Text>
            <Text style={styles.subtitle}>Tu Progreso, Tu Poder</Text>
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        </View>
    );
};

export default SplashScreen;
