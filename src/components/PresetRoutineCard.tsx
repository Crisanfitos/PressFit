import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PresetRoutine } from '../types/models';
import { useTheme } from '../context/ThemeContext';

interface PresetRoutineCardProps {
    preset: PresetRoutine;
    index?: number;
    onPressSelect: (preset: PresetRoutine) => void;
}

export const PresetRoutineCard: React.FC<PresetRoutineCardProps> = ({
    preset,
    index,
    onPressSelect,
}) => {
    const { theme } = useTheme();
    const { colors } = theme;

    const categoryBadgeStyle = useMemo(() => {
        switch (preset.categoria) {
            case 'Hipertrofia':
                return { bg: '#10B98120', text: '#10B981', border: '#10B98150' };
            case 'Fuerza':
                return { bg: '#F59E0B20', text: '#F59E0B', border: '#F59E0B50' };
            case 'Estética':
                return { bg: '#EC489920', text: '#EC4899', border: '#EC489950' };
            case 'Principiante':
                return { bg: '#3B82F620', text: '#3B82F6', border: '#3B82F650' };
            default:
                return { bg: '#8B5CF620', text: '#8B5CF6', border: '#8B5CF650' };
        }
    }, [preset.categoria]);

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onPressSelect(preset)}
            testID={index !== undefined ? `preset-routine-card-${index}` : `preset-card-${preset.id}`}
            accessibilityLabel={`preset-card-${preset.id}`}
            style={[
                styles.card,
                {
                    backgroundColor: colors.surface,
                    borderColor: `${colors.border}80`,
                },
            ]}
        >
            {/* Top Badges Row */}
            <View style={styles.topRow}>
                <View style={styles.badgeGroup}>
                    <View
                        style={[
                            styles.categoryBadge,
                            {
                                backgroundColor: categoryBadgeStyle.bg,
                                borderColor: categoryBadgeStyle.border,
                            },
                        ]}
                    >
                        <Text style={[styles.categoryText, { color: categoryBadgeStyle.text }]}>
                            {preset.categoria}
                        </Text>
                    </View>

                    <View style={[styles.metaBadge, { backgroundColor: `${colors.border}40` }]}>
                        <MaterialIcons name="date-range" size={13} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                            {preset.dias_por_semana} días/sem
                        </Text>
                    </View>

                    <View style={[styles.metaBadge, { backgroundColor: `${colors.border}40` }]}>
                        <MaterialIcons name="fitness-center" size={13} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                            {preset.nivel}
                        </Text>
                    </View>
                </View>

                <MaterialIcons name="fitness-center" size={18} color={colors.textSecondary} />
            </View>

            {/* Title & Description */}
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {preset.nombre}
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
                {preset.descripcion}
            </Text>

            {/* Micro Spec Matrix */}
            <View
                style={[
                    styles.specMatrix,
                    {
                        backgroundColor: `${colors.border}20`,
                        borderColor: `${colors.border}50`,
                    },
                ]}
            >
                <View style={styles.specColumn}>
                    <Text style={[styles.specLabel, { color: colors.textSecondary }]}>FRECUENCIA</Text>
                    <Text style={[styles.specValue, { color: colors.text }]}>
                        {preset.dias_por_semana} Días
                    </Text>
                </View>
                <View
                    style={[
                        styles.specColumn,
                        styles.specDivider,
                        { borderColor: `${colors.border}50` },
                    ]}
                >
                    <Text style={[styles.specLabel, { color: colors.textSecondary }]}>DURACIÓN</Text>
                    <Text style={[styles.specValue, { color: colors.text }]}>50-60 min</Text>
                </View>
                <View style={styles.specColumn}>
                    <Text style={[styles.specLabel, { color: colors.textSecondary }]}>VOLUMEN</Text>
                    <Text style={[styles.specValue, { color: colors.text }]}>
                        {preset.rutinas_diarias.length} sesiones
                    </Text>
                </View>
            </View>

            {/* Footer Row */}
            <View style={styles.footerRow}>
                <View
                    style={[
                        styles.useButton,
                        {
                            backgroundColor: `${colors.primary}18`,
                            borderColor: `${colors.primary}40`,
                        },
                    ]}
                >
                    <Text style={[styles.useButtonText, { color: colors.primary }]}>
                        Usar Plantilla
                    </Text>
                    <MaterialIcons name="add-circle" size={16} color={colors.primary} style={{ marginLeft: 4 }} />
                </View>

                <View
                    style={[
                        styles.infoButton,
                        {
                            backgroundColor: `${colors.border}30`,
                            borderColor: `${colors.border}60`,
                        },
                    ]}
                >
                    <MaterialIcons name="info-outline" size={18} color={colors.textSecondary} />
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    categoryBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    metaBadgesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    metaText: {
        fontSize: 11,
        fontWeight: '500',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 6,
    },
    description: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 14,
    },
    badgeGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
        flex: 1,
    },
    specMatrix: {
        flexDirection: 'row',
        borderRadius: 10,
        borderWidth: 1,
        paddingVertical: 8,
        paddingHorizontal: 4,
        marginBottom: 12,
    },
    specColumn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    specDivider: {
        borderLeftWidth: 1,
        borderRightWidth: 1,
    },
    specLabel: {
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    specValue: {
        fontSize: 12,
        fontWeight: '700',
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    useButton: {
        flex: 1,
        height: 38,
        borderRadius: 10,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    useButtonText: {
        fontSize: 13,
        fontWeight: '700',
    },
    infoButton: {
        width: 38,
        height: 38,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
