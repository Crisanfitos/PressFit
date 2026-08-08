import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PresetRoutine } from '../types/models';

interface PresetRoutineCardProps {
    preset: PresetRoutine;
    onPressSelect: (preset: PresetRoutine) => void;
}

export const PresetRoutineCard: React.FC<PresetRoutineCardProps> = ({
    preset,
    onPressSelect,
}) => {
    // Color badge helper for categories
    const getCategoryBadgeColor = (cat: string) => {
        switch (cat) {
            case 'Hipertrofia':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
            case 'Fuerza':
                return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
            case 'Estética':
                return 'bg-pink-500/10 text-pink-400 border-pink-500/30';
            case 'Principiante':
                return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
            default:
                return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
        }
    };

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onPressSelect(preset)}
            testID={`preset-card-${preset.id}`}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4 shadow-lg"
        >
            {/* Header Tags */}
            <View className="flex-row flex-wrap items-center justify-between gap-2 mb-3">
                <View className={`px-3 py-1 rounded-full border ${getCategoryBadgeColor(preset.categoria)}`}>
                    <Text className="text-xs font-semibold uppercase tracking-wider">
                        {preset.categoria}
                    </Text>
                </View>

                <View className="flex-row items-center gap-2">
                    <View className="bg-zinc-800 px-2.5 py-1 rounded-full flex-row items-center gap-1">
                        <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
                        <Text className="text-xs font-medium text-zinc-300">
                            {preset.dias_por_semana} días/sem
                        </Text>
                    </View>

                    <View className="bg-zinc-800 px-2.5 py-1 rounded-full flex-row items-center gap-1">
                        <Ionicons name="barbell-outline" size={12} color="#9CA3AF" />
                        <Text className="text-xs font-medium text-zinc-300">
                            {preset.nivel}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Title & Description */}
            <Text className="text-xl font-bold text-white mb-2" numberOfLines={1}>
                {preset.nombre}
            </Text>
            <Text className="text-sm text-zinc-400 leading-5 mb-4" numberOfLines={2}>
                {preset.descripcion}
            </Text>

            {/* Action Bar */}
            <View className="flex-row items-center justify-between pt-3 border-t border-zinc-800/80">
                <Text className="text-xs font-medium text-emerald-400 flex-row items-center">
                    {preset.rutinas_diarias.length} sesiones diseñadas
                </Text>

                <View className="flex-row items-center gap-1 text-emerald-400">
                    <Text className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        Ver Detalles
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color="#10B981" />
                </View>
            </View>
        </TouchableOpacity>
    );
};
