import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Keyboard,
  ActivityIndicator,
  Animated,
  Modal,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useExerciseController, FilterKey, Exercise } from '../controllers/useExerciseController';
import { CreateCustomExerciseModal } from '../components/CreateCustomExerciseModal';
import { ExerciseFilterSection, ExerciseListItem } from '../components/exercises';
import { ExerciseService } from '../services/ExerciseService';

type ExerciseCatalogScreenProps = {
  navigation: any;
};

const ExerciseCatalogScreen: React.FC<ExerciseCatalogScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { colors } = theme;

  const {
    exercises,
    loading,
    searchQuery,
    setSearchQuery,
    filters,
    setFilter,
    clearFilter,
    clearAllFilters,
    hasActiveFilters,
    filterOptions,
    refetchExercises,
  } = useExerciseController(undefined, undefined);

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [deleteDialogExercise, setDeleteDialogExercise] = useState<Exercise | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  const SCROLL_TOP_THRESHOLD = 6;
  const flatListRef = useRef<FlashList<Exercise>>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollTopOpacity = useRef(new Animated.Value(0)).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 10 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
    if (viewableItems.length === 0) return;
    const minIndex = Math.min(...viewableItems.map((v) => v.index ?? 0));
    setShowScrollTop(minIndex >= SCROLL_TOP_THRESHOLD);
  }).current;

  useEffect(() => {
    Animated.timing(scrollTopOpacity, {
      toValue: showScrollTop ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [showScrollTop, scrollTopOpacity]);

  const handleScrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearchFocused(false);
    Keyboard.dismiss();
  };

  const handleEditExercise = useCallback((exercise: Exercise) => {
    setEditingExercise(exercise);
    setCreateModalVisible(true);
  }, []);

  const handleDeleteExercise = useCallback((exercise: Exercise) => {
    setDeleteDialogExercise(exercise);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (deleteDialogExercise) {
      try {
        const { error } = await ExerciseService.deleteCustomExercise(deleteDialogExercise.id);
        if (error) {
          console.error('Error deleting custom exercise:', error);
        }
        await refetchExercises();
      } catch (err) {
        console.error('Unexpected error in confirmDelete:', err);
      } finally {
        setDeleteDialogExercise(null);
      }
    }
  }, [deleteDialogExercise, refetchExercises]);

  const FILTER_ROWS: { key: FilterKey; label: string; options: string[] }[] = useMemo(() => [
    { key: 'primaryMuscle', label: t('exerciseCatalog.primaryMuscle', 'Músculo Principal'), options: filterOptions.primaryMuscles },
    { key: 'secondaryMuscle', label: t('exerciseCatalog.secondaryMuscle', 'Músculo Secundario'), options: filterOptions.secondaryMuscles },
    { key: 'category', label: t('exerciseCatalog.category', 'Categoría'), options: filterOptions.categories },
    { key: 'difficulty', label: t('exerciseCatalog.difficulty', 'Dificultad'), options: filterOptions.difficulties },
  ], [filterOptions, t]);

  const openVideo = (videoId: string | null) => {
    if (videoId) {
      setCurrentVideoId(videoId);
      setVideoModalVisible(true);
    }
  };

  const closeVideo = () => {
    setVideoModalVisible(false);
    setCurrentVideoId(null);
  };

  const renderItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <ExerciseListItem
        item={item}
        isSelected={false}
        selectionMode={false}
        onSelect={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
        onThumbnailPress={openVideo}
        colors={colors}
        navigation={navigation}
        onEdit={handleEditExercise}
        onDelete={handleDeleteExercise}
      />
    ),
    [colors, navigation, handleEditExercise, handleDeleteExercise]
  );

  const screenStyles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 16,
          paddingBottom: 12,
        },
        backButton: { padding: 8, marginLeft: -8 },
        headerText: { fontSize: 18, fontWeight: 'bold', color: colors.text, flex: 1, textAlign: 'center' },
        searchContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: 16,
          marginBottom: 12,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 12,
          backgroundColor: colors.surface,
          gap: 12,
        },
        searchInput: { flex: 1, color: colors.text, fontSize: 16 },
        listContent: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 },
        emptyStateContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, opacity: 0.7 },
        emptyStateText: { color: colors.textSecondary, fontSize: 16, marginTop: 16, textAlign: 'center' },
        modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
        closeModalButton: { position: 'absolute', top: 40, right: 20, padding: 10, zIndex: 10 },
      }),
    [colors]
  );

  return (
    <SafeAreaView style={screenStyles.container} testID="exercise-catalog-screen">
      <View style={screenStyles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={screenStyles.backButton}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          testID="exercise-catalog-back-button"
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={screenStyles.headerText}>{t('exerciseCatalog.title', 'Catálogo de Ejercicios')}</Text>
        <TouchableOpacity
          onPress={() => {
            setEditingExercise(null);
            setCreateModalVisible(true);
          }}
          style={{ padding: 4 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID="open-create-custom-exercise-button"
        >
          <MaterialIcons name="add" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={screenStyles.searchContainer}>
        <MaterialIcons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={screenStyles.searchInput}
          placeholder={t('exerciseCatalog.searchPlaceholder', 'Buscar ejercicio...')}
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => {
            if (searchQuery.length === 0) setIsSearchFocused(false);
          }}
          testID="exercise-catalog-search-input"
        />
        {(searchQuery.length > 0 || isSearchFocused) && (
          <TouchableOpacity
            onPress={handleClearSearch}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            testID="exercise-catalog-clear-search-button"
          >
            <MaterialIcons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {!isSearchFocused && searchQuery.length === 0 && (
        <ExerciseFilterSection
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          hasActiveFilters={hasActiveFilters}
          filterRows={FILTER_ROWS}
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
        <FlashList
          ref={flatListRef}
          data={exercises}
          renderItem={renderItem}
          estimatedItemSize={90}
          keyExtractor={(item) => item.id}
          contentContainerStyle={screenStyles.listContent}
          showsVerticalScrollIndicator={false}
          testID="exercise-catalog-list"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          ListEmptyComponent={
            !loading ? (
              <View style={screenStyles.emptyStateContainer}>
                <MaterialIcons name={hasActiveFilters || searchQuery.length > 0 ? 'search-off' : 'touch-app'} size={48} color={colors.textSecondary} />
                <Text style={screenStyles.emptyStateText}>
                  {hasActiveFilters || searchQuery.length > 0
                    ? t('exerciseCatalog.noExercisesFound', 'No se encontraron ejercicios con los filtros actuales')
                    : t('exerciseCatalog.useFiltersPrompt', 'Usa los filtros o el buscador para encontrar ejercicios')}
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Scroll to top FAB */}
      <Animated.View
        style={[
          scrollTopStyles.fab,
          { backgroundColor: colors.primary, opacity: scrollTopOpacity },
        ]}
        pointerEvents={showScrollTop ? 'auto' : 'none'}
      >
        <TouchableOpacity onPress={handleScrollToTop} style={scrollTopStyles.fabInner} activeOpacity={0.8}>
          <MaterialIcons name="keyboard-arrow-up" size={28} color={colors.textOnPrimary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Video Modal */}
      <Modal visible={videoModalVisible} transparent animationType="fade" onRequestClose={closeVideo}>
        <View style={screenStyles.modalOverlay}>
          <TouchableOpacity style={screenStyles.closeModalButton} onPress={closeVideo} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
            <MaterialIcons name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center', padding: 20 }}>
            {currentVideoId && (
              <TouchableOpacity
                style={{
                  backgroundColor: '#FF0000',
                  paddingVertical: 16,
                  paddingHorizontal: 32,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                onPress={() => {
                  closeVideo();
                }}
              >
                <MaterialIcons name="play-arrow" size={24} color="#FFF" />
                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>Ver en YouTube</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      <CreateCustomExerciseModal
        visible={createModalVisible}
        initialExercise={editingExercise}
        onClose={() => {
          setCreateModalVisible(false);
          setEditingExercise(null);
        }}
        onSuccess={() => {
          setEditingExercise(null);
          refetchExercises();
        }}
      />

      {/* Modal de confirmación de borrado */}
      <Modal
        visible={!!deleteDialogExercise}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteDialogExercise(null)}
        testID="delete-custom-exercise-modal"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 24, width: '100%', maxWidth: 360, elevation: 5 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: `${colors.error || '#ef4444'}20`, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 16 }}>
              <MaterialIcons name="delete-outline" size={28} color={colors.error || '#ef4444'} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 8 }}>
              Eliminar Ejercicio
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 }}>
              ¿Estás seguro de que deseas eliminar "{deleteDialogExercise?.titulo}"? Esta acción no se puede deshacer.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
                onPress={() => setDeleteDialogExercise(null)}
                testID="delete-custom-exercise-cancel-button"
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.error || '#ef4444', alignItems: 'center' }}
                onPress={confirmDelete}
                testID="delete-custom-exercise-confirm-button"
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const scrollTopStyles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  fabInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ExerciseCatalogScreen;
