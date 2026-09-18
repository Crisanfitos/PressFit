import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Exercise } from '../../controllers/useExerciseController';
import { OldExerciseData } from '../../controllers/useSwapExerciseController';
import { styles } from './swapExerciseStyles';

export interface SwapExerciseStep2Props {
    colors: any;
    oldExercise?: OldExerciseData;
    selectedCandidate: Exercise | null;
    initialSetsCount: number;
    setsCount: number;
    isSubmitting: boolean;
    setStep: (step: 1 | 2) => void;
    handleDecrementSets: () => void;
    handleIncrementSets: () => void;
    handleFinalizeSwap: () => void;
}

export const SwapExerciseStep2: React.FC<SwapExerciseStep2Props> = ({
    colors,
    oldExercise,
    selectedCandidate,
    initialSetsCount,
    setsCount,
    isSubmitting,
    setStep,
    handleDecrementSets,
    handleIncrementSets,
    handleFinalizeSwap,
}) => {
    const { t } = useTranslation();

    return (
        <ScrollView
            style={styles.contentFlex}
            contentContainerStyle={styles.step2Container}
            testID="swap-exercise-step-2"
        >
            <Text style={[styles.step2Heading, { color: colors.text }]}>
                {t('swapExercise.compareHeading', 'Comparativa de Ejercicios')}
            </Text>
            <Text style={[styles.step2Description, { color: colors.textSecondary }]}>
                {t(
                    'swapExercise.compareDescription',
                    'Revisa el cambio antes de insertarlo en la rutina activa. El nuevo ejercicio ocupará exactamente la misma posición.'
                )}
            </Text>

            {/* Comparison Cards */}
            <View style={styles.comparisonGrid} testID="swap-exercise-comparison-card">
                {/* Old Exercise Card */}
                <View style={[styles.compareCard, { backgroundColor: colors.surface, borderColor: '#fca5a5' }]}>
                    <View style={[styles.compareBadge, { backgroundColor: '#fee2e2' }]}>
                        <Text style={[styles.compareBadgeText, { color: '#dc2626' }]}>
                            {t('swapExercise.originalBadge', 'Original')}
                        </Text>
                    </View>
                    <Text style={[styles.compareCardTitle, { color: colors.text }]} numberOfLines={2}>
                        {oldExercise?.titulo}
                    </Text>
                    <Text style={[styles.compareCardSubtitle, { color: colors.textSecondary }]}>
                        {oldExercise?.grupo_muscular || t('swapExercise.generalMuscle', 'General')}
                    </Text>
                    <View style={[styles.compareDivider, { backgroundColor: colors.border }]} />
                    <Text style={[styles.compareCardInfo, { color: colors.textSecondary }]}>
                        {t('swapExercise.currentSetsLabel', 'Series actuales:')} {initialSetsCount}
                    </Text>
                </View>

                {/* Arrow Divider */}
                <View style={styles.arrowDivider}>
                    <MaterialIcons name="arrow-forward" size={28} color={colors.primary} />
                </View>

                {/* New Exercise Card */}
                <View style={[styles.compareCard, { backgroundColor: colors.surface, borderColor: '#86efac' }]}>
                    <View style={[styles.compareBadge, { backgroundColor: '#dcfce7' }]}>
                        <Text style={[styles.compareBadgeText, { color: '#16a34a' }]}>
                            {t('swapExercise.newBadge', 'Nuevo')}
                        </Text>
                    </View>
                    <Text style={[styles.compareCardTitle, { color: colors.text }]} numberOfLines={2}>
                        {selectedCandidate?.titulo}
                    </Text>
                    <Text style={[styles.compareCardSubtitle, { color: colors.textSecondary }]}>
                        {selectedCandidate?.musculos_primarios
                            ? Array.isArray(selectedCandidate.musculos_primarios)
                                ? selectedCandidate.musculos_primarios.join(', ')
                                : selectedCandidate.musculos_primarios
                            : t('swapExercise.generalMuscle', 'General')}
                    </Text>
                    <View style={[styles.compareDivider, { backgroundColor: colors.border }]} />
                    <Text style={[styles.compareCardInfo, { color: colors.textSecondary }]}>
                        {t('swapExercise.difficultyLabel', 'Dificultad:')} {selectedCandidate?.dificultad || 'Normal'}
                    </Text>
                </View>
            </View>

            {/* Sets Config Section */}
            <View style={[styles.setsConfigCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.setsConfigTitle, { color: colors.text }]}>
                    {t('swapExercise.setsConfigTitle', '¿Cuántas series deseas programar?')}
                </Text>
                <Text style={[styles.setsConfigSubtitle, { color: colors.textSecondary }]}>
                    {t(
                        'swapExercise.setsConfigSubtitle',
                        'Se crearán las series en blanco listas para rellenar durante el entrenamiento.'
                    )}
                </Text>

                <View style={styles.counterRow}>
                    <TouchableOpacity
                        testID="swap-exercise-sets-decrement"
                        onPress={handleDecrementSets}
                        disabled={setsCount <= 1}
                        style={[
                            styles.counterButton,
                            {
                                backgroundColor: setsCount <= 1 ? colors.background : colors.surface,
                                borderColor: colors.border,
                            },
                        ]}
                    >
                        <MaterialIcons
                            name="remove"
                            size={24}
                            color={setsCount <= 1 ? colors.textSecondary : colors.primary}
                        />
                    </TouchableOpacity>

                    <View style={styles.counterValueContainer}>
                        <Text testID="swap-exercise-sets-count" style={[styles.counterValue, { color: colors.text }]}>
                            {setsCount}
                        </Text>
                        <Text style={[styles.counterUnit, { color: colors.textSecondary }]}>
                            {setsCount === 1 ? t('swapExercise.setSingular', 'serie') : t('swapExercise.setPlural', 'series')}
                        </Text>
                    </View>

                    <TouchableOpacity
                        testID="swap-exercise-sets-increment"
                        onPress={handleIncrementSets}
                        disabled={setsCount >= 10}
                        style={[
                            styles.counterButton,
                            {
                                backgroundColor: setsCount >= 10 ? colors.background : colors.surface,
                                borderColor: colors.border,
                            },
                        ]}
                    >
                        <MaterialIcons
                            name="add"
                            size={24}
                            color={setsCount >= 10 ? colors.textSecondary : colors.primary}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Actions */}
            <View style={styles.step2Actions}>
                <TouchableOpacity
                    onPress={() => setStep(1)}
                    style={[styles.secondaryButton, { borderColor: colors.border }]}
                    disabled={isSubmitting}
                >
                    <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
                        {t('swapExercise.changeExerciseBtn', 'Cambiar ejercicio')}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    testID="swap-exercise-finish-button"
                    onPress={handleFinalizeSwap}
                    disabled={isSubmitting}
                    style={[
                        styles.finishButton,
                        {
                            backgroundColor: isSubmitting ? colors.border : colors.primary,
                        },
                    ]}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <>
                            <MaterialIcons name="check" size={20} color="#ffffff" style={{ marginRight: 6 }} />
                            <Text style={styles.finishButtonText}>{t('swapExercise.finalizeSwapBtn', 'Finalizar Intercambio')}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};
