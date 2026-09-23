import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Modal,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { RoutineService } from '../services/RoutineService';
import { DAYS_OF_WEEK, getTranslatedDayName } from '../utils/dayUtils';

const DAY_NAMES = DAYS_OF_WEEK;

type RoutineDetailScreenProps = {
    navigation: any;
    route: any;
};

const RoutineDetailScreen: React.FC<RoutineDetailScreenProps> = ({ navigation, route }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { colors } = theme;
    const authContext = useContext(AuthContext);
    const userId = authContext?.user?.id;

    const { routineId } = route.params || {};

    const [routine, setRoutine] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editingDayId, setEditingDayId] = useState<string | null>(null);
    const [editDescription, setEditDescription] = useState('');

    useEffect(() => {
        if (routineId) {
            loadRoutine();
        }
    }, [routineId]);

    // Reload data when screen gains focus (navigating back from day detail)
    useFocusEffect(
        useCallback(() => {
            if (routineId) {
                loadRoutine();
            }
        }, [routineId])
    );

    const loadRoutine = async () => {
        setLoading(true);
        const { data } = await RoutineService.getWeeklyRoutineWithDays(routineId);
        if (data) {
            setRoutine(data);
        }
        setLoading(false);
    };

    const getDayData = (dayName: string) => {
        if (!routine?.rutinas_diarias) return null;

        // First try to find a template (no fecha_dia)
        const template = routine.rutinas_diarias.find(
            (d: any) => d.nombre_dia === dayName && !d.fecha_dia
        );
        if (template) return template;

        // If no template, find the most recent instance with this day name
        const instances = routine.rutinas_diarias
            .filter((d: any) => d.nombre_dia === dayName && d.fecha_dia)
            .sort((a: any, b: any) => new Date(b.fecha_dia).getTime() - new Date(a.fecha_dia).getTime());

        return instances[0] || null;
    };

    const getDayExerciseCount = (dayName: string) => {
        const day = getDayData(dayName);
        return day?.ejercicios_programados?.length || 0;
    };

    const getDayId = (dayName: string) => {
        const day = getDayData(dayName);
        return day?.id;
    };

    const getDayDescription = (dayName: string) => {
        const day = getDayData(dayName);
        return day?.descripcion || '';
    };

    const handleEditDescription = (dayName: string) => {
        const dayId = getDayId(dayName);
        if (!dayId) return;
        setEditingDayId(dayId);
        setEditDescription(getDayDescription(dayName));
    };

    const handleSaveDescription = async () => {
        if (!editingDayId) return;
        const { error } = await RoutineService.updateRoutineDayDescription(
            editingDayId,
            editDescription.trim()
        );
        if (error) {
            Alert.alert(t('common.error', 'Error'), t('routine.errorSaveDescription', 'No se pudo guardar la descripción'));
        } else {
            await loadRoutine();
        }
        setEditingDayId(null);
        setEditDescription('');
    };

    // Calculate weekly summary metrics
    const { activeDaysCount, totalExercisesCount } = useMemo(() => {
        let activeDays = 0;
        let totalExercises = 0;
        DAY_NAMES.forEach((dayName) => {
            const count = getDayExerciseCount(dayName);
            if (count > 0) {
                activeDays += 1;
                totalExercises += count;
            }
        });
        return { activeDaysCount: activeDays, totalExercisesCount: totalExercises };
    }, [routine]);

    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <SafeAreaView style={styles.container} testID="routine-detail-screen">
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    testID="routine-detail-back-button"
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                    <MaterialIcons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <View style={styles.protocolBadge}>
                        <View style={styles.protocolBadgeBar} />
                        <Text style={styles.protocolBadgeText}>{t('routine.weeklyMicrocycle', 'MICROCICLO SEMANAL')}</Text>
                    </View>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {routine?.nombre || t('routine.defaultRoutineName', 'Rutina')}
                    </Text>
                    {routine?.objetivo && (
                        <View style={styles.objectivePill}>
                            <MaterialIcons name="track-changes" size={12} color={colors.primary} />
                            <Text style={styles.headerSubtitle} numberOfLines={1}>
                                {routine.objetivo}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Bento Routine Overview Banner */}
                <View style={styles.bentoSummaryCard}>
                    <View style={styles.bentoMetricItem}>
                        <Text style={styles.bentoMetricVal}>{activeDaysCount}</Text>
                        <Text style={styles.bentoMetricLbl}>{t('routine.activeDays', 'Días Activos')}</Text>
                    </View>
                    <View style={styles.bentoDivider} />
                    <View style={styles.bentoMetricItem}>
                        <Text style={styles.bentoMetricVal}>{totalExercisesCount}</Text>
                        <Text style={styles.bentoMetricLbl}>{t('routine.exercises', 'Ejercicios')}</Text>
                    </View>
                    <View style={styles.bentoDivider} />
                    <View style={styles.bentoMetricItem}>
                        <View style={[styles.activeStatusPill, { backgroundColor: routine?.activa ? '#10B98120' : `${colors.border}40` }]}>
                            <View style={[styles.statusDot, { backgroundColor: routine?.activa ? '#10B981' : colors.textSecondary }]} />
                            <Text style={[styles.statusText, { color: routine?.activa ? '#10B981' : colors.textSecondary }]}>
                                {routine?.activa ? t('routine.statusActive', 'Activa') : t('routine.statusSaved', 'Guardada')}
                            </Text>
                        </View>
                        <Text style={styles.bentoMetricLbl}>{t('routine.status', 'Estado')}</Text>
                    </View>
                </View>

                {/* Section Title */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>{t('routine.daysOfWeek', 'Días de la Semana')}</Text>
                    <Text style={styles.sectionSubtitle}>{t('routine.programmableDays', '7 días programables')}</Text>
                </View>

                {DAY_NAMES.map((dayName, idx) => {
                    const exerciseCount = getDayExerciseCount(dayName);
                    const dayId = getDayId(dayName);
                    const translatedDay = getTranslatedDayName(dayName, t);
                    const description = getDayDescription(dayName);
                    const hasExercises = exerciseCount > 0;

                    return (
                        <TouchableOpacity
                            key={dayName}
                            testID={`routine-day-card-${dayName.toLowerCase()}`}
                            style={[
                                styles.dayCard,
                                !hasExercises && styles.emptyDay,
                                hasExercises && styles.activeDayCard,
                            ]}
                            activeOpacity={0.75}
                            onPress={async () => {
                                let targetDayId = dayId;

                                // If day doesn't exist, create it first
                                if (!targetDayId && userId) {
                                    const dayIndex = DAY_NAMES.indexOf(dayName);
                                    const dayOfWeek = dayIndex === 6 ? 0 : dayIndex + 1; // Convert to Sunday=0 format
                                    const { data } = await RoutineService.getOrCreateRoutineDay(userId, dayOfWeek);
                                    if (data) {
                                        targetDayId = data.id;
                                        // Reload routine to get updated data
                                        loadRoutine();
                                    }
                                }

                                if (targetDayId) {
                                    navigation.navigate('Workout', {
                                        routineDayId: targetDayId,
                                        dayName: dayName,
                                        mode: 'edit',
                                    });
                                }
                            }}
                        >
                            {/* Day Index & Status Indicator */}
                            <View style={[styles.dayNumberPill, hasExercises && styles.dayNumberPillActive]}>
                                <Text style={[styles.dayNumberText, hasExercises && styles.dayNumberTextActive]}>
                                    D{idx + 1}
                                </Text>
                            </View>

                            <View style={styles.dayInfo}>
                                <View style={styles.dayNameRow}>
                                    <Text style={styles.dayName}>{translatedDay}</Text>
                                    {hasExercises ? (
                                        <View style={styles.exerciseBadge}>
                                            <MaterialIcons name="fitness-center" size={11} color={colors.primary} />
                                            <Text style={styles.exerciseBadgeText}>
                                                {exerciseCount === 1
                                                    ? t('routine.exercisesCount_one', '1 ejercicio', { count: 1 })
                                                    : t('routine.exercisesCount_other', `${exerciseCount} ejercicios`, { count: exerciseCount })}
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>

                                {description ? (
                                    <Text style={styles.dayDescription} numberOfLines={1}>
                                        {description}
                                    </Text>
                                ) : null}

                                {!hasExercises && (
                                    <Text style={styles.noExercisesText}>
                                        {t('routine.noExercises', 'Sin ejercicios - Toca para añadir')}
                                    </Text>
                                )}
                            </View>

                            <TouchableOpacity
                                testID={`edit-day-desc-button-${dayName.toLowerCase()}`}
                                style={styles.editDescButton}
                                onPress={() => handleEditDescription(dayName)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <MaterialIcons name="edit" size={16} color={colors.textSecondary} />
                            </TouchableOpacity>

                            <View style={styles.dayArrow}>
                                <MaterialIcons
                                    name="chevron-right"
                                    size={20}
                                    color={colors.textSecondary}
                                />
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Modal for editing day description */}
            <Modal
                visible={editingDayId !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setEditingDayId(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <MaterialIcons name="edit-note" size={22} color={colors.primary} />
                            <Text style={styles.modalTitle}>{t('routine.dayDescriptionTitle', 'Descripción del día')}</Text>
                        </View>
                        <TextInput
                            testID="edit-day-desc-input"
                            style={styles.modalInput}
                            value={editDescription}
                            onChangeText={setEditDescription}
                            placeholder={t('routine.dayDescriptionPlaceholder', 'Ej: Día de Piernas - Enfoque cuádriceps')}
                            placeholderTextColor={colors.textSecondary}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalButtonCancel}
                                onPress={() => setEditingDayId(null)}
                            >
                                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>
                                    {t('common.cancel', 'Cancelar')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                testID="save-day-desc-button"
                                style={styles.modalButtonSave}
                                onPress={handleSaveDescription}
                            >
                                <Text style={{ color: colors.textOnPrimary || '#000000', fontWeight: '700' }}>
                                    {t('common.save', 'Guardar')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const createStyles = (colors: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background || '#09090B',
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: `${colors.border}80`,
            gap: 12,
        },
        backButton: {
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: `${colors.border}80`,
        },
        headerContent: {
            flex: 1,
        },
        protocolBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginBottom: 2,
        },
        protocolBadgeBar: {
            width: 10,
            height: 2.5,
            borderRadius: 2,
            backgroundColor: colors.primary,
        },
        protocolBadgeText: {
            fontSize: 9,
            fontWeight: '800',
            letterSpacing: 1.2,
            color: colors.textSecondary,
            textTransform: 'uppercase',
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: '800',
            color: colors.text,
        },
        objectivePill: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            marginTop: 2,
        },
        headerSubtitle: {
            fontSize: 12,
            color: colors.textSecondary,
            fontWeight: '500',
        },
        content: {
            flex: 1,
        },
        scrollContainer: {
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 40,
        },
        bentoSummaryCard: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.surface,
            borderRadius: 16,
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: `${colors.border}80`,
            marginBottom: 20,
        },
        bentoMetricItem: {
            alignItems: 'center',
            flex: 1,
        },
        bentoMetricVal: {
            fontSize: 18,
            fontWeight: '800',
            color: colors.text,
        },
        bentoMetricLbl: {
            fontSize: 10,
            fontWeight: '600',
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginTop: 2,
        },
        bentoDivider: {
            width: 1,
            height: 24,
            backgroundColor: `${colors.border}60`,
        },
        activeStatusPill: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 10,
        },
        statusDot: {
            width: 6,
            height: 6,
            borderRadius: 3,
        },
        statusText: {
            fontSize: 11,
            fontWeight: '700',
        },
        sectionHeaderRow: {
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 12,
        },
        sectionTitle: {
            fontSize: 14,
            fontWeight: '800',
            color: colors.text,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
        },
        sectionSubtitle: {
            fontSize: 11,
            color: colors.textSecondary,
            fontWeight: '500',
        },
        dayCard: {
            backgroundColor: colors.surface,
            borderRadius: 14,
            padding: 14,
            marginBottom: 10,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: `${colors.border}80`,
            gap: 12,
        },
        activeDayCard: {
            borderColor: `${colors.primary}40`,
        },
        emptyDay: {
            opacity: 0.7,
        },
        dayNumberPill: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: `${colors.border}40`,
            alignItems: 'center',
            justifyContent: 'center',
        },
        dayNumberPillActive: {
            backgroundColor: `${colors.primary}20`,
        },
        dayNumberText: {
            fontSize: 11,
            fontWeight: '800',
            color: colors.textSecondary,
        },
        dayNumberTextActive: {
            color: colors.primary,
        },
        dayInfo: {
            flex: 1,
        },
        dayNameRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        dayName: {
            fontSize: 15,
            fontWeight: '700',
            color: colors.text,
        },
        exerciseBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: `${colors.primary}15`,
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 8,
        },
        exerciseBadgeText: {
            fontSize: 11,
            fontWeight: '600',
            color: colors.primary,
        },
        dayDescription: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 3,
        },
        noExercisesText: {
            fontSize: 11,
            color: colors.textSecondary,
            marginTop: 2,
            fontStyle: 'italic',
        },
        editDescButton: {
            padding: 6,
            borderRadius: 8,
            backgroundColor: `${colors.border}40`,
        },
        dayArrow: {
            paddingLeft: 2,
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.65)',
            justifyContent: 'center',
            padding: 24,
        },
        modalContent: {
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: `${colors.border}80`,
        },
        modalHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 14,
        },
        modalTitle: {
            fontSize: 16,
            fontWeight: '700',
            color: colors.text,
        },
        modalInput: {
            backgroundColor: colors.background || '#09090B',
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            color: colors.text,
            fontSize: 14,
            borderWidth: 1,
            borderColor: `${colors.border}80`,
            minHeight: 48,
        },
        modalButtons: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginTop: 16,
            gap: 10,
        },
        modalButtonCancel: {
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: `${colors.border}80`,
        },
        modalButtonSave: {
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: colors.primary,
        },
    });

export default RoutineDetailScreen;

