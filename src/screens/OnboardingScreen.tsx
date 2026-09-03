import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';

export const ONBOARDING_COMPLETED_KEY = '@pressfit_onboarding_completed';
export const ONBOARDING_PREFERENCES_KEY = '@pressfit_onboarding_preferences';

export type FitnessGoal = 'strength' | 'hypertrophy' | 'fat_loss' | 'endurance';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface OnboardingPreferences {
    goal: FitnessGoal | null;
    daysPerWeek: number | null;
    experienceLevel: ExperienceLevel | null;
    completedAt: string;
}

type OnboardingScreenProps = {
    navigation: NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;
};

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
    const { theme } = useTheme();
    const { colors } = theme;
    const { t } = useTranslation();

    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
    const [selectedGoal, setSelectedGoal] = useState<FitnessGoal | null>(null);
    const [selectedDays, setSelectedDays] = useState<number | null>(null);
    const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const goalOptions: { id: FitnessGoal; icon: keyof typeof MaterialIcons.glyphMap; label: string; description: string }[] = [
        {
            id: 'strength',
            icon: 'fitness-center',
            label: t('onboarding.goalStrength', 'Ganar Fuerza'),
            description: t('onboarding.goalStrengthDesc', 'Aumentar marcas y fuerza máxima en levantamientos principales.'),
        },
        {
            id: 'hypertrophy',
            icon: 'trending-up',
            label: t('onboarding.goalHypertrophy', 'Hipertrofia Muscular'),
            description: t('onboarding.goalHypertrophyDesc', 'Optimizar volumen y estímulo para crecimiento muscular.'),
        },
        {
            id: 'fat_loss',
            icon: 'local-fire-department',
            label: t('onboarding.goalFatLoss', 'Pérdida de Grasa'),
            description: t('onboarding.goalFatLossDesc', 'Entrenamientos dinámicos para tonificar y maximizar gasto calórico.'),
        },
        {
            id: 'endurance',
            icon: 'directions-run',
            label: t('onboarding.goalEndurance', 'Salud y Resistencia'),
            description: t('onboarding.goalEnduranceDesc', 'Mejorar capacidad cardiovascular, energía y longevidad.'),
        },
    ];

    const daysOptions = [2, 3, 4, 5, 6];

    const getDaysSubtitle = (days: number) => {
        switch (days) {
            case 2:
                return t('onboarding.days2Subtitle', 'Mantenimiento mínimo');
            case 3:
                return t('onboarding.days3Subtitle', 'Equilibrado (Recomendado)');
            case 4:
                return t('onboarding.days4Subtitle', 'Excelente progresión');
            case 5:
                return t('onboarding.days5Subtitle', 'Alto compromiso');
            case 6:
                return t('onboarding.days6Subtitle', 'Avanzado / Atleta');
            default:
                return '';
        }
    };

    const levelOptions: { id: ExperienceLevel; icon: keyof typeof MaterialIcons.glyphMap; label: string; description: string }[] = [
        {
            id: 'beginner',
            icon: 'star-border',
            label: t('onboarding.levelBeginner', 'Principiante'),
            description: t('onboarding.levelBeginnerDesc', 'Menos de 1 año entrenando de forma consistente.'),
        },
        {
            id: 'intermediate',
            icon: 'star-half',
            label: t('onboarding.levelIntermediate', 'Intermedio'),
            description: t('onboarding.levelIntermediateDesc', '1 a 3 años de entrenamiento estructurado y técnica sólida.'),
        },
        {
            id: 'advanced',
            icon: 'star',
            label: t('onboarding.levelAdvanced', 'Avanzado'),
            description: t('onboarding.levelAdvancedDesc', 'Más de 3 años con conocimiento avanzado de periodización.'),
        },
    ];

    const handleSaveAndFinish = async (skip: boolean = false) => {
        let success = false;
        try {
            setIsSaving(true);
            const preferences: OnboardingPreferences = {
                goal: skip ? null : selectedGoal,
                daysPerWeek: skip ? null : selectedDays,
                experienceLevel: skip ? null : selectedLevel,
                completedAt: new Date().toISOString(),
            };

            await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
            await AsyncStorage.setItem(ONBOARDING_PREFERENCES_KEY, JSON.stringify(preferences));
            success = true;
        } catch (error) {
            console.error('Error saving onboarding preferences:', error);
            setIsSaving(false);
        }

        if (success) {
            navigation.navigate('SignUp');
        }
    };

    const handleNext = () => {
        if (currentStep === 1 && selectedGoal) {
            setCurrentStep(2);
        } else if (currentStep === 2 && selectedDays) {
            setCurrentStep(3);
        } else if (currentStep === 3 && selectedLevel) {
            handleSaveAndFinish(false);
        }
    };

    const handleBack = () => {
        if (currentStep === 3) {
            setCurrentStep(2);
        } else if (currentStep === 2) {
            setCurrentStep(1);
        } else {
            navigation.goBack();
        }
    };

    const isNextDisabled =
        (currentStep === 1 && !selectedGoal) ||
        (currentStep === 2 && !selectedDays) ||
        (currentStep === 3 && !selectedLevel) ||
        isSaving;

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 8,
        },
        progressDotsContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        dot: {
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.border,
        },
        dotActive: {
            width: 28,
            backgroundColor: colors.primary,
        },
        dotInactive: {
            width: 8,
        },
        skipButton: {
            paddingVertical: 6,
            paddingHorizontal: 12,
        },
        skipText: {
            color: colors.textSecondary,
            fontSize: 14,
            fontWeight: '600',
        },
        content: {
            flex: 1,
            paddingHorizontal: 24,
            paddingTop: 16,
        },
        title: {
            fontSize: 26,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: 8,
        },
        subtitle: {
            fontSize: 15,
            color: colors.textSecondary,
            marginBottom: 24,
            lineHeight: 22,
        },
        cardsContainer: {
            gap: 14,
            paddingBottom: 24,
        },
        card: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            borderRadius: 16,
            backgroundColor: colors.surface,
            borderWidth: 2,
            borderColor: colors.border,
        },
        cardSelected: {
            borderColor: colors.primary,
            backgroundColor: colors.mode === 'dark' ? 'rgba(255, 107, 0, 0.12)' : 'rgba(255, 107, 0, 0.08)',
        },
        iconContainer: {
            width: 48,
            height: 48,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
            marginRight: 16,
        },
        iconContainerSelected: {
            backgroundColor: colors.primary,
        },
        cardTextContainer: {
            flex: 1,
        },
        cardTitle: {
            fontSize: 17,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 4,
        },
        cardDescription: {
            fontSize: 13,
            color: colors.textSecondary,
            lineHeight: 18,
        },
        checkIcon: {
            marginLeft: 8,
        },
        daysGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 20,
            justifyContent: 'center',
        },
        dayChip: {
            width: 60,
            height: 60,
            borderRadius: 30,
            borderWidth: 2,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
        },
        dayChipSelected: {
            borderColor: colors.primary,
            backgroundColor: colors.primary,
        },
        dayChipText: {
            fontSize: 22,
            fontWeight: 'bold',
            color: colors.text,
        },
        dayChipTextSelected: {
            color: colors.textOnPrimary,
        },
        daysInfoCard: {
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
            marginTop: 12,
        },
        daysInfoTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 4,
        },
        daysInfoSubtitle: {
            fontSize: 14,
            color: colors.primary,
            fontWeight: '600',
        },
        footer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingVertical: 18,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
        },
        backButton: {
            paddingVertical: 14,
            paddingHorizontal: 18,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
        },
        backButtonText: {
            fontSize: 16,
            color: colors.textSecondary,
            fontWeight: '600',
        },
        primaryActionButton: {
            backgroundColor: colors.primary,
            paddingVertical: 14,
            paddingHorizontal: 28,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
            minWidth: 140,
        },
        primaryActionDisabled: {
            opacity: 0.45,
        },
        primaryActionText: {
            color: colors.textOnPrimary,
            fontSize: 16,
            fontWeight: 'bold',
        },
    });

    return (
        <SafeAreaView style={styles.container} testID="onboarding-screen">
            {/* Header / Step Bar */}
            <View style={styles.header}>
                <View style={styles.progressDotsContainer}>
                    {[1, 2, 3].map((step) => (
                        <View
                            key={step}
                            style={[
                                styles.dot,
                                currentStep === step ? styles.dotActive : styles.dotInactive,
                            ]}
                        />
                    ))}
                </View>

                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={() => handleSaveAndFinish(true)}
                    testID="skip-button"
                >
                    <Text style={styles.skipText}>{t('onboarding.skip', 'Saltar')}</Text>
                </TouchableOpacity>
            </View>

            {/* Step 1: Goal */}
            {currentStep === 1 && (
                <ScrollView style={styles.content} contentContainerStyle={styles.cardsContainer} showsVerticalScrollIndicator={false}>
                    <Text style={styles.title} testID="onboarding-step1-title">
                        {t('onboarding.step1Title', '¿Cuál es tu objetivo principal?')}
                    </Text>
                    <Text style={styles.subtitle}>
                        {t('onboarding.step1Subtitle', 'Personalizaremos tu plan y recomendaciones según lo que quieras lograr.')}
                    </Text>

                    {goalOptions.map((item) => {
                        const isSelected = selectedGoal === item.id;
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.card, isSelected && styles.cardSelected]}
                                onPress={() => setSelectedGoal(item.id)}
                                activeOpacity={0.8}
                                testID={`goal-card-${item.id}`}
                            >
                                <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                                    <MaterialIcons
                                        name={item.icon}
                                        size={26}
                                        color={isSelected ? colors.textOnPrimary : colors.primary}
                                    />
                                </View>
                                <View style={styles.cardTextContainer}>
                                    <Text style={styles.cardTitle}>{item.label}</Text>
                                    <Text style={styles.cardDescription}>{item.description}</Text>
                                </View>
                                {isSelected && (
                                    <MaterialIcons
                                        name="check-circle"
                                        size={24}
                                        color={colors.primary}
                                        style={styles.checkIcon}
                                    />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}

            {/* Step 2: Days per week */}
            {currentStep === 2 && (
                <ScrollView style={styles.content} contentContainerStyle={styles.cardsContainer} showsVerticalScrollIndicator={false}>
                    <Text style={styles.title} testID="onboarding-step2-title">
                        {t('onboarding.step2Title', '¿Cuántos días vas a entrenar?')}
                    </Text>
                    <Text style={styles.subtitle}>
                        {t('onboarding.step2Subtitle', 'Selecciona los días por semana que planeas dedicar al gimnasio.')}
                    </Text>

                    <View style={styles.daysGrid}>
                        {daysOptions.map((days) => {
                            const isSelected = selectedDays === days;
                            return (
                                <TouchableOpacity
                                    key={days}
                                    style={[styles.dayChip, isSelected && styles.dayChipSelected]}
                                    onPress={() => setSelectedDays(days)}
                                    activeOpacity={0.8}
                                    testID={`days-chip-${days}`}
                                >
                                    <Text style={[styles.dayChipText, isSelected && styles.dayChipTextSelected]}>
                                        {days}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {selectedDays && (
                        <View style={styles.daysInfoCard} testID="days-info-card">
                            <Text style={styles.daysInfoTitle}>
                                {selectedDays} {t('onboarding.daysPerWeek', 'días por semana')}
                            </Text>
                            <Text style={styles.daysInfoSubtitle}>{getDaysSubtitle(selectedDays)}</Text>
                        </View>
                    )}
                </ScrollView>
            )}

            {/* Step 3: Experience level */}
            {currentStep === 3 && (
                <ScrollView style={styles.content} contentContainerStyle={styles.cardsContainer} showsVerticalScrollIndicator={false}>
                    <Text style={styles.title} testID="onboarding-step3-title">
                        {t('onboarding.step3Title', '¿Cuál es tu nivel de experiencia?')}
                    </Text>
                    <Text style={styles.subtitle}>
                        {t('onboarding.step3Subtitle', 'Ajustaremos la complejidad y el progreso sugerido a tu trayectoria.')}
                    </Text>

                    {levelOptions.map((item) => {
                        const isSelected = selectedLevel === item.id;
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.card, isSelected && styles.cardSelected]}
                                onPress={() => setSelectedLevel(item.id)}
                                activeOpacity={0.8}
                                testID={`level-card-${item.id}`}
                            >
                                <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                                    <MaterialIcons
                                        name={item.icon}
                                        size={26}
                                        color={isSelected ? colors.textOnPrimary : colors.primary}
                                    />
                                </View>
                                <View style={styles.cardTextContainer}>
                                    <Text style={styles.cardTitle}>{item.label}</Text>
                                    <Text style={styles.cardDescription}>{item.description}</Text>
                                </View>
                                {isSelected && (
                                    <MaterialIcons
                                        name="check-circle"
                                        size={24}
                                        color={colors.primary}
                                        style={styles.checkIcon}
                                    />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}

            {/* Bottom Footer Actions */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBack}
                    testID="back-button"
                >
                    <Text style={styles.backButtonText}>
                        {currentStep === 1 ? t('common.cancel', 'Atrás') : t('common.back', 'Atrás')}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.primaryActionButton, isNextDisabled && styles.primaryActionDisabled]}
                    onPress={handleNext}
                    disabled={isNextDisabled}
                    testID={currentStep === 3 ? 'finish-button' : 'next-button'}
                >
                    <Text style={styles.primaryActionText}>
                        {currentStep === 3
                            ? isSaving
                                ? t('common.saving', 'Guardando...')
                                : t('onboarding.start', 'Comenzar')
                            : t('common.next', 'Siguiente')}
                    </Text>
                    <MaterialIcons
                        name={currentStep === 3 ? 'rocket-launch' : 'arrow-forward'}
                        size={18}
                        color={colors.textOnPrimary}
                    />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default OnboardingScreen;
