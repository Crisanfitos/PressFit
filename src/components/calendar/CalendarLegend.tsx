import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface CalendarLegendProps {
    colors: any;
    labels?: {
        today?: string;
        completed?: string;
        inProgress?: string;
        missed?: string;
    };
}

export const CalendarLegend: React.FC<CalendarLegendProps> = ({ colors, labels }) => {
    return (
        <View style={[styles.legendContainer, { paddingBottom: 100 }]} testID="status-legend">
            <View style={styles.legendItem} testID="legend-today">
                <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                    {labels?.today || 'Hoy'}
                </Text>
            </View>
            <View style={styles.legendItem} testID="legend-completed">
                <View
                    style={[
                        styles.legendDot,
                        { backgroundColor: colors.timelineCompleted || colors.statusSuccess },
                    ]}
                />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                    {labels?.completed || 'Completado'}
                </Text>
            </View>
            <View style={styles.legendItem} testID="legend-in-progress">
                <View
                    style={[
                        styles.legendDot,
                        { backgroundColor: colors.timelineInProgress || colors.statusWarning },
                    ]}
                />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                    {labels?.inProgress || 'En Progreso'}
                </Text>
            </View>
            <View style={styles.legendItem} testID="legend-missed">
                <View
                    style={[
                        styles.legendDot,
                        { backgroundColor: `${colors.statusError}30` },
                    ]}
                />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                    {labels?.missed || 'Sin Hacer'}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingTop: 24,
        gap: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    legendText: {
        fontSize: 12,
    },
});
