import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { WorkoutService } from '../services/WorkoutService';
import { AnalyticsService } from '../services/AnalyticsService';
import { AuthContext } from '../context/AuthContext';
import { ExerciseService } from '../services/ExerciseService';
import { LogService } from '../services/LogService';
import { format, parseISO, subMonths, subYears } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { TipoPeso, TIPO_PESO_SHORT_LABELS } from '../types/setTypes';
import StrengthProgressChart, { OneRMDataPoint, TimeRange } from '../components/charts/StrengthProgressChart';

interface SetData {
    id: string;
    numero_serie: number;
    peso_utilizado: number;
    repeticiones: number;
    rpe: number | null;
    tipo_peso: TipoPeso;
    fecha: string;
    rutina_id: string;
}

type ExerciseProgressDetailScreenProps = {
    route: any;
    navigation: any;
};

function getFilteredData(data: OneRMDataPoint[], range: TimeRange): OneRMDataPoint[] {
    if (range === 'Todo') return data;
    const now = new Date();
    let cutoff: Date;
    switch (range) {
        case '1M': cutoff = subMonths(now, 1); break;
        case '3M': cutoff = subMonths(now, 3); break;
        case '6M': cutoff = subMonths(now, 6); break;
        case '1A': cutoff = subYears(now, 1); break;
        default: return data;
    }
    return data.filter((d) => parseISO(d.fecha) >= cutoff);
}

