import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import {
    useSwapExerciseController,
    OldExerciseData,
} from '../controllers/useSwapExerciseController';
import { SwapExerciseStep1 } from './swapExercise/SwapExerciseStep1';
import { SwapExerciseStep2 } from './swapExercise/SwapExerciseStep2';
import { styles } from './swapExercise/swapExerciseStyles';

export interface SwapExerciseScreenProps {
    navigation: any;
    route: {
        params: {
            workoutId: string;
            routineDayId?: string;
            oldExercise: OldExerciseData;
        };
    };
}

export const SwapExerciseScreen: React.FC<SwapExerciseScreenProps> = ({
    navigation,
    route,
}) => {
    const { t } = useTranslation();
    const { colors } = useTheme().theme;
    const { workoutId, oldExercise } = route.params || {};

    const {
        step,
        setStep,
        selectedCandidate,
        setsCount,
        initialSetsCount,
        isSubmitting,
        exercises,
        loading,
        searchQuery,
        setSearchQuery,
        filters,
        setFilter,
        clearFilter,
        filterOptions,
        handleSelectExercise,
        handleContinueToStep2,
        handleBack,
        handleIncrementSets,
        handleDecrementSets,
        handleFinalizeSwap,
    } = useSwapExerciseController({
        workoutId,
        oldExercise,
        navigation,
    });

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
            testID="swap-exercise-screen"
        >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    testID="swap-exercise-back-button"
                    style={[styles.backButton, { backgroundColor: colors.surface }]}
                    onPress={handleBack}
                >
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        {step === 1
                            ? t('swapExercise.titleStep1', 'Intercambiar Ejercicio')
                            : t('swapExercise.titleStep2', 'Confirmar Intercambio')}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                        {step === 1
                            ? t('swapExercise.subtitleStep1', 'Paso 1 de 2: Seleccionar nuevo')
                            : t('swapExercise.subtitleStep2', 'Paso 2 de 2: Revisar y ajustar')}
                    </Text>
                </View>
            </View>

            {/* Sticky Card: Current Exercise to Replace */}
            <View
                testID="swap-exercise-current-card"
                style={[
                    styles.currentExerciseCard,
                    {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                    },
                ]}
            >
                <View style={styles.currentCardHeader}>
                    <MaterialIcons
                        name="swap-horiz"
                        size={20}
                        color={colors.primary}
                        style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.currentCardLabel, { color: colors.primary }]}>
                        {t('swapExercise.exerciseToSwap', 'Ejercicio a sustituir')}
                    </Text>
                </View>
                <Text
                    style={[styles.currentExerciseTitle, { color: colors.text }]}
                    numberOfLines={1}
                >
                    {oldExercise?.titulo ||
                        t('swapExercise.currentExerciseFallback', 'Ejercicio actual')}
                </Text>
                <View style={styles.currentExerciseMeta}>
                    <Text
                        style={[
                            styles.currentExerciseMetaText,
                            { color: colors.textSecondary },
                        ]}
                    >
                        {oldExercise?.grupo_muscular ||
                            t('swapExercise.noGroupSpecified', 'Sin grupo especificado')}
                    </Text>
                    <Text
                        style={[
                            styles.currentExerciseMetaText,
                            { color: colors.textSecondary },
                        ]}
                    >
                        • {initialSetsCount}{' '}
                        {initialSetsCount === 1
                            ? t('swapExercise.singleCurrentSet', 'serie actual')
                            : t('swapExercise.multipleCurrentSets', 'series actuales')}
                    </Text>
                </View>
            </View>

            {step === 1 ? (
                <SwapExerciseStep1
                    colors={colors}
                    exercises={exercises}
                    loading={loading}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    filters={filters}
                    setFilter={setFilter}
                    clearFilter={clearFilter}
                    filterOptions={filterOptions}
                    selectedCandidate={selectedCandidate}
                    oldExercise={oldExercise}
                    handleSelectExercise={handleSelectExercise}
                    handleContinueToStep2={handleContinueToStep2}
                />
            ) : (
                <SwapExerciseStep2
                    colors={colors}
                    oldExercise={oldExercise}
                    selectedCandidate={selectedCandidate}
                    initialSetsCount={initialSetsCount}
                    setsCount={setsCount}
                    isSubmitting={isSubmitting}
                    setStep={setStep}
                    handleDecrementSets={handleDecrementSets}
                    handleIncrementSets={handleIncrementSets}
                    handleFinalizeSwap={handleFinalizeSwap}
                />
            )}
        </SafeAreaView>
    );
};

export default SwapExerciseScreen;
