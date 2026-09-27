import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../../types/theme';
import { FilterKey, FilterState } from '../../controllers/useExerciseController';

export interface FilterRowData {
    key: FilterKey;
    label: string;
    options: string[];
}

export interface ExerciseFilterSectionProps {
    showFilters: boolean;
    setShowFilters?: React.Dispatch<React.SetStateAction<boolean>>;
    hasActiveFilters: boolean;
    filterRows: FilterRowData[];
    filters: FilterState | Partial<Record<FilterKey, string | null>>;
    setFilter: (key: FilterKey, value: string | null) => void;
    clearFilter: (key: FilterKey) => void;
    clearAllFilters: () => void;
    colors: ThemeColors;
}

export const ExerciseFilterSection: React.FC<ExerciseFilterSectionProps> = ({
    showFilters,
    hasActiveFilters,
    filterRows,
    filters,
    setFilter,
    clearFilter,
    clearAllFilters,
    colors,
}) => {
    const { t } = useTranslation();

    if (!showFilters) return null;

    const getOptionLabel = (filterKey: FilterKey, opt: string): string => {
        const cleanKey = opt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
        if (filterKey === 'primaryMuscle' || filterKey === 'secondaryMuscle') {
            return t(`muscleGroups.${cleanKey}`, opt);
        }
        if (filterKey === 'difficulty') {
            return t(`exerciseCatalog.difficulties.${cleanKey}`, opt);
        }
        if (filterKey === 'category') {
            return t(`exerciseCatalog.categories.${cleanKey}`, opt);
        }
        return opt;
    };

    return (
        <View style={styles.container}>
            {filterRows.map(({ key, label, options }) => {
                if (options.length === 0) return null;
                const activeValue = filters[key];
                return (
                    <View key={key} style={styles.filterGroup}>
                        <View style={styles.labelRow}>
                            <Text style={[styles.labelText, { color: colors.textSecondary }]}>
                                {label}
                            </Text>
                            {activeValue && (
                                <TouchableOpacity
                                    onPress={() => clearFilter(key)}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Text style={[styles.resetText, { color: colors.primary }]}>
                                        {t('common.reset', 'Restablecer')}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.categoriesScroll}
                        >
                            <TouchableOpacity
                                style={[
                                    styles.categoryChip,
                                    {
                                        backgroundColor: !activeValue ? colors.primary : colors.surface,
                                        borderColor: !activeValue ? colors.primary : `${colors.border}80`,
                                    },
                                ]}
                                onPress={() => clearFilter(key)}
                            >
                                <Text
                                    style={[
                                        styles.categoryText,
                                        {
                                            color: !activeValue ? (colors.textOnPrimary || '#ffffff') : colors.textSecondary,
                                            fontWeight: !activeValue ? '700' : '500',
                                        },
                                    ]}
                                >
                                    {t('common.all', 'Todos')}
                                </Text>
                            </TouchableOpacity>
                            {options.map((option) => {
                                const isSelected = activeValue === option;
                                return (
                                    <TouchableOpacity
                                        key={option}
                                        style={[
                                            styles.categoryChip,
                                            {
                                                backgroundColor: isSelected ? colors.primary : colors.surface,
                                                borderColor: isSelected ? colors.primary : `${colors.border}80`,
                                            },
                                        ]}
                                        onPress={() => setFilter(key, isSelected ? null : option)}
                                        testID={`filter-chip-${option.toLowerCase().replace(/\s+/g, '-')}`}
                                    >
                                        <Text
                                            style={[
                                                styles.categoryText,
                                                {
                                                    color: isSelected ? (colors.textOnPrimary || '#ffffff') : colors.textSecondary,
                                                    fontWeight: isSelected ? '700' : '500',
                                                },
                                            ]}
                                        >
                                            {getOptionLabel(key, option)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                );
            })}

            {hasActiveFilters && (
                <TouchableOpacity style={styles.clearButton} onPress={clearAllFilters}>
                    <MaterialIcons name="refresh" size={16} color={colors.primary} style={{ marginRight: 4 }} />
                    <Text style={[styles.clearButtonText, { color: colors.primary }]}>
                        {t('exerciseCatalog.clearFilters', 'Limpiar Filtros')}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
    },
    filterGroup: {
        marginBottom: 10,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 6,
    },
    labelText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
    },
    resetText: {
        fontSize: 12,
        fontWeight: '600',
    },
    categoriesScroll: {
        paddingHorizontal: 16,
        gap: 8,
        alignItems: 'center',
    },
    categoryChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    categoryText: {
        fontSize: 13,
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        paddingVertical: 6,
        paddingHorizontal: 16,
        marginTop: 2,
        marginBottom: 6,
    },
    clearButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
});

export default ExerciseFilterSection;
