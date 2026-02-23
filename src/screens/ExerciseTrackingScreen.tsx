import React, { useState, useContext, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ExerciseService } from '../services/ExerciseService';

type ExerciseTrackingScreenProps = { navigation: any };

const ExerciseTrackingScreen: React.FC<ExerciseTrackingScreenProps> = ({ navigation }) => {
    const { theme } = useTheme();
    const { colors } = theme;
    const authContext = useContext(AuthContext);
    const user = authContext?.user;
    const [exercises, setExercises] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loadExercises = async () => {
            if (!user?.id) return;
            setLoading(true);
            try {
                // Load only exercises that user has performed (has series data)
                const { data } = await ExerciseService.getUserExercisesWithProgress(user.id);
                setExercises(data || []);
            } catch (error) {
                console.error('Error loading exercises:', error);
            } finally {
                setLoading(false);
            }
        };
        loadExercises();
    }, [user?.id]);

    const filteredExercises = useMemo(() => {
        if (!searchQuery) return exercises;
        const lower = searchQuery.toLowerCase();
        return exercises.filter((e) => e.titulo.toLowerCase().includes(lower));
    }, [exercises, searchQuery]);

    const styles = useMemo(() => StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
        backButton: { padding: 8, marginLeft: -8 },
        headerText: { fontSize: 18, fontWeight: '600', color: colors.text },
        searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.surface, gap: 12 },
        searchInput: { flex: 1, color: colors.text, fontSize: 16 },
        loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
        listContent: { paddingHorizontal: 16, paddingBottom: 24 },
        exerciseCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, backgroundColor: colors.surface, marginBottom: 12 },
        exerciseName: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 },
    }), [colors]);

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.exerciseCard}
            onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
        >
            <Text style={styles.exerciseName} numberOfLines={1}>{item.titulo}</Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerText}>Progreso por Ejercicio</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar ejercicio..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredExercises}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
};

export default ExerciseTrackingScreen;
