import React, { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AnalyticsService } from '../services/AnalyticsService';
import { MuscleVolumeBar } from '../components/analytics/MuscleVolumeBar';
import {
    formatLocalDateKey,
    getStartOfWeek,
    getEndOfWeek,
} from '../utils/dateUtils';
import {
    assessMuscleHypertrophy,
} from '../utils/hypertrophyLandmarks';
import { EffectiveSetsSummary } from '../utils/analyticsUtils';

type HypertrophyVolumeScreenProps = {
    navigation: any;
};

export const HypertrophyVolumeScreen: React.FC<HypertrophyVolumeScreenProps> = ({
    navigation,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { colors } = theme;
    const authContext = useContext(AuthContext);
    const user = authContext?.user;

    const [referenceDate, setReferenceDate] = useState<Date>(new Date());
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [summary, setSummary] = useState<EffectiveSetsSummary | null>(null);
    const [showLegend, setShowLegend] = useState<boolean>(false);

    // Compute week date boundaries
    const { startOfWeek, endOfWeek, startDateStr, endDateStr, isCurrentWeek, weekLabel } =
        useMemo(() => {
            const start = getStartOfWeek(referenceDate);
            const end = getEndOfWeek(referenceDate);
            const currentStart = getStartOfWeek(new Date());

            const isCurrent = start.getTime() === currentStart.getTime();

            const startDay = String(start.getDate()).padStart(2, '0');
            const startMonth = String(start.getMonth() + 1).padStart(2, '0');
            const endDay = String(end.getDate()).padStart(2, '0');
            const endMonth = String(end.getMonth() + 1).padStart(2, '0');

            const label = `${startDay}/${startMonth} - ${endDay}/${endMonth}`;

            return {
                startOfWeek: start,
                endOfWeek: end,
                startDateStr: formatLocalDateKey(start),
                endDateStr: formatLocalDateKey(end),
                isCurrentWeek: isCurrent,
                weekLabel: label,
            };
        }, [referenceDate]);

    const fetchVolumeData = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            const response = await AnalyticsService.getEffectiveSetsByMuscleGroup(
                user.id,
                {
                    startDate: startDateStr,
                    endDate: endDateStr,
                    secondaryWeight: 0.5,
                }
            );

            if (response.data) {
                setSummary(response.data);
            } else {
                setSummary({
                    totalSeriesEfectivas: 0,
                    porGrupoMuscular: {},
                    distribucion: [],
                });
            }
        } catch (error) {
            console.error('Error fetching hypertrophy volume:', error);
            setSummary({
                totalSeriesEfectivas: 0,
                porGrupoMuscular: {},
                distribucion: [],
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id, startDateStr, endDateStr]);

    useEffect(() => {
        setLoading(true);
        fetchVolumeData();
    }, [fetchVolumeData]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchVolumeData();
    }, [fetchVolumeData]);

    const handlePrevWeek = () => {
        setReferenceDate((prev) => {
            const next = new Date(prev);
            next.setDate(next.getDate() - 7);
            return next;
        });
    };

    const handleNextWeek = () => {
        if (isCurrentWeek) return;
        setReferenceDate((prev) => {
            const next = new Date(prev);
            next.setDate(next.getDate() + 7);
            return next;
        });
    };

    // Calculate aggregated metrics across muscle assessments
    const { optimalCount, warningCount, overtrainingCount } = useMemo(() => {
        if (!summary?.distribucion?.length) {
            return { optimalCount: 0, warningCount: 0, overtrainingCount: 0 };
        }

        let optimal = 0;
        let warning = 0;
        let overtraining = 0;

        for (const item of summary.distribucion) {
            const assessment = assessMuscleHypertrophy(
                item.grupo_muscular,
                item.series_efectivas
            );
            if (assessment.status === 'optimal') optimal++;
            else if (assessment.status === 'warning') warning++;
            else if (assessment.status === 'overtraining') overtraining++;
        }

        return {
            optimalCount: optimal,
            warningCount: warning,
            overtrainingCount: overtraining,
        };
    }, [summary]);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: {
                    flex: 1,
                    backgroundColor: colors.background,
                },
                header: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                },
                backButton: {
                    padding: 8,
                    marginLeft: -8,
                },
                headerTitle: {
                    fontSize: 18,
                    fontWeight: '700',
                    color: colors.text,
                },
                headerRight: {
                    width: 40,
                    alignItems: 'flex-end',
                },
                weekSelector: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: colors.surface,
                    marginHorizontal: 16,
                    marginTop: 16,
                    marginBottom: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                weekNavButton: {
                    padding: 6,
                    borderRadius: 8,
                    backgroundColor: `${colors.primary}15`,
                },
                weekNavButtonDisabled: {
                    opacity: 0.3,
                },
                weekInfo: {
                    alignItems: 'center',
                },
                weekLabelText: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontWeight: '500',
                    textTransform: 'uppercase',
                },
                weekDateText: {
                    fontSize: 15,
                    fontWeight: '700',
                    color: colors.text,
                    marginTop: 2,
                },
                summaryCard: {
                    backgroundColor: colors.surface,
                    marginHorizontal: 16,
                    marginBottom: 16,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                summaryCardTitle: {
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.textSecondary,
                    marginBottom: 12,
                },
                summaryGrid: {
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                },
                summaryItem: {
                    alignItems: 'center',
                },
                summaryValue: {
                    fontSize: 22,
                    fontWeight: '800',
                    color: colors.text,
                },
                summaryLabel: {
                    fontSize: 11,
                    color: colors.textSecondary,
                    marginTop: 4,
                    textAlign: 'center',
                },
                legendToggle: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: colors.surface,
                    marginHorizontal: 16,
                    marginBottom: 16,
                    padding: 14,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                legendToggleText: {
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.text,
                },
                legendContent: {
                    backgroundColor: colors.surface,
                    marginHorizontal: 16,
                    marginTop: -8,
                    marginBottom: 16,
                    padding: 14,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                legendRow: {
                    flexDirection: 'row',
                    marginBottom: 10,
                    alignItems: 'flex-start',
                },
                legendDot: {
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    marginTop: 4,
                    marginRight: 10,
                },
                legendTextContainer: {
                    flex: 1,
                },
                legendTerm: {
                    fontSize: 13,
                    fontWeight: '700',
                    color: colors.text,
                },
                legendDesc: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginTop: 2,
                },
                scrollContent: {
                    paddingBottom: 32,
                },
                listSection: {
                    paddingHorizontal: 16,
                },
                emptyState: {
                    padding: 32,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                emptyTitle: {
                    fontSize: 18,
                    fontWeight: '700',
                    color: colors.text,
                    marginTop: 16,
                    marginBottom: 8,
                    textAlign: 'center',
                },
                emptySubtitle: {
                    fontSize: 14,
                    color: colors.textSecondary,
                    textAlign: 'center',
                    lineHeight: 20,
                },
                loadingContainer: {
                    padding: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
            }),
        [colors, isCurrentWeek]
    );

    return (
        <SafeAreaView style={styles.container} testID="hypertrophy-volume-screen">
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    testID="hypertrophy-back-button"
                >
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {t('progress.hypertrophy', 'Volumen de Hipertrofia')}
                </Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        onPress={() => setShowLegend((prev) => !prev)}
                        testID="hypertrophy-info-button"
                    >
                        <MaterialIcons
                            name={showLegend ? 'info' : 'info-outline'}
                            size={24}
                            color={colors.primary}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                    />
                }
            >
                {/* Week Selector */}
                <View style={styles.weekSelector} testID="hypertrophy-week-selector">
                    <TouchableOpacity
                        style={styles.weekNavButton}
                        onPress={handlePrevWeek}
                        testID="hypertrophy-prev-week"
                    >
                        <MaterialIcons name="chevron-left" size={24} color={colors.text} />
                    </TouchableOpacity>

                    <View style={styles.weekInfo}>
                        <Text style={styles.weekLabelText}>
                            {isCurrentWeek
                                ? t('calendar.today', 'Esta semana')
                                : t('progress.hypertrophyWeek', 'Semana')}
                        </Text>
                        <Text style={styles.weekDateText} testID="hypertrophy-week-label">
                            {weekLabel}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.weekNavButton, isCurrentWeek && styles.weekNavButtonDisabled]}
                        onPress={handleNextWeek}
                        disabled={isCurrentWeek}
                        testID="hypertrophy-next-week"
                    >
                        <MaterialIcons
                            name="chevron-right"
                            size={24}
                            color={isCurrentWeek ? colors.textSecondary : colors.text}
                        />
                    </TouchableOpacity>
                </View>

                {/* Summary Card */}
                <View style={styles.summaryCard} testID="hypertrophy-summary-card">
                    <Text style={styles.summaryCardTitle}>
                        {t('progress.hypertrophyDashboard', 'Dashboard de Hipertrofia')}
                    </Text>
                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryItem} testID="hypertrophy-summary-total-sets">
                            <Text style={styles.summaryValue}>
                                {summary?.totalSeriesEfectivas ?? 0}
                            </Text>
                            <Text style={styles.summaryLabel}>
                                {t('progress.hypertrophyTotalSets', 'Series Totales')}
                            </Text>
                        </View>
                        <View style={styles.summaryItem} testID="hypertrophy-summary-optimal-muscles">
                            <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                                {optimalCount}
                            </Text>
                            <Text style={styles.summaryLabel}>
                                {t('progress.hypertrophyOptimalMuscles', 'Óptimos (MAV)')}
                            </Text>
                        </View>
                        <View style={styles.summaryItem} testID="hypertrophy-summary-fatigue">
                            <Text
                                style={[
                                    styles.summaryValue,
                                    { color: overtrainingCount > 0 ? '#EF4444' : '#F59E0B' },
                                ]}
                            >
                                {warningCount + overtrainingCount}
                            </Text>
                            <Text style={styles.summaryLabel}>
                                {t('progress.hypertrophyHighFatigue', 'Cerca / > MRV')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Scientific Legend */}
                {showLegend && (
                    <View style={styles.legendContent} testID="hypertrophy-legend-card">
                        <View style={styles.legendRow}>
                            <View style={[styles.legendDot, { backgroundColor: '#64748B' }]} />
                            <View style={styles.legendTextContainer}>
                                <Text style={styles.legendTerm}>MV - Volumen de Mantenimiento</Text>
                                <Text style={styles.legendDesc}>
                                    {t(
                                        'progress.hypertrophyMVDesc',
                                        'Mínimo para mantener la masa muscular actual.'
                                    )}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.legendRow}>
                            <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                            <View style={styles.legendTextContainer}>
                                <Text style={styles.legendTerm}>MEV - Volumen Mínimo Efectivo</Text>
                                <Text style={styles.legendDesc}>
                                    {t(
                                        'progress.hypertrophyMEVDesc',
                                        'Volumen mínimo para inducir ganancias musculares.'
                                    )}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.legendRow}>
                            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                            <View style={styles.legendTextContainer}>
                                <Text style={styles.legendTerm}>MAV - Volumen Máximo Adaptativo</Text>
                                <Text style={styles.legendDesc}>
                                    {t(
                                        'progress.hypertrophyMAVDesc',
                                        'Rango óptimo para maximizar el crecimiento muscular.'
                                    )}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.legendRow}>
                            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                            <View style={styles.legendTextContainer}>
                                <Text style={styles.legendTerm}>MRV - Volumen Máximo Recuperable</Text>
                                <Text style={styles.legendDesc}>
                                    {t(
                                        'progress.hypertrophyMRVDesc',
                                        'Límite de recuperación. Superarlo produce sobreentrenamiento.'
                                    )}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Content / Muscle Bars */}
                {loading ? (
                    <View style={styles.loadingContainer} testID="hypertrophy-loading">
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : !summary || summary.distribucion.length === 0 ? (
                    <View style={styles.emptyState} testID="hypertrophy-empty-state">
                        <MaterialIcons name="fitness-center" size={64} color={colors.textSecondary} />
                        <Text style={styles.emptyTitle}>
                            {t('progress.hypertrophyEmptyTitle', 'Sin registros esta semana')}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {t(
                                'progress.hypertrophyEmptySubtitle',
                                'Completa entrenamientos para comparar tu volumen frente a los umbrales científicos de hipertrofia.'
                            )}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.listSection} testID="hypertrophy-muscles-list">
                        {summary.distribucion.map((item) => (
                            <MuscleVolumeBar
                                key={item.grupo_muscular}
                                muscle={item.grupo_muscular}
                                effectiveSets={item.series_efectivas}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default HypertrophyVolumeScreen;
