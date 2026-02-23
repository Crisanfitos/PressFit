import { useState, useEffect, useCallback } from 'react';
import { UserService } from '../services/UserService';
import { ProgressService } from '../services/ProgressService';

interface Metrics {
    peso?: number;
    altura?: number;
    imc?: number;
    grasa_corporal?: number;
}

interface User {
    id: string;
    email?: string;
    user_metadata?: {
        full_name?: string;
        avatar_url?: string;
        custom_avatar_url?: string;
    };
}

export const useProfileController = (user: User | null | undefined) => {
    const [profile, setProfile] = useState<User | null>(null);
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [progressPhotos, setProgressPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingPhotos, setLoadingPhotos] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    const fetchProfileData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data: metricsData } = await UserService.getUserMetrics(user.id);
            setMetrics(metricsData);
            setProfile(user);
        } catch (error) {
            console.error('Error fetching profile data:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const fetchPhotos = useCallback(async () => {
        if (!user) return;
        setLoadingPhotos(true);
        try {
            const { data } = await ProgressService.getProgressPhotos(user.id);
            setProgressPhotos(data || []);
        } catch (error) {
            console.error('Error fetching photos:', error);
        } finally {
            setLoadingPhotos(false);
        }
    }, [user]);

    useEffect(() => {
        fetchProfileData();
        fetchPhotos();
    }, [fetchProfileData, fetchPhotos]);

    const updateMetrics = async (newMetrics: { weight: number; height: number; bodyFatPercentage?: number }) => {
        if (!user) return;
        try {
            const heightM = newMetrics.height / 100;
            const imc = parseFloat((newMetrics.weight / (heightM * heightM)).toFixed(1));

            let bf = newMetrics.bodyFatPercentage;
            if (bf === null || bf === undefined) {
                if (!isNaN(imc)) {
                    bf = parseFloat((1.2 * imc - 10.45).toFixed(1));
                }
            }

            const metricsToSave = { ...newMetrics, imc, bodyFatPercentage: bf };
            const { data, error } = await UserService.saveUserMetrics(user.id, metricsToSave);
            if (error) throw error;
            setMetrics(data);
            return data;
        } catch (error) {
            throw error;
        }
    };

    const updateProfilePhoto = async (uri: string) => {
        if (!user) return;
        setUploadingPhoto(true);
        try {
            const { url, error } = await UserService.uploadProfilePhoto(user.id, uri);
            if (error) throw error;
            return url;
        } catch (error) {
            console.error('Error updating profile photo:', error);
            throw error;
        } finally {
            setUploadingPhoto(false);
        }
    };

    const addProgressPhoto = async (uri: string) => {
        if (!user) return;
        setUploadingPhoto(true);
        try {
            const { data, error } = await ProgressService.uploadProgressPhoto(user.id, uri, new Date(), '');
            if (error) throw error;
            await fetchPhotos();
            return data;
        } catch (error) {
            console.error('Error adding progress photo:', error);
            throw error;
        } finally {
            setUploadingPhoto(false);
        }
    };

    const calculateBodyFat = () => {
        if (!metrics?.peso || !metrics?.altura) return null;
        const heightM = metrics.altura / 100;
        const bmi = metrics.peso / (heightM * heightM);
        if (metrics.grasa_corporal) return metrics.grasa_corporal;
        return (1.2 * bmi - 10.45).toFixed(1);
    };

    return {
        profile,
        metrics,
        progressPhotos,
        loading,
        loadingPhotos,
        uploadingPhoto,
        updateMetrics,
        updateProfilePhoto,
        addProgressPhoto,
        bodyFatPercentage: calculateBodyFat(),
    };
};
