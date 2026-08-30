import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    FlatList,
    Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../context/ThemeContext';
import { ExerciseService } from '../services/ExerciseService';
import { AnalyticsService, OneRMHistoryEntry } from '../services/AnalyticsService';
import { parseDateKeyAsLocalDate } from '../utils/dateUtils';

export interface AdvancedMetricsCardProps {
    userId?: string;
    initialExerciseId?: string;
    onExerciseChange?: (exerciseId: string) => void;
    testID?: string;
}

interface ExerciseItem {
    id: string;
    titulo?: string;
    nombre?: string;
    grupo_muscular?: string;
}

interface SelectedPointInfo {
    fecha: string;
    estimated1RM: number;
    peso_utilizado: number;
    repeticiones: number;
    formula: 'brzycki' | 'epley';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AdvancedMetricsCard: React.FC<AdvancedMetricsCardProps> = ({
    userId,
    initialExerciseId,
    onExerciseChange,
    testID = 'advanced-metrics-card',
}) => {
    const { theme } = useTheme();
    const { colors } = theme;

    const [exercises, setExercises] = useState<ExerciseItem[]>([]);
    const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(initialExerciseId || null);
    const [historyData, setHistoryData] = useState<OneRMHistoryEntry[]>([]);
    const [loadingExercises, setLoadingExercises] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectorModalVisible, setSelectorModalVisible] = useState(false);
    const [selectedPoint, setSelectedPoint] = useState<SelectedPointInfo | null>(null);

    // 1. Fetch available exercises catalog
    useEffect(() => {
        let isMounted = true;

        const loadExercises = async () => {
            setLoadingExercises(true);
            try {
                const { data } = await ExerciseService.getExercises();
                if (isMounted && data && Array.isArray(data) && data.length > 0) {
                    setExercises(data);
                    if (!selectedExerciseId) {
                        const defaultId = initialExerciseId || data[0].id;
                        setSelectedExerciseId(defaultId);
                        if (onExerciseChange) onExerciseChange(defaultId);
                    }
                }
            } catch (error) {
                console.error('Error loading exercises in AdvancedMetricsCard:', error);
            } finally {
                if (isMounted) setLoadingExercises(false);
            }
        };

        loadExercises();

        return () => {
            isMounted = false;
        };
    }, []);

    // 2. Fetch 1RM history when selectedExerciseId or userId changes
    useEffect(() => {
        let isMounted = true;

        const loadHistory = async () => {
            if (!userId || !selectedExerciseId) {
                setHistoryData([]);
                setSelectedPoint(null);
                return;
            }

            setLoadingHistory(true);
            try {
                const { data } = await AnalyticsService.get1RMHistory(userId, selectedExerciseId);
                if (isMounted) {
                    setHistoryData(data || []);
                    setSelectedPoint(null);
                }
            } catch (error) {
                console.error('Error loading 1RM history:', error);
                if (isMounted) setHistoryData([]);
            } finally {
                if (isMounted) setLoadingHistory(false);
            }
        };

        loadHistory();

        return () => {
            isMounted = false;
        };
    }, [userId, selectedExerciseId]);

    const selectedExercise = useMemo(() => {
        return exercises.find((ex) => ex.id === selectedExerciseId) || null;
    }, [exercises, selectedExerciseId]);

    const exerciseName = selectedExercise?.titulo || selectedExercise?.nombre || 'Seleccionar Ejercicio';

    // 3. Compute KPI metrics and chart points
    const metricsResult = useMemo(() => {
        if (!historyData || historyData.length === 0) {
            return null;
        }

        const entries = [...historyData];
        const currentEntry = entries[entries.length - 1];
        const startEntry = entries[0];

        let bestEntry = entries[0];
        for (const e of entries) {
            if (e.estimated1RM > bestEntry.estimated1RM) {
                bestEntry = e;
            }
        }

        const current1RM = currentEntry.estimated1RM;
        const best1RM = bestEntry.estimated1RM;
        const start1RM = startEntry.estimated1RM;
        const diffFromStart = Math.round((current1RM - start1RM) * 10) / 10;
        const percentChange = start1RM > 0 ? Math.round(((current1RM - start1RM) / start1RM) * 1000) / 10 : 0;

        // Prepare chart points for react-native-gifted-charts
        const chartPoints = entries.map((entry) => {
            const dateObj = parseDateKeyAsLocalDate(entry.fecha);
            const label = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
            return {
                value: entry.estimated1RM,
                label,
                dataPointText: `${entry.estimated1RM} kg`,
                onPress: () => {
                    setSelectedPoint({
                        fecha: entry.fecha,
                        estimated1RM: entry.estimated1RM,
                        peso_utilizado: entry.peso_utilizado,
                        repeticiones: entry.repeticiones,
                        formula: entry.formula,
                    });
                },
            };
        });

        // Y-axis scaling
        const values = entries.map((e) => e.estimated1RM);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const range = maxVal - minVal;
        const padding = range > 0 ? range * 0.4 : (maxVal * 0.1) || 5;

        const calculatedMax = Math.ceil(maxVal + padding);
        const calculatedMin = Math.max(0, Math.floor(minVal - padding));
        const stepValue = Math.max(1, Math.ceil((calculatedMax - calculatedMin) / 4));

        return {
            current1RM,
            best1RM,
            start1RM,
            diffFromStart,
            percentChange,
            bestEntry,
            currentEntry,
            chartPoints,
            calculatedMax,
            calculatedMin,
            stepValue,
        };
    }, [historyData]);

