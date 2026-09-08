import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import {
    HypertrophyThresholds,
    assessMuscleHypertrophy,
    normalizeMuscleKey,
} from '../../utils/hypertrophyLandmarks';

export interface MuscleVolumeBarProps {
    muscle: string;
    effectiveSets: number;
    thresholds?: HypertrophyThresholds;
    testID?: string;
}

export const MuscleVolumeBar: React.FC<MuscleVolumeBarProps> = ({
    muscle,
    effectiveSets,
    testID,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { colors } = theme;

    const assessment = useMemo(() => {
        return assessMuscleHypertrophy(muscle, effectiveSets);
    }, [muscle, effectiveSets]);

    const { thresholds, status, statusColor, progressPercentage } = assessment;

    // Localized label and description
    const statusLabel = useMemo(() => {
        switch (status) {
            case 'below_mv':
                return t('hypertrophy.statusBelowMV', 'Bajo Mantenimiento (< MV)');
            case 'maintenance':
                return t('hypertrophy.statusMaintenance', 'Mantenimiento (MV)');
            case 'optimal':
                return t('hypertrophy.statusOptimal', 'Óptimo (MAV)');
            case 'warning':
                return t('hypertrophy.statusWarning', 'Cerca de MRV');
            case 'overtraining':
                return t('hypertrophy.statusOvertraining', 'Sobreentrenamiento (> MRV)');
            default:
                return assessment.statusLabel;
        }
    }, [status, t, assessment.statusLabel]);

    const statusDesc = useMemo(() => {
        switch (status) {
            case 'below_mv':
                return t('hypertrophy.descBelowMV', 'Volumen insuficiente para mantener masa muscular.');
            case 'maintenance':
                return t('hypertrophy.descMaintenance', 'Volumen adecuado para mantener masa muscular.');
            case 'optimal':
                return t('hypertrophy.descOptimal', 'Rango óptimo para maximizar crecimiento muscular.');
            case 'warning':
                return t('hypertrophy.descWarning', 'Volumen muy alto. Cerca del límite de recuperación.');
            case 'overtraining':
                return t('hypertrophy.descOvertraining', 'Has superado el volumen máximo recuperable.');
            default:
                return assessment.statusDescription;
        }
    }, [status, t, assessment.statusDescription]);

    const safeTestId = testID || `muscle-volume-bar-${normalizeMuscleKey(muscle)}`;

    const styles = useMemo(
        () =>
            StyleSheet.create({
                card: {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 14,
                    padding: 16,
                    marginBottom: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                },
                header: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                },
                muscleTitle: {
                    fontSize: 16,
                    fontWeight: '700',
                    color: colors.text,
                    textTransform: 'capitalize',
                },
                badge: {
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 12,
                    backgroundColor: `${statusColor}22`,
                },
                badgeText: {
                    fontSize: 12,
                    fontWeight: '600',
                    color: statusColor,
                },
                setsRow: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 8,
                },
                setsCount: {
                    fontSize: 20,
                    fontWeight: '800',
                    color: colors.text,
                },
                setsLabel: {
                    fontSize: 13,
                    fontWeight: '500',
                    color: colors.textSecondary,
                },
                progressBarTrack: {
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: colors.border,
                    overflow: 'hidden',
                    position: 'relative',
                    marginBottom: 8,
                },
                progressBarFill: {
                    height: '100%',
                    borderRadius: 5,
                    backgroundColor: statusColor,
                    width: `${progressPercentage}%`,
                },
                landmarksRow: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginTop: 2,
                    marginBottom: 6,
                },
                landmarkItem: {
                    alignItems: 'center',
                },
                landmarkLabel: {
                    fontSize: 10,
                    fontWeight: '600',
                    color: colors.textSecondary,
                },
                landmarkValue: {
                    fontSize: 10,
                    color: colors.textSecondary,
                },
                descriptionText: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginTop: 4,
                },
            }),
        [colors, statusColor, progressPercentage]
    );

    return (
        <View style={styles.card} testID={safeTestId}>
            <View style={styles.header}>
                <Text style={styles.muscleTitle}>{muscle}</Text>
                <View style={styles.badge} testID={`${safeTestId}-badge`}>
                    <Text style={styles.badgeText}>{statusLabel}</Text>
                </View>
            </View>

            <View style={styles.setsRow}>
                <Text style={styles.setsCount} testID={`${safeTestId}-count`}>
                    {effectiveSets}{' '}
                    <Text style={styles.setsLabel}>
                        {t('workout.sets', 'series').toLowerCase()}
                    </Text>
                </Text>
                <Text style={styles.setsLabel}>
                    MAV: {thresholds.mavMin}-{thresholds.mavMax} | MRV: {thresholds.mrv}
                </Text>
            </View>

            <View style={styles.progressBarTrack} testID={`${safeTestId}-track`}>
                <View style={styles.progressBarFill} testID={`${safeTestId}-fill`} />
            </View>

            <View style={styles.landmarksRow}>
                <View style={styles.landmarkItem}>
                    <Text style={styles.landmarkLabel}>MV</Text>
                    <Text style={styles.landmarkValue}>{thresholds.mv}</Text>
                </View>
                <View style={styles.landmarkItem}>
                    <Text style={styles.landmarkLabel}>MEV</Text>
                    <Text style={styles.landmarkValue}>{thresholds.mev}</Text>
                </View>
                <View style={styles.landmarkItem}>
                    <Text style={styles.landmarkLabel}>MAV</Text>
                    <Text style={styles.landmarkValue}>
                        {thresholds.mavMin}-{thresholds.mavMax}
                    </Text>
                </View>
                <View style={styles.landmarkItem}>
                    <Text style={styles.landmarkLabel}>MRV</Text>
                    <Text style={styles.landmarkValue}>{thresholds.mrv}</Text>
                </View>
            </View>

            <Text style={styles.descriptionText} testID={`${safeTestId}-desc`}>
                {statusDesc}
            </Text>
        </View>
    );
};

export default MuscleVolumeBar;
