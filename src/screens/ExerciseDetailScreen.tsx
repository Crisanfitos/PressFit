import React, { useState, useContext, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    Linking,
} from 'react-native';
import {
    SafeAreaView,
} from 'react-native-safe-area-context';
import Reanimated from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { useExerciseDetailController } from '../controllers/useExerciseDetailController';
import { PersonalRecordService } from '../services/PersonalRecordService';

const { width } = Dimensions.get('window');

type ExerciseDetailScreenProps = {
    route: any;
    navigation: any;
};

const getVideoId = (url: string | undefined): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
};

const ExerciseDetailScreen: React.FC<ExerciseDetailScreenProps> = ({ route, navigation }) => {
    const { t, i18n } = useTranslation();
    const { theme } = useTheme();
    const { colors } = theme;
    const { exerciseId } = route.params || {};

    const { exercise, loading } = useExerciseDetailController(exerciseId);
    const authContext = useContext(AuthContext);
    const userId = authContext?.user?.id;
    const [currentSlide, setCurrentSlide] = useState(0);
    const [personalRecord, setPersonalRecord] = useState<any>(null);
    const [exerciseHistory, setExerciseHistory] = useState<any[]>([]);

    useEffect(() => {
        if (userId && exerciseId) {
            PersonalRecordService.getPersonalRecord(userId, exerciseId).then(({ data }) => {
                if (data) setPersonalRecord(data);
            });
            PersonalRecordService.getExerciseHistory(userId, exerciseId).then(({ data }) => {
                if (data) setExerciseHistory(data);
            });
        }
    }, [userId, exerciseId]);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: { flex: 1, backgroundColor: colors.background },
                header: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    paddingBottom: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                },
                backButton: { padding: 8, marginLeft: -8 },
                headerText: { flex: 1, fontSize: 18, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
                scrollView: { flex: 1, padding: 16 },
                mediaContainer: {
                    borderRadius: 12,
                    overflow: 'hidden',
                    backgroundColor: '#000',
                    marginBottom: 8,
                    height: 220,
                },
                noVideoPlaceholder: {
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 220,
                    backgroundColor: colors.surface,
                    width: '100%',
                },
                description: { fontSize: 16, color: colors.textSecondary, marginTop: 8, lineHeight: 24 },
                muscleTag: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: `${colors.primary}15`,
                    borderWidth: 1,
                    borderColor: `${colors.primary}40`,
                },
                infoSection: { marginBottom: 20, backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: `${colors.border}60` },
                sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10, letterSpacing: -0.2 },
                muscleTagText: { fontSize: 13, fontWeight: '600', color: colors.primary },
                paginationContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 8, marginBottom: 12 },
                paginationDot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
                youtubeButton: {
                    backgroundColor: '#FF0000',
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                },
                youtubeButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700', marginLeft: 8 },
                prCard: {
                    borderRadius: 14,
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                },
                prIconContainer: {
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    backgroundColor: `${colors.statusWarning || '#f59e0b'}20`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                },
                prWeight: {
                    fontSize: 20,
                    fontWeight: '800',
                    color: colors.text,
                },
                prDate: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginTop: 2,
                    fontWeight: '500',
                },
                historyRow: {
                    flexDirection: 'row',
                    paddingVertical: 9,
                    borderBottomWidth: 1,
                    borderBottomColor: `${colors.border}50`,
                },
                historyCell: {
                    flex: 1,
                    fontSize: 13,
                    color: colors.text,
                    textAlign: 'center',
                    fontWeight: '500',
                },
                historyHeaderCell: {
                    flex: 1,
                    fontSize: 11,
                    fontWeight: '700',
                    color: colors.textSecondary,
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                },
            }),
        [colors]
    );

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    if (!exercise) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                        <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: colors.textSecondary }}>{t('exerciseDetail.notFound', 'Ejercicio no encontrado')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    const exerciseName = exercise.titulo || t('workout.exercise', 'Ejercicio');
    const primaryMuscles = exercise.musculos_primarios || 'N/A';
    const secondaryMuscles = exercise.musculos_secundarios || '';
    const instructions = exercise.descripcion || exercise.description || t('exerciseDetail.noInstructions', 'No hay instrucciones disponibles.');
    const videoId = getVideoId(exercise.url_video);
    const imageUrl = exercise.url_foto || exercise.url_imagen;

    const openYouTube = () => {
        if (videoId) {
            Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
        }
    };

    return (
        <SafeAreaView style={styles.container} testID="exercise-detail-screen">
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} testID="exercise-detail-back-button">
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerText} numberOfLines={1}>
                    {exerciseName}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Media Carousel */}
                <View style={{ marginBottom: 24 }}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        style={styles.mediaContainer}
                        onScroll={(e) => {
                            const x = e.nativeEvent.contentOffset.x;
                            setCurrentSlide(x >= (width - 32) / 2 ? 1 : 0);
                        }}
                        scrollEventThrottle={16}
                        decelerationRate="fast"
                    >
                        {/* Image Slide */}
                        <View style={{ width: width - 32, height: 220, alignItems: 'center', justifyContent: 'center' }}>
                            {imageUrl ? (
                                <Reanimated.Image
                                    source={{ uri: imageUrl }}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="cover"
                                    sharedTransitionTag={`exercise-image-${exercise.id}`}
                                />
                            ) : (
                                <Reanimated.View
                                    style={styles.noVideoPlaceholder}
                                    sharedTransitionTag={`exercise-image-${exercise.id}`}
                                >
                                    <MaterialIcons name="image" size={48} color={colors.textSecondary} />
                                    <Text style={{ color: colors.textSecondary, marginTop: 8 }}>{t('exerciseDetail.noImage', 'Sin imagen')}</Text>
                                </Reanimated.View>
                            )}
                        </View>

                        {/* Video Slide Placeholder - Opens YouTube */}
                        <View style={{ width: width - 32, height: 220, alignItems: 'center', justifyContent: 'center' }}>
                            {videoId ? (
                                <TouchableOpacity
                                    style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                                    onPress={openYouTube}
                                >
                                    <Image
                                        source={{ uri: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }}
                                        style={{ width: '100%', height: '100%', position: 'absolute' }}
                                        resizeMode="cover"
                                    />
                                    <View
                                        style={{
                                            position: 'absolute',
                                            width: '100%',
                                            height: '100%',
                                            backgroundColor: 'rgba(0,0,0,0.4)',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <MaterialIcons name="play-circle-filled" size={64} color="#FFF" />
                                        <Text style={{ color: '#FFF', marginTop: 8, fontWeight: '600' }}>{t('exerciseDetail.viewOnYouTube', 'Ver en YouTube')}</Text>
                                    </View>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.noVideoPlaceholder}>
                                    <MaterialIcons name="videocam-off" size={48} color={colors.textSecondary} />
                                    <Text style={{ color: colors.textSecondary, marginTop: 8 }}>{t('exerciseDetail.noVideo', 'Sin video')}</Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    {/* Pagination Dots */}
                    <View style={styles.paginationContainer}>
                        <View style={[styles.paginationDot, { backgroundColor: currentSlide === 0 ? colors.primary : colors.border }]} />
                        <View style={[styles.paginationDot, { backgroundColor: currentSlide === 1 ? colors.primary : colors.border }]} />
                    </View>
                </View>

                {/* Muscle Groups */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>{t('exerciseDetail.involvedMuscles', 'Músculos Involucrados')}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                        <View style={styles.muscleTag}>
                            <MaterialIcons name="fitness-center" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                            <Text style={styles.muscleTagText}>{primaryMuscles}</Text>
                        </View>
                        {secondaryMuscles && (
                            <View style={[styles.muscleTag, { backgroundColor: colors.inputBackground, borderWidth: 0 }]}>
                                <Text style={[styles.muscleTagText, { color: colors.textSecondary }]}>{secondaryMuscles}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Instructions */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>{t('exerciseDetail.instructions', 'Instrucciones')}</Text>
                    <Text style={styles.description}>{instructions}</Text>
                </View>

                {/* YouTube Button */}
                {videoId && (
                    <TouchableOpacity style={styles.youtubeButton} onPress={openYouTube}>
                        <MaterialIcons name="play-arrow" size={24} color="#FFF" />
                        <Text style={styles.youtubeButtonText}>{t('exerciseDetail.viewVideoOnYouTube', 'Ver Video en YouTube')}</Text>
                    </TouchableOpacity>
                )}

                {/* Personal Record */}
                {personalRecord && (
                    <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>🏆 {t('exerciseDetail.personalRecord', 'Récord Personal')}</Text>
                        <View style={styles.prCard}>
                            <View style={styles.prIconContainer}>
                                <MaterialIcons name="emoji-events" size={26} color={colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.prWeight}>
                                    {personalRecord.peso_maximo} kg × {personalRecord.repeticiones} reps
                                </Text>
                                <Text style={styles.prDate}>
                                    {new Date(personalRecord.fecha_dia).toLocaleDateString(i18n.language)}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Exercise History */}
                {exerciseHistory.length > 0 && (
                    <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>{t('exerciseDetail.sessionHistory', 'Historial de Sesiones')}</Text>
                        <View style={styles.historyRow}>
                            <Text style={styles.historyHeaderCell}>{t('exerciseDetail.tableDate', 'Fecha')}</Text>
                            <Text style={styles.historyHeaderCell}>{t('exerciseDetail.tableMaxWeight', 'Peso Máx')}</Text>
                            <Text style={styles.historyHeaderCell}>{t('exerciseDetail.tableReps', 'Reps')}</Text>
                            <Text style={styles.historyHeaderCell}>{t('exerciseDetail.tableVol', 'Vol.')}</Text>
                        </View>
                        {exerciseHistory.map((entry, i) => (
                            <View key={i} style={styles.historyRow}>
                                <Text style={styles.historyCell}>
                                    {new Date(entry.fecha_dia).toLocaleDateString(i18n.language)}
                                </Text>
                                <Text style={styles.historyCell}>{entry.peso_sesion} kg</Text>
                                <Text style={styles.historyCell}>{entry.reps_totales}</Text>
                                <Text style={styles.historyCell}>{entry.volumen_sesion}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

export default ExerciseDetailScreen;
