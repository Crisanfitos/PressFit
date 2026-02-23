import React, { useContext, useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useProfileController } from '../controllers/useProfileController';
import EditProfileModal from '../components/EditProfileModal';

type ProfileScreenProps = { navigation: any };

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
    const authContext = useContext(AuthContext);
    const { signOut, user } = authContext || {};
    const { theme, themeMode, toggleTheme } = useTheme();
    const { colors } = theme;

    const { metrics, progressPhotos, loading, loadingPhotos, uploadingPhoto, updateProfilePhoto, updateMetrics } = useProfileController(user);
    const [showEditModal, setShowEditModal] = useState(false);

    const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.user_metadata?.custom_avatar_url || user?.user_metadata?.avatar_url || null);

    useEffect(() => {
        if (user?.user_metadata?.custom_avatar_url) {
            setProfilePhoto(user.user_metadata.custom_avatar_url);
        }
    }, [user]);

    const handlePhotoSelection = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
            try {
                const url = await updateProfilePhoto(result.assets[0].uri);
                if (url) setProfilePhoto(url);
                Alert.alert('Éxito', 'Foto de perfil actualizada');
            } catch (error) {
                Alert.alert('Error', 'No se pudo subir la foto');
            }
        }
    };

    const physicalData = [
        { label: 'Peso', value: metrics?.peso ? `${metrics.peso} kg` : '--' },
        { label: 'Altura', value: metrics?.altura ? `${metrics.altura} cm` : '--' },
        { label: 'IMC', value: metrics?.imc ? Number(metrics.imc).toFixed(1) : '--' },
        { label: 'Grasa Corporal', value: metrics?.grasa_corporal ? `${metrics.grasa_corporal}%` : '--', isEstimated: true },
    ];

    const styles = useMemo(() => StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
        header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
        headerText: { fontSize: 18, fontWeight: 'bold', color: colors.text },
        scrollView: { padding: 16 },
        profileInfo: { alignItems: 'center', gap: 8, marginBottom: 24 },
        avatarContainer: { position: 'relative' },
        avatar: { height: 96, width: 96, borderRadius: 48, backgroundColor: colors.surface },
        cameraIconContainer: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.primary, borderRadius: 16, width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.background },
        userName: { fontSize: 24, fontWeight: 'bold', color: colors.text },
        userEmail: { fontSize: 14, color: colors.textSecondary },
        section: { marginTop: 24 },
        sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 16 },
        dataGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
        dataCard: { width: '47%', borderRadius: 12, backgroundColor: colors.surface, padding: 16, borderWidth: 1, borderColor: colors.border },
        dataLabel: { fontSize: 14, color: colors.textSecondary },
        dataValue: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginTop: 4 },
        estimatedText: { fontSize: 10, color: '#f59e0b', marginTop: 2 },
        settingCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border },
        settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
        settingTextContainer: { flex: 1 },
        settingLabel: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 2 },
        settingDescription: { fontSize: 14, color: colors.textSecondary },
        photosContainer: { flexDirection: 'row', gap: 8, marginBottom: 16 },
        photoWrapper: { width: '23%', aspectRatio: 1, borderRadius: 8, overflow: 'hidden' },
        progressPhoto: { width: '100%', height: '100%' },
        viewProgressButton: { width: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: 'row', gap: 8 },
        viewProgressButtonText: { fontWeight: 'bold', color: colors.primary },
        logoutSection: { marginTop: 32, marginBottom: 24 },
        logoutButton: { width: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#ef4444', padding: 16, flexDirection: 'row', gap: 8 },
        logoutButtonText: { fontWeight: 'bold', color: '#ef4444' },
        noPhotosText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', paddingVertical: 20, flex: 1 },
    }), [colors]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Perfil</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView style={styles.scrollView}>
                    <View style={styles.profileInfo}>
                        <TouchableOpacity onPress={handlePhotoSelection} style={styles.avatarContainer}>
                            <Image
                                source={{ uri: profilePhoto || 'https://via.placeholder.com/96' }}
                                style={styles.avatar}
                            />
                            <View style={styles.cameraIconContainer}>
                                {uploadingPhoto ? (
                                    <ActivityIndicator size="small" color={colors.background} />
                                ) : (
                                    <MaterialIcons name="camera-alt" size={18} color={colors.background} />
                                )}
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.userName}>{user?.user_metadata?.full_name || user?.email || 'Usuario'}</Text>
                        <Text style={styles.userEmail}>{user?.email}</Text>
                    </View>

                    <View style={styles.section}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={styles.sectionTitle}>Datos Físicos</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(true)} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                                <MaterialIcons name="edit" size={20} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.dataGrid}>
                            {physicalData.map((item, index) => (
                                <View key={index} style={styles.dataCard}>
                                    <Text style={styles.dataLabel}>{item.label}</Text>
                                    <Text style={styles.dataValue}>{item.value}</Text>
                                    {item.isEstimated && <Text style={styles.estimatedText}>Estimado ±10%</Text>}
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Apariencia</Text>
                        <View style={styles.settingCard}>
                            <View style={styles.settingRow}>
                                <MaterialIcons name={themeMode === 'dark' ? 'dark-mode' : 'light-mode'} size={24} color={colors.textSecondary} />
                                <View style={styles.settingTextContainer}>
                                    <Text style={styles.settingLabel}>Modo Oscuro</Text>
                                    <Text style={styles.settingDescription}>{themeMode === 'dark' ? 'Activado' : 'Desactivado'}</Text>
                                </View>
                                <Switch
                                    value={themeMode === 'dark'}
                                    onValueChange={toggleTheme}
                                    trackColor={{ false: colors.border, true: `${colors.primary}50` }}
                                    thumbColor={themeMode === 'dark' ? colors.primary : colors.textSecondary}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Fotos de Progreso</Text>
                        <View style={styles.photosContainer}>
                            {loadingPhotos ? (
                                <Text style={styles.noPhotosText}>Cargando fotos...</Text>
                            ) : progressPhotos.length > 0 ? (
                                progressPhotos.slice(0, 4).map((photo, index) => (
                                    <View key={index} style={styles.photoWrapper}>
                                        <Image source={{ uri: photo.url_foto }} style={styles.progressPhoto} />
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.noPhotosText}>No hay fotos de progreso aún</Text>
                            )}
                        </View>
                        <TouchableOpacity style={styles.viewProgressButton} onPress={() => navigation.navigate('PhysicalProgress')}>
                            <MaterialIcons name="photo-library" size={24} color={colors.primary} />
                            <Text style={styles.viewProgressButtonText}>Ver Cambio Físico</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.logoutSection}>
                        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
                            <MaterialIcons name="logout" size={24} color="#ef4444" />
                            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}

            <EditProfileModal
                visible={showEditModal}
                onClose={() => setShowEditModal(false)}
                currentMetrics={metrics}
                onSave={async (data) => {
                    await updateMetrics({
                        ...data,
                        bodyFatPercentage: data.bodyFatPercentage ?? undefined
                    });
                    Alert.alert('Éxito', 'Datos actualizados correctamente');
                }}
            />
        </SafeAreaView>
    );
};

export default ProfileScreen;
