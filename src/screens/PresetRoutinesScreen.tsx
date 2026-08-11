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

    const handleSelectPreset = (preset: PresetRoutine) => {
        setSelectedPreset(preset);
        setModalVisible(true);
    };

    const handleConfirmImport = async (preset: PresetRoutine) => {
        if (!user?.id) {
            Alert.alert('Inicia sesión', 'Debes iniciar sesión para asignar una rutina.');
            return;
        }

        try {
            setIsImporting(true);
            const res = await RoutineService.importPresetRoutine(user.id, preset.id, true);
            setIsImporting(false);

            if (res.error) {
                Alert.alert('Error', `No se pudo importar: ${JSON.stringify(res.error)}`);
                return;
            }




            setModalVisible(false);
            Alert.alert(
                '¡Rutina Asignada!',
                `La rutina "${preset.nombre}" ha sido configurada como tu rutina semanal activa.`,
                [
                    {
                        text: 'Ir a Mis Rutinas',
                        onPress: () => navigation.navigate('RoutineEditor'),
                    },

                ]
            );
        } catch (error) {
            setIsImporting(false);
            Alert.alert('Error', 'Ocurrió un error inesperado al importar la rutina.');
        }
    };

    return (
        <SafeAreaView
            style={[styles.safeArea, { backgroundColor: colors.background || '#09090B' }]}
            edges={['top', 'left', 'right']}
        >
            {/* Top Navigation Header */}
            <View style={[styles.headerBar, { borderBottomColor: colors.border || '#27272A' }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    testID="back-button"
                    style={[styles.backBtn, { backgroundColor: colors.surface || '#1E1E1E' }]}
                >
                    <MaterialIcons name="arrow-back" size={22} color={colors.text || '#FFFFFF'} />
                </TouchableOpacity>

                <Text style={[styles.headerTitle, { color: colors.text || '#FFFFFF' }]}>
                    {t('presetRoutines.title', 'Plantillas Prémium')}
                </Text>

                <View style={styles.headerRightSpacer} />
            </View>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Intro Title & Description */}
                <View style={styles.introBlock}>
                    <Text style={[styles.mainHeading, { color: colors.text || '#FFFFFF' }]}>
                        {t('presetRoutines.libraryTitle', 'Biblioteca de Rutinas')}
                    </Text>
                    <Text style={[styles.subHeading, { color: colors.textSecondary || '#A1A1AA' }]}>
                        {t('presetRoutines.subtitle', 'Selecciona un programa probado científicamente para tus objetivos.')}
                    </Text>
                </View>

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
                                            ? colors.primary || '#10B981'
                                            : colors.surface || '#18181B',
                                        borderColor: isSelected
                                            ? colors.primary || '#10B981'
                                            : colors.border || '#27272A',
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.chipText,
                                        {
                                            color: isSelected
                                                ? '#000000'
                                                : colors.textSecondary || '#D4D4D8',
                                            fontWeight: isSelected ? '700' : '500',
                                        },
                                    ]}
                                >
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Days Filter Chips */}
                <View style={styles.daysRow}>
                    <Text style={[styles.daysLabel, { color: colors.textSecondary || '#71717A' }]}>
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
                                                ? colors.surface || '#1F2937'
                                                : colors.background || '#18181B',
                                            borderColor: isSelected
                                                ? colors.primary || '#10B981'
                                                : colors.border || '#27272A',
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.dayFilterText,
                                            {
                                                color: isSelected
                                                    ? colors.primary || '#10B981'
                                                    : colors.textSecondary || '#A1A1AA',
                                                fontWeight: isSelected ? '700' : '500',
                                            },
                                        ]}
                                    >
                                        {days === 0 ? 'Todos' : `${days} días`}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Preset Routines List */}
                {filteredPresets.length > 0 ? (
                    filteredPresets.map((preset) => (
                        <PresetRoutineCard
                            key={preset.id}
                            preset={preset}
                            onPressSelect={handleSelectPreset}
                        />
                    ))
                ) : (
                    <View
                        style={[
                            styles.emptyState,
                            {
                                backgroundColor: colors.surface || '#18181B',
                                borderColor: colors.border || '#27272A',
                            },
                        ]}
                    >
                        <MaterialIcons name="fitness-center" size={40} color={colors.textSecondary || '#71717A'} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary || '#A1A1AA' }]}>
                            No hay plantillas con estos filtros
                        </Text>
                    </View>
                )}

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
    bottomSpacer: {
        height: 32,
    },
});
