import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../../types/theme';

export interface ExerciseEmptyStateProps {
    hasActiveFilters: boolean;
    searchQuery: string;
    colors: ThemeColors;
}

export const ExerciseEmptyState: React.FC<ExerciseEmptyStateProps> = ({
    hasActiveFilters,
    searchQuery,
    colors,
}) => {
    const { t } = useTranslation();

    return (
        <View style={styles.emptyStateContainer}>
            <MaterialIcons
                name={hasActiveFilters || searchQuery.length > 0 ? 'search-off' : 'touch-app'}
                size={48}
                color={colors.textSecondary}
            />
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                {hasActiveFilters || searchQuery.length > 0
                    ? t('exerciseCatalog.noExercisesFound', 'No se encontraron ejercicios con los filtros actuales')
                    : t('exerciseCatalog.useFiltersPrompt', 'Usa los filtros o el buscador para encontrar ejercicios')}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        opacity: 0.7,
    },
    emptyStateText: {
        fontSize: 16,
        marginTop: 16,
        textAlign: 'center',
    },
});

export default ExerciseEmptyState;
