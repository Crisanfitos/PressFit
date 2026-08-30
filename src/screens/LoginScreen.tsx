import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import KeyboardAwareContainer from '../components/KeyboardAwareContainer';
import { mapAuthError } from '../services/AuthService';

type LoginScreenProps = {
    navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const { theme } = useTheme();
    const { colors } = theme;
    const { t } = useTranslation();
    const authContext = useContext(AuthContext);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleEmailLogin = async () => {
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await authContext?.signInWithEmail(email, password);
        } catch (err: any) {
            setError(mapAuthError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);

        try {
            await authContext?.signInWithGoogle();
        } catch (err: any) {
            setError(mapAuthError(err));
        } finally {
            setLoading(false);
        }
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        scrollContent: {
            flexGrow: 1,
            justifyContent: 'center',
            padding: 24,
        },
        header: {
            alignItems: 'center',
            marginBottom: 48,
        },
        title: {
            fontSize: 32,
            fontWeight: 'bold',
            color: colors.text,
            marginTop: 16,
        },
        subtitle: {
            fontSize: 16,
            color: colors.textSecondary,
            marginTop: 8,
        },
        form: {
            gap: 20,
        },
        inputGroup: {
            gap: 8,
        },
        label: {
            fontSize: 16,
            fontWeight: '500',
            color: colors.text,
        },
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.inputBackground,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            paddingHorizontal: 16,
        },
        input: {
            flex: 1,
            height: 56,
            fontSize: 16,
            color: colors.text,
            marginLeft: 12,
        },
        eyeButton: {
            padding: 8,
        },
        forgotPassword: {
            alignSelf: 'flex-end',
        },
        forgotPasswordText: {
            color: colors.primary,
            fontSize: 14,
        },
        loginButton: {
            backgroundColor: colors.primary,
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: 8,
        },
        loginButtonText: {
            color: colors.textOnPrimary,
            fontSize: 18,
            fontWeight: 'bold',
        },
        divider: {
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: 32,
        },
        dividerLine: {
            flex: 1,
            height: 1,
            backgroundColor: colors.border,
        },
        dividerText: {
            marginHorizontal: 16,
            color: colors.textSecondary,
            fontSize: 14,
        },
        socialContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 16,
        },
        socialButton: {
            width: 56,
            height: 56,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.surface,
        },
        footer: {
            marginTop: 48,
            alignItems: 'center',
        },
        footerText: {
            fontSize: 16,
            color: colors.textSecondary,
        },
        footerLink: {
            color: colors.primary,
            fontWeight: 'bold',
        },
        errorContainer: {
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 1,
            borderColor: 'rgba(239, 68, 68, 0.3)',
            borderRadius: 8,
            padding: 12,
            marginTop: 16,
        },
        errorText: {
            color: '#ef4444',
            textAlign: 'center',
            fontSize: 14,
        },
    });

    return (
        <SafeAreaView style={styles.container} testID="login-screen">
            <KeyboardAwareContainer contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Image
                            source={require('../../assets/icon.png')}
                            style={{ width: 80, height: 80, marginBottom: 16 }}
                            resizeMode="contain"
                        />
                        <Text style={styles.title}>PressFit</Text>
                        <Text style={styles.subtitle}>{t('auth.tagline')}</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('auth.email')}</Text>
                            <View style={styles.inputContainer}>
                                <MaterialIcons name="mail" size={24} color={colors.primary} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('auth.emailPlaceholder')}
                                    placeholderTextColor={colors.textSecondary}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    value={email}
                                    onChangeText={setEmail}
                                    testID="email-input"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('auth.password')}</Text>
                            <View style={styles.inputContainer}>
                                <MaterialIcons name="lock" size={24} color={colors.primary} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('auth.passwordPlaceholder')}
                                    placeholderTextColor={colors.textSecondary}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    spellCheck={false}
                                    textContentType="password"
                                    autoComplete="password"
                                    value={password}
                                    onChangeText={setPassword}
                                    testID="password-input"
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowPassword(!showPassword)}
                                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                                    testID="login-password-toggle"
                                >
                                    <MaterialIcons
                                        name={showPassword ? 'visibility' : 'visibility-off'}
                                        size={24}
                                        color={colors.primary}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.forgotPassword}>
                            <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={handleEmailLogin}
                            disabled={loading}
                            testID="login-submit-button"
                        >
                            {loading ? (
                                <ActivityIndicator color={colors.textOnPrimary} />
                            ) : (
                                <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
                            )}
                        </TouchableOpacity>

                        {error ? (
                            <View style={styles.errorContainer} testID="login-error-container">
                                <Text style={styles.errorText} testID="login-error-text">{error}</Text>
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>{t('auth.orLoginWith')}</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <View style={styles.socialContainer}>
                        <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
                            <Image
                                source={require('../../assets/googlelogo.png')}
                                style={{ width: 28, height: 28 }}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.socialButton, { opacity: 0.5 }]} disabled>
                            <MaterialIcons name="apple" size={28} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                            <Text style={styles.footerText}>
                                {t('auth.noAccount')}{' '}
                                <Text style={styles.footerLink}>{t('auth.registerLink')}</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
            </KeyboardAwareContainer>
        </SafeAreaView>
    );
};

export default LoginScreen;
