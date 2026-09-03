import { useState, useEffect, useMemo, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { UserService } from '../../services/UserService';
import { ProgressCustomAlertData } from './ProgressCustomAlertModal';

export const usePhysicalProgressState = (
    user: any,
    progressPhotos: any[],
    uploadPhoto: (uri: string, date: Date, comment: string) => Promise<boolean>,
    deletePhotos: (ids: string[]) => Promise<boolean>,
    updatePhoto: (id: string, updates: any) => Promise<boolean>
) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
    const [comment, setComment] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [sourceModalVisible, setSourceModalVisible] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [viewerVisible, setViewerVisible] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    const [customAlert, setCustomAlert] = useState<ProgressCustomAlertData>({
        visible: false,
        type: 'success',
        title: '',
        message: '',
        onConfirm: () => {},
    });

    const closeCustomAlert = useCallback(() => {
        setCustomAlert((prev) => ({ ...prev, visible: false }));
    }, []);

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingPhoto, setEditingPhoto] = useState<any>(null);
    const [editComment, setEditComment] = useState('');
    const [editDate, setEditDate] = useState<Date>(new Date());
    const [saving, setSaving] = useState(false);

    const [weightHistory, setWeightHistory] = useState<
        { id: string; peso: number; created_at: string }[]
    >([]);

    useEffect(() => {
        if (user?.id) {
            UserService.getWeightHistory(user.id).then(({ data }) => {
                if (data) setWeightHistory(data);
            });
        }
    }, [user?.id]);

    const handleAddPhoto = () => setSourceModalVisible(true);

    const pickFromGallery = async () => {
        setSourceModalVisible(false);
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
            setSelectedImageUri(result.assets[0].uri);
            setComment('');
            setSelectedDate(new Date());
            setModalVisible(true);
        }
    };

    const pickFromCamera = async () => {
        setSourceModalVisible(false);
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            setCustomAlert({
                visible: true,
                type: 'error',
                title: 'Permiso denegado',
                message: 'Se necesita acceso a la cámara para tomar fotos de progreso.',
                onConfirm: closeCustomAlert,
            });
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
            setSelectedImageUri(result.assets[0].uri);
            setComment('');
            setSelectedDate(new Date());
            setModalVisible(true);
        }
    };

    const handleConfirmUpload = async () => {
        if (!selectedImageUri) return;
        setUploading(true);
        const success = await uploadPhoto(selectedImageUri, selectedDate, comment);
        setUploading(false);
        setModalVisible(false);
        setSelectedImageUri(null);
        if (success) {
            setCustomAlert({
                visible: true,
                type: 'success',
                title: 'Éxito',
                message: 'La foto ha sido añadida correctamente.',
                onConfirm: closeCustomAlert,
            });
        } else {
            setCustomAlert({
                visible: true,
                type: 'error',
                title: 'Error',
                message: 'Hubo un problema al añadir la foto.',
                onConfirm: closeCustomAlert,
            });
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            if (newSet.size === 0) setIsSelectionMode(false);
            return newSet;
        });
    };

    const handleLongPress = (id: string) => {
        setIsSelectionMode(true);
        toggleSelection(id);
    };

    const handleDeleteSelected = () => {
        setCustomAlert({
            visible: true,
            type: 'warning',
            title: 'Eliminar fotos',
            message: `¿Estás seguro de que quieres eliminar ${selectedIds.size} foto(s) seleccionada(s)?`,
            onCancel: closeCustomAlert,
            onConfirm: async () => {
                closeCustomAlert();
                const ids = Array.from(selectedIds);
                const success = await deletePhotos(ids);
                if (success) {
                    setSelectedIds(new Set());
                    setIsSelectionMode(false);
                    setCustomAlert({
                        visible: true,
                        type: 'success',
                        title: 'Eliminado',
                        message: 'Las fotos seleccionadas han sido eliminadas.',
                        onConfirm: closeCustomAlert,
                    });
                } else {
                    setCustomAlert({
                        visible: true,
                        type: 'error',
                        title: 'Error',
                        message: 'Hubo un problema al eliminar las fotos.',
                        onConfirm: closeCustomAlert,
                    });
                }
            },
        });
    };

    const openViewer = (index: number) => {
        if (isSelectionMode) {
            toggleSelection(progressPhotos[index].id);
        } else {
            setCurrentPhotoIndex(index);
            setViewerVisible(true);
        }
    };

    const handleEditPhoto = () => {
        const photo = progressPhotos[currentPhotoIndex];
        if (photo) {
            setEditingPhoto(photo);
            setEditComment(photo.comentario || '');
            setEditDate(new Date(photo.created_at));
            setEditModalVisible(true);
        }
    };

    const handleSaveEdit = async () => {
        if (!editingPhoto) return;
        setSaving(true);
        const success = await updatePhoto(editingPhoto.id, {
            comentario: editComment,
            created_at: editDate.toISOString(),
        });
        setSaving(false);
        if (success) {
            setEditModalVisible(false);
            setEditingPhoto(null);
            setCustomAlert({
                visible: true,
                type: 'success',
                title: 'Éxito',
                message: 'La foto ha sido actualizada correctamente.',
                onConfirm: closeCustomAlert,
            });
        } else {
            setCustomAlert({
                visible: true,
                type: 'error',
                title: 'Error',
                message: 'No se pudo actualizar la foto. Inténtalo de nuevo.',
                onConfirm: closeCustomAlert,
            });
        }
    };

    const viewerImages = useMemo(
        () => progressPhotos.map((photo) => ({ url: photo.url_foto })),
        [progressPhotos]
    );

    return {
        modalVisible,
        setModalVisible,
        selectedImageUri,
        comment,
        setComment,
        selectedDate,
        setSelectedDate,
        showDatePicker,
        setShowDatePicker,
        sourceModalVisible,
        setSourceModalVisible,
        uploading,
        viewerVisible,
        setViewerVisible,
        currentPhotoIndex,
        setCurrentPhotoIndex,
        selectedIds,
        setSelectedIds,
        isSelectionMode,
        setIsSelectionMode,
        customAlert,
        closeCustomAlert,
        editModalVisible,
        setEditModalVisible,
        editComment,
        setEditComment,
        editDate,
        setEditDate,
        saving,
        weightHistory,
        handleAddPhoto,
        pickFromGallery,
        pickFromCamera,
        handleConfirmUpload,
        toggleSelection,
        handleLongPress,
        handleDeleteSelected,
        openViewer,
        handleEditPhoto,
        handleSaveEdit,
        viewerImages,
    };
};
