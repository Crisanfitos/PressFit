import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { PresetRoutine } from '../types/models';
import { useTheme } from '../context/ThemeContext';

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
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { colors } = theme;

    if (!preset) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View
                    style={[
                        styles.container,
                        {
                            backgroundColor: colors.surface || '#1E1E1E',
                            borderColor: colors.border || '#333333',
                        },
                    ]}
                >
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border || '#27272A' }]}>
                        <View style={styles.headerTitleCol}>
                            <Text style={[styles.title, { color: colors.text || '#FFFFFF' }]} numberOfLines={1}>
                                {preset.nombre}
                            </Text>
                            <Text style={[styles.subTitle, { color: colors.primary || '#10B981' }]}>
                                {preset.categoria} • {preset.dias_por_semana} {t('presetRoutines.day', 'Días')}/Semana • {preset.nivel}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            testID="modal-close-button"
                            style={[styles.closeBtn, { backgroundColor: colors.background || '#121212' }]}
                        >
                            <MaterialIcons name="close" size={20} color={colors.textSecondary || '#9CA3AF'} />
                        </TouchableOpacity>
                    </View>

                    {/* Scroll Body */}
                    <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody}>
                        <Text style={[styles.description, { color: colors.textSecondary || '#D4D4D8' }]}>
                            {preset.descripcion}
                        </Text>

                        <Text style={[styles.sectionTitle, { color: colors.textSecondary || '#A1A1AA' }]}>
                            {t('presetRoutines.routineStructure', 'Estructura de la Rutina')}
                        </Text>

                        {/* Daily Routines */}
                        {preset.rutinas_diarias.map((day) => (
                            <View
                                key={`day-${day.orden}-${day.nombre_dia}`}
                                style={[
                                    styles.dayCard,
                                    {
                                        backgroundColor: colors.background || '#121212',
                                        borderColor: colors.border || '#27272A',
                                    },
                                ]}
                            >
                                <View style={styles.dayHeader}>
                                    <Text style={[styles.dayName, { color: colors.text || '#FFFFFF' }]}>
                                        {day.nombre_dia}
                                    </Text>
                                    <Text style={[styles.dayOrder, { color: colors.textSecondary || '#71717A' }]}>
                                        {t('presetRoutines.day', 'Día')} {day.orden}
                                    </Text>
                                </View>

                                {day.descripcion ? (
                                    <Text style={[styles.dayDesc, { color: colors.textSecondary || '#A1A1AA' }]}>
                                        {day.descripcion}
                                    </Text>
                                ) : null}

                                {/* Scheduled Exercises */}
                                {day.ejercicios.map((ex, exIdx) => (
                                    <View
                                        key={`ex-${exIdx}-${ex.nombre_ejercicio}`}
                                        style={[
                                            styles.exerciseRow,
                                            {
                                                backgroundColor: colors.surface || '#1E1E1E',
                                                borderColor: colors.border || '#27272A',
                                            },
                                        ]}
                                    >
                                        <View style={styles.exInfo}>
                                            <Text style={[styles.exName, { color: colors.text || '#E4E4E7' }]}>
                                                {ex.nombre_ejercicio}
                                            </Text>
                                            <Text style={[styles.exSub, { color: colors.textSecondary || '#A1A1AA' }]}>
                                                {ex.grupo_muscular_principal} • {ex.series.length} {t('workout.sets', 'series').toLowerCase()}
                                            </Text>
                                        </View>

                                        <View style={[styles.repsBadge, { backgroundColor: '#10B98120' }]}>
                                            <Text style={[styles.repsText, { color: colors.primary || '#10B981' }]}>
                                                {ex.series[0]?.repeticiones_objetivo || 10} reps
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </ScrollView>

                    {/* Footer CTA */}
                    <View style={[styles.footer, { borderTopColor: colors.border || '#27272A' }]}>
                        <TouchableOpacity
                            onPress={() => onConfirmUse(preset)}
                            disabled={isImporting}
                            testID="confirm-import-button"
                            style={[
                                styles.confirmBtn,
                                { backgroundColor: colors.primary || '#10B981' },
                            ]}
                        >
                            {isImporting ? (
                                <ActivityIndicator color="#000000" />
                            ) : (
                                <>
                                    <MaterialIcons name="check-circle" size={20} color="#000000" />
                                    <Text style={styles.confirmBtnText}>
                                        {t('presetRoutines.useThisRoutine', 'Usar esta Rutina')}
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

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTopWidth: 1,
        height: '85%',
        padding: 20,
        flexDirection: 'column',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 14,
        borderBottomWidth: 1,
    },
    headerTitleCol: {
        flex: 1,
        paddingRight: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },
    subTitle: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    closeBtn: {
        padding: 8,
        borderRadius: 20,
    },
    scrollBody: {
        flex: 1,
        marginVertical: 14,
    },
    description: {
        fontSize: 13,
        lineHeight: 20,
        marginBottom: 18,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    dayCard: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 14,
        marginBottom: 14,
    },
    dayHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    dayName: {
        fontSize: 15,
        fontWeight: '700',
    },
    dayOrder: {
        fontSize: 12,
        fontWeight: '500',
    },
    dayDesc: {
        fontSize: 12,
        fontStyle: 'italic',
        marginBottom: 10,
    },
    exerciseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 8,
    },
    exInfo: {
        flex: 1,
        paddingRight: 8,
    },
    exName: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 2,
    },
    exSub: {
        fontSize: 11,
    },
    repsBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    repsText: {
        fontSize: 11,
        fontWeight: '700',
    },
    footer: {
        paddingTop: 12,
        borderTopWidth: 1,
    },
    confirmBtn: {
        height: 50,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    confirmBtnText: {
        color: '#000000',
        fontSize: 15,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
