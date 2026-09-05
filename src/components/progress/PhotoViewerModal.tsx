import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ImageViewing from 'react-native-image-viewing';

export interface PhotoViewerModalProps {
    visible: boolean;
    images: { url?: string; uri?: string }[];
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
    const formattedImages = useMemo(
        () => images.map((img) => ({ uri: img.uri || img.url || '' })),
        [images]
    );

    const renderHeader = () => (
        <View style={styles.topActions}>
            <TouchableOpacity style={styles.actionButton} onPress={onEditPhoto} testID="photo-viewer-edit-button">
                <MaterialIcons name="edit" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={onClose} testID="photo-viewer-close-button">
                <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
        </View>
    );

    const renderFooter = ({ imageIndex }: { imageIndex: number }) => {
        const currentPhoto = photos[imageIndex];
        return (
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
                    {imageIndex + 1} / {photos.length}
                </Text>
            </View>
        );
    };

    if (images.length === 0) {
        return null;
    }

    return (
        <ImageViewing
            images={formattedImages}
            imageIndex={currentIndex}
            visible={visible}
            onRequestClose={onClose}
            onImageIndexChange={onIndexChange}
            swipeToCloseEnabled={true}
            doubleTapToZoomEnabled={true}
            backgroundColor="#000"
            HeaderComponent={renderHeader}
            FooterComponent={renderFooter}
        />
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
