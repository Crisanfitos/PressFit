import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

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
    const { theme } = useTheme();
    const { colors } = theme;

    const progressItems: ProgressItem[] = [
        { icon: 'calendar-view-month', title: 'Progreso Mensual', subtitle: 'Vista general de tu mes', screen: 'MonthlyProgress' },
        { icon: 'date-range', title: 'Progreso Semanal', subtitle: 'Resumen de tu semana', screen: 'WeeklyProgress' },
        { icon: 'today', title: 'Progreso Diario', subtitle: 'Detalles de hoy', screen: 'DailyProgress' },
        { icon: 'fitness-center', title: 'Progreso por Ejercicio', subtitle: 'Evolución en cada ejercicio', screen: 'ExerciseTracking' },
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
                itemContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
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
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Progreso</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                {progressItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.progressItem}
                        onPress={() => navigation.navigate(item.screen)}
                    >
                        <View style={styles.itemContent}>
                            <View style={styles.iconContainer}>
                                <MaterialIcons name={item.icon} size={28} color={colors.primary} />
                            </View>
                            <View>
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