    const handleSelectExercise = (id: string) => {
        setSelectedExerciseId(id);
        setSelectorModalVisible(false);
        if (onExerciseChange) onExerciseChange(id);
    };

    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: {
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                },
                headerRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                },
                titleContainer: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                },
                title: {
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: colors.text,
                },
                selectorButton: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    backgroundColor: `${colors.primary}15`,
                    borderWidth: 1,
                    borderColor: `${colors.primary}40`,
                    maxWidth: 180,
                },
                selectorText: {
                    fontSize: 13,
                    fontWeight: '600',
                    color: colors.primary,
                },
                kpiContainer: {
                    flexDirection: 'row',
                    gap: 8,
                    marginBottom: 16,
                },
                kpiCard: {
                    flex: 1,
                    backgroundColor: colors.background,
                    borderRadius: 10,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                kpiLabel: {
                    fontSize: 11,
                    color: colors.textSecondary,
                    marginBottom: 4,
                    fontWeight: '500',
                },
                kpiValue: {
                    fontSize: 17,
                    fontWeight: 'bold',
                    color: colors.text,
                },
                kpiSubtext: {
                    fontSize: 10,
                    color: colors.textSecondary,
                    marginTop: 2,
                },
                positiveChange: {
                    color: '#10B981',
                },
                negativeChange: {
                    color: '#EF4444',
                },
                neutralChange: {
                    color: colors.textSecondary,
                },
                tooltipBanner: {
                    backgroundColor: `${colors.primary}20`,
                    borderColor: `${colors.primary}60`,
                    borderWidth: 1,
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                },
                tooltipText: {
                    fontSize: 12,
                    color: colors.text,
                },
                tooltipBold: {
                    fontWeight: 'bold',
                    color: colors.primary,
                },
                chartWrapper: {
                    alignItems: 'center',
                    marginVertical: 8,
                    overflow: 'hidden',
                },
                emptyContainer: {
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 28,
                    paddingHorizontal: 16,
                },
                emptyText: {
                    fontSize: 13,
                    color: colors.textSecondary,
                    textAlign: 'center',
                    marginTop: 8,
                },
                loadingContainer: {
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 36,
                },
                modalOverlay: {
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    justifyContent: 'flex-end',
                },
                modalContent: {
                    backgroundColor: colors.surface,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    padding: 20,
                    maxHeight: '70%',
                },
                modalHeader: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                    paddingBottom: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                },
                modalTitle: {
                    fontSize: 17,
                    fontWeight: 'bold',
                    color: colors.text,
                },
                exerciseItem: {
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 10,
                    marginBottom: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                },
                exerciseItemActive: {
                    backgroundColor: `${colors.primary}20`,
                },
                exerciseItemText: {
                    fontSize: 14,
                    color: colors.text,
                },
                exerciseItemTextActive: {
                    fontWeight: 'bold',
                    color: colors.primary,
                },
                exerciseGroup: {
                    fontSize: 12,
                    color: colors.textSecondary,
                },
            }),
        [colors]
    );

    return (
        <View style={styles.container} testID={testID}>
            {/* Header */}
            <View style={styles.headerRow}>
                <View style={styles.titleContainer}>
                    <MaterialIcons name="insights" size={20} color={colors.primary} />
                    <Text style={styles.title}>1RM Estimado</Text>
                </View>

                <TouchableOpacity
                    testID="exercise-selector-button"
                    style={styles.selectorButton}
                    onPress={() => setSelectorModalVisible(true)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.selectorText} numberOfLines={1}>
                        {exerciseName}
                    </Text>
                    <MaterialIcons name="arrow-drop-down" size={18} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Content Body */}
            {loadingExercises || loadingHistory ? (
                <View style={styles.loadingContainer} testID="advanced-metrics-loading">
                    <ActivityIndicator size="small" color={colors.primary} />
                </View>
            ) : !metricsResult ? (
                <View style={styles.emptyContainer} testID="advanced-metrics-empty">
                    <MaterialIcons name="show-chart" size={40} color={colors.textSecondary} />
                    <Text style={styles.emptyText}>
                        No hay series registradas para estimar el 1RM de este ejercicio.
                    </Text>
                </View>
            ) : (
                <View>
                    {/* KPI Metrics Summary */}
                    <View style={styles.kpiContainer}>
                        <View style={styles.kpiCard} testID="metric-current-1rm">
                            <Text style={styles.kpiLabel}>1RM Actual</Text>
                            <Text style={styles.kpiValue}>{metricsResult.current1RM} kg</Text>
                            <Text
                                style={[
                                    styles.kpiSubtext,
                                    metricsResult.diffFromStart > 0
                                        ? styles.positiveChange
                                        : metricsResult.diffFromStart < 0
                                        ? styles.negativeChange
                                        : styles.neutralChange,
                                ]}
                            >
                                {metricsResult.diffFromStart > 0 ? '+' : ''}
                                {metricsResult.diffFromStart} kg ({metricsResult.percentChange > 0 ? '+' : ''}
                                {metricsResult.percentChange}%)
                            </Text>
                        </View>

                        <View style={styles.kpiCard} testID="metric-best-1rm">
                            <Text style={styles.kpiLabel}>Récord Histórico</Text>
                            <Text style={styles.kpiValue}>{metricsResult.best1RM} kg</Text>
                            <Text style={styles.kpiSubtext} numberOfLines={1}>
                                {metricsResult.bestEntry.peso_utilizado} kg × {metricsResult.bestEntry.repeticiones} reps
                            </Text>
                        </View>

                        <View style={styles.kpiCard} testID="metric-formula">
                            <Text style={styles.kpiLabel}>Fórmula</Text>
                            <Text style={styles.kpiValue}>
                                {metricsResult.currentEntry.formula === 'brzycki' ? 'Brzycki' : 'Epley'}
                            </Text>
                            <Text style={styles.kpiSubtext}>
                                {metricsResult.currentEntry.formula === 'brzycki' ? '≤ 10 reps' : '> 10 reps'}
                            </Text>
                        </View>
                    </View>

                    {/* Interactive Point Details Banner */}
                    {selectedPoint && (
                        <View style={styles.tooltipBanner} testID="selected-point-banner">
                            <View>
                                <Text style={styles.tooltipText}>
                                    <Text style={styles.tooltipBold}>Fecha:</Text> {selectedPoint.fecha}
                                </Text>
                                <Text style={styles.tooltipText}>
                                    <Text style={styles.tooltipBold}>1RM Estimado:</Text> {selectedPoint.estimated1RM} kg ({selectedPoint.formula})
                                </Text>
                                <Text style={styles.tooltipText}>
                                    <Text style={styles.tooltipBold}>Serie:</Text> {selectedPoint.peso_utilizado} kg × {selectedPoint.repeticiones} reps
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setSelectedPoint(null)} testID="close-tooltip-button">
                                <MaterialIcons name="close" size={18} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Gifted Charts Line Chart */}
                    <View style={styles.chartWrapper} testID="chart-1rm">
                        <LineChart
                            data={metricsResult.chartPoints}
                            height={170}
                            width={SCREEN_WIDTH - 120}
                            initialSpacing={20}
                            endSpacing={20}
                            spacing={Math.max(40, (SCREEN_WIDTH - 160) / Math.max(1, metricsResult.chartPoints.length))}
                            color={colors.primary}
                            thickness={3}
                            startFillColor={`${colors.primary}50`}
                            endFillColor={`${colors.primary}05`}
                            startOpacity={0.7}
                            endOpacity={0.1}
                            areaChart
                            curved
                            isAnimated
                            animationDuration={400}
                            hideDataPoints={false}
                            dataPointsColor={colors.primary}
                            dataPointsRadius={5}
                            textColor={colors.text}
                            textFontSize={10}
                            yAxisColor={colors.border}
                            xAxisColor={colors.border}
                            yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                            xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                            noOfSections={4}
                            maxValue={metricsResult.calculatedMax}
                            mostNegativeValue={metricsResult.calculatedMin}
                            stepValue={metricsResult.stepValue}
                            yAxisOffset={metricsResult.calculatedMin}
                            rulesColor={`${colors.border}50`}
                            rulesType="solid"
                        />
                    </View>
                </View>
            )}

            {/* Exercise Selector Modal */}
            <Modal
                visible={selectorModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectorModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setSelectorModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Seleccionar Ejercicio</Text>
                            <TouchableOpacity
                                onPress={() => setSelectorModalVisible(false)}
                                testID="close-exercise-selector"
                            >
                                <MaterialIcons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={exercises}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => {
                                const isSelected = item.id === selectedExerciseId;
                                const title = item.titulo || item.nombre || '';
                                return (
                                    <TouchableOpacity
                                        testID={`exercise-option-${item.id}`}
                                        style={[
                                            styles.exerciseItem,
                                            isSelected && styles.exerciseItemActive,
                                        ]}
                                        onPress={() => handleSelectExercise(item.id)}
                                    >
                                        <View>
                                            <Text
                                                style={[
                                                    styles.exerciseItemText,
                                                    isSelected && styles.exerciseItemTextActive,
                                                ]}
                                            >
                                                {title}
                                            </Text>
                                            {item.grupo_muscular && (
                                                <Text style={styles.exerciseGroup}>{item.grupo_muscular}</Text>
                                            )}
                                        </View>
                                        {isSelected && (
                                            <MaterialIcons
                                                name="check"
                                                size={20}
                                                color={colors.primary}
                                            />
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

export default AdvancedMetricsCard;
