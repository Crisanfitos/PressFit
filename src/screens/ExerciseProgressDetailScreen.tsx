import React, { useState, useEffect, useContext, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../context/ThemeContext';
import { WorkoutService } from '../services/WorkoutService';
import { AuthContext } from '../context/AuthContext';
import { ExerciseService } from '../services/ExerciseService';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface SetData {
    id: string;
    numero_serie: number;
    peso_utilizado: number;
    repeticiones: number;
    rpe: number | null;
    fecha: string;
    rutina_id: string;
}

type ExerciseProgressDetailScreenProps = {
    route: any;
    navigation: any;
};

const ExerciseProgressDetailScreen: React.FC<ExerciseProgressDetailScreenProps> = ({ route, navigation }) => {
    const { exerciseId } = route.params;
    const { theme } = useTheme();
    const { colors } = theme;
    const authContext = useContext(AuthContext);
    const user = authContext?.user;

    const [loading, setLoading] = useState(true);
    const [exerciseDetails, setExerciseDetails] = useState<any>(null);
    const [historyData, setHistoryData] = useState<SetData[]>([]);
    const [chartMode, setChartMode] = useState<'peso' | 'volumen'>('peso');

    useEffect(() => {
        const loadData = async () => {
            if (!user?.id || !exerciseId) return;
            setLoading(true);
            try {
                // Fetch exercise name
                const exRes = await ExerciseService.getExerciseById(exerciseId);
                if (exRes.data) {
                    setExerciseDetails(exRes.data);
                }

                // Fetch history
                const histRes = await WorkoutService.getExerciseHistory(user.id, exerciseId);
                if (histRes.data) {
                    setHistoryData(histRes.data);
                }
            } catch (error) {
                console.error('Error loading exercise progress:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user?.id, exerciseId]);

    // Group history by date (session) to show max weight or total volume
    const chartData = useMemo(() => {
        if (!historyData.length) return [];

        const sessionsMap = new Map<string, { date: string, maxWeight: number, totalVolume: number }>();

        historyData.forEach((set) => {
            const date = set.fecha;
            const volume = (set.peso_utilizado || 0) * (set.repeticiones || 0);

            if (!sessionsMap.has(date)) {
                sessionsMap.set(date, { date, maxWeight: set.peso_utilizado || 0, totalVolume: volume });
            } else {
                const existing = sessionsMap.get(date)!;
                sessionsMap.set(date, {
                    date,
                    maxWeight: Math.max(existing.maxWeight, set.peso_utilizado || 0),
                    totalVolume: existing.totalVolume + volume,
                });
            }
        });

        // Convert grouped data to chart format
        const grouped = Array.from(sessionsMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return grouped.map((session) => ({
            value: chartMode === 'peso' ? session.maxWeight : session.totalVolume,
            label: format(parseISO(session.date), 'd MMM', { locale: es }),
            dataPointText: chartMode === 'peso' ? `${session.maxWeight}kg` : session.totalVolume.toString(),
            date: session.date
        }));

    }, [historyData, chartMode]);

    const recommendation = useMemo(() => {
        if (!historyData.length) return "Aún no hay suficientes datos para dar recomendaciones.";

        // Analyze recent RPE
        const recentSets = historyData.slice(-5); // Look at last 5 sets
        const highRpeSets = recentSets.filter(s => (s.rpe || 0) >= 9.5);
        if (highRpeSets.length >= 3) {
            return "Estás entrenando al fallo muy seguido últimamente (RPE 9.5 - 10). Considera bajar un poco el RPE (dejar 1-2 repeticiones en recámara) en tus próximas sesiones para mejorar la recuperación.";
        }

        const lowRpeSets = recentSets.filter(s => (s.rpe || 0) <= 6 && (s.rpe || 0) > 0);
        if (lowRpeSets.length >= 3) {
            return "Tus últimas series se sienten bastante ligeras (RPE bajo). Si te sientes con energía, podrías intentar aumentar un poco el peso para estimular más el progreso.";
        }

        // Analyze progress direction (simplistic: compare avg of first half vs second half of sessions)
        if (chartData.length >= 4) {
            const half = Math.floor(chartData.length / 2);
            const firstHalf = chartData.slice(0, half);
            const secondHalf = chartData.slice(half);

            const firstAvg = firstHalf.reduce((acc, curr) => acc + curr.value, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((acc, curr) => acc + curr.value, 0) / secondHalf.length;

            if (secondAvg > firstAvg * 1.05) { // 5% improvement
                return "¡Excelente! Hay una tendencia clara de progreso en este ejercicio. Tus números están mejorando con el tiempo, sigue haciendo lo que estás haciendo.";
            } else if (secondAvg < firstAvg * 0.95) { // 5% decrease
                return "Parece que el progreso en este ejercicio ha retrocedido ligeramente últimamente. Asegúrate de estar descansando lo suficiente y comiendo bien. Tal vez sea momento de una semana de descarga (deload).";
            } else {
                return "Tus números en este ejercicio se han mantenido bastante estables en las últimas sesiones. Si sientes que te has estancado prolongadamente, podrías intentar variar el rango de repeticiones o la variación del ejercicio.";
            }
        }

        return "Sigue registrando tus series para obtener recomendaciones personalizadas sobre tu rendimiento.";

    }, [historyData, chartData]);

    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border
        },
        backButton: { padding: 8, marginLeft: -8 },
        headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text, flex: 1, textAlign: 'center' },
        content: { padding: 16 },
        loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
        sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 12, marginTop: 8 },
        chartContainer: {
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            paddingBottom: 24,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center'
        },
        toggleContainer: {
            flexDirection: 'row',
            backgroundColor: `${colors.primary}20`,
            borderRadius: 8,
            marginBottom: 20,
            padding: 4,
            width: '100%'
        },
        toggleButton: {
            flex: 1,
            paddingVertical: 8,
            alignItems: 'center',
            borderRadius: 6,
        },
        toggleButtonActive: {
            backgroundColor: colors.primary,
        },
        toggleText: {
            fontWeight: '600',
            color: colors.primary,
        },
        toggleTextActive: {
            color: '#FFFFFF',
        },
        recommendationCard: {
            backgroundColor: `${colors.primary}15`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            borderLeftWidth: 4,
            borderLeftColor: colors.primary,
        },
        recommendationHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
            gap: 8
        },
        recommendationTitle: {
            fontSize: 16,
            fontWeight: 'bold',
            color: colors.primary
        },
        recommendationText: {
            color: colors.text,
            fontSize: 14,
            lineHeight: 20,
        },
        sessionCard: {
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: colors.border
        },
        sessionDateRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
            gap: 8,
            paddingBottom: 8,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border
        },
        sessionDate: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text
        },
        setRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 6,
        },
        setNumber: {
            color: colors.textSecondary,
            width: 70,
            fontSize: 14,
        },
        setDetails: {
            color: colors.text,
            flex: 1,
            fontWeight: '500',
            fontSize: 15,
        },
        rpeBadge: {
            backgroundColor: `${colors.textSecondary}20`,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
        },
        rpeText: {
            color: colors.textSecondary,
            fontSize: 12,
            fontWeight: 'bold',
        }
    });

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Cargando...</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    // Group history by date for list view
    const historyListGroupedByDate = historyData.reduce((acc, current) => {
        const date = current.fecha;
        if (!acc[date]) acc[date] = [];
        acc[date].push(current);
        return acc;
    }, {} as Record<string, SetData[]>);

    const sortedDates = Object.keys(historyListGroupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{exerciseDetails?.titulo || 'Progreso'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Chart Section */}
                <View style={styles.chartContainer}>
                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            style={[styles.toggleButton, chartMode === 'peso' && styles.toggleButtonActive]}
                            onPress={() => setChartMode('peso')}
                        >
                            <Text style={[styles.toggleText, chartMode === 'peso' && styles.toggleTextActive]}>Max Peso</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleButton, chartMode === 'volumen' && styles.toggleButtonActive]}
                            onPress={() => setChartMode('volumen')}
                        >
                            <Text style={[styles.toggleText, chartMode === 'volumen' && styles.toggleTextActive]}>Volumen Total</Text>
                        </TouchableOpacity>
                    </View>

                    {chartData.length > 0 ? (
                        <View style={{ marginLeft: -20, alignItems: 'center', width: '100%' }}>
                            <LineChart
                                data={chartData}
                                width={280}
                                height={200}
                                color={colors.primary}
                                thickness={3}
                                dataPointsColor={colors.primary}
                                textShiftY={-10}
                                textShiftX={-5}
                                textColor={colors.text}
                                yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                                xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10, width: 60 }}
                                initialSpacing={20}
                                verticalLinesColor={`${colors.border}40`}
                                rulesColor={`${colors.border}40`}
                            />
                        </View>
                    ) : (
                        <Text style={{ color: colors.textSecondary, padding: 20 }}>No hay datos suficientes para la gráfica.</Text>
                    )}
                </View>

                {/* Recommendations */}
                <View style={styles.recommendationCard}>
                    <View style={styles.recommendationHeader}>
                        <MaterialIcons name="lightbulb" size={20} color={colors.primary} />
                        <Text style={styles.recommendationTitle}>Análisis de IA</Text>
                    </View>
                    <Text style={styles.recommendationText}>{recommendation}</Text>
                </View>

                {/* History List */}
                <Text style={styles.sectionTitle}>Historial de Series</Text>

                {sortedDates.map((date) => (
                    <View key={date} style={styles.sessionCard}>
                        <View style={styles.sessionDateRow}>
                            <MaterialIcons name="event" size={20} color={colors.primary} />
                            <Text style={styles.sessionDate}>{format(parseISO(date), "EEEE, d 'de' MMMM yyyy", { locale: es })}</Text>
                        </View>

                        {historyListGroupedByDate[date].map((set) => (
                            <View key={set.id} style={styles.setRow}>
                                <Text style={styles.setNumber}>Serie {set.numero_serie}</Text>
                                <Text style={styles.setDetails}>{set.peso_utilizado} kg × {set.repeticiones} reps</Text>
                                {set.rpe ? (
                                    <View style={styles.rpeBadge}>
                                        <Text style={styles.rpeText}>RPE {set.rpe}</Text>
                                    </View>
                                ) : (
                                    <View style={{ width: 50 }} />
                                )}
                            </View>
                        ))}
                    </View>
                ))}

            </ScrollView>
        </SafeAreaView>
    );
};

export default ExerciseProgressDetailScreen;
