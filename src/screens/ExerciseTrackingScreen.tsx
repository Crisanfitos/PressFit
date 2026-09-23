import React, { useState, useContext, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ExerciseService } from '../services/ExerciseService';
import { LogService } from '../services/LogService';

type ExerciseTrackingScreenProps = { navigation: any };

const ExerciseTrackingScreen: React.FC<ExerciseTrackingScreenProps> = ({ navigation }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { colors } = theme;
    const authContext = useContext(AuthContext);
    const user = authContext?.user;
    const [exercises, setExercises] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loadExercises = async () => {
            if (!user?.id) return;
            setLoading(true);
            try {
                const { data } = await ExerciseService.getUserExercisesWithProgress(user.id);
                setExercises(data || []);
            } catch (error) {
                LogService.error('Error loading exercises:', error);
            } finally {
                setLoading(false);
            }
        };
        loadExercises();
    }, [user?.id]);

    const filteredExercises = useMemo(() => {
        if (!searchQuery) return exercises;
        const lower = searchQuery.toLowerCase();
        return exercises.filter((e) => e.titulo.toLowerCase().includes(lower));
    }, [exercises, searchQuery]);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: { flex: 1, backgroundColor: colors.background },
                // ─── Header ──────────────────────────────────────────
                header: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                },
                backButton: { padding: 8, marginLeft: -8 },
                headerText: {
                    fontSize: 18,
                    fontWeight: '700',
                    color: colors.onSurface,
                    flex: 1,
                    textAlign: 'center',
                    letterSpacing: -0.3,
                },
                // ─── Search ──────────────────────────────────────────
                searchContainer: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginHorizontal: 16,
                    marginBottom: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 11,
                    borderRadius: 14,
                    backgroundColor: colors.surfaceContainerLow,
                    borderWidth: 1,
                    borderColor: colors.outlineVariant,
                    gap: 10,
                },
                searchInput: {
                    flex: 1,
                    color: colors.onSurface,
                    fontSize: 15,
                },
                // ─── Counter ─────────────────────────────────────────
                counterRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    marginBottom: 8,
                },
                counterText: {
                    fontSize: 12,
                    color: colors.onSurfaceVariant,
                    fontWeight: '500',
                },
                // ─── List ────────────────────────────────────────────
                loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
                listContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 8 },
                // ─── Exercise Card ───────────────────────────────────
                exerciseCard: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 14,
                    borderRadius: 14,
                    backgroundColor: colors.surfaceContainerLowest,
                    borderWidth: 1,
                    borderColor: colors.outlineVariant,
                    gap: 12,
                },
                exerciseIconWrap: {
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: colors.surfaceContainerHigh,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                exerciseInfo: { flex: 1 },
                exerciseName: {
                    fontSize: 15,
                    fontWeight: '600',
                    color: colors.onSurface,
                    letterSpacing: -0.2,
                },
                exerciseMuscle: {
                    fontSize: 11,
                    color: colors.onSurfaceVariant,
                    marginTop: 2,
                },
                arrowIcon: {
                    opacity: 0.5,
                },
                // ─── Empty state ─────────────────────────────────────
                emptyContainer: {
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 60,
                    gap: 12,
                },
                emptyIconWrap: {
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    backgroundColor: colors.surfaceContainerLow,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                emptyTitle: {
                    fontSize: 15,
                    fontWeight: '600',
                    color: colors.onSurface,
                },
                emptySubtitle: {
                    fontSize: 13,
                    color: colors.onSurfaceVariant,
                    textAlign: 'center',
                    paddingHorizontal: 32,
                },
            }),
        [colors]
    );

    const formatMuscle = (muscles: any): string => {
        if (!muscles) return '';
        const raw = Array.isArray(muscles)
            ? muscles[0]
            : (typeof muscles === 'string' ? muscles.split(',')[0].trim() : String(muscles));
        if (!raw) return '';
        const key = String(raw).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').trim();
        return String(t(`muscleGroups.${key}`, raw));
    };

    const renderItem = ({ item, index }: { item: any; index: number }) => (
        <TouchableOpacity
            style={styles.exerciseCard}
            testID={`exercise-tracking-item-${index}`}
            onPress={() => navigation.navigate('ExerciseProgressDetail', { exerciseId: item.id })}
            activeOpacity={0.75}
        >
            <View style={styles.exerciseIconWrap}>
                <MaterialIcons name="fitness-center" size={20} color={colors.primary} />
            </View>
            <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName} numberOfLines={1}>
                    {item.titulo}
                </Text>
                {item.musculos_primarios && (
                    <Text style={styles.exerciseMuscle} numberOfLines={1}>
                        {formatMuscle(item.musculos_primarios)}
                    </Text>
                )}
            </View>
            <MaterialIcons
                name="arrow-forward-ios"
                size={15}
                color={colors.onSurfaceVariant}
                style={styles.arrowIcon}
            />
        </TouchableOpacity>
    );

    const ListEmpty = () => (
        <View style={styles.emptyContainer} testID="exercise-tracking-empty">
            <View style={styles.emptyIconWrap}>
                <MaterialIcons name="bar-chart" size={30} color={colors.onSurfaceVariant} />
            </View>
            <Text style={styles.emptyTitle}>
                {searchQuery
                    ? t('progress.noSearchResults', 'Sin resultados')
                    : t('progress.noExercisesTracked', 'Sin ejercicios registrados')}
            </Text>
            <Text style={styles.emptySubtitle}>
                {searchQuery
                    ? t('progress.tryAnotherSearch', 'Prueba con otro término de búsqueda')
                    : t('progress.logSetsPrompt', 'Registra series en un entrenamiento para ver tu progreso aquí')}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} testID="exercise-tracking-screen">
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    testID="exercise-tracking-back-button"
                >
                    <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
                </TouchableOpacity>
                <Text style={styles.headerText}>
                    {t('progress.exerciseProgress', 'Progreso por Ejercicio')}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={20} color={colors.onSurfaceVariant} />
                <TextInput
                    testID="exercise-tracking-search-input"
                    style={styles.searchInput}
                    placeholder={t('progress.searchExercise', 'Buscar ejercicio...')}
                    placeholderTextColor={colors.onSurfaceVariant}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} testID="exercise-tracking-clear-search">
                        <MaterialIcons name="close" size={18} color={colors.onSurfaceVariant} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Counter */}
            {!loading && (
                <View style={styles.counterRow}>
                    <Text style={styles.counterText}>
                        {filteredExercises.length === 1
                            ? t('progress.exerciseCountSingular', '1 ejercicio')
                            : t('progress.exerciseCountPlural', '{{count}} ejercicios', { count: filteredExercises.length })}
                    </Text>
                </View>
            )}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    testID="exercise-tracking-list"
                    data={filteredExercises}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<ListEmpty />}
                />
            )}
        </SafeAreaView>
    );
};

export default ExerciseTrackingScreen;
