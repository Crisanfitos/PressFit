import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PresetRoutine } from '../types/models';

interface PresetRoutineDetailModalProps {
    visible: boolean;
    preset: PresetRoutine | null;
    isImporting?: boolean;
    onClose: () => void;
    onConfirmUse: (preset: PresetRoutine) => void;
}

export const PresetRoutineDetailModal: React.FC<PresetRoutineDetailModalProps> = ({
    visible,
    preset,
    isImporting = false,
    onClose,
    onConfirmUse,
}) => {
    if (!preset) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/80 justify-end">
                <View className="bg-zinc-900 border-t border-zinc-800 rounded-t-3xl h-[85%] p-6 flex-col">
                    {/* Modal Header */}
                    <View className="flex-row items-center justify-between pb-4 border-b border-zinc-800">
                        <View className="flex-1 pr-4">
                            <Text className="text-2xl font-bold text-white mb-1" numberOfLines={1}>
                                {preset.nombre}
                            </Text>
                            <Text className="text-xs text-emerald-400 font-semibold uppercase tracking-widest">
                                {preset.categoria} • {preset.dias_por_semana} Días/Semana • {preset.nivel}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            testID="modal-close-button"
                            className="bg-zinc-800 p-2 rounded-full"
                        >
                            <Ionicons name="close" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    {/* Content Scroll */}
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        className="flex-1 my-4 pr-1"
                    >
                        <Text className="text-sm text-zinc-300 leading-6 mb-6">
                            {preset.descripcion}
                        </Text>

                        <Text className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">
                            Estructura de la Rutina
                        </Text>

                        {/* Daily Routines Breakdown */}
                        {preset.rutinas_diarias.map((day) => (
                            <View
                                key={`day-${day.orden}-${day.nombre_dia}`}
                                className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 mb-4"
                            >
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className="text-base font-bold text-white">
                                        {day.nombre_dia}
                                    </Text>
                                    <Text className="text-xs font-medium text-zinc-500">
                                        Día {day.orden}
                                    </Text>
                                </View>

                                {day.descripcion ? (
                                    <Text className="text-xs text-zinc-400 mb-3 italic">
                                        {day.descripcion}
                                    </Text>
                                ) : null}

                                {/* Scheduled Exercises List */}
                                <View className="space-y-2">
                                    {day.ejercicios.map((ex, exIdx) => (
                                        <View
                                            key={`ex-${exIdx}-${ex.nombre_ejercicio}`}
                                            className="bg-zinc-900 p-3 rounded-lg flex-row items-center justify-between border border-zinc-800/50 mb-1.5"
                                        >
                                            <View className="flex-1 pr-2">
                                                <Text className="text-sm font-semibold text-zinc-200">
                                                    {ex.nombre_ejercicio}
                                                </Text>
                                                <Text className="text-xs text-zinc-400">
                                                    {ex.grupo_muscular_principal} • {ex.series.length} series
                                                </Text>
                                            </View>

                                            <View className="bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                                <Text className="text-xs font-bold text-emerald-400">
                                                    {ex.series[0]?.repeticiones_objetivo || 10} reps
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Footer Actions */}
                    <View className="pt-3 border-t border-zinc-800">
                        <TouchableOpacity
                            onPress={() => onConfirmUse(preset)}
                            disabled={isImporting}
                            testID="confirm-import-button"
                            className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 py-3.5 rounded-xl flex-row items-center justify-center gap-2"
                        >
                            {isImporting ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={20} color="#000" />
                                    <Text className="text-black font-bold text-base uppercase tracking-wider">
                                        Usar esta Rutina
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
