import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PresetRoutine } from '../types/models';
import { useTheme } from '../context/ThemeContext';

interface PresetRoutineCardProps {
    preset: PresetRoutine;
    onPressSelect: (preset: PresetRoutine) => void;
}

export const PresetRoutineCard: React.FC<PresetRoutineCardProps> = ({
    preset,
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
            testID={`preset-card-${preset.id}`}
            style={[
                styles.card,
                {
                    backgroundColor: colors.card || colors.surface || '#1E1E1E',
                    borderColor: colors.border || '#333',
                },
            ]}
        >
            {/* Top Badges Row */}
            <View style={styles.topRow}>
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

                <View style={styles.metaBadgesRow}>
                    <View style={[styles.metaBadge, { backgroundColor: colors.background || '#121212' }]}>
                        <MaterialIcons name="date-range" size={14} color={colors.textSecondary || '#9CA3AF'} />
                        <Text style={[styles.metaText, { color: colors.textSecondary || '#9CA3AF' }]}>
                            {preset.dias_por_semana} días/sem
                        </Text>
                    </View>

                    <View style={[styles.metaBadge, { backgroundColor: colors.background || '#121212' }]}>
                        <MaterialIcons name="fitness-center" size={14} color={colors.textSecondary || '#9CA3AF'} />
                        <Text style={[styles.metaText, { color: colors.textSecondary || '#9CA3AF' }]}>
                            {preset.nivel}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Title & Description */}
            <Text style={[styles.title, { color: colors.text || '#FFFFFF' }]} numberOfLines={1}>
                {preset.nombre}
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary || '#9CA3AF' }]} numberOfLines={2}>
                {preset.descripcion}
            </Text>

            {/* Footer Row */}
            <View style={[styles.footerRow, { borderTopColor: colors.border || '#27272A' }]}>
                <Text style={[styles.sessionsText, { color: colors.primary || '#10B981' }]}>
                    {preset.rutinas_diarias.length} sesiones diseñadas
                </Text>

                <View style={styles.detailsBtn}>
                    <Text style={[styles.detailsBtnText, { color: colors.primary || '#10B981' }]}>
                        Ver Detalles
                    </Text>
                    <MaterialIcons name="chevron-right" size={18} color={colors.primary || '#10B981'} />
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
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
    },
    sessionsText: {
        fontSize: 12,
        fontWeight: '600',
    },
    detailsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    detailsBtnText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
