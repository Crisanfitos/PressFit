import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { PresetRoutineService } from '../services/PresetRoutineService';
import { RoutineService } from '../services/RoutineService';
import { PresetRoutine } from '../types/models';
import { PresetRoutineCard } from '../components/PresetRoutineCard';
import { PresetRoutineDetailModal } from '../components/PresetRoutineDetailModal';

const CATEGORY_FILTERS = ['Todas', 'Hipertrofia', 'Fuerza', 'Estética', 'Principiante'];
const DAYS_FILTERS = [0, 3, 4, 6];

export const PresetRoutinesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
    const [selectedDays, setSelectedDays] = useState<number>(0);
    const [selectedPreset, setSelectedPreset] = useState<PresetRoutine | null>(null);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [isImporting, setIsImporting] = useState<boolean>(false);

    // Fetch and filter presets dynamically
    const filteredPresets = useMemo(() => {
        const res = PresetRoutineService.filterPresets({
            categoria: selectedCategory === 'Todas' ? undefined : selectedCategory,
            dias_por_semana: selectedDays === 0 ? undefined : selectedDays,
        });
        return res.data || [];
    }, [selectedCategory, selectedDays]);

    const handleSelectPreset = (preset: PresetRoutine) => {
        setSelectedPreset(preset);
        setModalVisible(true);
    };

    const handleConfirmImport = async (preset: PresetRoutine) => {
        if (!user?.id) {
            Alert.alert('Inicia sesión', 'Debes iniciar sesión para asignar una rutina.');
            return;
        }

        try {
            setIsImporting(true);
            const res = await RoutineService.importPresetRoutine(user.id, preset.id, true);
            setIsImporting(false);

            if (res.error) {
                Alert.alert('Error', 'No se pudo importar la rutina predefinida.');
                return;
            }

            setModalVisible(false);
            Alert.alert(
                '¡Rutina Asignada!',
                `La rutina "${preset.nombre}" ha sido configurada como tu rutina semanal activa.`,
                [
                    {
                        text: 'Ir a Mis Rutinas',
                        onPress: () => navigation.navigate('WeeklyRoutines'),
                    },
                ]
            );
        } catch (error) {
            setIsImporting(false);
            Alert.alert('Error', 'Ocurrió un error inesperado al importar la rutina.');
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-zinc-950">
            {/* Header */}
            <View className="px-5 pt-4 pb-3 flex-row items-center justify-between border-b border-zinc-800/80">
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    testID="back-button"
                    className="p-2 bg-zinc-900 rounded-full"
                >
                    <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                <Text className="text-lg font-bold text-white">
                    Plantillas Prémium
                </Text>

                <View className="w-9" />
            </View>

            <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
                {/* Intro Title */}
                <View className="mb-4">
                    <Text className="text-2xl font-extrabold text-white mb-1">
                        Biblioteca de Rutinas
                    </Text>
                    <Text className="text-sm text-zinc-400">
                        Selecciona un programa probado científicamente para tus objetivos.
                    </Text>
                </View>

                {/* Category Chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-3 flex-row"
                >
                    {CATEGORY_FILTERS.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => setSelectedCategory(cat)}
                            testID={`filter-category-${cat}`}
                            className={`px-4 py-2 rounded-full mr-2 border ${
                                selectedCategory === cat
                                    ? 'bg-emerald-500 border-emerald-500'
                                    : 'bg-zinc-900 border-zinc-800'
                            }`}
                        >
                            <Text
                                className={`text-xs font-semibold ${
                                    selectedCategory === cat ? 'text-black font-bold' : 'text-zinc-300'
                                }`}
                            >
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Days Filter Chips */}
                <View className="flex-row items-center mb-5 gap-2">
                    <Text className="text-xs font-bold text-zinc-400 uppercase tracking-widest mr-1">
                        Frecuencia:
                    </Text>
                    {DAYS_FILTERS.map((days) => (
                        <TouchableOpacity
                            key={`days-${days}`}
                            onPress={() => setSelectedDays(days)}
                            testID={`filter-days-${days}`}
                            className={`px-3 py-1.5 rounded-lg border ${
                                selectedDays === days
                                    ? 'bg-zinc-800 border-emerald-500'
                                    : 'bg-zinc-900 border-zinc-800'
                            }`}
                        >
                            <Text
                                className={`text-xs font-medium ${
                                    selectedDays === days ? 'text-emerald-400 font-bold' : 'text-zinc-400'
                                }`}
                            >
                                {days === 0 ? 'Todos' : `${days} días`}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Routines Catalog List */}
                {filteredPresets.length > 0 ? (
                    filteredPresets.map((preset) => (
                        <PresetRoutineCard
                            key={preset.id}
                            preset={preset}
                            onPressSelect={handleSelectPreset}
                        />
                    ))
                ) : (
                    <View className="py-12 items-center justify-center bg-zinc-900/50 rounded-2xl border border-zinc-800">
                        <Ionicons name="fitness-outline" size={40} color="#71717A" />
                        <Text className="text-base font-semibold text-zinc-400 mt-2">
                            No hay plantillas con estos filtros
                        </Text>
                    </View>
                )}

                <View className="h-8" />
            </ScrollView>

            {/* Routine Detail Modal */}
            <PresetRoutineDetailModal
                visible={modalVisible}
                preset={selectedPreset}
                isImporting={isImporting}
                onClose={() => setModalVisible(false)}
                onConfirmUse={handleConfirmImport}
            />
        </SafeAreaView>
    );
};
