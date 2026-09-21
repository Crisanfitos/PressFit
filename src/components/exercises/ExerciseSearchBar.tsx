import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../types/theme';

export interface ExerciseSearchBarProps {
    searchQuery: string;
    setSearchQuery: (text: string) => void;
    isSearchFocused: boolean;
    setIsSearchFocused: (focused: boolean) => void;
    onClearSearch: () => void;
    colors: ThemeColors;
    placeholder?: string;
    onToggleFilter?: () => void;
    showFilterButton?: boolean;
    hasActiveFilters?: boolean;
    testID?: string;
    clearButtonTestID?: string;
}

export const ExerciseSearchBar: React.FC<ExerciseSearchBarProps> = ({
    searchQuery,
    setSearchQuery,
    isSearchFocused,
    setIsSearchFocused,
    onClearSearch,
    colors,
    placeholder = 'Buscar ejercicio...',
    onToggleFilter,
    showFilterButton = false,
    hasActiveFilters = false,
    testID = 'exercise-search-input',
    clearButtonTestID = 'exercise-search-clear-button',
}) => {
    return (
        <View
            style={[
                styles.searchContainer,
                {
                    backgroundColor: colors.surface,
                    borderColor: isSearchFocused ? colors.primary : `${colors.border}80`,
                },
            ]}
        >
            <MaterialIcons
                name="search"
                size={22}
                color={isSearchFocused ? colors.primary : colors.textSecondary}
                style={styles.searchIcon}
            />
            <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={placeholder}
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => {
                    if (searchQuery.length === 0) setIsSearchFocused(false);
                }}
                testID={testID}
            />
            {(searchQuery.length > 0 || isSearchFocused) && (
                <TouchableOpacity
                    onPress={onClearSearch}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    style={styles.actionButton}
                    testID={clearButtonTestID}
                >
                    <MaterialIcons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
            )}
            {showFilterButton && onToggleFilter && (
                <TouchableOpacity
                    onPress={onToggleFilter}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={[
                        styles.tuneButton,
                        {
                            backgroundColor: hasActiveFilters ? `${colors.primary}20` : `${colors.border}40`,
                        },
                    ]}
                    testID="exercise-search-tune-button"
                >
                    <MaterialIcons
                        name="tune"
                        size={18}
                        color={hasActiveFilters ? colors.primary : colors.textSecondary}
                    />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 12,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 14,
        borderWidth: 1,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    searchIcon: {
        marginRight: 2,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '400',
        paddingVertical: 2,
    },
    actionButton: {
        padding: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tuneButton: {
        padding: 6,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default ExerciseSearchBar;

