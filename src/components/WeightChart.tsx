import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

interface WeightEntry {
    id: string;
    peso: number;
    created_at: string;
}

interface WeightChartProps {
    data: WeightEntry[];
    colors: any;
}

const CHART_WIDTH = Dimensions.get('window').width - 64;
const CHART_HEIGHT = 140;

const WeightChart: React.FC<WeightChartProps> = ({ data, colors }) => {
    const chartData = useMemo(() => {
        if (data.length === 0) return null;

        const weights = data.map((d) => d.peso);
        const minW = Math.min(...weights);
        const maxW = Math.max(...weights);
        const range = maxW - minW || 1;

        return {
            weights,
            minW,
            maxW,
            range,
            labels: data.map((d) => {
                const date = new Date(d.created_at);
                return `${date.getDate()}/${date.getMonth() + 1}`;
            }),
        };
    }, [data]);

    if (!chartData || data.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.title, { color: colors.text }]}>Evolución de Peso</Text>
                <View style={styles.emptyState}>
                    <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                        Aún no hay datos de peso registrados
                    </Text>
                </View>
            </View>
        );
    }

    const barWidth = Math.min(32, (CHART_WIDTH - 20) / data.length - 4);

    return (
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.headerRow}>
                <Text style={[styles.title, { color: colors.text }]}>Evolución de Peso</Text>
                <Text style={[styles.currentWeight, { color: colors.primary }]}>
                    {chartData.weights[chartData.weights.length - 1]} kg
                </Text>
            </View>

            {/* Y-axis labels + bars */}
            <View style={styles.chartArea}>
                <View style={styles.yAxis}>
                    <Text style={[styles.yLabel, { color: colors.textSecondary }]}>{chartData.maxW}</Text>
                    <Text style={[styles.yLabel, { color: colors.textSecondary }]}>{chartData.minW}</Text>
                </View>
                <View style={styles.barsContainer}>
                    {chartData.weights.map((w, i) => {
                        const heightPct = ((w - chartData.minW) / chartData.range) * 0.8 + 0.2;
                        return (
                            <View key={data[i].id} style={styles.barWrapper}>
                                <View
                                    style={[
                                        styles.bar,
                                        {
                                            width: barWidth,
                                            height: heightPct * CHART_HEIGHT,
                                            backgroundColor: i === chartData.weights.length - 1 ? colors.primary : `${colors.primary}60`,
                                            borderRadius: barWidth / 2,
                                        },
                                    ]}
                                />
                                <Text
                                    style={[styles.xLabel, { color: colors.textSecondary }]}
                                    numberOfLines={1}
                                >
                                    {chartData.labels[i]}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* Trend indicator */}
            {data.length >= 2 && (
                <View style={styles.trendRow}>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        {(() => {
                            const diff = chartData.weights[chartData.weights.length - 1] - chartData.weights[0];
                            const sign = diff > 0 ? '+' : '';
                            return `${sign}${diff.toFixed(1)} kg desde el primer registro`;
                        })()}
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
        marginBottom: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
    },
    currentWeight: {
        fontSize: 20,
        fontWeight: '700',
    },
    chartArea: {
        flexDirection: 'row',
        height: CHART_HEIGHT + 20,
    },
    yAxis: {
        width: 36,
        justifyContent: 'space-between',
        paddingBottom: 16,
    },
    yLabel: {
        fontSize: 10,
    },
    barsContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-evenly',
        paddingBottom: 16,
    },
    barWrapper: {
        alignItems: 'center',
    },
    bar: {
        minHeight: 4,
    },
    xLabel: {
        fontSize: 9,
        marginTop: 4,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
    },
    trendRow: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(128,128,128,0.2)',
        paddingTop: 8,
        marginTop: 8,
    },
});

export default WeightChart;
