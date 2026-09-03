import React, { useContext, useEffect } from 'react';
import { View, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { es, enUS } from 'date-fns/locale';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { useProgressController } from '../controllers/useProgressController';
import WeightChart from '../components/WeightChart';
import AdvancedMetricsCard from '../components/AdvancedMetricsCard';
import {
    PhysicalProgressHeader,
    PhotoGrid,
    PhysicalProgressEmptyState,
    PhotoSourceModal,
    PhotoUploadModal,
    PhotoViewerModal,
    PhotoEditModal,
    ProgressCustomAlertModal,
    PhysicalProgressFab,
    usePhysicalProgressState,
} from '../components/progress';

type PhysicalProgressScreenProps = { navigation: any };

const PhysicalProgressScreen: React.FC<PhysicalProgressScreenProps> = ({ navigation }) => {
    const { t, i18n } = useTranslation();
    const { theme, themeMode } = useTheme();
    const { colors } = theme;
    const user = useContext(AuthContext)?.user;

    const {
        progressPhotos,
        loading,
        fetchPhotos,
        uploadPhoto,
        deletePhotos,
        updatePhoto,
    } = useProgressController(user?.id);

    useEffect(() => {
        fetchPhotos();
    }, [fetchPhotos]);

    const state = usePhysicalProgressState(
        user,
        progressPhotos,
        uploadPhoto,
        deletePhotos,
        updatePhoto
    );

    const currentLocale = i18n.language?.startsWith('en') ? enUS : es;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} testID="physical-progress-screen">
            <PhysicalProgressHeader
                isSelectionMode={state.isSelectionMode}
                selectedCount={state.selectedIds.size}
                title={t('physicalProgress.title', 'Cambio Físico')}
                colors={colors}
                onBack={() => navigation.goBack()}
                onClearSelection={() => {
                    state.setIsSelectionMode(false);
                    state.setSelectedIds(new Set());
                }}
                onDeleteSelected={state.handleDeleteSelected}
            />

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView style={styles.scrollView}>
                    <WeightChart data={state.weightHistory} colors={colors} />
                    <AdvancedMetricsCard userId={user?.id} />

                    {progressPhotos.length === 0 ? (
                        <PhysicalProgressEmptyState
                            message={t('physicalProgress.noPhotosYet', 'No hay fotos de progreso aún')}
                            colors={colors}
                        />
                    ) : (
                        <PhotoGrid
                            photos={progressPhotos}
                            selectedIds={state.selectedIds}
                            onOpenViewer={state.openViewer}
                            onLongPress={state.handleLongPress}
                            colors={colors}
                            locale={currentLocale}
                        />
                    )}
                    <View style={{ height: 100 }} />
                </ScrollView>
            )}

            {!state.isSelectionMode && (
                <PhysicalProgressFab
                    colors={colors}
                    label={t('physicalProgress.addPhoto', 'Añadir Foto')}
                    onPress={state.handleAddPhoto}
                />
            )}

            <PhotoSourceModal
                visible={state.sourceModalVisible}
                colors={colors}
                t={t}
                onClose={() => state.setSourceModalVisible(false)}
                onPickFromCamera={state.pickFromCamera}
                onPickFromGallery={state.pickFromGallery}
            />

            <PhotoUploadModal
                visible={state.modalVisible}
                imageUri={state.selectedImageUri}
                selectedDate={state.selectedDate}
                setSelectedDate={state.setSelectedDate}
                showDatePicker={state.showDatePicker}
                setShowDatePicker={state.setShowDatePicker}
                comment={state.comment}
                setComment={state.setComment}
                uploading={state.uploading}
                colors={colors}
                themeMode={themeMode}
                onClose={() => state.setModalVisible(false)}
                onConfirmUpload={state.handleConfirmUpload}
            />

            <PhotoViewerModal
                visible={state.viewerVisible}
                images={state.viewerImages}
                currentIndex={state.currentPhotoIndex}
                photos={progressPhotos}
                onIndexChange={state.setCurrentPhotoIndex}
                onClose={() => state.setViewerVisible(false)}
                onEditPhoto={state.handleEditPhoto}
            />

            <PhotoEditModal
                visible={state.editModalVisible}
                editDate={state.editDate}
                setEditDate={state.setEditDate}
                editComment={state.editComment}
                setEditComment={state.setEditComment}
                saving={state.saving}
                colors={colors}
                onClose={() => state.setEditModalVisible(false)}
                onSave={state.handleSaveEdit}
            />

            <ProgressCustomAlertModal
                alert={state.customAlert}
                colors={colors}
                onClose={state.closeCustomAlert}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1, padding: 16 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default PhysicalProgressScreen;
