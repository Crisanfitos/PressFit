import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../../context/ThemeContext';
import { format, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

export interface OneRMDataPoint {
    fecha: string;
    estimated1RM: number;
    peso_utilizado: number;
    repeticiones: number;
}

export type TimeRange = '1M' | '3M' | '6M' | '1A' | 'Todo';

interface StrengthProgressChartProps {
    data: OneRMDataPoint[];
    selectedRange: TimeRange;
    onRangeChange: (range: TimeRange) => void;
    testID?: string;
}

const TIME_RANGES: TimeRange[] = ['1M', '3M', '6M', '1A', 'Todo'];

const RANGE_LABELS: Record<TimeRange, string> = {
    '1M': '1M',
    '3M': '3M',
    '6M': '6M',
    '1A': '1A',
    'Todo': 'Todo',
};

const StrengthProgressChart: React.FC<StrengthProgressChartProps> = ({
    data,
    selectedRange,
    onRangeChange,
    testID,
}) => {
    const { theme } = useTheme();
    const { colors } = theme;
    const { i18n } = useTranslation();
    const [tooltipIndex, setTooltipIndex] = useState<number | null>(null);

    const currentLocale = i18n.language?.startsWith('en') ? enUS : es;

    const chartData = useMemo(() => {
        if (!data.length) return [];
        return data.map((point, idx) => ({
            value: point.estimated1RM,
            label: format(parseISO(point.fecha), 'd MMM', { locale: currentLocale }),
            dataPointText: `${Math.round(point.estimated1RM)}`,
            date: point.fecha,
            peso: point.peso_utilizado,
            reps: point.repeticiones,
            index: idx,
        }));
    }, [data, currentLocale]);

    const maxVal = useMemo(() => {
        if (!chartData.length) return 100;
        const max = Math.max(...chartData.map((d) => d.value));
        return Math.ceil(max * 1.15);
    }, [chartData]);

    const minVal = useMemo(() => {
        if (!chartData.length) return 0;
        const min = Math.min(...chartData.map((d) => d.value));
        return Math.max(0, Math.floor(min * 0.85));
    }, [chartData]);

    const activeTooltip = tooltipIndex !== null ? chartData[tooltipIndex] : null;

    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: {
                    gap: 12,
                },
                rangeSelector: {
                    flexDirection: 'row',
                    gap: 6,
                },
                rangeBtn: {
                    flex: 1,
                    paddingVertical: 7,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.surfaceContainerLow,
                    borderWidth: 1,
                    borderColor: colors.outlineVariant,
                },
                rangeBtnActive: {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                },
                rangeBtnText: {
                    fontSize: 12,
                    fontWeight: '600',
                    color: colors.onSurfaceVariant,
                    letterSpacing: 0.2,
                },
                rangeBtnTextActive: {
                    color: colors.onPrimary,
                },
                chartWrapper: {
                    position: 'relative',
                    paddingTop: 4,
                },
                tooltip: {
                    position: 'absolute',
                    top: 0,
                    left: '25%',
                    right: '25%',
                    backgroundColor: colors.surfaceContainerHighest,
                    borderRadius: 10,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: colors.primary,
                    zIndex: 10,
                },
                tooltipDate: {
                    fontSize: 10,
                    color: colors.onSurfaceVariant,
                    marginBottom: 2,
                },
                tooltipValue: {
                    fontSize: 16,
                    fontWeight: '700',
                    color: colors.primary,
                    letterSpacing: -0.5,
                },
                tooltipSub: {
                    fontSize: 10,
                    color: colors.onSurfaceVariant,
                    marginTop: 1,
                },
                legend: {
                    flexDirection: 'row',
                    gap: 12,
                    alignItems: 'center',
                },
                legendDot: {
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.primary,
                },
                legendText: {
                    fontSize: 11,
                    color: colors.onSurfaceVariant,
                    fontWeight: '500',
                },
                emptyContainer: {
                    height: 140,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                emptyText: {
                    color: colors.onSurfaceVariant,
                    fontSize: 13,
                },
            }),
        [colors]
    );

    return (
        <View style={styles.container} testID={testID}>
            {/* Range Selector */}
            <View style={styles.rangeSelector} testID="strength-chart-range-selector">
                {TIME_RANGES.map((range) => (
                    <TouchableOpacity
                        key={range}
                        style={[styles.rangeBtn, selectedRange === range && styles.rangeBtnActive]}
                        onPress={() => onRangeChange(range)}
                        testID={`strength-chart-range-${range}`}
                    >
                        <Text
                            style={[styles.rangeBtnText, selectedRange === range && styles.rangeBtnTextActive]}
                        >
                            {RANGE_LABELS[range]}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Legend */}
            <View style={styles.legend}>
                <View style={styles.legendDot} />
                <Text style={styles.legendText}>1RM Estimado</Text>
            </View>

            {/* Chart */}
            <View style={styles.chartWrapper} testID="strength-chart-plot">
                {chartData.length > 0 ? (
                    <>
                        {activeTooltip && (
                            <View style={styles.tooltip} testID="strength-chart-tooltip">
                                <Text style={styles.tooltipDate}>
                                    {format(parseISO(activeTooltip.date), "d 'de' MMMM yyyy", {
                                        locale: currentLocale,
                                    })}
                                </Text>
                                <Text style={styles.tooltipValue}>
                                    {Math.round(activeTooltip.value)} kg
                                </Text>
                                <Text style={styles.tooltipSub}>
                                    {activeTooltip.peso} kg × {activeTooltip.reps} reps
                                </Text>
                            </View>
                        )}
                        <LineChart
                            data={chartData}
                            width={280}
                            height={160}
                            maxValue={maxVal}
                            mostNegativeValue={minVal}
                            color={colors.primary}
                            thickness={2.5}
                            startFillColor={`${colors.primary}55`}
                            endFillColor={`${colors.primary}00`}
                            startOpacity={0.35}
                            endOpacity={0}
                            areaChart
                            dataPointsColor={colors.primary}
                            dataPointsRadius={4}
                            yAxisTextStyle={{ color: colors.onSurfaceVariant, fontSize: 10 }}
                            xAxisLabelTextStyle={{
                                color: colors.onSurfaceVariant,
                                fontSize: 9,
                                width: 50,
                            }}
                            rulesColor={`${colors.outlineVariant}60`}
                            yAxisLabelSuffix=" kg"
                            initialSpacing={16}
                            spacing={chartData.length > 8 ? 30 : 42}
                            curved
                            onPress={(item: any, index: number) => {
                                setTooltipIndex(tooltipIndex === index ? null : index);
                            }}
                            focusEnabled
                            showStripOnFocus
                            stripColor={`${colors.primary}30`}
                            stripWidth={1}
                            focusedDataPointColor={colors.primary}
                            focusedDataPointRadius={6}
                            yAxisColor={colors.outlineVariant}
                            xAxisColor={colors.outlineVariant}
                            hideDataPoints={false}
                            showVerticalLines={false}
                        />
                    </>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Sin datos para el período seleccionado</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

export default StrengthProgressChart;
