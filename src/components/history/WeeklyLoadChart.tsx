import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import type { DailyLoadBar } from '../../utils/progressHighlights';

export interface WeeklyLoadChartProps {
    bars: DailyLoadBar[];
    testID?: string;
}

export const WeeklyLoadChart: React.FC<WeeklyLoadChartProps> = ({
    bars,
    testID = 'progress-load-chart',
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { colors } = theme;

    const { maxTonnage, average } = useMemo(() => {
        const max = Math.max(...bars.map((b) => b.tonnageKg), 1);
        const avg = bars.length > 0 ? bars.reduce((a, b) => a + b.tonnageKg, 0) / bars.length : 0;
        return { maxTonnage: max, average: avg };
    }, [bars]);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                card: {
                    backgroundColor: colors.surface,
                    marginHorizontal: 16,
                    marginBottom: 8,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                title: {
                    fontSize: 14,
                    fontWeight: '700',
                    color: colors.text,
                    marginBottom: 4,
                },
                subtitle: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginBottom: 12,
                },
                chartRow: {
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                    height: 140,
                },
                barColumn: {
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                },
                barTrack: {
                    width: '60%',
                    height: 110,
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                },
                bar: {
                    width: '100%',
                    borderRadius: 6,
                    minHeight: 4,
                },
                barLabel: {
                    fontSize: 11,
                    color: colors.textSecondary,
                    marginTop: 6,
                    fontWeight: '600',
                },
                averageRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 10,
                },
                averageDot: {
                    width: 12,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: colors.primary,
                    marginRight: 6,
                },
                averageText: {
                    fontSize: 12,
                    color: colors.textSecondary,
                },
            }),
        [colors]
    );

    return (
        <View style={styles.card} testID={testID}>
            <Text style={styles.title}>
                {t('progress.weeklyLoad', 'Carga semanal')}
            </Text>
            <Text style={styles.subtitle}>
                {t('progress.weeklyLoadSubtitle', 'Tonelaje movido por día (kg)')}
            </Text>
            <View style={styles.chartRow}>
                {bars.map((bar, i) => {
                    const heightPct = Math.max(3, Math.round((bar.tonnageKg / maxTonnage) * 100));
                    const isRecord = bar.tonnageKg > 0 && bar.tonnageKg === maxTonnage;
                    return (
                        <View key={i} style={styles.barColumn}>
                            <View style={styles.barTrack}>
                                <View
                                    testID={`${testID}-bar-${i}`}
                                    accessibilityLabel={`${bar.label}: ${bar.tonnageKg} kg`}
                                    style={[
                                        styles.bar,
                                        {
                                            height: `${heightPct}%`,
                                            backgroundColor: isRecord
                                                ? colors.primary
                                                : `${colors.primary}55`,
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={styles.barLabel}>{bar.label}</Text>
                        </View>
                    );
                })}
            </View>
            <View style={styles.averageRow} testID={`${testID}-average`}>
                <View style={styles.averageDot} />
                <Text style={styles.averageText}>
                    {t('progress.weeklyAverage', 'Promedio: {{avg}} kg/día', { avg: Math.round(average) })}
                </Text>
            </View>
        </View>
    );
};

export default WeeklyLoadChart;
