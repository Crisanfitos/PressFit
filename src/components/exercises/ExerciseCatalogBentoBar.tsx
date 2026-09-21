import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../types/theme';

export interface ExerciseCatalogBentoBarProps {
    totalExercises: number;
    totalPRs?: number;
    totalGroups?: number;
    colors: ThemeColors;
    testID?: string;
}

export const ExerciseCatalogBentoBar: React.FC<ExerciseCatalogBentoBarProps> = ({
    totalExercises,
    totalPRs = 34,
    totalGroups = 8,
    colors,
    testID = 'exercise-catalog-bento-bar',
}) => {
    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: colors.surface,
                    borderColor: `${colors.border}80`,
                },
            ]}
            testID={testID}
        >
            {/* Metric 1: Total Ejercicios */}
            <View style={styles.metricItem}>
                <View style={styles.metricHeader}>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>TOTAL</Text>
                    <MaterialIcons name="fitness-center" size={14} color={colors.primary} />
                </View>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                    {totalExercises}
                </Text>
                <Text style={[styles.metricSubtitle, { color: colors.textSecondary }]}>
                    Ejercicios
                </Text>
            </View>

            {/* Metric 2: Récords Activos */}
            <View
                style={[
                    styles.metricItem,
                    styles.metricBorder,
                    { borderColor: `${colors.border}60` },
                ]}
            >
                <View style={styles.metricHeader}>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>RÉCORDS</Text>
                    <MaterialIcons name="emoji-events" size={14} color={colors.statusWarning || '#f59e0b'} />
                </View>
                <Text style={[styles.metricValue, { color: colors.statusWarning || '#f59e0b' }]}>
                    {totalPRs > 0 ? `${totalPRs} PRs` : '0 PRs'}
                </Text>
                <Text style={[styles.metricSubtitle, { color: colors.textSecondary }]}>
                    Registrados
                </Text>
            </View>

            {/* Metric 3: Grupos Guiados */}
            <View style={styles.metricItem}>
                <View style={styles.metricHeader}>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>GRUPOS</Text>
                    <MaterialIcons name="category" size={14} color={colors.statusInfo || '#38bdf8'} />
                </View>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                    {totalGroups} Zonas
                </Text>
                <Text style={[styles.metricSubtitle, { color: colors.textSecondary }]}>
                    Guiadas
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 14,
        borderWidth: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    metricItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 2,
    },
    metricBorder: {
        borderLeftWidth: 1,
        borderRightWidth: 1,
    },
    metricHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 2,
    },
    metricLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    metricValue: {
        fontSize: 18,
        fontWeight: '800',
        marginVertical: 1,
    },
    metricSubtitle: {
        fontSize: 11,
        fontWeight: '500',
    },
});

export default ExerciseCatalogBentoBar;