const ExerciseProgressDetailScreen: React.FC<ExerciseProgressDetailScreenProps> = ({
    route,
    navigation,
}) => {
    const { t, i18n } = useTranslation();
    const { exerciseId } = route.params;
    const { theme } = useTheme();
    const { colors } = theme;
    const authContext = useContext(AuthContext);
    const user = authContext?.user;

    const [loading, setLoading] = useState(true);
    const [exerciseDetails, setExerciseDetails] = useState<any>(null);
    const [historyData, setHistoryData] = useState<SetData[]>([]);
    const [oneRMHistory, setOneRMHistory] = useState<OneRMDataPoint[]>([]);
    const [selectedRange, setSelectedRange] = useState<TimeRange>('3M');
    const [chartMode, setChartMode] = useState<'peso' | 'volumen'>('peso');

    const currentLocale = i18n.language?.startsWith('en') ? enUS : es;

    useEffect(() => {
        const loadData = async () => {
            if (!user?.id || !exerciseId) return;
            setLoading(true);
            try {
                const [exRes, histRes, oneRMRes] = await Promise.all([
                    ExerciseService.getExerciseById(exerciseId),
                    WorkoutService.getExerciseHistory(user.id, exerciseId),
                    AnalyticsService.get1RMHistory(user.id, exerciseId),
                ]);
                if (exRes.data) setExerciseDetails(exRes.data);
                if (histRes.data) setHistoryData(histRes.data);
                if (oneRMRes.data) setOneRMHistory(oneRMRes.data);
            } catch (error) {
                LogService.error('Error loading exercise progress:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user?.id, exerciseId]);

    // ─── Derived Metrics ───────────────────────────────────────────────────────

    const filteredChartData = useMemo(
        () => getFilteredData(oneRMHistory, selectedRange),
        [oneRMHistory, selectedRange]
    );

    const current1RM = useMemo(() => {
        if (!oneRMHistory.length) return null;
        return oneRMHistory[oneRMHistory.length - 1].estimated1RM;
    }, [oneRMHistory]);

    const previous1RM = useMemo(() => {
        if (oneRMHistory.length < 2) return null;
        return oneRMHistory[oneRMHistory.length - 2].estimated1RM;
    }, [oneRMHistory]);

    const trendPct = useMemo(() => {
        if (current1RM === null || previous1RM === null || previous1RM === 0) return null;
        return ((current1RM - previous1RM) / previous1RM) * 100;
    }, [current1RM, previous1RM]);

    const maxSessionVolume = useMemo(() => {
        if (!historyData.length) return null;
        const sessionsMap = new Map<string, number>();
        historyData.forEach((s) => {
            const v = (s.peso_utilizado || 0) * (s.repeticiones || 0);
            sessionsMap.set(s.fecha, (sessionsMap.get(s.fecha) || 0) + v);
        });
        return Math.max(...Array.from(sessionsMap.values()));
    }, [historyData]);

    const bestSet = useMemo(() => {
        if (!historyData.length) return null;
        return historyData.reduce<SetData | null>((best, set) => {
            if (!best) return set;
            const setScore = (set.peso_utilizado || 0) * (set.repeticiones || 0);
            const bestScore = (best.peso_utilizado || 0) * (best.repeticiones || 0);
            return setScore > bestScore ? set : best;
        }, null);
    }, [historyData]);

    const recommendation = useMemo(() => {
        if (!historyData.length) return t('progress.noDataForRec', 'Aún no hay suficientes datos para dar recomendaciones.');
        const recentSets = historyData.slice(-5);
        const highRpeSets = recentSets.filter((s) => (s.rpe || 0) >= 9.5);
        if (highRpeSets.length >= 3) {
            return t('progress.recHighRpe', 'Estás entrenando al fallo muy seguido últimamente (RPE 9.5 - 10). Considera dejar 1-2 repeticiones en recámara en tus próximas sesiones para mejorar la recuperación.');
        }
        const lowRpeSets = recentSets.filter((s) => (s.rpe || 0) <= 6 && (s.rpe || 0) > 0);
        if (lowRpeSets.length >= 3) {
            return t('progress.recLowRpe', 'Tus últimas series se sienten bastante ligeras (RPE bajo). Si te sientes con energía, podrías intentar aumentar un poco el peso para estimular más el progreso.');
        }
        if (oneRMHistory.length >= 4) {
            const half = Math.floor(oneRMHistory.length / 2);
            const firstHalf = oneRMHistory.slice(0, half);
            const secondHalf = oneRMHistory.slice(half);
            const firstAvg = firstHalf.reduce((acc, curr) => acc + curr.estimated1RM, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((acc, curr) => acc + curr.estimated1RM, 0) / secondHalf.length;
            if (secondAvg > firstAvg * 1.05) {
                return t('progress.recProgress', '¡Excelente! Hay una tendencia clara de sobrecarga progresiva en este ejercicio. Tus números están mejorando con el tiempo.');
            } else if (secondAvg < firstAvg * 0.95) {
                return t('progress.recDeload', 'Parece que el progreso en este ejercicio ha retrocedido ligeramente últimamente. Asegúrate de descansar bien. Tal vez sea momento de una descarga (deload).');
            }
        }
        return t('progress.recMaintain', 'Tus números en este ejercicio se mantienen consistentes. Continúa aplicando sobrecarga progresiva en tus siguientes bloques.');
    }, [historyData, oneRMHistory, t]);

    // ─── History grouping ─────────────────────────────────────────────────────

    const historyByDate = useMemo(() => {
        const map: Record<string, SetData[]> = {};
        historyData.forEach((s) => {
            if (!map[s.fecha]) map[s.fecha] = [];
            map[s.fecha].push(s);
        });
        return map;
    }, [historyData]);

    const sortedDates = useMemo(
        () => Object.keys(historyByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()),
        [historyByDate]
    );

    const handleRangeChange = useCallback((range: TimeRange) => {
        setSelectedRange(range);
    }, []);

    // ─── Styles ───────────────────────────────────────────────────────────────

    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: { flex: 1, backgroundColor: colors.background },
                header: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                },
                backButton: { padding: 8, marginLeft: -8 },
                headerTitle: {
                    fontSize: 18,
                    fontWeight: '700',
                    color: colors.onSurface,
                    flex: 1,
                    textAlign: 'center',
                    letterSpacing: -0.3,
                },
                loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
                content: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },

                // ─── Bento Grid ──────────────────────────────────────────────
                bentoGrid: { flexDirection: 'row', gap: 10 },

                // ─── 1RM Hero Card ───────────────────────────────────────────
                oneRMCard: {
                    backgroundColor: colors.surfaceContainerLowest,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.outlineVariant,
                    overflow: 'hidden',
                },
                oneRMAmbient: {
                    position: 'absolute',
                    top: -30,
                    right: -30,
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: colors.primary,
                    opacity: 0.08,
                },
                oneRMTopRow: {
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                },
                oneRMLeft: { flex: 1 },
                oneRMLabel: {
                    fontSize: 12,
                    color: colors.onSurfaceVariant,
                    marginBottom: 4,
                    fontWeight: '500',
                },
                oneRMValueRow: {
                    flexDirection: 'row',
                    alignItems: 'baseline',
                    gap: 4,
                },
                oneRMValue: {
                    fontSize: 40,
                    fontWeight: '800',
                    color: colors.onSurface,
                    letterSpacing: -1.5,
                    lineHeight: 44,
                },
                oneRMUnit: {
                    fontSize: 18,
                    fontWeight: '500',
                    color: colors.onSurfaceVariant,
                },
                trendBadge: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 20,
                    backgroundColor: colors.primaryContainer,
                    marginLeft: 8,
                },
                trendBadgeNeg: {
                    backgroundColor: colors.errorContainer,
                },
                trendText: {
                    fontSize: 12,
                    fontWeight: '700',
                    color: colors.primary,
                },
                trendTextNeg: {
                    color: colors.error,
                },
                oneRMDivider: {
                    height: 1,
                    backgroundColor: colors.surfaceContainer,
                    marginTop: 12,
                    marginBottom: 10,
                },
                oneRMFooter: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                },
                oneRMFormulaRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                },
                oneRMFormula: {
                    fontSize: 11,
                    color: colors.onSurfaceVariant,
                },
                oneRMTrendPct: {
                    fontSize: 12,
                    fontWeight: '700',
                    color: colors.primary,
                },

                // ─── Mini cards ──────────────────────────────────────────────
                miniCard: {
                    flex: 1,
                    backgroundColor: colors.surfaceContainerLowest,
                    borderRadius: 14,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: colors.outlineVariant,
                    justifyContent: 'space-between',
                    minHeight: 90,
                },
                miniCardLabelRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    marginBottom: 6,
                },
                miniCardLabel: {
                    fontSize: 11,
                    color: colors.onSurfaceVariant,
                    fontWeight: '500',
                    flex: 1,
                    flexWrap: 'wrap',
                },
                miniCardValue: {
                    fontSize: 18,
                    fontWeight: '700',
                    color: colors.onSurface,
                    letterSpacing: -0.5,
                },
                miniCardUnit: {
                    fontSize: 12,
                    fontWeight: '400',
                    color: colors.onSurfaceVariant,
                },
                miniCardSub: {
                    fontSize: 10,
                    color: colors.onSurfaceVariant,
                    marginTop: 3,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 2,
                },
                miniCardSubText: {
                    fontSize: 10,
                    color: colors.onSurfaceVariant,
                },

                // ─── Chart Card ──────────────────────────────────────────────
                chartCard: {
                    backgroundColor: colors.surfaceContainerLowest,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.outlineVariant,
                },
                chartCardHeader: {
                    marginBottom: 12,
                },
                chartCardTitle: {
                    fontSize: 16,
                    fontWeight: '700',
                    color: colors.onSurface,
                    letterSpacing: -0.3,
                },
                chartCardSubtitle: {
                    fontSize: 11,
                    color: colors.onSurfaceVariant,
                    marginTop: 2,
                },
                chartCardHeaderRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                },
                toggleRow: {
                    flexDirection: 'row',
                    gap: 4,
                    backgroundColor: colors.surfaceContainerLow,
                    borderRadius: 8,
                    padding: 3,
                },
                toggleBtn: {
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                },
                toggleBtnActive: {
                    backgroundColor: colors.primary,
                },
                toggleBtnText: {
                    fontSize: 10,
                    fontWeight: '600',
                    color: colors.onSurfaceVariant,
                },
                toggleBtnTextActive: {
                    color: colors.onPrimary,
                    fontWeight: '700',
                },
                recommendationCard: {
                    backgroundColor: colors.surfaceContainerLowest,
                    borderRadius: 14,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: colors.outlineVariant,
                    marginTop: 12,
                },
                recommendationHeader: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                },
                recommendationTitle: {
                    fontSize: 13,
                    fontWeight: '700',
                    color: colors.primary,
                },
                recommendationText: {
                    fontSize: 12,
                    color: colors.onSurfaceVariant,
                    lineHeight: 18,
                },

                // ─── Insight bar ─────────────────────────────────────────────
                insightBar: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: colors.surfaceContainerLow,
                    borderRadius: 10,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    marginTop: 12,
                },
                insightLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
                insightText: { fontSize: 12, color: colors.onSurface },
                insightBadge: {
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    borderRadius: 20,
                    backgroundColor: colors.primary,
                },
                insightBadgeText: {
                    fontSize: 11,
                    fontWeight: '700',
                    color: colors.onPrimary,
                },

                // ─── History section ─────────────────────────────────────────
                sectionTitle: {
                    fontSize: 17,
                    fontWeight: '700',
                    color: colors.onSurface,
                    letterSpacing: -0.3,
                    marginTop: 4,
                },
                sessionCard: {
                    backgroundColor: colors.surfaceContainerLowest,
                    borderRadius: 14,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: colors.outlineVariant,
                },
                sessionHeader: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                },
                sessionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
                sessionDate: { fontSize: 13, fontWeight: '700', color: colors.onSurface },
                sessionVolBadge: {
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    backgroundColor: colors.surfaceContainerHigh,
                },
                sessionVolText: { fontSize: 10, color: colors.onSurfaceVariant, fontWeight: '500' },
                setsGrid: {
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 6,
                },
                setChip: {
                    width: '47%',
                    backgroundColor: colors.surfaceContainerLow,
                    borderRadius: 10,
                    padding: 8,
                    alignItems: 'center',
                },
                setChipPR: {
                    backgroundColor: colors.secondaryContainer,
                    borderWidth: 1,
                    borderColor: colors.secondary,
                },
                setChipLabel: {
                    fontSize: 10,
                    color: colors.onSurfaceVariant,
                    fontWeight: '600',
                    marginBottom: 2,
                },
                setChipValue: {
                    fontSize: 12,
                    fontWeight: '700',
                    color: colors.onSurface,
                },
                setChipValuePR: {
                    color: colors.secondary,
                },
            }),
        [colors]
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} testID="exercise-progress-detail-screen">
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    testID="exercise-progress-detail-back-button"
                >
                    <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {exerciseDetails?.titulo || 'Progreso'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* ─── 1RM Hero Card ───────────────────────────────── */}
                <View style={styles.oneRMCard} testID="exercise-progress-1rm-card">
                    <View style={styles.oneRMAmbient} />
                    <View style={styles.oneRMTopRow}>
                        <View style={styles.oneRMLeft}>
                            <Text style={styles.oneRMLabel}>1RM Estimado Actual</Text>
                            <View style={styles.oneRMValueRow}>
                                <Text style={styles.oneRMValue} testID="exercise-progress-1rm-value">
                                    {current1RM !== null ? Math.round(current1RM) : '—'}
                                </Text>
                                <Text style={styles.oneRMUnit}>kg</Text>
                            </View>
                        </View>
                        {trendPct !== null && (
                            <View
                                style={[
                                    styles.trendBadge,
                                    trendPct < 0 && styles.trendBadgeNeg,
                                ]}
                                testID="exercise-progress-trend-badge"
                            >
                                <MaterialIcons
                                    name={trendPct >= 0 ? 'trending-up' : 'trending-down'}
                                    size={14}
                                    color={trendPct >= 0 ? colors.primary : colors.error}
                                />
                                <Text
                                    style={[
                                        styles.trendText,
                                        trendPct < 0 && styles.trendTextNeg,
                                    ]}
                                >
                                    {trendPct >= 0 ? '+' : ''}
                                    {trendPct.toFixed(1)}%
                                </Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.oneRMDivider} />
                    <View style={styles.oneRMFooter}>
                        <View style={styles.oneRMFormulaRow}>
                            <MaterialIcons
                                name="trending-up"
                                size={14}
                                color={colors.primary}
                            />
                            <Text style={styles.oneRMFormula}>Fórmula Brzycki</Text>
                        </View>
                        {trendPct !== null && (
                            <Text style={styles.oneRMTrendPct}>
                                {trendPct >= 0 ? '+' : ''}
                                {trendPct.toFixed(1)}% vs sesión anterior
                            </Text>
                        )}
                    </View>
                </View>

                {/* ─── Mini Bento Cards ─────────────────────────────── */}
                <View style={styles.bentoGrid} testID="exercise-progress-mini-cards">
                    {/* Volumen Máximo */}
                    <View style={styles.miniCard} testID="exercise-progress-max-volume-card">
                        <View style={styles.miniCardLabelRow}>
                            <MaterialIcons
                                name="fitness-center"
                                size={13}
                                color={colors.primaryContainer}
                            />
                            <Text style={styles.miniCardLabel}>Volumen de Sesión</Text>
                        </View>
                        <View>
                            <Text style={styles.miniCardValue} testID="exercise-progress-max-volume-value">
                                {maxSessionVolume !== null
                                    ? `${maxSessionVolume.toLocaleString()} `
                                    : '—'}
                                <Text style={styles.miniCardUnit}>kg</Text>
                            </Text>
                            <View style={styles.miniCardSub}>
                                <MaterialIcons name="star" size={10} color={colors.primary} />
                                <Text style={styles.miniCardSubText}>Récord histórico</Text>
                            </View>
                        </View>
                    </View>

                    {/* Mejor Serie */}
                    <View style={styles.miniCard} testID="exercise-progress-best-set-card">
                        <View style={styles.miniCardLabelRow}>
                            <MaterialIcons
                                name="military-tech"
                                size={13}
                                color={colors.tertiaryContainer}
                            />
                            <Text style={styles.miniCardLabel}>Mejor Serie</Text>
                        </View>
                        <View>
                            {bestSet ? (
                                <>
                                    <Text style={styles.miniCardValue} testID="exercise-progress-best-set-value">
                                        {bestSet.peso_utilizado}{' '}
                                        <Text style={styles.miniCardUnit}>kg</Text> × {bestSet.repeticiones}{' '}
                                        <Text style={styles.miniCardUnit}>reps</Text>
                                    </Text>
                                    <View style={styles.miniCardSub}>
                                        <MaterialIcons
                                            name="check-circle"
                                            size={10}
                                            color={colors.primary}
                                        />
                                        <Text style={styles.miniCardSubText}>
                                            {bestSet.rpe ? `RPE ${bestSet.rpe} · ` : ''}
                                            {format(parseISO(bestSet.fecha), 'd MMM', {
                                                locale: currentLocale,
                                            })}
                                        </Text>
                                    </View>
                                </>
                            ) : (
                                <Text style={styles.miniCardValue}>—</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* ─── Chart Card ───────────────────────────────────── */}
                <View testID="exercise-progress-chart-container">
                    <View style={styles.chartCard} testID="exercise-progress-chart-card">
                        <View style={styles.chartCardHeaderRow}>
                            <View>
                                <Text style={styles.chartCardTitle}>Evolución de Carga</Text>
                                <Text style={styles.chartCardSubtitle}>
                                    Progreso del 1RM estimado por sesión
                                </Text>
                            </View>
                            <View style={styles.toggleRow}>
                                <TouchableOpacity
                                    testID="exercise-progress-toggle-weight"
                                    onPress={() => setChartMode('peso')}
                                    style={[styles.toggleBtn, chartMode === 'peso' && styles.toggleBtnActive]}
                                >
                                    <Text style={[styles.toggleBtnText, chartMode === 'peso' && styles.toggleBtnTextActive]}>
                                        {t('progress.maxWeight', 'Max')}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    testID="exercise-progress-toggle-volume"
                                    onPress={() => setChartMode('volumen')}
                                    style={[styles.toggleBtn, chartMode === 'volumen' && styles.toggleBtnActive]}
                                >
                                    <Text style={[styles.toggleBtnText, chartMode === 'volumen' && styles.toggleBtnTextActive]}>
                                        {t('progress.totalVolume', 'Vol')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <StrengthProgressChart
                            data={filteredChartData}
                            selectedRange={selectedRange}
                            onRangeChange={handleRangeChange}
                            testID="exercise-progress-strength-chart"
                        />

                        {/* Insight bar */}
                        {filteredChartData.length > 2 && (
                            <View style={styles.insightBar} testID="exercise-progress-insight-bar">
                                <View style={styles.insightLeft}>
                                    <MaterialIcons name="insights" size={16} color={colors.primary} />
                                    <Text style={styles.insightText}>Ritmo de sobrecarga progresiva</Text>
                                </View>
                                <View style={styles.insightBadge}>
                                    <Text style={styles.insightBadgeText}>Consistente</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* ─── Recommendation Card ─────────────────────────── */}
                <View style={styles.recommendationCard} testID="exercise-progress-recommendation">
                    <View style={styles.recommendationHeader}>
                        <MaterialIcons name="auto-awesome" size={18} color={colors.primary} />
                        <Text style={styles.recommendationTitle}>
                            {t('progress.aiAnalysis', 'Análisis de Rendimiento')}
                        </Text>
                    </View>
                    <Text style={styles.recommendationText}>{recommendation}</Text>
                </View>

                {/* ─── Session History ──────────────────────────────── */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.sectionTitle}>
                        {t('progress.setsHistory', 'Historial de Sesiones')}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.onSurfaceVariant }}>
                        {sortedDates.length} sesiones
                    </Text>
                </View>

                <View testID="exercise-progress-history-list">
                    {sortedDates.map((date) => {
                        const sets = [...historyByDate[date]].sort(
                            (a, b) => a.numero_serie - b.numero_serie
                        );
                        const sessionVolume = sets.reduce(
                            (sum, s) => sum + (s.peso_utilizado || 0) * (s.repeticiones || 0),
                            0
                        );
                        const maxSetVolume = Math.max(
                            ...sets.map((s) => (s.peso_utilizado || 0) * (s.repeticiones || 0))
                        );

                        return (
                            <View key={date} style={[styles.sessionCard, { marginBottom: 10 }]}>
                                <View style={styles.sessionHeader}>
                                    <View style={styles.sessionHeaderLeft}>
                                        <Text style={styles.sessionDate}>
                                            {format(parseISO(date), "d MMM yyyy", {
                                                locale: currentLocale,
                                            })}
                                        </Text>
                                    </View>
                                    <View style={styles.sessionVolBadge}>
                                        <Text style={styles.sessionVolText}>
                                            Vol: {sessionVolume.toLocaleString()} kg
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.setsGrid}>
                                    {sets.map((set) => {
                                        const setVol =
                                            (set.peso_utilizado || 0) * (set.repeticiones || 0);
                                        const isPR = setVol === maxSetVolume && maxSetVolume > 0;
                                        const weightLabel =
                                            set.tipo_peso === 'corporal'
                                                ? 'BW'
                                                : `${set.peso_utilizado} ${TIPO_PESO_SHORT_LABELS[
                                                      set.tipo_peso || 'total'
                                                  ].toLowerCase()}`;
                                        return (
                                            <View
                                                key={set.id}
                                                style={[styles.setChip, isPR && styles.setChipPR]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.setChipLabel,
                                                        isPR && { color: colors.secondary },
                                                    ]}
                                                >
                                                    {isPR ? `S${set.numero_serie} ★` : `S${set.numero_serie}`}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.setChipValue,
                                                        isPR && styles.setChipValuePR,
                                                    ]}
                                                >
                                                    {weightLabel} × {set.repeticiones}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ExerciseProgressDetailScreen;
