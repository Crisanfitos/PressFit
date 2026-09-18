import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    TextInput,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Exercise } from '../../controllers/useExerciseController';
import { OldExerciseData } from '../../controllers/useSwapExerciseController';
import { styles } from './swapExerciseStyles';

export interface SwapExerciseStep1Props {
    colors: any;
    exercises: Exercise[];
    loading: boolean;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filters: any;
    setFilter: (key: string, value: any) => void;
    clearFilter: (key: string) => void;
    filterOptions: any;
    selectedCandidate: Exercise | null;
    oldExercise?: OldExerciseData;
    handleSelectExercise: (exercise: Exercise) => void;
    handleContinueToStep2: () => void;
}

export const SwapExerciseStep1: React.FC<SwapExerciseStep1Props> = ({
    colors,
    exercises,
    loading,
    searchQuery,
    setSearchQuery,
    filters,
    setFilter,
    clearFilter,
    filterOptions,
    selectedCandidate,
    oldExercise,
    handleSelectExercise,
    handleContinueToStep2,
}) => {
    const { t } = useTranslation();

    const renderCandidateItem = ({ item }: { item: Exercise }) => {
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
                            {item.musculos_primarios
                                ? Array.isArray(item.musculos_primarios)
                                    ? item.musculos_primarios.join(', ')
                                    : item.musculos_primarios
                                : t('swapExercise.generalMuscle', 'General')}
                        </Text>
                    </View>
                    {isCurrent ? (
                        <View style={[styles.badge, { backgroundColor: colors.border }]}>
                            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                                {t('swapExercise.currentBadge', 'Actual')}
                            </Text>
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
    };

    return (
        <View style={styles.contentFlex}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <MaterialIcons name="search" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                        testID="swap-exercise-search-input"
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder={t('swapExercise.searchPlaceholder', 'Buscar ejercicio de reemplazo...')}
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
                            {t('common.all', 'Todos')}
                        </Text>
                    </TouchableOpacity>
                    {filterOptions.primaryMuscles.map((muscle: string) => {
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
                                {t('swapExercise.noExercisesFound', 'No se encontraron ejercicios')}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Bottom Floating Bar */}
            <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={[styles.bottomBarLabel, { color: colors.textSecondary }]}>
                        {selectedCandidate ? t('swapExercise.selectedLabel', 'Seleccionado:') : t('swapExercise.selectExercisePrompt', 'Selecciona un ejercicio')}
                    </Text>
                    <Text style={[styles.bottomBarSelected, { color: colors.text }]} numberOfLines={1}>
                        {selectedCandidate ? selectedCandidate.titulo : t('swapExercise.noneSelected', 'Ninguno')}
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
                    <Text style={styles.primaryButtonText}>{t('common.continue', 'Continuar')}</Text>
                    <MaterialIcons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
            </View>
        </View>
    );
};
