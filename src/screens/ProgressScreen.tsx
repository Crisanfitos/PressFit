import React, { useContext, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { useProgressController } from '../controllers/useProgressController';
import { PRGlowCard } from '../components/history/PRGlowCard';
import { WeeklyLoadChart } from '../components/history/WeeklyLoadChart';
import { findLatestPRSet, buildDailyLoad } from '../utils/progressHighlights';
import { ShareService } from '../services/ShareService';
import { LogService } from '../services/LogService';

type ProgressScreenProps = {
    navigation: any;
};

interface ProgressItem {
    icon: keyof typeof MaterialIcons.glyphMap;
    title: string;
    subtitle: string;
    screen: string;
}

const ProgressScreen: React.FC<ProgressScreenProps> = ({ navigation }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { colors } = theme;
    const authContext = useContext(AuthContext);
    const user = authContext?.user;
    const { weeklyStats, fetchWeeklyProgress } = useProgressController(user?.id);

    useEffect(() => {
        fetchWeeklyProgress();
    }, [fetchWeeklyProgress]);

    const latestPR = useMemo(() => findLatestPRSet(weeklyStats), [weeklyStats]);
    const dailyLoad = useMemo(() => buildDailyLoad(weeklyStats), [weeklyStats]);

    const handleSharePR = async () => {
        if (!latestPR) return;
        try {
            await ShareService.share({
                title: t('progress.sharePRTitle', 'Nuevo récord personal en PressFit'),
                message: t(
                    'progress.sharePRMessage',
                    `¡Nuevo récord! ${latestPR.exerciseName}: ${latestPR.weight} kg × ${latestPR.reps} reps 💪`
                ),
            });
        } catch (error) {
            LogService.error('Error sharing PR achievement:', error);
        }
    };

    const progressItems: (ProgressItem & { testID: string })[] = [
        { icon: 'calendar-view-month', title: t('progress.monthly'), subtitle: t('progress.monthlySubtitle'), screen: 'MonthlyProgress', testID: 'progress-item-monthly' },
        { icon: 'date-range', title: t('progress.weekly'), subtitle: t('progress.weeklySubtitle'), screen: 'WeeklyProgress', testID: 'progress-item-weekly' },
        { icon: 'today', title: t('progress.daily'), subtitle: t('progress.dailySubtitle'), screen: 'DailyProgress', testID: 'progress-item-daily' },
        { icon: 'fitness-center', title: t('progress.exercise'), subtitle: t('progress.exerciseSubtitle'), screen: 'ExerciseTracking', testID: 'progress-item-exercise' },
        { icon: 'bar-chart', title: t('progress.hypertrophy', 'Volumen de Hipertrofia'), subtitle: t('progress.hypertrophySubtitle', 'Series efectivas semanales vs MEV / MAV / MRV'), screen: 'HypertrophyVolume', testID: 'progress-item-hypertrophy' },
    ];

    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: { flex: 1, backgroundColor: colors.background },
                header: {
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16,
                    paddingBottom: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                },
                headerText: { fontSize: 18, fontWeight: 'bold', color: colors.text },
                scrollView: { padding: 16 },
                progressItem: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: 16,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: 16,
                    marginBottom: 16,
                },
                itemContent: {
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 16,
                    marginRight: 12,
                },
                textContent: {
                    flex: 1,
                    justifyContent: 'center',
                },
                iconContainer: {
                    height: 48,
                    width: 48,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 24,
                    backgroundColor: `${colors.primary}20`,
                },
                itemTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
                itemSubtitle: { fontSize: 14, color: colors.textSecondary },
            }),
        [colors]
    );

    return (
        <SafeAreaView style={styles.container} testID="progress-screen">
            <View style={styles.header}>
                <Text style={styles.headerText}>{t('progress.title')}</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                {latestPR && <PRGlowCard pr={latestPR} onPressShare={handleSharePR} />}
                {(weeklyStats?.length || 0) > 0 && <WeeklyLoadChart bars={dailyLoad} />}
                {progressItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        testID={item.testID}
                        style={styles.progressItem}
                        onPress={() => navigation.navigate(item.screen)}
                    >
                        <View style={styles.itemContent}>
                            <View style={styles.iconContainer}>
                                <MaterialIcons name={item.icon} size={28} color={colors.primary} />
                            </View>
                            <View style={styles.textContent}>
                                <Text style={styles.itemTitle}>{item.title}</Text>
                                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                            </View>
                        </View>
                        <MaterialIcons name="arrow-forward-ios" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

export default ProgressScreen;
