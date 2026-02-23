import React, { useContext, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useProgressController } from '../controllers/useProgressController';

type DailyProgressScreenProps = { navigation: any };

const DailyProgressScreen: React.FC<DailyProgressScreenProps> = ({ navigation }) => {
    const { theme } = useTheme();
    const { colors } = theme;
    const authContext = useContext(AuthContext);
    const user = authContext?.user;
    const { dailyStats, loading, fetchDailyProgress } = useProgressController(user?.id);

    useEffect(() => {
        fetchDailyProgress();
    }, [fetchDailyProgress]);

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
        statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
        statCard: { width: '47%', padding: 16, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center' },
        statValue: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginTop: 8 },
        statLabel: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
    }), [colors]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerText}>Progreso Diario</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : !dailyStats ? (
                <View style={styles.emptyState}>
                    <MaterialIcons name="today" size={64} color={colors.textSecondary} />
                    <Text style={styles.emptyStateTitle}>Sin entrenamientos hoy</Text>
                    <Text style={styles.emptyStateText}>Completa un entrenamiento para ver tu progreso del día</Text>
                </View>
            ) : (
                <ScrollView style={styles.scrollView}>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <MaterialIcons name="fitness-center" size={28} color={colors.primary} />
                            <Text style={styles.statValue}>{dailyStats.exercises}</Text>
                            <Text style={styles.statLabel}>Ejercicios</Text>
                        </View>
                        <View style={styles.statCard}>
                            <MaterialIcons name="repeat" size={28} color={colors.primary} />
                            <Text style={styles.statValue}>{dailyStats.sets}</Text>
                            <Text style={styles.statLabel}>Series</Text>
                        </View>
                        <View style={styles.statCard}>
                            <MaterialIcons name="timer" size={28} color={colors.primary} />
                            <Text style={styles.statValue}>{dailyStats.duration}</Text>
                            <Text style={styles.statLabel}>Minutos</Text>
                        </View>
                        <View style={styles.statCard}>
                            <MaterialIcons name="speed" size={28} color={colors.primary} />
                            <Text style={styles.statValue}>{dailyStats.totalWeight}</Text>
                            <Text style={styles.statLabel}>Kg Totales</Text>
                        </View>
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

export default DailyProgressScreen;
