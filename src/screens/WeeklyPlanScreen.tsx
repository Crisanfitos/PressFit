import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

const WeeklyPlanScreen: React.FC<any> = ({ navigation, route }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { colors } = theme;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.text }]}>{t('weeklyPlan.title', 'Plan Semanal')}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {t('weeklyPlan.placeholderSubtitle', 'Esta pantalla será rediseñada')}
            </Text>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
    },
});

export default WeeklyPlanScreen;
