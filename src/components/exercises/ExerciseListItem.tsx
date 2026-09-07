import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../types/theme';

export interface ExerciseListItemProps {
    item: any;
    isSelected: boolean;
    selectionMode?: boolean;
    onSelect: () => void;
    onThumbnailPress: (videoId: string | null) => void;
    colors: ThemeColors;
    navigation: any;
    onEdit?: (item: any) => void;
    onDelete?: (item: any) => void;
}

export const getVideoId = (url: string | undefined): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
};

export const getThumbnailUrl = (videoId: string | null): string | null => {
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
};

export const ExerciseListItem: React.FC<ExerciseListItemProps> = React.memo(
    ({
        item,
        isSelected,
        selectionMode = true,
        onSelect,
        onThumbnailPress,
        colors,
        navigation,
        onEdit,
        onDelete,
    }) => {
        const fadeAnim = useRef(new Animated.Value(0)).current;
        const [isExpanded, setIsExpanded] = useState(false);

        useEffect(() => {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }, [fadeAnim]);

        const videoId = getVideoId(item?.url_video);
        const thumbnailUrl = getThumbnailUrl(videoId);

        return (
            <Animated.View style={{ opacity: fadeAnim }}>
                <TouchableOpacity
                    testID={item?.id ? `exercise-item-${item.id}` : undefined}
                    style={[
                        styles.exerciseCard,
                        {
                            backgroundColor: colors.surface,
                            borderColor: isSelected ? colors.primary : colors.border,
                            borderWidth: isSelected ? 2 : 1,
                        },
                    ]}
                    onPress={onSelect}
                    activeOpacity={0.7}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity
                            style={styles.thumbnailContainer}
                            onPress={() => onThumbnailPress(videoId)}
                            disabled={!videoId}
                        >
                            {thumbnailUrl ? (
                                <Reanimated.Image
                                    source={{ uri: thumbnailUrl }}
                                    style={styles.thumbnail}
                                    resizeMode="cover"
                                    sharedTransitionTag={`exercise-image-${item.id}`}
                                />
                            ) : (
                                <Reanimated.View
                                    style={[styles.thumbnailPlaceholder, { backgroundColor: colors.inputBackground }]}
                                    sharedTransitionTag={`exercise-image-${item.id}`}
                                >
                                    <MaterialIcons name="fitness-center" size={24} color={colors.primary} />
                                </Reanimated.View>
                            )}
                            {videoId && (
                                <View style={styles.playIconOverlay}>
                                    <MaterialIcons name="play-circle-filled" size={24} color="rgba(255,255,255,0.9)" />
                                </View>
                            )}
                        </TouchableOpacity>

                        <View style={styles.exerciseInfo}>
                            <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={2}>
                                {item.titulo}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 2 }}>
                                <Text style={[styles.exerciseText, { color: colors.primary }]}>
                                    {item.musculos_primarios}
                                </Text>
                                {item.is_custom && (
                                    <View
                                        testID="custom-exercise-badge"
                                        style={[
                                            styles.badge,
                                            {
                                                backgroundColor: `${colors.primary}25`,
                                                marginLeft: 6,
                                                paddingVertical: 2,
                                                paddingHorizontal: 6,
                                            },
                                        ]}
                                    >
                                        <Text style={[styles.badgeText, { color: colors.primary, fontSize: 10, fontWeight: '700' }]}>
                                            Personalizado
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {item.is_custom && onEdit && (
                                <TouchableOpacity
                                    onPress={() => onEdit(item)}
                                    style={{ padding: 6 }}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    testID="edit-custom-exercise-button"
                                >
                                    <MaterialIcons name="edit" size={20} color={colors.primary} />
                                </TouchableOpacity>
                            )}

                            {item.is_custom && onDelete && (
                                <TouchableOpacity
                                    onPress={() => onDelete(item)}
                                    style={{ padding: 6 }}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    testID="delete-custom-exercise-button"
                                >
                                    <MaterialIcons name="delete-outline" size={20} color={colors.error || '#ef4444'} />
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                onPress={() => setIsExpanded(!isExpanded)}
                                style={{ padding: 8 }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <MaterialIcons
                                    name={isExpanded ? 'expand-less' : 'expand-more'}
                                    size={26}
                                    color={colors.textSecondary}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
                                style={{ padding: 8 }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <MaterialIcons name="info-outline" size={22} color={colors.textSecondary} />
                            </TouchableOpacity>

                            {selectionMode && (
                                <View style={styles.selectionIndicator}>
                                    <MaterialIcons
                                        name={isSelected ? 'check-circle' : 'add-circle-outline'}
                                        size={24}
                                        color={isSelected ? colors.primary : colors.textSecondary}
                                    />
                                </View>
                            )}
                        </View>
                    </View>

                    {isExpanded && (
                        <View style={[styles.expandedContent, { borderTopColor: colors.border }]}>
                            {item.descripcion ? (
                                <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                                    {item.descripcion}
                                </Text>
                            ) : null}
                            <View style={styles.badgeRow}>
                                {item.musculos_primarios ? (
                                    (Array.isArray(item.musculos_primarios)
                                        ? item.musculos_primarios
                                        : item.musculos_primarios.split(',').map((s: string) => s.trim()).filter(Boolean)
                                    ).map((muscle: string, i: number) => (
                                        <View key={`pm-${i}`} style={[styles.badge, { backgroundColor: `${colors.primary}20` }]}>
                                            <Text style={[styles.badgeText, { color: colors.primary }]}>{muscle}</Text>
                                        </View>
                                    ))
                                ) : null}
                                {item.musculos_secundarios ? (
                                    (Array.isArray(item.musculos_secundarios)
                                        ? item.musculos_secundarios
                                        : item.musculos_secundarios.split(',').map((s: string) => s.trim()).filter(Boolean)
                                    ).map((muscle: string, i: number) => (
                                        <View key={`sm-${i}`} style={[styles.badge, { backgroundColor: `${colors.statusInfo}20` }]}>
                                            <Text style={[styles.badgeText, { color: colors.statusInfo }]}>{muscle}</Text>
                                        </View>
                                    ))
                                ) : null}
                                {item.dificultad ? (
                                    <View style={[styles.badge, { backgroundColor: `${colors.statusWarning}20` }]}>
                                        <Text style={[styles.badgeText, { color: colors.statusWarning }]}>{item.dificultad}</Text>
                                    </View>
                                ) : null}
                                {item.categoria ? (
                                    <View style={[styles.badge, { backgroundColor: `${colors.textSecondary}20` }]}>
                                        <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{item.categoria}</Text>
                                    </View>
                                ) : null}
                            </View>
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>
        );
    },
    (prevProps, nextProps) =>
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.item?.id === nextProps.item?.id &&
        prevProps.item?.titulo === nextProps.item?.titulo &&
        prevProps.item?.descripcion === nextProps.item?.descripcion &&
        prevProps.item?.is_custom === nextProps.item?.is_custom &&
        prevProps.selectionMode === nextProps.selectionMode
);

export const ExerciseItem = ExerciseListItem;
export type ExerciseItemProps = ExerciseListItemProps;

const styles = StyleSheet.create({
    exerciseCard: {
        flexDirection: 'column',
        padding: 12,
        marginBottom: 12,
        borderRadius: 12,
    },
    thumbnailContainer: {
        width: 80,
        height: 54,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#000',
        marginRight: 12,
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    thumbnailPlaceholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    playIconOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    exerciseInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    exerciseName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    exerciseText: {
        fontSize: 12,
    },
    selectionIndicator: {
        marginLeft: 12,
    },
    expandedContent: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    descriptionText: {
        fontSize: 13,
        lineHeight: 20,
        marginBottom: 10,
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
});

export default ExerciseListItem;
