import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { summarizeSession } from '../../utils/progressHighlights';
import type { WorkoutSession } from '../../services/HistoryService';

export interface SessionTimelineProps {
    sessions: WorkoutSession[];
    onPressExport?: () => void;
    testID?: string;
}

const formatKg = (value: number): string =>
    value.toLocaleString('es-ES', { maximumFractionDigits: 0 });

export const SessionTimeline: React.FC<SessionTimelineProps> = ({
    sessions,
    onPressExport,
    testID = 'progress-session-timeline',
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { colors } = theme;
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const items = useMemo(
        () => sessions.map((s, i) => summarizeSession(s, i)),
        [sessions]
    );

    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: { marginTop: 8 },
                row: { flexDirection: 'row' },
                rail: { alignItems: 'center', width: 28 },
                dot: {
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: colors.primary,
                    marginTop: 18,
                },
                line: { width: 2, flex: 1, backgroundColor: colors.border, marginTop: 4 },
                dateLabel: {
                    fontSize: 12,
                    fontWeight: '700',
                    color: colors.textSecondary,
                    textTransform: 'uppercase',
                    marginBottom: 6,
                    marginTop: 2,
                },
                card: {
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderRadius: 14,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                    marginBottom: 4,
                },
                cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
                metaRow: {
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    marginTop: 8,
                    gap: 12,
                },
                metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
                metaText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
                expandButton: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 8,
                    gap: 4,
                },
                expandText: { fontSize: 12, fontWeight: '700', color: colors.primary },
                detailText: { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
                exportButton: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.primary,
                    borderRadius: 12,
                    paddingVertical: 12,
                    marginTop: 12,
                    gap: 8,
                },
                exportText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
            }),
        [colors]
    );

    if (items.length === 0) return null;

    return (
        <View style={styles.container} testID={testID}>
            {items.map((item, index) => {
                const expanded = expandedId === item.id;
                return (
                    <View key={item.id} style={styles.row}>
                        <View style={styles.rail}>
                            <View style={styles.dot} />
                            {index < items.length - 1 && <View style={styles.line} />}
                        </View>
                        <View style={{ flex: 1, paddingBottom: 12 }}>
                            <Text style={styles.dateLabel}>
                                {item.dateKey
                                    ? `${item.weekdayLabel} · ${item.dateKey}`
                                    : item.weekdayLabel}
                            </Text>
                            <View style={styles.card} testID={`${testID}-item-${item.id}`}>
                                <Text style={styles.cardTitle}>{item.title}</Text>
                                <View style={styles.metaRow}>
                                    {item.durationMin !== null && (
                                        <View style={styles.metaItem}>
                                            <MaterialIcons name="timer" size={14} color={colors.textSecondary} />
                                            <Text style={styles.metaText}>{`${item.durationMin} min`}</Text>
                                        </View>
                                    )}
                                    <View style={styles.metaItem}>
                                        <MaterialIcons name="fitness-center" size={14} color={colors.textSecondary} />
                                        <Text style={styles.metaText}>
                                            {`${formatKg(item.tonnageKg)} kg`}
                                        </Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <MaterialIcons name="repeat" size={14} color={colors.textSecondary} />
                                        <Text style={styles.metaText}>
                                            {t('progress.sessionSets', `${item.setCount} series`)}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.expandButton}
                                    onPress={() => setExpandedId(expanded ? null : item.id)}
                                    testID={`${testID}-expand-${item.id}`}
                                >
                                    <Text style={styles.expandText}>
                                        {expanded
                                            ? t('progress.showLess', 'Ver menos')
                                            : t('progress.showMore', 'Ver desglose')}
                                    </Text>
                                    <MaterialIcons
                                        name={expanded ? 'expand-less' : 'expand-more'}
                                        size={16}
                                        color={colors.primary}
                                    />
                                </TouchableOpacity>
                                {expanded && (
                                    <Text style={styles.detailText} testID={`${testID}-detail-${item.id}`}>
                                        {t(
                                            'progress.sessionDetail',
                                            `${item.exerciseCount} ejercicios · ${item.setCount} series · ${formatKg(item.tonnageKg)} kg totales`
                                        )}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>
                );
            })}
            {onPressExport && (
                <TouchableOpacity
                    style={styles.exportButton}
                    onPress={onPressExport}
                    testID={`${testID}-export-button`}
                    accessibilityRole="button"
                >
                    <MaterialIcons name="ios-share" size={18} color="#FFFFFF" />
                    <Text style={styles.exportText}>
                        {t('progress.exportReport', 'Exportar / Compartir Informe de Progreso')}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

export default SessionTimeline;
