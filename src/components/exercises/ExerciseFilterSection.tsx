import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../types/theme';
import { FilterKey } from '../../controllers/useExerciseController';

export interface FilterRowData {
    key: FilterKey;
    label: string;
    options: string[];
}

export interface ExerciseFilterSectionProps {
    showFilters: boolean;
    setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
    hasActiveFilters: boolean;
    filterRows: FilterRowData[];
    filters: Partial<Record<FilterKey, string>>;
    setFilter: (key: FilterKey, value: string | null) => void;
    clearFilter: (key: FilterKey) => void;
    clearAllFilters: () => void;
    colors: ThemeColors;
}

export const ExerciseFilterSection: React.FC<ExerciseFilterSectionProps> = ({
    showFilters,
    setShowFilters,
    hasActiveFilters,
    filterRows,
    filters,
    setFilter,
    clearFilter,
    clearAllFilters,
    colors,
}) => {
    return (
        <View>
            <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setShowFilters((prev) => !prev)}
            >
                <MaterialIcons
                    name={showFilters ? 'filter-list-off' : 'filter-list'}
                    size={20}
                    color={colors.textSecondary}
                />
                <Text style={[styles.toggleText, { color: colors.textSecondary }]}>
                    {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
                </Text>
                {hasActiveFilters && (
                    <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
                )}
            </TouchableOpacity>

            {showFilters &&
                filterRows.map(({ key, label, options }) => {
                    if (options.length === 0) return null;
                    const activeValue = filters[key];
                    return (
                        <View key={key} style={{ marginBottom: 6 }}>
                            <View style={styles.labelRow}>
                                <Text style={[styles.labelText, { color: colors.textSecondary }]}>
                                    {label}
                                </Text>
                                {activeValue && (
                                    <TouchableOpacity
                                        onPress={() => clearFilter(key)}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <MaterialIcons name="close" size={16} color={colors.textSecondary} />
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
                                        { backgroundColor: colors.surface, borderColor: colors.border },
                                        !activeValue && {
                                            backgroundColor: `${colors.primary}20`,
                                            borderColor: colors.primary,
                                        },
                                    ]}
                                    onPress={() => clearFilter(key)}
                                >
                                    <Text
                                        style={[
                                            styles.categoryText,
                                            { color: colors.textSecondary },
                                            !activeValue && { color: colors.primary, fontWeight: '600' },
                                        ]}
                                    >
                                        Todos
                                    </Text>
                                </TouchableOpacity>
                                {options.map((option) => {
                                    const isSelected = activeValue === option;
                                    return (
                                        <TouchableOpacity
                                            key={option}
                                            style={[
                                                styles.categoryChip,
                                                { backgroundColor: colors.surface, borderColor: colors.border },
                                                isSelected && {
                                                    backgroundColor: `${colors.primary}20`,
                                                    borderColor: colors.primary,
                                                },
                                            ]}
                                            onPress={() => setFilter(key, isSelected ? null : option)}
                                        >
                                            <Text
                                                style={[
                                                    styles.categoryText,
                                                    { color: colors.textSecondary },
                                                    isSelected && { color: colors.primary, fontWeight: '600' },
                                                ]}
                                            >
                                                {option}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    );
                })}

            {showFilters && hasActiveFilters && (
                <TouchableOpacity style={styles.clearButton} onPress={clearAllFilters}>
                    <Text style={[styles.clearButtonText, { color: colors.primary }]}>
                        Limpiar Filtros
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    toggleText: {
        fontSize: 13,
        marginLeft: 6,
        fontWeight: '500',
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 6,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 4,
    },
    labelText: {
        fontSize: 12,
        fontWeight: '600',
        flex: 1,
    },
    categoriesScroll: {
        paddingHorizontal: 16,
        gap: 8,
        alignItems: 'center',
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '500',
    },
    clearButton: {
        alignSelf: 'center',
        paddingVertical: 6,
        paddingHorizontal: 16,
        marginTop: 4,
        marginBottom: 4,
    },
    clearButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
});

export default ExerciseFilterSection;
