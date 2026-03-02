import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Keyboard,
  ActivityIndicator,
  Animated,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useExerciseController, FilterKey, Exercise } from '../controllers/useExerciseController';
import { ExerciseItem } from '../components/ExerciseItem';

type ExerciseCatalogScreenProps = {
  navigation: any;
};

const ExerciseCatalogScreen: React.FC<ExerciseCatalogScreenProps> = ({ navigation }) => {
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
  } = useExerciseController(undefined, undefined);

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  const SCROLL_TOP_THRESHOLD = 6;
  const flatListRef = useRef<FlatList>(null);
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

  const FILTER_ROWS: { key: FilterKey; label: string; options: string[] }[] = useMemo(() => [
    { key: 'primaryMuscle', label: 'Músculo Principal', options: filterOptions.primaryMuscles },
    { key: 'secondaryMuscle', label: 'Músculo Secundario', options: filterOptions.secondaryMuscles },
    { key: 'category', label: 'Categoría', options: filterOptions.categories },
    { key: 'difficulty', label: 'Dificultad', options: filterOptions.difficulties },
  ], [filterOptions]);

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
      <ExerciseItem
        item={item}
        isSelected={false}
        selectionMode={false}
        onSelect={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
        onThumbnailPress={openVideo}
        colors={colors}
        navigation={navigation}
      />
    ),
    [colors, navigation]
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
        categoriesScroll: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
        categoryChip: {
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 20,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        categoryChipSelected: { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
        categoryText: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
        categoryTextSelected: { color: colors.primary, fontWeight: '600' },
        listContent: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 },
        emptyStateContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, opacity: 0.7 },
        emptyStateText: { color: colors.textSecondary, fontSize: 16, marginTop: 16, textAlign: 'center' },
        modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
        closeModalButton: { position: 'absolute', top: 40, right: 20, padding: 10, zIndex: 10 },
      }),
    [colors]
  );

  return (
    <SafeAreaView style={screenStyles.container}>
      <View style={screenStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={screenStyles.backButton} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={screenStyles.headerText}>Catálogo de Ejercicios</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={screenStyles.searchContainer}>
        <MaterialIcons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={screenStyles.searchInput}
          placeholder="Buscar ejercicio..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => {
            if (searchQuery.length === 0) setIsSearchFocused(false);
          }}
        />
        {(searchQuery.length > 0 || isSearchFocused) && (
          <TouchableOpacity onPress={handleClearSearch} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
            <MaterialIcons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {!isSearchFocused && searchQuery.length === 0 && (
        <View>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 }}
            onPress={() => setShowFilters((prev) => !prev)}
          >
            <MaterialIcons name={showFilters ? 'filter-list-off' : 'filter-list'} size={20} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginLeft: 6, fontWeight: '500' }}>
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </Text>
            {hasActiveFilters && (
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginLeft: 6 }} />
            )}
          </TouchableOpacity>

          {showFilters && FILTER_ROWS.map(({ key, label, options }) => {
            if (options.length === 0) return null;
            const activeValue = filters[key];
            return (
              <View key={key} style={{ marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 4 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600', flex: 1 }}>{label}</Text>
                  {activeValue && (
                    <TouchableOpacity onPress={() => clearFilter(key)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <MaterialIcons name="close" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={screenStyles.categoriesScroll}>
                  <TouchableOpacity
                    style={[screenStyles.categoryChip, !activeValue && screenStyles.categoryChipSelected]}
                    onPress={() => clearFilter(key)}
                  >
                    <Text style={[screenStyles.categoryText, !activeValue && screenStyles.categoryTextSelected]}>Todos</Text>
                  </TouchableOpacity>
                  {options.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[screenStyles.categoryChip, activeValue === option && screenStyles.categoryChipSelected]}
                      onPress={() => setFilter(key, activeValue === option ? null : option)}
                    >
                      <Text style={[screenStyles.categoryText, activeValue === option && screenStyles.categoryTextSelected]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            );
          })}

          {showFilters && hasActiveFilters && (
            <TouchableOpacity
              style={{ alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 16, marginTop: 4, marginBottom: 4 }}
              onPress={clearAllFilters}
            >
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>Limpiar Filtros</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={exercises}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={screenStyles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          windowSize={5}
          removeClippedSubviews
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          ListEmptyComponent={
            !loading ? (
              <View style={screenStyles.emptyStateContainer}>
                <MaterialIcons name={hasActiveFilters || searchQuery.length > 0 ? 'search-off' : 'touch-app'} size={48} color={colors.textSecondary} />
                <Text style={screenStyles.emptyStateText}>
                  {hasActiveFilters || searchQuery.length > 0
                    ? 'No se encontraron ejercicios con los filtros actuales'
                    : 'Usa los filtros o el buscador para encontrar ejercicios'}
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
