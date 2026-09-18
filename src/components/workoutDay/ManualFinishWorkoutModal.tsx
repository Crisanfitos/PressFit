import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import KeyboardAwareContainer from '../KeyboardAwareContainer';

export interface ManualFinishWorkoutModalProps {
    visible: boolean;
    dayName?: string;
    startTime?: string | null;
    workoutDate?: Date | string;
    initialEndTime?: Date;
    onClose: () => void;
    onConfirm: (endTime: Date) => Promise<{ success: boolean; error?: string } | boolean>;
}

export const ManualFinishWorkoutModal: React.FC<ManualFinishWorkoutModalProps> = ({
    visible,
    dayName,
    startTime,
    workoutDate,
    initialEndTime,
    onClose,
    onConfirm,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { colors, isDark } = theme;

    const startDate = useMemo(() => {
        if (!startTime) return new Date();
        const parsed = new Date(startTime);
        return isNaN(parsed.getTime()) ? new Date() : parsed;
    }, [startTime]);

    const calculatedInitialEndTime = useMemo(() => {
        if (initialEndTime) return initialEndTime;
        // Default to 1 hour after start time
        return new Date(startDate.getTime() + 60 * 60 * 1000);
    }, [initialEndTime, startDate]);

    const [selectedTime, setSelectedTime] = useState<Date>(() => calculatedInitialEndTime);
    const [showPicker, setShowPicker] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (visible) {
            setSelectedTime(calculatedInitialEndTime);
            setSaveError(null);
        }
    }, [visible, calculatedInitialEndTime]);

    const isInvalidTime = selectedTime.getTime() - startDate.getTime() < 60 * 1000;
    const errorMessage = isInvalidTime
        ? t(
              'workout.invalidEndTimeMinDuration',
              'La hora final debe ser como mínimo un minuto posterior a la hora inicial.'
          )
        : saveError;

    const handleTimeChange = (_event: any, date?: Date) => {
        setShowPicker(false);
        if (date) {
            const newDate = new Date(startDate);
            newDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
            setSelectedTime(newDate);
            setSaveError(null);
        }
    };

    const adjustMinutes = (delta: number) => {
        setSelectedTime((prev) => new Date(prev.getTime() + delta * 60 * 1000));
        setSaveError(null);
    };

    const formatTimeOnly = (d: Date) => {
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const handleSave = async () => {
        if (isInvalidTime) {
            return;
        }
        setLoading(true);
        setSaveError(null);
        try {
            const res = await onConfirm(selectedTime);
            if (typeof res === 'object' && !res.success) {
                setSaveError(res.error || t('common.error', 'Error al guardar'));
                setLoading(false);
            } else {
                onClose();
            }
        } catch (err: any) {
            setSaveError(err?.message || t('common.error', 'Error al guardar'));
            setLoading(false);
        }
    };

    const styles = useMemo(
        () =>
            StyleSheet.create({
                modalOverlay: {
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 20,
                },
                modalContent: {
                    width: '100%',
                    maxWidth: 400,
                    borderRadius: 20,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                    padding: 24,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 16,
                    elevation: 10,
                },
                modalHeader: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                },
                title: {
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: colors.text,
                    flex: 1,
                },
                closeButton: {
                    padding: 4,
                    marginLeft: 8,
                },
                infoBox: {
                    backgroundColor: `${colors.primary}15`,
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 20,
                    borderLeftWidth: 4,
                    borderLeftColor: colors.primary,
                },
                infoTitle: {
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: 4,
                },
                infoText: {
                    fontSize: 13,
                    color: colors.textSecondary,
                },
                fieldLabel: {
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.textSecondary,
                    marginBottom: 8,
                },
                timeSelectorContainer: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 14,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    marginBottom: 12,
                },
                stepperButton: {
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: `${colors.primary}25`,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                timeDisplayButton: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                },
                timeDisplayText: {
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: colors.text,
                },
                errorContainer: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 4,
                    marginBottom: 16,
                },
                errorText: {
                    fontSize: 13,
                    color: colors.statusError,
                    flex: 1,
                },
                actionRow: {
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    gap: 12,
                    marginTop: 12,
                },
                cancelButton: {
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                cancelText: {
                    fontSize: 15,
                    fontWeight: '600',
                    color: colors.textSecondary,
                },
                confirmButton: {
                    backgroundColor: colors.primary,
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                },
                confirmText: {
                    fontSize: 15,
                    fontWeight: 'bold',
                    color: colors.background,
                },
            }),
        [colors]
    );

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            testID="manual-finish-modal"
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.title} testID="manual-finish-modal-title">
                            {t('workout.manualFinishTitle', 'Finalizar Rutina Pendiente')}
                        </Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                            testID="manual-finish-modal-close"
                        >
                            <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Pending Routine Details */}
                    <View style={styles.infoBox} testID="pending-routine-details-box">
                        <Text style={styles.infoTitle}>
                            {dayName || t('workout.routine', 'Rutina')}
                        </Text>
                        <Text style={styles.infoText} testID="pending-workout-modal-start-time">
                            {t('workout.startedAt', 'Hora de inicio')}: {formatTimeOnly(startDate)}
                        </Text>
                    </View>

                    {/* Time Selector */}
                    <Text style={styles.fieldLabel}>
                        {t('workout.selectEndTime', 'Hora de finalización')}:
                    </Text>

                    <View style={styles.timeSelectorContainer}>
                        <TouchableOpacity
                            style={styles.stepperButton}
                            onPress={() => adjustMinutes(-15)}
                            testID="decrease-time-15min"
                            accessibilityLabel="Restar 15 minutos"
                        >
                            <MaterialIcons name="remove" size={20} color={colors.primary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.timeDisplayButton}
                            onPress={() => setShowPicker(true)}
                            testID="manual-finish-time-button"
                        >
                            <MaterialIcons name="access-time" size={22} color={colors.primary} />
                            <Text style={styles.timeDisplayText} testID="manual-finish-time-text">
                                {formatTimeOnly(selectedTime)}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.stepperButton}
                            onPress={() => adjustMinutes(15)}
                            testID="increase-time-15min"
                            accessibilityLabel="Sumar 15 minutos"
                        >
                            <MaterialIcons name="add" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {showPicker && (
                        <DateTimePicker
                            value={selectedTime}
                            mode="time"
                            is24Hour={true}
                            display="spinner"
                            onChange={handleTimeChange}
                            testID="manual-finish-time-picker"
                            themeVariant={isDark ? 'dark' : 'light'}
                            textColor={colors.text}
                            accentColor={colors.primary}
                        />
                    )}

                    {/* Validation Error */}
                    {errorMessage && (
                        <View style={styles.errorContainer} testID="time-validation-error">
                            <MaterialIcons name="error-outline" size={18} color={colors.statusError} />
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                            disabled={loading}
                            testID="manual-finish-cancel-button"
                        >
                            <Text style={styles.cancelText}>{t('common.cancel', 'Cancelar')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.confirmButton,
                                (Boolean(errorMessage) || loading) && { opacity: 0.7 },
                            ]}
                            onPress={handleSave}
                            disabled={loading}
                            testID="manual-finish-confirm-button"
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color={colors.background} />
                            ) : (
                                <>
                                    <MaterialIcons
                                        name="check-circle"
                                        size={18}
                                        color={colors.background}
                                    />
                                    <Text style={styles.confirmText}>
                                        {t('workout.saveAndComplete', 'Guardar y Finalizar')}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
