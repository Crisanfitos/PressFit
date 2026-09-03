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
}

export const ExerciseSearchBar: React.FC<ExerciseSearchBarProps> = ({
    searchQuery,
    setSearchQuery,
    isSearchFocused,
    setIsSearchFocused,
    onClearSearch,
    colors,
}) => {
    return (
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="search" size={20} color={colors.textSecondary} />
            <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Buscar ejercicio..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => {
                    if (searchQuery.length === 0) setIsSearchFocused(false);
                }}
            />
            {(searchQuery.length > 0 || isSearchFocused) && (
                <TouchableOpacity onPress={onClearSearch} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                    <MaterialIcons name="close" size={20} color={colors.textSecondary} />
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
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
});

export default ExerciseSearchBar;
