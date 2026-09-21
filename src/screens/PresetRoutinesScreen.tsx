import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { PresetRoutineService } from '../services/PresetRoutineService';
import { RoutineService } from '../services/RoutineService';
import { PresetRoutine } from '../types/models';
import { PresetRoutineCard } from '../components/PresetRoutineCard';
import { PresetRoutineDetailModal } from '../components/PresetRoutineDetailModal';
import { PresetHeroCard, PresetMetricHighlightBar } from '../components/routine';

const CATEGORY_FILTERS = ['Todas', 'Hipertrofia', 'Fuerza', 'Estética', 'Principiante'];
const DAYS_FILTERS = [0, 3, 4, 6];

export const PresetRoutinesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { theme } = useTheme();
    const { colors } = theme;

    const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
    const [selectedDays, setSelectedDays] = useState<number>(0);
    const [selectedPreset, setSelectedPreset] = useState<PresetRoutine | null>(null);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [isImporting, setIsImporting] = useState<boolean>(false);

    // Fetch and filter presets dynamically
    const filteredPresets = useMemo(() => {
        const res = PresetRoutineService.filterPresets({
            categoria: selectedCategory === 'Todas' ? undefined : selectedCategory,
            dias_por_semana: selectedDays === 0 ? undefined : selectedDays,
        });
        return res.data || [];
    }, [selectedCategory, selectedDays]);

    const heroPreset = useMemo(() => {
        return (
            filteredPresets.find((p) => p.id === 'preset-ppl-6d') ||
            (filteredPresets.length > 0 ? filteredPresets[0] : null)
        );
    }, [filteredPresets]);

    const isHeroVisible = Boolean(
        heroPreset &&
        (selectedCategory === 'Todas' || selectedCategory === 'Hipertrofia') &&
        selectedDays === 0
    );

    const secondaryPresets = useMemo(() => {
        if (!isHeroVisible || !heroPreset) return filteredPresets;
        return filteredPresets.filter((p) => p.id !== heroPreset.id);
    }, [isHeroVisible, heroPreset, filteredPresets]);

    const handleSelectPreset = (preset: PresetRoutine) => {
        setSelectedPreset(preset);
        setModalVisible(true);
    };

    const handleConfirmImport = async (preset: PresetRoutine) => {
        if (!user?.id) {
            Alert.alert(
                t('presetRoutines.loginRequiredTitle', 'Inicia sesión'),
                t('presetRoutines.loginRequiredMsg', 'Debes iniciar sesión para asignar una rutina.')
            );
            return;
        }

        try {
            setIsImporting(true);
            const res = await RoutineService.importPresetRoutine(user.id, preset.id, true);
            setIsImporting(false);

            if (res.error) {
                Alert.alert(t('common.error', 'Error'), `No se pudo importar: ${JSON.stringify(res.error)}`);
                return;
            }

            setModalVisible(false);
            Alert.alert(
                t('presetRoutines.routineAssignedTitle', '¡Rutina Asignada!'),
                t('presetRoutines.routineAssignedSuccess', `La rutina "${preset.nombre}" ha sido configurada como tu rutina semanal activa.`, { name: preset.nombre }),
                [
                    {
                        text: t('presetRoutines.goToMyRoutines', 'Ir a Mis Rutinas'),
                        onPress: () => navigation.navigate('RoutineEditor'),
                    },
                ]
            );
        } catch (error) {
            setIsImporting(false);
            Alert.alert(t('common.error', 'Error'), 'Ocurrió un error inesperado al importar la rutina.');
        }
    };

    return (
        <SafeAreaView
            style={[styles.safeArea, { backgroundColor: colors.background || '#09090B' }]}
            edges={['top', 'left', 'right']}
            testID="preset-routines-screen"
        >
            {/* Top Navigation Header */}
            <View style={[styles.headerBar, { borderBottomColor: `${colors.border}80` }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    testID="back-button"
                    style={[styles.backBtn, { backgroundColor: colors.surface }]}
                >
                    <MaterialIcons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>

                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {t('presetRoutines.title', 'Plantillas Prémium')}
                </Text>

                <TouchableOpacity
                    onPress={() => navigation.navigate('RoutineEditor')}
                    style={[styles.createFromScratchBtn, { backgroundColor: `${colors.primary}20` }]}
                    testID="create-routine-from-scratch-button"
                >
                    <MaterialIcons name="add" size={16} color={colors.primary} />
                    <Text style={[styles.createFromScratchText, { color: colors.primary }]}>
                        Crear
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                testID="preset-routines-list"
            >
                {/* Intro Title & Description */}
                <View style={styles.introBlock}>
                    <View style={styles.engineeringBadge}>
                        <View style={[styles.badgeAccentBar, { backgroundColor: colors.primary }]} />
                        <Text style={[styles.engineeringTag, { color: colors.textSecondary }]}>
                            ENGINEERING PROTOCOLS
                        </Text>
                    </View>
                    <Text style={[styles.mainHeading, { color: colors.text }]}>
                        {t('presetRoutines.libraryTitle', 'Biblioteca de Rutinas')}
                    </Text>
                    <Text style={[styles.subHeading, { color: colors.textSecondary }]}>
                        {t('presetRoutines.subtitle', 'Selecciona un programa probado científicamente para tus objetivos.')}
                    </Text>
                </View>

                {/* Metric Highlight Strip */}
                <PresetMetricHighlightBar totalPresets={filteredPresets.length || 24} colors={colors} />

                {/* Category Chips (Horizontal Scroll) */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.chipsScroll}
                    contentContainerStyle={styles.chipsScrollContent}
                >
                    {CATEGORY_FILTERS.map((cat) => {
                        const isSelected = selectedCategory === cat;
                        return (
                            <TouchableOpacity
                                key={cat}
                                onPress={() => setSelectedCategory(cat)}
                                testID={`filter-category-${cat}`}
                                style={[
                                    styles.chip,
                                    {
                                        backgroundColor: isSelected
                                            ? colors.primary
                                            : colors.surface,
                                        borderColor: isSelected
                                            ? colors.primary
                                            : `${colors.border}80`,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.chipText,
                                        {
                                            color: isSelected
                                                ? (colors.textOnPrimary || '#000000')
                                                : colors.textSecondary,
                                            fontWeight: isSelected ? '700' : '500',
                                        },
                                    ]}
                                >
                                    {cat === 'Todas' ? t('common.allFem', 'Todas') : cat}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Days Filter Chips */}
                <View style={styles.daysRow}>
                    <Text style={[styles.daysLabel, { color: colors.textSecondary }]}>
                        Frecuencia:
                    </Text>
                    <View style={styles.daysChipsContainer}>
                        {DAYS_FILTERS.map((days) => {
                            const isSelected = selectedDays === days;
                            return (
                                <TouchableOpacity
                                    key={`days-${days}`}
                                    onPress={() => setSelectedDays(days)}
                                    testID={`filter-days-${days}`}
                                    style={[
                                        styles.dayFilterChip,
                                        {
                                            backgroundColor: isSelected
                                                ? colors.surface
                                                : colors.background,
                                            borderColor: isSelected
                                                ? colors.primary
                                                : `${colors.border}80`,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.dayFilterText,
                                            {
                                                color: isSelected
                                                    ? colors.primary
                                                    : colors.textSecondary,
                                                fontWeight: isSelected ? '700' : '500',
                                            },
                                        ]}
                                    >
                                        {days === 0 ? t('common.all', 'Todos') : `${days} días`}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Featured Hero Bento Card for Flagship Routine */}
                {isHeroVisible && heroPreset && (
                    <PresetHeroCard
                        preset={heroPreset}
                        onPressSelect={handleSelectPreset}
                        onPressUse={handleConfirmImport}
                        colors={colors}
                    />
                )}

                {/* Preset Routines List */}
                {secondaryPresets.length > 0 ? (
                    secondaryPresets.map((preset, index) => (
                        <PresetRoutineCard
                            key={preset.id}
                            preset={preset}
                            index={index}
                            onPressSelect={handleSelectPreset}
                        />
                    ))
                ) : !isHeroVisible ? (
                    <View
                        style={[
                            styles.emptyState,
                            {
                                backgroundColor: colors.surface,
                                borderColor: `${colors.border}80`,
                            },
                        ]}
                    >
                        <MaterialIcons name="fitness-center" size={40} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            No hay plantillas con estos filtros
                        </Text>
                    </View>
                ) : null}

                {/* Quick Creation Tile: Crear Plantilla en Blanco */}
                <TouchableOpacity
                    style={[
                        styles.createBlankTile,
                        {
                            backgroundColor: colors.surface,
                            borderColor: `${colors.border}80`,
                        },
                    ]}
                    onPress={() => navigation.navigate('RoutineEditor')}
                    activeOpacity={0.8}
                    testID="create-blank-routine-tile"
                >
                    <View style={styles.createBlankLeft}>
                        <View style={[styles.createBlankIcon, { backgroundColor: `${colors.primary}20` }]}>
                            <MaterialIcons name="post-add" size={22} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.createBlankTitle, { color: colors.text }]}>
                                Crear Plantilla en Blanco
                            </Text>
                            <Text style={[styles.createBlankSubtitle, { color: colors.textSecondary }]}>
                                Diseña tu propio microciclo biomecánico
                            </Text>
                        </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={22} color={colors.textSecondary} />
                </TouchableOpacity>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Routine Detail Modal */}
            <PresetRoutineDetailModal
                visible={modalVisible}
                preset={selectedPreset}
                isImporting={isImporting}
                onClose={() => setModalVisible(false)}
                onConfirmUse={handleConfirmImport}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
    },
    headerRightSpacer: {
        width: 36,
    },
    createFromScratchBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    createFromScratchText: {
        fontSize: 12,
        fontWeight: '700',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    introBlock: {
        marginBottom: 16,
    },
    engineeringBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    badgeAccentBar: {
        width: 14,
        height: 3,
        borderRadius: 2,
    },
    engineeringTag: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    mainHeading: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 4,
    },
    subHeading: {
        fontSize: 13,
        lineHeight: 18,
    },
    chipsScroll: {
        marginBottom: 14,
    },
    chipsScrollContent: {
        gap: 8,
        paddingRight: 16,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 12,
    },
    daysRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 8,
    },
    daysLabel: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    daysChipsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dayFilterChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
    },
    dayFilterText: {
        fontSize: 12,
    },
    emptyState: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        borderWidth: 1,
        marginVertical: 20,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 10,
    },
    createBlankTile: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginTop: 12,
        marginBottom: 8,
    },
    createBlankLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    createBlankIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createBlankTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    createBlankSubtitle: {
        fontSize: 12,
    },
    bottomSpacer: {
        height: 32,
    },
});
