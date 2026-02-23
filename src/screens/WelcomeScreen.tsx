import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';

type WelcomeScreenProps = {
    navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
};

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
    const { theme } = useTheme();
    const { colors } = theme;

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        content: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
        },
        icon: {
            marginBottom: 32,
        },
        title: {
            fontSize: 40,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: 12,
        },
        subtitle: {
            fontSize: 18,
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: 64,
        },
        buttonContainer: {
            width: '100%',
            gap: 16,
        },
        primaryButton: {
            backgroundColor: colors.primary,
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
        },
        primaryButtonText: {
            color: colors.background,
            fontSize: 18,
            fontWeight: 'bold',
        },
        secondaryButton: {
            borderWidth: 2,
            borderColor: colors.primary,
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
        },
        secondaryButtonText: {
            color: colors.primary,
            fontSize: 18,
            fontWeight: 'bold',
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <MaterialIcons
                    name="fitness-center"
                    size={100}
                    color={colors.primary}
                    style={styles.icon}
                />
                <Text style={styles.title}>PressFit</Text>
                <Text style={styles.subtitle}>
                    Tu aplicación de seguimiento de entrenamientos y progreso físico
                </Text>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => navigation.navigate('SignUp')}
                    >
                        <Text style={styles.secondaryButtonText}>Crear Cuenta</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default WelcomeScreen;
