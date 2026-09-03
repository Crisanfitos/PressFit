import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../types/theme';
import RestTimer from '../RestTimer';

export interface WorkoutModalsProps {
    modalVisible: boolean;
    setsToAdd: number;
    colors: ThemeColors;
    onCloseModal: () => void;
    onIncrementSets: () => void;
    onDecrementSets: () => void;
    onConfirmAddSets: () => void;
    restTimerVisible: boolean;
    onRestTimerDismiss: () => void;
    onRestTimerStop: (seconds: number) => void;
}

export const WorkoutModals: React.FC<WorkoutModalsProps> = ({
    modalVisible,
    setsToAdd,
    colors,
    onCloseModal,
    onIncrementSets,
    onDecrementSets,
    onConfirmAddSets,
    restTimerVisible,
    onRestTimerDismiss,
    onRestTimerStop,
}) => {
    return (
        <>
            {/* Add Sets Modal */}
            <Modal
                animationType="fade"
                transparent
                visible={modalVisible}
                onRequestClose={onCloseModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Añadir Series</Text>
                            <TouchableOpacity
                                onPress={onCloseModal}
                                style={{ padding: 4 }}
                                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                            >
                                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.counterContainer}>
                            <TouchableOpacity
                                style={[styles.counterButton, { borderColor: colors.border }]}
                                onPress={onDecrementSets}
                            >
                                <MaterialIcons name="remove" size={24} color={colors.primary} />
                            </TouchableOpacity>
                            <Text style={[styles.counterText, { color: colors.text }]}>{setsToAdd}</Text>
                            <TouchableOpacity
                                style={[styles.counterButton, { borderColor: colors.border }]}
                                onPress={onIncrementSets}
                            >
                                <MaterialIcons name="add" size={24} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.confirmAddButton} onPress={onConfirmAddSets}>
                            <Text style={styles.confirmAddButtonText}>Añadir</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Rest Timer */}
            <RestTimer
                visible={restTimerVisible}
                onDismiss={onRestTimerDismiss}
                onTimerStop={onRestTimerStop}
                colors={colors}
            />
        </>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 20,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    counterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        marginBottom: 24,
    },
    counterButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    counterText: {
        fontSize: 32,
        fontWeight: 'bold',
        minWidth: 40,
        textAlign: 'center',
    },
    confirmAddButton: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#22c55e',
    },
    confirmAddButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default WorkoutModals;
