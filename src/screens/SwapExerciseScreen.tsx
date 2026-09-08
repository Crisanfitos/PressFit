import React, { useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useExerciseController, Exercise } from '../controllers/useExerciseController';
import { ExerciseListItem } from '../components/exercises/ExerciseListItem';
import { WorkoutService } from '../services/WorkoutService';

interface SwapExerciseScreenProps {
    navigation: any;
    route: {
        params: {
            workoutId: string;
            routineDayId?: string;
            oldExercise: {
                id: string;
                titulo: string;
                routine_exercise_id: string;
                target_sets?: number;
                sets?: any[];
                series?: any[];
                grupo_muscular?: string;
                tipo_peso?: any;
                imagen_url?: string;
            };
        };
    };
}

export const SwapExerciseScreen: React.FC<SwapExerciseScreenProps> = ({ navigation, route }) => {
    const { colors } = useTheme().theme;
    const { workoutId, oldExercise } = route.params || {};

    const initialSetsCount = useMemo(() => {
        const currentSets = oldExercise?.sets?.length || oldExercise?.series?.length || oldExercise?.target_sets || 3;
        return Math.max(1, Math.min(10, currentSets));
    }, [oldExercise]);

    const [step, setStep] = useState<1 | 2>(1);
    const [selectedCandidate, setSelectedCandidate] = useState<Exercise | null>(null);
    const [setsCount, setSetsCount] = useState<number>(initialSetsCount);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        exercises,
        loading,
        searchQuery,
        setSearchQuery,
        filters,
        setFilter,
        clearFilter,
        filterOptions,
    } = useExerciseController(undefined, undefined);

    const handleSelectExercise = useCallback((exercise: Exercise) => {
        setSelectedCandidate((prev) => (prev?.id === exercise.id ? null : exercise));
    }, []);

    const handleContinueToStep2 = () => {
        if (!selectedCandidate) return;
        setStep(2);
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
        } else {
            navigation.goBack();
        }
    };

    const handleIncrementSets = () => {
        setSetsCount((prev) => Math.min(10, prev + 1));
    };

    const handleDecrementSets = () => {
        setSetsCount((prev) => Math.max(1, prev - 1));
    };

    const handleFinalizeSwap = async () => {
        if (!selectedCandidate || !oldExercise?.routine_exercise_id || !workoutId) {
            Alert.alert('Error', 'Faltan datos necesarios para realizar el intercambio.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await WorkoutService.swapExerciseInWorkout(
                workoutId,
                oldExercise.routine_exercise_id,
                selectedCandidate.id,
                setsCount
            );

            if (res.error) {
                Alert.alert('Error', 'No se pudo intercambiar el ejercicio. Inténtalo de nuevo.');
                setIsSubmitting(false);
                return;
            }

            // Successfully swapped
            navigation.goBack();
        } catch (err) {
            console.error('Error swapping exercise:', err);
            Alert.alert('Error', 'Ocurrió un fallo inesperado al intercambiar el ejercicio.');
            setIsSubmitting(false);
        }
    };

    const renderCandidateItem = useCallback(({ item }: { item: Exercise }) => {
        const isCurrent = item.id === oldExercise?.id;
        const isSelected = selectedCandidate?.id === item.id;

        return (
            <TouchableOpacity
                testID={`swap-candidate-${item.id}`}
                activeOpacity={0.7}
                onPress={() => !isCurrent && handleSelectExercise(item)}
                style={[
                    styles.candidateCard,
                    {
                        backgroundColor: colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderWidth: isSelected ? 2 : 1,
                        opacity: isCurrent ? 0.5 : 1,
                    },
                ]}
            >
                <View style={styles.candidateHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.candidateTitle, { color: colors.text }]} numberOfLines={1}>
                            {item.titulo}
                        </Text>
                        <Text style={[styles.candidateSubtitle, { color: colors.textSecondary }]}>
                            {item.musculos_primarios ? (Array.isArray(item.musculos_primarios) ? item.musculos_primarios.join(', ') : item.musculos_primarios) : 'General'}
                        </Text>
                    </View>
                    {isCurrent ? (
                        <View style={[styles.badge, { backgroundColor: colors.border }]}>
                            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>Actual</Text>
                        </View>
                    ) : (
                        <View
                            style={[
                                styles.radioCircle,
                                {
                                    borderColor: isSelected ? colors.primary : colors.border,
                                    backgroundColor: isSelected ? colors.primary : 'transparent',
                                },
                            ]}
                        >
                            {isSelected && <MaterialIcons name="check" size={14} color="#ffffff" />}
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    }, [oldExercise, selectedCandidate, colors, handleSelectExercise]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} testID="swap-exercise-screen">
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
                        {step === 1 ? 'Intercambiar Ejercicio' : 'Confirmar Intercambio'}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                        {step === 1 ? 'Paso 1 de 2: Seleccionar nuevo' : 'Paso 2 de 2: Revisar y ajustar'}
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
                    <MaterialIcons name="swap-horiz" size={20} color={colors.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.currentCardLabel, { color: colors.primary }]}>
                        Ejercicio a sustituir
                    </Text>
                </View>
                <Text style={[styles.currentExerciseTitle, { color: colors.text }]} numberOfLines={1}>
                    {oldExercise?.titulo || 'Ejercicio actual'}
                </Text>
                <View style={styles.currentExerciseMeta}>
                    <Text style={[styles.currentExerciseMetaText, { color: colors.textSecondary }]}>
                        {oldExercise?.grupo_muscular || 'Sin grupo especificado'}
                    </Text>
                    <Text style={[styles.currentExerciseMetaText, { color: colors.textSecondary }]}>
                        • {initialSetsCount} {initialSetsCount === 1 ? 'serie actual' : 'series actuales'}
                    </Text>
                </View>
            </View>

            {step === 1 ? (
                // Step 1: Catalog Selection
                <View style={styles.contentFlex}>
                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <MaterialIcons name="search" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                            <TextInput
                                testID="swap-exercise-search-input"
                                style={[styles.searchInput, { color: colors.text }]}
                                placeholder="Buscar ejercicio de reemplazo..."
                                placeholderTextColor={colors.textSecondary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <MaterialIcons name="close" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Muscle Quick Filter Chips */}
                    <View style={styles.filtersWrapper}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsContainer}>
                            <TouchableOpacity
                                onPress={() => clearFilter('primaryMuscle')}
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: !filters.primaryMuscle ? colors.primary : colors.surface,
                                        borderColor: !filters.primaryMuscle ? colors.primary : colors.border,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        { color: !filters.primaryMuscle ? '#ffffff' : colors.textSecondary },
                                    ]}
                                >
                                    Todos
                                </Text>
                            </TouchableOpacity>
                            {filterOptions.primaryMuscles.map((muscle) => {
                                const isActive = filters.primaryMuscle === muscle;
                                return (
                                    <TouchableOpacity
                                        key={muscle}
                                        onPress={() => (isActive ? clearFilter('primaryMuscle') : setFilter('primaryMuscle', muscle))}
                                        style={[
                                            styles.filterChip,
                                            {
                                                backgroundColor: isActive ? colors.primary : colors.surface,
                                                borderColor: isActive ? colors.primary : colors.border,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.filterChipText,
                                                { color: isActive ? '#ffffff' : colors.textSecondary },
                                            ]}
                                        >
                                            {muscle}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Exercise List */}
                    {loading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : (
                        <FlatList
                            data={exercises}
                            keyExtractor={(item) => item.id}
                            renderItem={renderCandidateItem}
                            extraData={selectedCandidate}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <MaterialIcons name="fitness-center" size={48} color={colors.textSecondary} />
                                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                        No se encontraron ejercicios
                                    </Text>
                                </View>
                            }
                        />
                    )}

                    {/* Bottom Floating Bar */}
                    <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                        <View style={{ flex: 1, marginRight: 12 }}>
                            <Text style={[styles.bottomBarLabel, { color: colors.textSecondary }]}>
                                {selectedCandidate ? 'Seleccionado:' : 'Selecciona un ejercicio'}
                            </Text>
                            <Text style={[styles.bottomBarSelected, { color: colors.text }]} numberOfLines={1}>
                                {selectedCandidate ? selectedCandidate.titulo : 'Ninguno'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            testID="swap-exercise-continue-button"
                            disabled={!selectedCandidate || selectedCandidate.id === oldExercise?.id}
                            onPress={handleContinueToStep2}
                            style={[
                                styles.primaryButton,
                                {
                                    backgroundColor:
                                        !selectedCandidate || selectedCandidate.id === oldExercise?.id
                                            ? colors.border
                                            : colors.primary,
                                },
                            ]}
                        >
                            <Text style={styles.primaryButtonText}>Continuar</Text>
                            <MaterialIcons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                // Step 2: Comparison & Sets Selection
                <ScrollView
                    style={styles.contentFlex}
                    contentContainerStyle={styles.step2Container}
                    testID="swap-exercise-step-2"
                >
                    <Text style={[styles.step2Heading, { color: colors.text }]}>
                        Comparativa de Ejercicios
                    </Text>
                    <Text style={[styles.step2Description, { color: colors.textSecondary }]}>
                        Revisa el cambio antes de insertarlo en la rutina activa. El nuevo ejercicio ocupará exactamente la misma posición.
                    </Text>

                    {/* Comparison Cards */}
                    <View style={styles.comparisonGrid} testID="swap-exercise-comparison-card">
                        {/* Old Exercise Card */}
                        <View style={[styles.compareCard, { backgroundColor: colors.surface, borderColor: '#fca5a5' }]}>
                            <View style={[styles.compareBadge, { backgroundColor: '#fee2e2' }]}>
                                <Text style={[styles.compareBadgeText, { color: '#dc2626' }]}>Original</Text>
                            </View>
                            <Text style={[styles.compareCardTitle, { color: colors.text }]} numberOfLines={2}>
                                {oldExercise?.titulo}
                            </Text>
                            <Text style={[styles.compareCardSubtitle, { color: colors.textSecondary }]}>
                                {oldExercise?.grupo_muscular || 'General'}
                            </Text>
                            <View style={[styles.compareDivider, { backgroundColor: colors.border }]} />
                            <Text style={[styles.compareCardInfo, { color: colors.textSecondary }]}>
                                Series actuales: {initialSetsCount}
                            </Text>
                        </View>

                        {/* Arrow Divider */}
                        <View style={styles.arrowDivider}>
                            <MaterialIcons name="arrow-forward" size={28} color={colors.primary} />
                        </View>

                        {/* New Exercise Card */}
                        <View style={[styles.compareCard, { backgroundColor: colors.surface, borderColor: '#86efac' }]}>
                            <View style={[styles.compareBadge, { backgroundColor: '#dcfce7' }]}>
                                <Text style={[styles.compareBadgeText, { color: '#16a34a' }]}>Nuevo</Text>
                            </View>
                            <Text style={[styles.compareCardTitle, { color: colors.text }]} numberOfLines={2}>
                                {selectedCandidate?.titulo}
                            </Text>
                            <Text style={[styles.compareCardSubtitle, { color: colors.textSecondary }]}>
                                {selectedCandidate?.musculos_primarios ? (Array.isArray(selectedCandidate.musculos_primarios) ? selectedCandidate.musculos_primarios.join(', ') : selectedCandidate.musculos_primarios) : 'General'}
                            </Text>
                            <View style={[styles.compareDivider, { backgroundColor: colors.border }]} />
                            <Text style={[styles.compareCardInfo, { color: colors.textSecondary }]}>
                                Dificultad: {selectedCandidate?.dificultad || 'Normal'}
                            </Text>
                        </View>
                    </View>

                    {/* Sets Config Section */}
                    <View style={[styles.setsConfigCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.setsConfigTitle, { color: colors.text }]}>
                            ¿Cuántas series deseas programar?
                        </Text>
                        <Text style={[styles.setsConfigSubtitle, { color: colors.textSecondary }]}>
                            Se crearán las series en blanco listas para rellenar durante el entrenamiento.
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
                                    {setsCount === 1 ? 'serie' : 'series'}
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
                                Cambiar ejercicio
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
                                    <Text style={styles.finishButtonText}>Finalizar Intercambio</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

export default SwapExerciseScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    currentExerciseCard: {
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    currentCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    currentCardLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    currentExerciseTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    currentExerciseMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    currentExerciseMetaText: {
        fontSize: 13,
    },
    contentFlex: {
        flex: 1,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 44,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
    },
    filtersWrapper: {
        marginBottom: 6,
    },
    filterChipsContainer: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '500',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 80,
    },
    candidateCard: {
        padding: 14,
        borderRadius: 12,
        marginBottom: 8,
    },
    candidateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    candidateTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    candidateSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    radioCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginLeft: 12,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 14,
        marginTop: 8,
    },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    bottomBarLabel: {
        fontSize: 11,
        textTransform: 'uppercase',
    },
    bottomBarSelected: {
        fontSize: 14,
        fontWeight: '600',
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 10,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    step2Container: {
        padding: 16,
        paddingBottom: 40,
    },
    step2Heading: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    step2Description: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 16,
    },
    comparisonGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    compareCard: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 1.5,
        padding: 12,
        minHeight: 130,
    },
    compareBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginBottom: 8,
    },
    compareBadgeText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    compareCardTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    compareCardSubtitle: {
        fontSize: 12,
    },
    compareDivider: {
        height: 1,
        marginVertical: 8,
    },
    compareCardInfo: {
        fontSize: 11,
    },
    arrowDivider: {
        paddingHorizontal: 6,
    },
    setsConfigCard: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        marginBottom: 24,
    },
    setsConfigTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    setsConfigSubtitle: {
        fontSize: 12,
        marginBottom: 16,
    },
    counterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
    },
    counterButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    counterValueContainer: {
        alignItems: 'center',
        minWidth: 80,
    },
    counterValue: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    counterUnit: {
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    step2Actions: {
        gap: 12,
    },
    secondaryButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    finishButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 10,
    },
    finishButtonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: 'bold',
    },
});
