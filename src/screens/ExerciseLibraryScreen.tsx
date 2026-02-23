import React, { useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Keyboard,
    ActivityIndicator,
    Alert,
    Image,
    Animated,
    Dimensions,
    ScrollView,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { useExerciseController } from '../controllers/useExerciseController';

const { width } = Dimensions.get('window');

type ExerciseLibraryScreenProps = {
    navigation: any;
    route: any;
};

interface ExerciseItemProps {
    item: any;
    isSelected: boolean;
    onSelect: () => void;
    onThumbnailPress: (videoId: string | null) => void;
    colors: any;
    navigation: any;
}

const getVideoId = (url: string | undefined): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
};

const getThumbnailUrl = (videoId: string | null): string | null => {
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
};

const ExerciseItem: React.FC<ExerciseItemProps> = React.memo(
    ({ item, isSelected, onSelect, onThumbnailPress, colors, navigation }) => {
        const fadeAnim = useRef(new Animated.Value(0)).current;
        const [isExpanded, setIsExpanded] = useState(false);

        useEffect(() => {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }, []);

        const videoId = getVideoId(item.url_video);
        const thumbnailUrl = getThumbnailUrl(videoId);

        return (
            <Animated.View style={{ opacity: fadeAnim }}>
                <TouchableOpacity
                    style={[
                        styles.exerciseCard,
                        {
                            backgroundColor: colors.surface,
                            borderColor: isSelected ? colors.primary : colors.border,
                            borderWidth: isSelected ? 2 : 1,
                        },
                    ]}
                    onPress={onSelect}
                    activeOpacity={0.7}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity
                            style={styles.thumbnailContainer}
                            onPress={() => onThumbnailPress(videoId)}
                            disabled={!videoId}
                        >
                            {thumbnailUrl ? (
                                <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
                            ) : (
                                <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.inputBackground }]}>
                                    <MaterialIcons name="fitness-center" size={24} color={colors.primary} />
                                </View>
                            )}
                            {videoId && (
                                <View style={styles.playIconOverlay}>
                                    <MaterialIcons name="play-circle-filled" size={24} color="rgba(255,255,255,0.9)" />
                                </View>
                            )}
                        </TouchableOpacity>

                        <View style={styles.exerciseInfo}>
                            <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={2}>
                                {item.titulo}
                            </Text>
                            <Text style={[styles.exerciseText, { color: colors.primary }]}>{item.musculos_primarios}</Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={{ padding: 8 }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <MaterialIcons name={isExpanded ? 'expand-less' : 'expand-more'} size={26} color={colors.textSecondary} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
                                style={{ padding: 8 }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <MaterialIcons name="info-outline" size={22} color={colors.textSecondary} />
                            </TouchableOpacity>

                            <View style={styles.selectionIndicator}>
                                <MaterialIcons
                                    name={isSelected ? 'check-circle' : 'add-circle-outline'}
                                    size={24}
                                    color={isSelected ? colors.primary : colors.textSecondary}
                                />
                            </View>
                        </View>
                    </View>

                    {isExpanded && item.descripcion && (
                        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                            <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>{item.descripcion}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>
        );
    },
    (prevProps, nextProps) => prevProps.isSelected === nextProps.isSelected && prevProps.item.id === nextProps.item.id
);

const ExerciseLibraryScreen: React.FC<ExerciseLibraryScreenProps> = ({ navigation, route }) => {
    const { theme } = useTheme();
    const { colors } = theme;
    const authContext = useContext(AuthContext);
    const user = authContext?.user;
    const { routineDayId } = route.params || {};

    const {
        exercises,
        loading,
        saving,
        searchQuery,
        setSearchQuery,
        selectedMuscleGroup,
        setSelectedMuscleGroup,
        selectedExercises,
        toggleSelection,
        saveSelection,
        muscleGroups,
        clearSelection,
    } = useExerciseController(routineDayId, user?.id);

    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [videoModalVisible, setVideoModalVisible] = useState(false);
    const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

    const ALL_KEY = '__ALL__';

    const handleClearSearch = () => {
        setSearchQuery('');
        setIsSearchFocused(false);
        Keyboard.dismiss();
    };

    const handleMuscleGroupPress = (group: string) => {
        setSelectedMuscleGroup(group === selectedMuscleGroup ? null : group);
    };

    const handleConfirmSelection = async () => {
        const success = await saveSelection();
        if (success) {
            navigation.goBack();
        } else {
            Alert.alert('Error', 'No se pudieron añadir los ejercicios');
        }
    };

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

    const isSelectionMode = selectedExercises.length > 0;

    const renderItem = useCallback(
        ({ item }: { item: any }) => (
            <ExerciseItem
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
                headerText: { fontSize: 18, fontWeight: 'bold', color: colors.text },
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
                categoriesContainer: { marginBottom: 8, height: 50 },
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
                {isSelectionMode ? (
                    <TouchableOpacity onPress={clearSelection} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                        <MaterialIcons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={screenStyles.backButton} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                        <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                )}

                <Text style={screenStyles.headerText}>
                    {isSelectionMode ? `${selectedExercises.length} Seleccionados` : 'Biblioteca de Ejercicios'}
                </Text>

                {isSelectionMode ? (
                    <TouchableOpacity onPress={handleConfirmSelection} disabled={saving}>
                        {saving ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <MaterialIcons name="check" size={24} color={colors.primary} />
                        )}
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 24 }} />
                )}
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
                <View style={screenStyles.categoriesContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={screenStyles.categoriesScroll}>
                        <TouchableOpacity
                            key="all"
                            style={[screenStyles.categoryChip, selectedMuscleGroup === ALL_KEY && screenStyles.categoryChipSelected]}
                            onPress={() => handleMuscleGroupPress(ALL_KEY)}
                        >
                            <Text style={[screenStyles.categoryText, selectedMuscleGroup === ALL_KEY && screenStyles.categoryTextSelected]}>
                                Todos
                            </Text>
                        </TouchableOpacity>
                        {muscleGroups.map((group, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[screenStyles.categoryChip, selectedMuscleGroup === group && screenStyles.categoryChipSelected]}
                                onPress={() => handleMuscleGroupPress(group)}
                            >
                                <Text style={[screenStyles.categoryText, selectedMuscleGroup === group && screenStyles.categoryTextSelected]}>
                                    {group}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={exercises}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={screenStyles.listContent}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={8}
                    windowSize={5}
                    removeClippedSubviews
                    extraData={selectedExercises}
                    ListEmptyComponent={
                        !loading && !isSearchFocused && searchQuery.length === 0 && !selectedMuscleGroup ? (
                            <View style={screenStyles.emptyStateContainer}>
                                <MaterialIcons name="touch-app" size={48} color={colors.textSecondary} />
                                <Text style={screenStyles.emptyStateText}>Selecciona un grupo muscular o usa el buscador</Text>
                            </View>
                        ) : null
                    }
                />
            )}

            {/* Video Modal - Simplified without YouTube player for now */}
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
                                    // Could use Linking.openURL to open in YouTube app
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

const styles = StyleSheet.create({
    exerciseCard: {
        flexDirection: 'column',
        padding: 12,
        marginBottom: 12,
        borderRadius: 12,
    },
    thumbnailContainer: {
        width: 80,
        height: 54,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#000',
        marginRight: 12,
    },
    thumbnail: { width: '100%', height: '100%' },
    thumbnailPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
    playIconOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    exerciseInfo: { flex: 1, justifyContent: 'center' },
    exerciseName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
    exerciseText: { fontSize: 12 },
    selectionIndicator: { marginLeft: 12 },
});

export default ExerciseLibraryScreen;
