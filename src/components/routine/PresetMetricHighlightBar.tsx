import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../types/theme';

export interface PresetMetricHighlightBarProps {
    totalPresets?: number;
    colors: ThemeColors;
    testID?: string;
}

export const PresetMetricHighlightBar: React.FC<PresetMetricHighlightBarProps> = ({
    totalPresets = 24,
    colors,
    testID = 'preset-metric-highlight-bar',
}) => {
    return (
        <View style={styles.container} testID={testID}>
            {/* Metric 1: Programas Pro */}
            <View
                style={[
                    styles.card,
                    {
                        backgroundColor: colors.surface,
                        borderColor: `${colors.border}60`,
                    },
                ]}
            >
                <View style={styles.cardHeader}>
                    <Text style={[styles.caption, { color: colors.textSecondary }]}>PROGRAMAS</Text>
                    <MaterialIcons name="grid-view" size={15} color={colors.primary} />
                </View>
                <View style={styles.valueRow}>
                    <Text style={[styles.numericValue, { color: colors.text }]}>{totalPresets}</Text>
                    <Text style={[styles.valueSuffix, { color: colors.primary }]}>Activas</Text>
                </View>
                <View style={[styles.progressBarTrack, { backgroundColor: `${colors.border}60` }]}>
                    <View style={[styles.progressBarFill, { backgroundColor: colors.primary }]} />
                </View>
            </View>

            {/* Metric 2: Comunidad */}
            <View
                style={[
                    styles.card,
                    {
                        backgroundColor: colors.surface,
                        borderColor: `${colors.border}60`,
                    },
                ]}
            >
                <View style={styles.cardHeader}>
                    <Text style={[styles.caption, { color: colors.textSecondary }]}>COMUNIDAD</Text>
                    <MaterialIcons name="groups" size={15} color={colors.primary} />
                </View>
                <View style={styles.valueRow}>
                    <Text style={[styles.numericValue, { color: colors.text }]}>12.4k</Text>
                    <Text style={[styles.valueSuffix, { color: colors.textSecondary }]}>atletas</Text>
                </View>
                <Text style={[styles.subText, { color: colors.textSecondary }]}>
                    <Text style={{ color: colors.primary, fontWeight: '700' }}>+18%</Text> este mes
                </Text>
            </View>

            {/* Metric 3: Tiempo Medio */}
            <View
                style={[
                    styles.card,
                    {
                        backgroundColor: colors.surface,
                        borderColor: `${colors.border}60`,
                    },
                ]}
            >
                <View style={styles.cardHeader}>
                    <Text style={[styles.caption, { color: colors.textSecondary }]}>TIEMPO MEDIO</Text>
                    <MaterialIcons name="schedule" size={15} color={colors.statusInfo || colors.primary} />
                </View>
                <View style={styles.valueRow}>
                    <Text style={[styles.numericValue, { color: colors.text }]}>52</Text>
                    <Text style={[styles.valueSuffix, { color: colors.textSecondary }]}>min</Text>
                </View>
                <Text style={[styles.subText, { color: colors.textSecondary }]}>Óptimo RPE 8-9</Text>
            </View>

            {/* Metric 4: Verificación */}
            <View
                style={[
                    styles.card,
                    {
                        backgroundColor: colors.surface,
                        borderColor: `${colors.border}60`,
                        borderLeftWidth: 3,
                        borderLeftColor: colors.primary,
                    },
                ]}
            >
                <View style={styles.cardHeader}>
                    <Text style={[styles.caption, { color: colors.textSecondary }]}>VERIFICACIÓN</Text>
                    <MaterialIcons name="verified" size={15} color={colors.primary} />
                </View>
                <View style={styles.valueRow}>
                    <Text style={[styles.numericValue, { color: colors.primary, fontSize: 16 }]}>
                        PressFit Lab
                    </Text>
                </View>
                <Text style={[styles.subText, { color: colors.textSecondary }]}>Biometría deportiva</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    card: {
        flex: 1,
        minWidth: '47%',
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    caption: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.6,
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
        marginVertical: 2,
    },
    numericValue: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    valueSuffix: {
        fontSize: 12,
        fontWeight: '600',
    },
    progressBarTrack: {
        width: '100%',
        height: 4,
        borderRadius: 2,
        marginTop: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        width: '75%',
        height: '100%',
        borderRadius: 2,
    },
    subText: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 4,
    },
});

export default PresetMetricHighlightBar;
