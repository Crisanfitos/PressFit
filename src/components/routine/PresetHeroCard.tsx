import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PresetRoutine } from '../../types/models';
import { ThemeColors } from '../../types/theme';

export interface PresetHeroCardProps {
    preset: PresetRoutine;
    onPressSelect: (preset: PresetRoutine) => void;
    onPressUse?: (preset: PresetRoutine) => void;
    colors: ThemeColors;
    testID?: string;
}

export const PresetHeroCard: React.FC<PresetHeroCardProps> = ({
    preset,
    onPressSelect,
    onPressUse,
    colors,
    testID = 'preset-hero-card',
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const displayedDays = isExpanded ? preset.rutinas_diarias : preset.rutinas_diarias.slice(0, 3);
    const hasMoreDays = preset.rutinas_diarias.length > 3;

    const handleUse = () => {
        if (onPressUse) {
            onPressUse(preset);
        } else {
            onPressSelect(preset);
        }
    };

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: colors.surface,
                    borderColor: colors.primary,
                },
            ]}
            testID={testID}
        >
            {/* Top Badges Row */}
            <View style={styles.topRow}>
                <View style={styles.badgeGroup}>
                    <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                        <MaterialIcons
                            name="emoji-events"
                            size={14}
                            color={colors.textOnPrimary || '#FFFFFF'}
                            style={{ marginRight: 4 }}
                        />
                        <Text style={[styles.popularText, { color: colors.textOnPrimary || '#FFFFFF' }]}>
                            MÁS POPULAR
                        </Text>
                    </View>
                    <View style={[styles.levelBadge, { backgroundColor: `${colors.border}60` }]}>
                        <Text style={[styles.levelText, { color: colors.textSecondary }]}>
                            {preset.nivel}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.bookmarkButton, { backgroundColor: `${colors.border}40` }]}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                >
                    <MaterialIcons name="bookmark-border" size={20} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Title & Description */}
            <View style={styles.contentBlock}>
                <Text style={[styles.title, { color: colors.text }]}>{preset.nombre}</Text>
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                    {preset.descripcion}
                </Text>
            </View>

            {/* Technical Specification Matrix */}
            <View
                style={[
                    styles.specMatrix,
                    {
                        backgroundColor: `${colors.border}25`,
                        borderColor: `${colors.border}60`,
                    },
                ]}
            >
                <View style={styles.specColumn}>
                    <Text style={[styles.specLabel, { color: colors.textSecondary }]}>FRECUENCIA</Text>
                    <Text style={[styles.specValue, { color: colors.text }]}>
                        {preset.dias_por_semana} días/sem
                    </Text>
                </View>
                <View
                    style={[
                        styles.specColumn,
                        styles.specDivider,
                        { borderColor: `${colors.border}60` },
                    ]}
                >
                    <Text style={[styles.specLabel, { color: colors.textSecondary }]}>DURACIÓN</Text>
                    <Text style={[styles.specValue, { color: colors.primary }]}>55-65 min</Text>
                </View>
                <View style={styles.specColumn}>
                    <Text style={[styles.specLabel, { color: colors.textSecondary }]}>VOLUMEN</Text>
                    <Text style={[styles.specValue, { color: colors.text }]}>
                        {preset.rutinas_diarias.length} sesiones
                    </Text>
                </View>
            </View>

            {/* Microcycle Day Breakdown */}
            <View style={styles.microcycleSection}>
                <View style={styles.microcycleHeader}>
                    <Text style={[styles.microcycleTitle, { color: colors.textSecondary }]}>
                        MICRO-CICLO ESTRUCTURADO
                    </Text>
                    <Text style={[styles.microcycleSplit, { color: colors.primary }]}>
                        Split {preset.dias_por_semana}x1
                    </Text>
                </View>

                <View style={styles.daysList}>
                    {displayedDays.map((day, idx) => (
                        <View
                            key={`hero-day-${day.orden || idx}-${day.nombre_dia}`}
                            style={[
                                styles.dayRow,
                                {
                                    backgroundColor: `${colors.border}20`,
                                    borderColor: `${colors.border}40`,
                                },
                            ]}
                        >
                            <View style={styles.dayInfo}>
                                <View
                                    style={[
                                        styles.dayIndexCircle,
                                        { backgroundColor: `${colors.primary}20` },
                                    ]}
                                >
                                    <Text style={[styles.dayIndexText, { color: colors.primary }]}>
                                        {day.orden || idx + 1}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.dayName, { color: colors.text }]} numberOfLines={1}>
                                        {day.nombre_dia}
                                    </Text>
                                    {day.descripcion ? (
                                        <Text
                                            style={[styles.dayDesc, { color: colors.textSecondary }]}
                                            numberOfLines={1}
                                        >
                                            {day.descripcion}
                                        </Text>
                                    ) : null}
                                </View>
                            </View>
                            <Text style={[styles.dayCount, { color: colors.textSecondary }]}>
                                {day.ejercicios?.length || 0} ejer
                            </Text>
                        </View>
                    ))}

                    {hasMoreDays && (
                        <TouchableOpacity
                            onPress={() => setIsExpanded(!isExpanded)}
                            style={styles.expandDaysButton}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Text style={[styles.expandDaysText, { color: colors.primary }]}>
                                {isExpanded
                                    ? 'Ocultar días adicionales'
                                    : `+ Ver ${preset.rutinas_diarias.length - 3} días más...`}
                            </Text>
                            <MaterialIcons
                                name={isExpanded ? 'expand-less' : 'expand-more'}
                                size={18}
                                color={colors.primary}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
                <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                    onPress={handleUse}
                    activeOpacity={0.8}
                    testID="preset-hero-import-button"
                >
                    <Text style={[styles.primaryButtonText, { color: colors.textOnPrimary || '#FFFFFF' }]}>
                        Usar Plantilla
                    </Text>
                    <MaterialIcons
                        name="bolt"
                        size={20}
                        color={colors.textOnPrimary || '#FFFFFF'}
                        style={{ marginLeft: 4 }}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.secondaryButton,
                        {
                            backgroundColor: `${colors.border}40`,
                            borderColor: `${colors.border}80`,
                        },
                    ]}
                    onPress={() => onPressSelect(preset)}
                    activeOpacity={0.8}
                    testID="preset-hero-preview-button"
                >
                    <MaterialIcons
                        name="visibility"
                        size={18}
                        color={colors.text}
                        style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                        Previsualizar
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        borderWidth: 2,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    badgeGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    popularBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    popularText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    levelBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
    },
    levelText: {
        fontSize: 11,
        fontWeight: '600',
    },
    bookmarkButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentBlock: {
        marginBottom: 12,
    },
    title: {
        fontSize: 19,
        fontWeight: '800',
        letterSpacing: -0.4,
        marginBottom: 4,
    },
    description: {
        fontSize: 13,
        lineHeight: 18,
    },
    specMatrix: {
        flexDirection: 'row',
        borderRadius: 12,
        borderWidth: 1,
        paddingVertical: 10,
        paddingHorizontal: 6,
        marginBottom: 14,
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
        fontSize: 13,
        fontWeight: '700',
    },
    microcycleSection: {
        marginBottom: 14,
    },
    microcycleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    microcycleTitle: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.6,
    },
    microcycleSplit: {
        fontSize: 11,
        fontWeight: '700',
    },
    daysList: {
        gap: 6,
    },
    dayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 10,
        borderWidth: 1,
    },
    dayInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    dayIndexCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayIndexText: {
        fontSize: 11,
        fontWeight: '800',
    },
    dayName: {
        fontSize: 13,
        fontWeight: '700',
    },
    dayDesc: {
        fontSize: 11,
        marginTop: 1,
    },
    dayCount: {
        fontSize: 11,
        fontWeight: '500',
        marginLeft: 8,
    },
    expandDaysButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        gap: 2,
    },
    expandDaysText: {
        fontSize: 12,
        fontWeight: '600',
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    primaryButton: {
        flex: 1,
        height: 46,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    primaryButtonText: {
        fontSize: 14,
        fontWeight: '700',
    },
    secondaryButton: {
        height: 46,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
});

export default PresetHeroCard;
