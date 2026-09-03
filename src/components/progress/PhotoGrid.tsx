import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { ThemeColors } from '../../types/theme';

export interface PhotoGridProps {
    photos: any[];
    selectedIds: Set<string>;
    onOpenViewer: (globalIndex: number) => void;
    onLongPress: (photoId: string) => void;
    colors: ThemeColors;
    locale: any;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
    photos,
    selectedIds,
    onOpenViewer,
    onLongPress,
    colors,
    locale,
}) => {
    const grouped = useMemo(() => {
        return photos.reduce((acc, photo) => {
            const dateKey = photo.created_at
                ? format(parseISO(photo.created_at), 'MMMM yyyy', { locale })
                : 'Desconocido';
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(photo);
            return acc;
        }, {} as Record<string, any[]>);
    }, [photos, locale]);

    return (
        <View>
            {Object.entries(grouped).map(([month, photosArray]) => {
                const monthPhotos = photosArray as any[];
                return (
                    <View key={month}>
                        <Text style={[styles.monthTitle, { color: colors.text }]}>
                            {month.charAt(0).toUpperCase() + month.slice(1)}
                        </Text>
                        <View style={styles.photoGrid}>
                            {monthPhotos.map((photo) => {
                                const globalIndex = photos.findIndex((p) => p.id === photo.id);
                                const isSelected = selectedIds.has(photo.id);
                                return (
                                    <TouchableOpacity
                                        key={photo.id}
                                        style={[styles.photoCard, { backgroundColor: colors.surface }]}
                                        onPress={() => onOpenViewer(globalIndex)}
                                        onLongPress={() => onLongPress(photo.id)}
                                        activeOpacity={0.8}
                                    >
                                        <Image source={{ uri: photo.url_foto }} style={styles.photoImage} />
                                        {isSelected && (
                                            <View
                                                style={[
                                                    styles.selectedOverlay,
                                                    { borderColor: colors.primary },
                                                ]}
                                            >
                                                <MaterialIcons name="check-circle" size={32} color="#fff" />
                                            </View>
                                        )}
                                        <View style={styles.photoOverlay}>
                                            <Text style={styles.photoDate}>
                                                {photo.created_at
                                                    ? format(parseISO(photo.created_at), "d 'de' MMMM", { locale })
                                                    : ''}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    monthTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        marginTop: 8,
    },
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    photoCard: {
        width: '48%',
        aspectRatio: 1,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    photoImage: {
        width: '100%',
        height: '100%',
    },
    selectedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(59,130,246,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
    },
    photoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    photoDate: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },
});

export default PhotoGrid;
