import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
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

import { extractYouTubeVideoId } from '../../utils/youtubeUtils';

export const getVideoId = (url: string | undefined): string | null => {
    return extractYouTubeVideoId(url);
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
        const { t } = useTranslation();
        const fadeAnim = useRef(new Animated.Value(0)).current;
        const [isExpanded, setIsExpanded] = useState(false);

        useEffect(() => {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }, [fadeAnim]);

        const videoId = getVideoId(item?.video_url || item?.url_video);
        const thumbnailUrl = getThumbnailUrl(videoId);

        return (
            <Animated.View style={{ opacity: fadeAnim }}>
                <TouchableOpacity
                    testID={item?.id ? `exercise-item-${item.id}` : undefined}
                    style={[
                        styles.exerciseCard,
                        {
                            backgroundColor: colors.surface,
                            borderColor: isSelected ? colors.primary : `${colors.border}80`,
                            borderWidth: 1,
                            borderLeftWidth: 4,
                            borderLeftColor: isSelected ? colors.primary : (item.is_custom ? (colors.statusWarning || '#f59e0b') : colors.primary),
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
                                {(() => {
                                    const isCustom = Boolean(item?.is_custom || item?.es_custom);
                                    const isOficial = Boolean(item?.es_oficial);
                                    const isOwner = item?.es_propietario !== undefined
                                        ? Boolean(item.es_propietario)
                                        : (isCustom && !item?.es_oficial);

                                    if (isOficial) {
                                        return (
                                            <View
                                                testID="official-exercise-badge"
                                                style={[
                                                    styles.badge,
                                                    {
                                                        backgroundColor: `${colors.statusInfo || '#0ea5e9'}20`,
                                                        borderColor: `${colors.statusInfo || '#0ea5e9'}40`,
                                                        borderWidth: 1,
                                                        marginLeft: 6,
                                                        paddingVertical: 2,
                                                        paddingHorizontal: 6,
                                                    },
                                                ]}
                                            >
                                                <Text style={[styles.badgeText, { color: colors.statusInfo || '#0ea5e9', fontSize: 10, fontWeight: '700' }]}>
                                                    {t('exerciseCatalog.badges.official', 'Oficial')}
                                                </Text>
                                            </View>
                                        );
                                    }

                                    if (isCustom && isOwner) {
                                        return (
                                            <View
                                                testID="my-exercise-badge"
                                                style={[
                                                    styles.badge,
                                                    {
                                                        backgroundColor: `${colors.primary}25`,
                                                        borderColor: `${colors.primary}50`,
                                                        borderWidth: 1,
                                                        marginLeft: 6,
                                                        paddingVertical: 2,
                                                        paddingHorizontal: 6,
                                                    },
                                                ]}
                                            >
                                                <Text
                                                    testID="custom-exercise-badge"
                                                    style={[styles.badgeText, { color: colors.primary, fontSize: 10, fontWeight: '700' }]}
                                                >
                                                    {t('exerciseCatalog.badges.myExercise', 'Mi Ejercicio')}
                                                </Text>
                                            </View>
                                        );
                                    }

                                    if (isCustom) {
                                        return (
                                            <View
                                                testID="community-exercise-badge"
                                                style={[
                                                    styles.badge,
                                                    {
                                                        backgroundColor: '#a855f725',
                                                        borderColor: '#a855f750',
                                                        borderWidth: 1,
                                                        marginLeft: 6,
                                                        paddingVertical: 2,
                                                        paddingHorizontal: 6,
                                                    },
                                                ]}
                                            >
                                                <Text
                                                    testID="custom-exercise-badge"
                                                    style={[styles.badgeText, { color: '#c084fc', fontSize: 10, fontWeight: '700' }]}
                                                >
                                                    {t('exerciseCatalog.badges.community', 'Comunidad')}
                                                </Text>
                                            </View>
                                        );
                                    }

                                    return null;
                                })()}
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {(() => {
                                const isOwner = item?.es_propietario !== undefined
                                    ? Boolean(item.es_propietario)
                                    : (Boolean(item?.is_custom) && !item?.es_oficial);

                                return (
                                    <>
                                        {isOwner && onEdit && (
                                            <TouchableOpacity
                                                onPress={() => onEdit(item)}
                                                style={{ padding: 6 }}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                testID="edit-custom-exercise-button"
                                            >
                                                <MaterialIcons name="edit" size={20} color={colors.primary} />
                                            </TouchableOpacity>
                                        )}

                                        {isOwner && onDelete && (
                                            <TouchableOpacity
                                                onPress={() => onDelete(item)}
                                                style={{ padding: 6 }}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                testID="delete-custom-exercise-button"
                                            >
                                                <MaterialIcons name="delete-outline" size={20} color={colors.error || '#ef4444'} />
                                            </TouchableOpacity>
                                        )}
                                    </>
                                );
                            })()}

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
        marginBottom: 10,
        borderRadius: 14,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    thumbnailContainer: {
        width: 76,
        height: 52,
        borderRadius: 10,
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
        borderRadius: 10,
    },
    playIconOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    exerciseInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 3,
        letterSpacing: -0.2,
    },
    exerciseText: {
        fontSize: 12,
        fontWeight: '500',
    },
    selectionIndicator: {
        marginLeft: 10,
    },
    expandedContent: {
        marginTop: 10,
        paddingTop: 10,
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
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: 10,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
});

ExerciseListItem.displayName = 'ExerciseListItem';

export default ExerciseListItem;
