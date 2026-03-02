import React, { useState, useContext, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Modal, TextInput, Alert, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ImageViewer from 'react-native-image-zoom-viewer';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { useProgressController } from '../controllers/useProgressController';
import { UserService } from '../services/UserService';
import WeightChart from '../components/WeightChart';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type PhysicalProgressScreenProps = { navigation: any };

const PhysicalProgressScreen: React.FC<PhysicalProgressScreenProps> = ({ navigation }) => {
    const { theme } = useTheme();
    const { colors } = theme;
    const authContext = useContext(AuthContext);
    const user = authContext?.user;

    const { progressPhotos, loading, fetchPhotos, uploadPhoto, deletePhotos, updatePhoto } = useProgressController(user?.id);

    useEffect(() => {
        fetchPhotos();
    }, [fetchPhotos]);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
    const [comment, setComment] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
    const [uploading, setUploading] = useState(false);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    // Custom Alert State
    const [customAlert, setCustomAlert] = useState<{
        visible: boolean;
        type: 'success' | 'error' | 'warning';
        title: string;
        message: string;
        onConfirm: () => void;
        onCancel?: () => void;
    }>({
        visible: false,
        type: 'success',
        title: '',
        message: '',
        onConfirm: () => { }
    });

    const closeCustomAlert = () => setCustomAlert(prev => ({ ...prev, visible: false }));
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingPhoto, setEditingPhoto] = useState<any>(null);
    const [editComment, setEditComment] = useState('');
    const [editDate, setEditDate] = useState<Date>(new Date());
    const [saving, setSaving] = useState(false);
    const [weightHistory, setWeightHistory] = useState<{ id: string; peso: number; created_at: string }[]>([]);

    useEffect(() => {
        if (user?.id) {
            UserService.getWeightHistory(user.id).then(({ data }) => {
                if (data) setWeightHistory(data);
            });
        }
    }, [user?.id]);

    const handleAddPhoto = async () => {
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
                onConfirm: closeCustomAlert
            });
        } else {
            setCustomAlert({
                visible: true,
                type: 'error',
                title: 'Error',
                message: 'Hubo un problema al añadir la foto.',
                onConfirm: closeCustomAlert
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
                        onConfirm: closeCustomAlert
                    });
                } else {
                    setCustomAlert({
                        visible: true,
                        type: 'error',
                        title: 'Error',
                        message: 'Hubo un problema al eliminar las fotos.',
                        onConfirm: closeCustomAlert
                    });
                }
            }
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
                onConfirm: closeCustomAlert
            });
        } else {
            setCustomAlert({
                visible: true,
                type: 'error',
                title: 'Error',
                message: 'No se pudo actualizar la foto. Inténtalo de nuevo.',
                onConfirm: closeCustomAlert
            });
        }
    };

    // Prepare images for ImageViewer
    const viewerImages = useMemo(() =>
        progressPhotos.map((photo) => ({ url: photo.url_foto })),
        [progressPhotos]
    );


    const styles = useMemo(() => StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
        headerText: { fontSize: 18, fontWeight: 'bold', color: colors.text },
        backButton: { padding: 8, marginLeft: -8 },
        scrollView: { flex: 1, padding: 16 },
        photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
        photoCard: { width: '48%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.surface, position: 'relative' },
        photoImage: { width: '100%', height: '100%' },
        monthTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 12, marginTop: 8 },
        selectedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(59,130,246,0.4)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.primary },
        photoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, backgroundColor: 'rgba(0,0,0,0.5)' },
        photoDate: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
        fab: { position: 'absolute', bottom: 24, right: 16, zIndex: 10 },
        fabButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingLeft: 16, paddingRight: 24, paddingVertical: 14, borderRadius: 28, elevation: 8 },
        fabText: { fontSize: 16, fontWeight: 'bold', color: colors.background, marginLeft: 8 },
        emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
        emptyStateText: { color: colors.textSecondary, marginTop: 16 },
        modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
        modalContent: { backgroundColor: colors.surface, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: colors.border },
        modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 16, textAlign: 'center' },
        label: { fontSize: 14, color: colors.textSecondary, marginBottom: 8 },
        input: { backgroundColor: colors.inputBackground, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, color: colors.text, marginBottom: 16 },
        previewImage: { width: 100, height: 100, borderRadius: 8, marginBottom: 20, alignSelf: 'center' },
        modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
        modalButton: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
        cancelButton: { backgroundColor: colors.inputBackground, borderWidth: 1, borderColor: colors.border },
        confirmButton: { backgroundColor: colors.primary },
        buttonText: { fontWeight: '600' },
        viewerContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
        viewerCloseButton: { position: 'absolute', top: 50, right: 20, zIndex: 100, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
        viewerImage: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.8 },
        viewerFooter: { position: 'absolute', bottom: 0, padding: 20, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', width: '100%', paddingBottom: 40 },
        viewerDateText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
        viewerCommentText: { color: '#ccc', fontSize: 14, marginTop: 4 },
        viewerCountText: { color: '#999', fontSize: 12, marginTop: 8 },
        selectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.primary },
        selectionText: { color: colors.background, fontWeight: 'bold', fontSize: 16 },
    }), [colors]);

    return (
        <SafeAreaView style={styles.container}>
            {isSelectionMode ? (
                <View style={styles.selectionHeader}>
                    <TouchableOpacity onPress={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }}>
                        <MaterialIcons name="close" size={24} color={colors.background} />
                    </TouchableOpacity>
                    <Text style={styles.selectionText}>{selectedIds.size} seleccionadas</Text>
                    <TouchableOpacity onPress={handleDeleteSelected}>
                        <MaterialIcons name="delete" size={24} color={colors.background} />
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>Cambio Físico</Text>
                    <View style={{ width: 24 }} />
                </View>
            )}

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView style={styles.scrollView}>
                    {/* Weight Evolution Chart */}
                    <WeightChart data={weightHistory} colors={colors} />

                    {progressPhotos.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialIcons name="photo-camera" size={64} color={colors.textSecondary} />
                            <Text style={styles.emptyStateText}>No hay fotos de progreso aún</Text>
                        </View>
                    ) : (
                        <View>
                            {(() => {
                                // Group photos by month
                                const grouped = progressPhotos.reduce((acc, photo) => {
                                    // Use created_at if valid, otherwise fallback to current date just in case
                                    const dateKey = photo.created_at ? format(parseISO(photo.created_at), 'MMMM yyyy', { locale: es }) : 'Desconocido';
                                    if (!acc[dateKey]) acc[dateKey] = [];
                                    acc[dateKey].push(photo);
                                    return acc;
                                }, {} as Record<string, typeof progressPhotos>);

                                return Object.entries(grouped).map(([month, photosArray]) => {
                                    const photos = photosArray as typeof progressPhotos;
                                    return (
                                        <View key={month}>
                                            <Text style={styles.monthTitle}>{month.charAt(0).toUpperCase() + month.slice(1)}</Text>
                                            <View style={styles.photoGrid}>
                                                {photos.map((photo) => {
                                                    const globalIndex = progressPhotos.findIndex(p => p.id === photo.id);
                                                    const isSelected = selectedIds.has(photo.id);
                                                    return (
                                                        <TouchableOpacity
                                                            key={photo.id}
                                                            style={styles.photoCard}
                                                            onPress={() => openViewer(globalIndex)}
                                                            onLongPress={() => handleLongPress(photo.id)}
                                                        >
                                                            <Image source={{ uri: photo.url_foto }} style={styles.photoImage} />
                                                            {isSelected && (
                                                                <View style={styles.selectedOverlay}>
                                                                    <MaterialIcons name="check-circle" size={32} color="#fff" />
                                                                </View>
                                                            )}
                                                            <View style={styles.photoOverlay}>
                                                                <Text style={styles.photoDate}>
                                                                    {photo.created_at ? format(parseISO(photo.created_at), "d 'de' MMMM", { locale: es }) : ''}
                                                                </Text>
                                                            </View>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        </View>
                                    );
                                });
                            })()}
                        </View>
                    )}
                    <View style={{ height: 100 }} />
                </ScrollView>
            )}

            {!isSelectionMode && (
                <TouchableOpacity style={styles.fab} onPress={handleAddPhoto}>
                    <View style={styles.fabButton}>
                        <MaterialIcons name="add-a-photo" size={24} color={colors.background} />
                        <Text style={styles.fabText}>Añadir Foto</Text>
                    </View>
                </TouchableOpacity>
            )}

            {/* Upload Modal */}
            <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Nueva Foto de Progreso</Text>
                        {selectedImageUri && <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />}

                        <Text style={styles.label}>Fecha de la foto</Text>
                        <TouchableOpacity
                            style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={{ color: colors.text }}>{format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}</Text>
                            <MaterialIcons name="calendar-today" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={selectedDate}
                                mode="date"
                                display="default"
                                onChange={(event, date) => {
                                    setShowDatePicker(false);
                                    if (date) {
                                        setSelectedDate(date);
                                    }
                                }}
                                maximumDate={new Date()}
                            />
                        )}

                        <Text style={styles.label}>Comentario (opcional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Añade un comentario..."
                            placeholderTextColor={colors.textSecondary}
                            value={comment}
                            onChangeText={setComment}
                            multiline
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                                <Text style={[styles.buttonText, { color: colors.text }]}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleConfirmUpload} disabled={uploading}>
                                {uploading ? <ActivityIndicator color={colors.background} /> : <Text style={[styles.buttonText, { color: colors.background }]}>Guardar</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Photo Viewer with Zoom */}
            <Modal visible={viewerVisible} transparent animationType="fade" onRequestClose={() => setViewerVisible(false)}>
                <View style={{ flex: 1, backgroundColor: '#000' }}>
                    <View style={{ position: 'absolute', top: 50, right: 20, zIndex: 100, flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity
                            style={{ padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 }}
                            onPress={handleEditPhoto}
                        >
                            <MaterialIcons name="edit" size={24} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 }}
                            onPress={() => setViewerVisible(false)}
                        >
                            <MaterialIcons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    {viewerImages.length > 0 && (
                        <ImageViewer
                            imageUrls={viewerImages}
                            index={currentPhotoIndex}
                            onChange={(index) => index !== undefined && setCurrentPhotoIndex(index)}
                            enableSwipeDown
                            onSwipeDown={() => setViewerVisible(false)}
                            backgroundColor="#000"
                            renderIndicator={() => <></>}
                        />
                    )}
                    <View style={styles.viewerFooter}>
                        <Text style={styles.viewerDateText}>
                            {progressPhotos[currentPhotoIndex]?.created_at ? new Date(progressPhotos[currentPhotoIndex].created_at).toLocaleDateString() : ''}
                        </Text>
                        {progressPhotos[currentPhotoIndex]?.comentario && (
                            <Text style={styles.viewerCommentText}>{progressPhotos[currentPhotoIndex].comentario}</Text>
                        )}
                        <Text style={styles.viewerCountText}>{currentPhotoIndex + 1} / {progressPhotos.length}</Text>
                    </View>
                </View>
            </Modal>

            {/* Edit Photo Modal */}
            <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Editar Detalles de Foto</Text>

                        <Text style={styles.label}>Fecha</Text>
                        <TouchableOpacity
                            style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                            onPress={() => {
                                Alert.alert('Cambiar Fecha', 'Selecciona una opción', [
                                    { text: 'Hoy', onPress: () => setEditDate(new Date()) },
                                    { text: 'Ayer', onPress: () => { const d = new Date(); d.setDate(d.getDate() - 1); setEditDate(d); } },
                                    { text: 'Hace 1 semana', onPress: () => { const d = new Date(); d.setDate(d.getDate() - 7); setEditDate(d); } },
                                    { text: 'Cancelar', style: 'cancel' },
                                ]);
                            }}
                        >
                            <Text style={{ color: colors.text }}>{editDate.toLocaleDateString()}</Text>
                            <MaterialIcons name="calendar-today" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>

                        <Text style={styles.label}>Comentario</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Añade un comentario..."
                            placeholderTextColor={colors.textSecondary}
                            value={editComment}
                            onChangeText={setEditComment}
                            multiline
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setEditModalVisible(false)}>
                                <Text style={[styles.buttonText, { color: colors.text }]}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleSaveEdit} disabled={saving}>
                                {saving ? <ActivityIndicator color={colors.background} /> : <Text style={[styles.buttonText, { color: colors.background }]}>Guardar</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Custom Alert Modal */}
            <Modal visible={customAlert.visible} transparent animationType="fade" onRequestClose={closeCustomAlert}>
                <View style={[styles.modalOverlay, { padding: 40 }]}>
                    <View style={[styles.modalContent, { maxWidth: 350 }]}>
                        <View style={{
                            width: 56, height: 56, borderRadius: 28, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
                            backgroundColor: customAlert.type === 'success' ? '#dcfce7' : customAlert.type === 'error' ? '#fee2e2' : '#fef3c7'
                        }}>
                            <MaterialIcons
                                name={customAlert.type === 'success' ? 'check' : customAlert.type === 'error' ? 'close' : 'warning'}
                                size={32}
                                color={customAlert.type === 'success' ? '#22c55e' : customAlert.type === 'error' ? '#ef4444' : '#f59e0b'}
                            />
                        </View>
                        <Text style={[styles.modalTitle, { textAlign: 'center' }]}>{customAlert.title}</Text>
                        <Text style={{ fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
                            {customAlert.message}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            {customAlert.type === 'warning' && (
                                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={customAlert.onCancel}>
                                    <MaterialIcons name="close" size={24} color={colors.text} style={{ alignSelf: 'center' }} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.modalButton, {
                                    backgroundColor: customAlert.type === 'warning' ? '#ef4444' : colors.primary,
                                    justifyContent: 'center', alignItems: 'center'
                                }]}
                                onPress={customAlert.onConfirm}
                            >
                                <MaterialIcons name="check" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
};

export default PhysicalProgressScreen;

