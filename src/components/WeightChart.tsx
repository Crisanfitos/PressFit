import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

interface WeightEntry {
    id: string;
    peso: number;
    created_at: string;
}

interface WeightChartProps {
    data: WeightEntry[];
    colors: any;
}

interface SelectedPoint {
    id: string;
    peso: number;
    dateStr: string;
    label: string;
    index: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const WeightChart: React.FC<WeightChartProps> = ({ data, colors }) => {
    const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(null);

    const chartDataResult = useMemo(() => {
        if (data.length === 0) return null;

        // Sort data chronologically first to ensure correct lines
        const sortedData = [...data].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        const weights = sortedData.map((d) => d.peso);
        const minW = Math.min(...weights);
        const maxW = Math.max(...weights);
        // Add headroom for the top and bottom of the chart
        const valueRange = maxW - minW;
        const padding = valueRange > 0 ? valueRange * 0.5 : (maxW * 0.1) || 5;

        const calculatedMax = Math.ceil(maxW + padding);
        const calculatedMin = Math.max(0, Math.floor(minW - padding));
        const stepValue = Math.ceil((calculatedMax - calculatedMin) / 4) || 1;

        // Calculate differences
        const firstWeight = weights[0];
        const currentWeight = weights[weights.length - 1];
        const lastWeight = weights.length > 1 ? weights[weights.length - 2] : currentWeight;

        const diffFromStart = currentWeight - firstWeight;
        const diffFromLast = currentWeight - lastWeight;

        const chartPoints = sortedData.map((d, index) => {
            const date = new Date(d.created_at);
            const label = `${date.getDate()}/${date.getMonth() + 1}`;
            const dateStr = date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
            return {
                id: d.id,
                value: d.peso,
                label,
                dateStr,
                dataPointText: `${d.peso} kg`,
                onPress: () => {
                    setSelectedPoint({ id: d.id, peso: d.peso, dateStr, label, index });
                }
            };
        });

        return {
            currentWeight,
            diffFromStart,
            diffFromLast,
            calculatedMax,
            calculatedMin,
            stepValue,
            chartPoints,
        };
    }, [data]);

    if (!chartDataResult || data.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]} testID="weight-chart-empty-state">
                <Text style={[styles.title, { color: colors.text }]}>Evolución de Peso</Text>
                <View style={styles.emptyState}>
                    <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                        Aún no hay datos de peso registrados
                    </Text>
                </View>
            </View>
        );
    }

    const { chartPoints, calculatedMax, calculatedMin, stepValue, currentWeight, diffFromStart, diffFromLast } = chartDataResult;
    const chartWidth = SCREEN_WIDTH - 120; // Accounting for paddings and y-axis

    return (
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]} testID="weight-chart-container">
            <View style={styles.headerRow}>
                <Text style={[styles.title, { color: colors.text }]}>Evolución de Peso</Text>
                <Text style={[styles.currentWeight, { color: colors.primary }]}>
                    {currentWeight} kg
                </Text>
            </View>

            {/* Interactive Selected Point Tooltip Banner */}
            {selectedPoint && (
                <View
                    style={[
                        styles.tooltipBanner,
                        { backgroundColor: `${colors.primary}15`, borderColor: colors.primary }
                    ]}
                    testID="weight-chart-selected-tooltip"
                >
                    <View style={styles.tooltipContent}>
                        <Text style={[styles.tooltipDate, { color: colors.textSecondary }]}>
                            {selectedPoint.dateStr} (Punto {selectedPoint.index + 1} de {data.length})
                        </Text>
                        <Text style={[styles.tooltipValue, { color: colors.primary }]}>
                            {selectedPoint.peso} kg
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setSelectedPoint(null)}
                        style={styles.tooltipCloseBtn}
                        testID="weight-chart-tooltip-close"
                        accessibilityRole="button"
                        accessibilityLabel="Cerrar detalle"
                    >
                        <Text style={[styles.tooltipCloseText, { color: colors.textSecondary }]}>✕</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Line Chart */}
            <View style={styles.chartWrapper} testID="weight-chart-wrapper">
                <LineChart
                    data={chartPoints}
                    width={chartWidth}
                    height={200}
                    maxValue={calculatedMax - calculatedMin}
                    yAxisOffset={calculatedMin}
                    stepValue={stepValue}
                    color={colors.primary}
                    thickness={3}
                    dataPointsColor={colors.primary}
                    textShiftY={-8}
                    textShiftX={-8}
                    textColor={colors.text}
                    yAxisLabelSuffix=" kg"
                    yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                    xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10, width: 40, textAlign: 'center' }}
                    yAxisTextNumberOfLines={1}
                    yAxisLabelWidth={35}
                    initialSpacing={40}
                    endSpacing={40}
                    verticalLinesColor={`${colors.textSecondary}30`}
                    rulesColor={`${colors.textSecondary}30`}
                    activatePointersOnPress
                    pointerConfig={{
                        pointerStripColor: colors.primary,
                        pointerStripWidth: 2,
                        pointerColor: colors.primary,
                        radius: 6,
                        pointerLabelWidth: 100,
                        pointerLabelHeight: 60,
                        activatePointersOnPress: true,
                        pointerEvents: 'none',
                        pointerLabelComponent: (items: any) => {
                            const item = items[0];
                            if (!item) return null;
                            return (
                                <View
                                    style={[
                                        styles.pointerLabel,
                                        { backgroundColor: colors.surface, borderColor: colors.border }
                                    ]}
                                >
                                    <Text style={[styles.pointerValue, { color: colors.text }]}>
                                        {item.value} kg
                                    </Text>
                                    <Text style={[styles.pointerDate, { color: colors.textSecondary }]}>
                                        {item.label}
                                    </Text>
                                </View>
                            );
                        },
                    }}
                />
            </View>

            {/* Trend indicator */}
            {data.length >= 2 && (
                <View style={styles.trendRow}>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                        {diffFromStart > 0 ? '+' : ''}{diffFromStart.toFixed(1)} kg desde el primer registro
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        {diffFromLast > 0 ? '+' : ''}{diffFromLast.toFixed(1)} kg desde el último registro
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    currentWeight: {
        fontSize: 20,
        fontWeight: '700',
    },
    tooltipBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 16,
    },
    tooltipContent: {
        flex: 1,
    },
    tooltipDate: {
        fontSize: 11,
        fontWeight: '500',
        marginBottom: 2,
    },
    tooltipValue: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    tooltipCloseBtn: {
        padding: 6,
        marginLeft: 8,
    },
    tooltipCloseText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    chartWrapper: {
        alignItems: 'center',
        width: '100%',
        marginLeft: -10, // Adjusting for y-axis offset
        marginBottom: 20,
    },
    pointerLabel: {
        height: 50,
        width: 90,
        borderRadius: 8,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
    },
    pointerValue: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    pointerDate: {
        fontSize: 10,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
    },
    trendRow: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(128,128,128,0.2)',
        paddingTop: 12,
        marginTop: 8,
    },
});

export default WeightChart;
