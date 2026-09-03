import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ImageViewer from 'react-native-image-zoom-viewer';

export interface PhotoViewerModalProps {
    visible: boolean;
    images: { url: string }[];
    currentIndex: number;
    photos: any[];
    onIndexChange: (index: number) => void;
    onClose: () => void;
    onEditPhoto: () => void;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
    visible,
    images,
    currentIndex,
    photos,
    onIndexChange,
    onClose,
    onEditPhoto,
}) => {
    const currentPhoto = photos[currentIndex];

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: '#000' }}>
                <View style={styles.topActions}>
                    <TouchableOpacity style={styles.actionButton} onPress={onEditPhoto}>
                        <MaterialIcons name="edit" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={onClose}>
                        <MaterialIcons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {images.length > 0 && (
                    <ImageViewer
                        imageUrls={images}
                        index={currentIndex}
                        onChange={(index) => index !== undefined && onIndexChange(index)}
                        enableSwipeDown
                        onSwipeDown={onClose}
                        backgroundColor="#000"
                        renderIndicator={() => <></>}
                    />
                )}

                <View style={styles.viewerFooter}>
                    <Text style={styles.viewerDateText}>
                        {currentPhoto?.created_at
                            ? new Date(currentPhoto.created_at).toLocaleDateString()
                            : ''}
                    </Text>
                    {currentPhoto?.comentario ? (
                        <Text style={styles.viewerCommentText}>{currentPhoto.comentario}</Text>
                    ) : null}
                    <Text style={styles.viewerCountText}>
                        {currentIndex + 1} / {photos.length}
                    </Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    topActions: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 100,
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    viewerFooter: {
        position: 'absolute',
        bottom: 0,
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        width: '100%',
        paddingBottom: 40,
    },
    viewerDateText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    viewerCommentText: {
        color: '#ccc',
        fontSize: 14,
        marginTop: 4,
    },
    viewerCountText: {
        color: '#999',
        fontSize: 12,
        marginTop: 8,
    },
});

export default PhotoViewerModal;
