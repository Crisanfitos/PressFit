import React, { useState, useContext, useEffect, useRef, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { useProgressController } from '../controllers/useProgressController';

type MonthlyProgressScreenProps = { navigation: any };

const MonthlyProgressScreen: React.FC<MonthlyProgressScreenProps> = ({ navigation }) => {
    const { theme } = useTheme();
    const { colors } = theme;
    const authContext = useContext(AuthContext);
    const user = authContext?.user;
    const [currentDate, setCurrentDate] = useState(new Date());
    const [activeWeekBubble, setActiveWeekBubble] = useState<number | null>(null);
    const bubbleOpacity = useRef(new Animated.Value(0)).current;
    const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);

    const { processedMonthlyData, loading, fetchMonthlyProgressByDate } = useProgressController(user?.id);

    useEffect(() => {
        if (user?.id) {
            fetchMonthlyProgressByDate(currentDate.getFullYear(), currentDate.getMonth());
        }
    }, [currentDate, user?.id]);

    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const getMonthName = (date: Date) => months[date.getMonth()];

    const showWeekInfo = (weekIndex: number) => {
        if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
        setActiveWeekBubble(weekIndex);
        Animated.timing(bubbleOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        bubbleTimerRef.current = setTimeout(() => {
            Animated.timing(bubbleOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setActiveWeekBubble(null));
        }, 2000);
    };

    const formatDurationText = () => {
        if (!processedMonthlyData) return 'Este mes has entrenado un total de 0 minutos';
        const { totalHours, totalMinutes } = processedMonthlyData;
        if (totalHours === 0) return `Este mes has entrenado un total de ${totalMinutes} minutos`;
        if (totalMinutes === 0) return `Este mes has entrenado un total de ${totalHours} ${totalHours === 1 ? 'hora' : 'horas'}`;
        return `Este mes has entrenado un total de ${totalHours} ${totalHours === 1 ? 'hora' : 'horas'} y ${totalMinutes} minutos`;
    };

    const weeklyData = processedMonthlyData?.weeklyData || [];
    const totalWorkouts = processedMonthlyData?.totalWorkouts || 0;
    const maxDuration = weeklyData.length > 0 ? Math.max(...weeklyData.map((d) => d.durationMinutes), 1) : 1;

    const goToPreviousMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() - 1);
        setCurrentDate(newDate);
    };

    const goToNextMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + 1);
        if (newDate <= new Date()) setCurrentDate(newDate);
    };

    const isCurrentMonth = currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();

    const styles = useMemo(() => StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
        backButton: { padding: 8, marginLeft: -8 },
        headerText: { fontSize: 18, fontWeight: 'bold', color: colors.text },
        monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
        currentMonth: { fontSize: 20, fontWeight: '600', color: colors.text },
        scrollView: { flex: 1, padding: 16 },
        statsCard: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, marginBottom: 16 },
        statsLabel: { fontSize: 16, fontWeight: '500', color: colors.text, marginBottom: 8 },
        chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 200, paddingTop: 16 },
        barContainer: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
        barWrapper: { width: '100%', height: 150, justifyContent: 'flex-end', alignItems: 'center', marginBottom: 8 },
        bar: { width: '70%', backgroundColor: colors.primary, borderRadius: 4, minHeight: 4 },
        barLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
        barValue: { fontSize: 10, color: colors.textSecondary },
        summaryGrid: { flexDirection: 'row', gap: 12 },
        summaryCard: { flex: 1, padding: 16, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center' },
        summaryValue: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 8 },
        summaryLabel: { fontSize: 14, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
        loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
        speechBubble: { position: 'absolute', bottom: 45, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, minWidth: 120, alignItems: 'center' },
        speechBubbleText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
    }), [colors]);

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerText}>Progreso Mensual</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.monthSelector}>
                <TouchableOpacity onPress={goToPreviousMonth} style={{ padding: 8 }}>
                    <MaterialIcons name="chevron-left" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.currentMonth}>{getMonthName(currentDate)} {currentDate.getFullYear()}</Text>
                <TouchableOpacity onPress={goToNextMonth} disabled={isCurrentMonth} style={{ padding: 8 }}>
                    <MaterialIcons name="chevron-right" size={28} color={isCurrentMonth ? colors.border : colors.text} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView style={styles.scrollView}>
                    <View style={styles.statsCard}>
                        <Text style={styles.statsLabel}>{formatDurationText()}</Text>
                        <View style={styles.chartContainer}>
                            {weeklyData.map((data, index) => (
                                <TouchableOpacity key={index} style={styles.barContainer} onPress={() => showWeekInfo(index)} activeOpacity={0.7}>
                                    <View style={styles.barWrapper}>
                                        <View style={[styles.bar, { height: `${(data.durationMinutes / maxDuration) * 100}%` }]} />
                                    </View>
                                    <Text style={styles.barLabel}>{data.weekLabel}</Text>
                                    <Text style={styles.barValue}>{data.durationMinutes}m</Text>
                                    {activeWeekBubble === index && data.startDate && data.endDate && (
                                        <Animated.View style={[styles.speechBubble, { opacity: bubbleOpacity }]}>
                                            <Text style={styles.speechBubbleText}>del {formatDate(data.startDate)} al {formatDate(data.endDate)}</Text>
                                        </Animated.View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryCard}>
                            <MaterialIcons name="fitness-center" size={32} color={colors.primary} />
                            <Text style={styles.summaryValue}>{totalWorkouts}</Text>
                            <Text style={styles.summaryLabel}>Entrenamientos</Text>
                        </View>
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

export default MonthlyProgressScreen;
