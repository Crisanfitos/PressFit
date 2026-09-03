import React, { useContext, useState, useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, Keyboard, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { useExerciseController } from '../controllers/useExerciseController';
import { CreateCustomExerciseModal } from '../components/CreateCustomExerciseModal';
import {
    ExerciseHeader,
    ExerciseSearchBar,
    ExerciseFilterSection,
    ExerciseListItem,
    ScrollToTopFab,
    ExerciseVideoModal,
    ExerciseEmptyState,
    useScrollToTop,
    FilterRowData,
} from '../components/exercises';

type ExerciseLibraryScreenProps = {
    navigation: any;
    route: any;
};

const ExerciseLibraryScreen: React.FC<ExerciseLibraryScreenProps> = ({ navigation, route }) => {
    const { colors } = useTheme().theme;
    const user = useContext(AuthContext)?.user;
    const { routineDayId } = route.params || {};

    const {
        exercises,
        loading,
        saving,
        searchQuery,
        setSearchQuery,
        filters,
        setFilter,
        clearFilter,
        clearAllFilters,
        hasActiveFilters,
        filterOptions,
        selectedExercises,
        toggleSelection,
        saveSelection,
        clearSelection,
        refetchExercises,
    } = useExerciseController(routineDayId, user?.id);

    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [videoModalVisible, setVideoModalVisible] = useState(false);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(true);

    const { flatListRef, showScrollTop, scrollTopOpacity, onViewableItemsChanged, viewabilityConfig, handleScrollToTop } = useScrollToTop();

    const handleClearSearch = () => {
        setSearchQuery('');
        setIsSearchFocused(false);
        Keyboard.dismiss();
    };

    const filterRows: FilterRowData[] = useMemo(
        () => [
            { key: 'primaryMuscle', label: 'Músculo Principal', options: filterOptions.primaryMuscles },
            { key: 'secondaryMuscle', label: 'Músculo Secundario', options: filterOptions.secondaryMuscles },
            { key: 'category', label: 'Categoría', options: filterOptions.categories },
            { key: 'difficulty', label: 'Dificultad', options: filterOptions.difficulties },
        ],
        [filterOptions]
    );

    const handleConfirmSelection = async () => {
        const success = await saveSelection();
        if (success) navigation.goBack();
        else Alert.alert('Error', 'No se pudieron añadir los ejercicios');
    };

    const openVideo = (videoId: string | null) => {
        if (videoId) {
            setCurrentVideoId(videoId);
            setVideoModalVisible(true);
        }
    };

    const renderItem = useCallback(
        ({ item }: { item: any }) => (
            <ExerciseListItem
                item={item}
                isSelected={selectedExercises.includes(item.id)}
                onSelect={() => toggleSelection(item.id)}
                onThumbnailPress={openVideo}
                colors={colors}
                navigation={navigation}
            />
        ),
        [selectedExercises, colors, toggleSelection, navigation]
    );

    const isSelectionMode = selectedExercises.length > 0;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} testID="exercise-library-screen">
            <ExerciseHeader
                isSelectionMode={isSelectionMode}
                selectedCount={selectedExercises.length}
                saving={saving}
                colors={colors}
                onBack={() => navigation.goBack()}
                onClearSelection={clearSelection}
                onConfirmSelection={handleConfirmSelection}
                onOpenCreateModal={() => setCreateModalVisible(true)}
            />

            <ExerciseSearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                isSearchFocused={isSearchFocused}
                setIsSearchFocused={setIsSearchFocused}
                onClearSearch={handleClearSearch}
                colors={colors}
            />

            {!isSearchFocused && searchQuery.length === 0 && (
                <ExerciseFilterSection
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    hasActiveFilters={hasActiveFilters}
                    filterRows={filterRows}
                    filters={filters}
                    setFilter={setFilter}
                    clearFilter={clearFilter}
                    clearAllFilters={clearAllFilters}
                    colors={colors}
                />
            )}

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={exercises}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={8}
                    windowSize={5}
                    removeClippedSubviews
                    extraData={selectedExercises}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    ListEmptyComponent={
                        !loading ? (
                            <ExerciseEmptyState
                                hasActiveFilters={hasActiveFilters}
                                searchQuery={searchQuery}
                                colors={colors}
                            />
                        ) : null
                    }
                />
            )}

            <ScrollToTopFab
                visible={showScrollTop}
                opacity={scrollTopOpacity}
                colors={colors}
                onScrollToTop={handleScrollToTop}
            />

            <ExerciseVideoModal
                visible={videoModalVisible}
                videoId={currentVideoId}
                onClose={() => {
                    setVideoModalVisible(false);
                    setCurrentVideoId(null);
                }}
            />

            <CreateCustomExerciseModal
                visible={createModalVisible}
                onClose={() => setCreateModalVisible(false)}
                onSuccess={() => refetchExercises()}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    listContent: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 },
});

export default ExerciseLibraryScreen;
