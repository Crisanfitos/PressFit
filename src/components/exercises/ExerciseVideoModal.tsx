import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface ExerciseVideoModalProps {
    visible: boolean;
    videoId: string | null;
    onClose: () => void;
}

export const ExerciseVideoModal: React.FC<ExerciseVideoModalProps> = ({
    visible,
    videoId,
    onClose,
}) => {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <TouchableOpacity
                    style={styles.closeModalButton}
                    onPress={onClose}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                    <MaterialIcons name="close" size={30} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.content}>
                    {videoId && (
                        <TouchableOpacity
                            style={styles.youtubeButton}
                            onPress={() => {
                                onClose();
                            }}
                        >
                            <MaterialIcons name="play-arrow" size={24} color="#FFF" />
                            <Text style={styles.youtubeButtonText}>Ver en YouTube</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeModalButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        padding: 10,
        zIndex: 10,
    },
    content: {
        alignItems: 'center',
        padding: 20,
    },
    youtubeButton: {
        backgroundColor: '#FF0000',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    youtubeButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default ExerciseVideoModal;
