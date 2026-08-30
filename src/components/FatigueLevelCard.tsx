import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AnalyticsService } from '../services/AnalyticsService';
import { FatigueAnalysisResult } from '../utils/analyticsUtils';

export interface FatigueLevelCardProps {
    userId?: string;
    initialData?: FatigueAnalysisResult;
    testID?: string;
}

const FatigueLevelCard: React.FC<FatigueLevelCardProps> = ({
    userId,
    initialData,
    testID = 'fatigue-level-card',
}) => {
    const { theme } = useTheme();
    const { colors } = theme;

    const [loading, setLoading] = useState(!initialData && !!userId);
    const [fatigueData, setFatigueData] = useState<FatigueAnalysisResult | null>(initialData || null);

    useEffect(() => {
        let isMounted = true;

        if (initialData) {
            setFatigueData(initialData);
            setLoading(false);
            return;
        }

        const fetchFatigue = async () => {
            if (!userId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const { data } = await AnalyticsService.getWeeklyFatigueAnalysis(userId);
                if (isMounted && data) {
                    setFatigueData(data);
                }
            } catch (error) {
                console.error('Error loading weekly fatigue analysis:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchFatigue();

        return () => {
            isMounted = false;
        };
    }, [userId, initialData]);

    const statusIcon = useMemo(() => {
        switch (fatigueData?.fatigueLevel) {
            case 'optimo':
                return 'check-circle';
            case 'alto':
                return 'warning';
            case 'sobreentrenamiento':
                return 'error-outline';
            case 'sin_datos':
            default:
                return 'info-outline';
        }
    }, [fatigueData?.fatigueLevel]);

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
                badge: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                    borderRadius: 8,
                },
                badgeText: {
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: '#ffffff',
                },
                rpeBarContainer: {
                    marginVertical: 12,
                },
                rpeLabelsRow: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                },
                rpeScaleLabel: {
                    fontSize: 11,
                    color: colors.textSecondary,
                },
                rpeTrack: {
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: colors.background,
                    overflow: 'hidden',
                    flexDirection: 'row',
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                rpeFill: {
                    height: '100%',
                    borderRadius: 5,
                },
                kpiRow: {
                    flexDirection: 'row',
                    gap: 8,
                    marginVertical: 8,
                },
                kpiCard: {
                    flex: 1,
                    backgroundColor: colors.background,
                    borderRadius: 10,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: 'center',
                },
                kpiLabel: {
                    fontSize: 11,
                    color: colors.textSecondary,
                    marginBottom: 2,
                    textAlign: 'center',
                },
                kpiValue: {
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: colors.text,
                },
                recommendationBox: {
                    flexDirection: 'row',
                    gap: 8,
                    padding: 12,
                    borderRadius: 10,
                    marginTop: 8,
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                recommendationText: {
                    flex: 1,
                    fontSize: 12,
                    lineHeight: 18,
                    color: colors.text,
                },
                loadingContainer: {
                    paddingVertical: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
            }),
        [colors]
    );

    if (loading) {
        return (
            <View style={styles.container} testID={`${testID}-loading`}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                </View>
            </View>
        );
    }

    const data = fatigueData || {
        averageRPE: 0,
        fatigueLevel: 'sin_datos' as const,
        totalSeriesCount: 0,
        rpeSeriesCount: 0,
        highIntensityCount: 0,
        statusLabel: 'Sin Datos',
        statusColor: '#6B7280',
        recommendation: 'Registra el RPE en tus series de entrenamiento para analizar tu fatiga acumulada.',
    };

    const rpePercentage = Math.min(100, Math.max(0, (data.averageRPE / 10) * 100));

    return (
        <View style={styles.container} testID={testID}>
            {/* Header with Traffic Light Status Badge */}
            <View style={styles.headerRow}>
                <View style={styles.titleContainer}>
                    <MaterialIcons name="speed" size={20} color={colors.primary} />
                    <Text style={styles.title}>Fatiga y RPE Semanal</Text>
                </View>

                <View
                    style={[styles.badge, { backgroundColor: data.statusColor }]}
                    testID="fatigue-status-badge"
                >
                    <MaterialIcons name={statusIcon} size={14} color="#ffffff" />
                    <Text style={styles.badgeText}>{data.statusLabel}</Text>
                </View>
            </View>

            {/* RPE Gauge Bar */}
            <View style={styles.rpeBarContainer}>
                <View style={styles.rpeLabelsRow}>
                    <Text style={styles.rpeScaleLabel}>RPE 1 (Mín)</Text>
                    <Text style={styles.rpeScaleLabel}>RPE 5 (Medio)</Text>
                    <Text style={styles.rpeScaleLabel}>RPE 10 (Fallo)</Text>
                </View>
                <View style={styles.rpeTrack}>
                    <View
                        style={[
                            styles.rpeFill,
                            {
                                width: `${rpePercentage}%`,
                                backgroundColor: data.statusColor,
                            },
                        ]}
                        testID="rpe-gauge-fill"
                    />
                </View>
            </View>

            {/* KPIs Grid */}
            <View style={styles.kpiRow}>
                <View style={styles.kpiCard} testID="metric-avg-rpe">
                    <Text style={styles.kpiLabel}>RPE Medio</Text>
                    <Text style={styles.kpiValue}>
                        {data.rpeSeriesCount > 0 ? `${data.averageRPE} / 10` : '—'}
                    </Text>
                </View>

                <View style={styles.kpiCard} testID="metric-evaluated-sets">
                    <Text style={styles.kpiLabel}>Series Evaluadas</Text>
                    <Text style={styles.kpiValue}>{data.rpeSeriesCount}</Text>
                </View>

                <View style={styles.kpiCard} testID="metric-high-intensity">
                    <Text style={styles.kpiLabel}>RPE ≥ 9 (Fallo)</Text>
                    <Text
                        style={[
                            styles.kpiValue,
                            data.highIntensityCount > 0 && { color: data.statusColor },
                        ]}
                    >
                        {data.highIntensityCount}
                    </Text>
                </View>
            </View>

            {/* Recommendation Box */}
            <View style={styles.recommendationBox} testID="fatigue-recommendation-box">
                <MaterialIcons name="lightbulb" size={18} color={data.statusColor} />
                <Text style={styles.recommendationText}>{data.recommendation}</Text>
            </View>
        </View>
    );
};

export default FatigueLevelCard;
