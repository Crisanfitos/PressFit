import React, { useContext, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useProgressController } from '../controllers/useProgressController';

type WeeklyProgressScreenProps = { navigation: any };

const WeeklyProgressScreen: React.FC<WeeklyProgressScreenProps> = ({ navigation }) => {
    const { theme } = useTheme();
    const { colors } = theme;
    const authContext = useContext(AuthContext);
    const user = authContext?.user;
    const { weeklyStats, loading, fetchWeeklyProgress } = useProgressController(user?.id);

    useEffect(() => {
        fetchWeeklyProgress();
    }, [fetchWeeklyProgress]);

    const processWeeklyData = () => {
        if (!weeklyStats) return [];
        const days = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
        return days.map((day, index) => {
            const dayWorkouts = weeklyStats.filter((w: any) => new Date(w.hora_fin).getDay() === index);
            return {
                day,
                workouts: dayWorkouts.length,
                duration: dayWorkouts.reduce((acc: number, w: any) => {
                    if (w.hora_inicio && w.hora_fin) {
                        const duration = (new Date(w.hora_fin).getTime() - new Date(w.hora_inicio).getTime()) / 1000 / 60;
                        return acc + Math.round(duration);
                    }
                    return acc;
                }, 0),
            };
        });
    };

    const weekData = processWeeklyData();
    const totalWorkouts = weeklyStats?.length || 0;
    const totalDuration = weekData.reduce((acc, d) => acc + d.duration, 0);
    const maxDuration = Math.max(...weekData.map((d) => d.duration), 1);

    const styles = useMemo(() => StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
        backButton: { padding: 8, marginLeft: -8 },
        headerText: { fontSize: 18, fontWeight: '600', color: colors.text },
        loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
        emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
        emptyStateTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 24, marginBottom: 12, textAlign: 'center' },
        emptyStateText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center' },
        scrollView: { flex: 1, padding: 16 },
        summaryCard: { flexDirection: 'row', padding: 20, borderRadius: 16, backgroundColor: colors.surface, marginBottom: 24 },
        summaryItem: { flex: 1, alignItems: 'center' },
        summaryDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: 16 },
        summaryValue: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 8 },
        summaryLabel: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
        section: { marginBottom: 24 },
        sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 16 },
        chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 200, paddingHorizontal: 8 },
        barContainer: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
        barWrapper: { width: '100%', height: 160, justifyContent: 'flex-end', alignItems: 'center', marginBottom: 8 },
        bar: { width: '70%', borderRadius: 4, minHeight: 4 },
        dayLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
        detailCard: { padding: 16, borderRadius: 12, backgroundColor: colors.surface, marginBottom: 12 },
        detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
        detailDay: { fontSize: 16, fontWeight: '600', color: colors.text },
        detailVolume: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
        detailWorkouts: { fontSize: 14, color: colors.textSecondary },
    }), [colors]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerText}>Progreso Semanal</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : totalWorkouts === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialIcons name="trending-up" size={64} color={colors.textSecondary} />
                    <Text style={styles.emptyStateTitle}>¡Empieza tu semana fuerte!</Text>
                    <Text style={styles.emptyStateText}>Entrena esta semana y verás tu progreso reflejado aquí</Text>
                </View>
            ) : (
                <ScrollView style={styles.scrollView}>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryItem}>
                            <MaterialIcons name="fitness-center" size={24} color={colors.primary} />
                            <Text style={styles.summaryValue}>{totalWorkouts}</Text>
                            <Text style={styles.summaryLabel}>Entrenamientos</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <MaterialIcons name="timer" size={24} color={colors.primary} />
                            <Text style={styles.summaryValue}>{totalDuration}</Text>
                            <Text style={styles.summaryLabel}>Minutos Totales</Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Duración por Día</Text>
                        <View style={styles.chartContainer}>
                            {weekData.map((data, index) => (
                                <View key={index} style={styles.barContainer}>
                                    <View style={styles.barWrapper}>
                                        <View style={[styles.bar, { height: data.duration > 0 ? `${(data.duration / maxDuration) * 100}%` : 4, backgroundColor: data.duration > 0 ? colors.primary : colors.border }]} />
                                    </View>
                                    <Text style={styles.dayLabel}>{data.day}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Detalles</Text>
                        {weekData.filter((d) => d.workouts > 0).map((data, index) => (
                            <View key={index} style={styles.detailCard}>
                                <View style={styles.detailHeader}>
                                    <Text style={styles.detailDay}>{data.day}</Text>
                                    <Text style={styles.detailVolume}>{data.duration} min</Text>
                                </View>
                                <Text style={styles.detailWorkouts}>{data.workouts} entrenamiento(s)</Text>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

export default WeeklyProgressScreen;
