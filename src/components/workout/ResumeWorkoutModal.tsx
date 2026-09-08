import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RecoverySession } from '../../services/WorkoutRecoveryService';

export interface ResumeWorkoutModalProps {
    visible: boolean;
    session: RecoverySession | null;
    onResume: () => void;
    onDiscard: () => void;
    colors: {
        background: string;
        surface: string;
        surfaceHighlight: string;
        text: string;
        textSecondary: string;
        primary: string;
        border: string;
        [key: string]: any;
    };
}

export const ResumeWorkoutModal: React.FC<ResumeWorkoutModalProps> = ({
    visible,
    session,
    onResume,
    onDiscard,
    colors,
}) => {
    if (!visible || !session) return null;

    const handleDiscardPress = () => {
        Alert.alert(
            '¿Descartar entrenamiento?',
            '¿Estás seguro de que deseas descartar esta sesión activa? Esta acción no se puede deshacer.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Descartar',
                    style: 'destructive',
                    onPress: onDiscard,
                },
            ]
        );
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={() => {}}
            testID="resume-workout-modal"
        >
            <View style={styles.overlay} testID="resume-workout-overlay">
                <View
                    style={[
                        styles.modalContainer,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                    testID="resume-workout-content"
                >
                    {/* Header Icon */}
                    <View
                        style={[
                            styles.iconWrapper,
                            { backgroundColor: `${colors.primary}20` },
                        ]}
                    >
                        <MaterialIcons name="replay" size={32} color={colors.primary} />
                    </View>

                    {/* Titles */}
                    <Text style={[styles.title, { color: colors.text }]}>
                        Entrenamiento en Curso
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Se detectó una sesión previa sin finalizar. Puedes continuar justo donde lo dejaste o descartarla.
                    </Text>

                    {/* Session Details Card */}
                    <View
                        style={[
                            styles.detailsCard,
                            { backgroundColor: colors.surfaceHighlight, borderColor: colors.border },
                        ]}
                    >
                        <View style={styles.detailRow}>
                            <MaterialIcons name="calendar-today" size={18} color={colors.primary} />
                            <Text style={[styles.detailText, { color: colors.text }]}>
                                {session.dayName}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <MaterialIcons name="timer" size={18} color="#f59e0b" />
                            <Text style={[styles.detailText, { color: colors.text }]}>
                                {session.elapsedMinutes > 0
                                    ? `${session.elapsedMinutes} min transcurridos`
                                    : 'Iniciado recientemente'}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <MaterialIcons name="fitness-center" size={18} color={colors.textSecondary} />
                            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                                {session.exerciseCount} ejercicio{session.exerciseCount !== 1 ? 's' : ''} · {session.completedSetsCount} serie{session.completedSetsCount !== 1 ? 's' : ''} completada{session.completedSetsCount !== 1 ? 's' : ''}
                            </Text>
                        </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            testID="resume-workout-confirm-button"
                            style={[styles.resumeButton, { backgroundColor: colors.primary }]}
                            onPress={onResume}
                            activeOpacity={0.8}
                        >
                            <MaterialIcons name="play-arrow" size={22} color="#ffffff" />
                            <Text style={styles.resumeButtonText}>Reanudar Sesión</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            testID="resume-workout-discard-button"
                            style={[styles.discardButton, { borderColor: colors.border }]}
                            onPress={handleDiscardPress}
                            activeOpacity={0.7}
                        >
                            <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
                            <Text style={styles.discardButtonText}>Descartar Sesión</Text>
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
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 380,
        borderRadius: 20,
        borderWidth: 1,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 10,
    },
    iconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    detailsCard: {
        width: '100%',
        borderRadius: 14,
        borderWidth: 1,
        padding: 16,
        marginBottom: 24,
        gap: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    detailText: {
        fontSize: 14,
        fontWeight: '500',
    },
    actionButtons: {
        width: '100%',
        gap: 12,
    },
    resumeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderRadius: 12,
        gap: 8,
    },
    resumeButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    discardButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 46,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    discardButtonText: {
        color: '#ef4444',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default ResumeWorkoutModal;
