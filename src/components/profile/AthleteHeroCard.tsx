import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';

export interface AthleteHeroCardProps {
    displayName: string;
    email?: string;
    photoUri?: string | null;
    primaryMetricValue: string;
    primaryMetricLabel: string;
    secondaryMetricValue: string;
    secondaryMetricLabel: string;
    onPressAvatar?: () => void;
    avatarActionIcon?: React.ReactNode;
    testID?: string;
}

function initialsOf(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'PF';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const AthleteHeroCard: React.FC<AthleteHeroCardProps> = ({
    displayName,
    email,
    photoUri,
    primaryMetricValue,
    primaryMetricLabel,
    secondaryMetricValue,
    secondaryMetricLabel,
    onPressAvatar,
    avatarActionIcon,
    testID = 'profile-athlete-hero',
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { colors } = theme;

    const styles = useMemo(
        () =>
            StyleSheet.create({
                card: {
                    backgroundColor: colors.surface,
                    borderRadius: 20,
                    padding: 18,
                    borderWidth: 1,
                    borderColor: colors.primary,
                    marginBottom: 16,
                },
                topRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
                avatar: { height: 64, width: 64, borderRadius: 32, backgroundColor: `${colors.primary}20` },
                avatarAction: {
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: colors.surface,
                },
                avatarFallback: {
                    height: 64,
                    width: 64,
                    borderRadius: 32,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                avatarInitials: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
                nameBlock: { flex: 1 },
                name: { fontSize: 19, fontWeight: '800', color: colors.text },
                email: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
                badgeRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 6,
                    gap: 4,
                },
                badgeText: { fontSize: 12, fontWeight: '700', color: colors.primary },
                metricsRow: { flexDirection: 'row', marginTop: 14, gap: 10 },
                metricCard: {
                    flex: 1,
                    backgroundColor: colors.background,
                    borderRadius: 14,
                    padding: 12,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                metricValue: { fontSize: 22, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
                metricLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
            }),
        [colors]
    );

    return (
        <View style={styles.card} testID={testID}>
            <View style={styles.topRow}>
                <TouchableOpacity
                    onPress={onPressAvatar}
                    disabled={!onPressAvatar}
                    testID={`${testID}-avatar-button`}
                >
                    <View>
                        {photoUri ? (
                            <Image source={{ uri: photoUri }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarFallback}>
                                <Text style={styles.avatarInitials}>{initialsOf(displayName)}</Text>
                            </View>
                        )}
                        {!!avatarActionIcon && <View style={styles.avatarAction}>{avatarActionIcon}</View>}
                    </View>
                </TouchableOpacity>
                <View style={styles.nameBlock}>
                    <Text style={styles.name}>{displayName}</Text>
                    {!!email && <Text style={styles.email}>{email}</Text>}
                    <View style={styles.badgeRow}>
                        <MaterialIcons name="verified" size={15} color={colors.primary} />
                        <Text style={styles.badgeText}>
                            {t('profile.cloudAthlete', 'Atleta PressFit Cloud')}
                        </Text>
                    </View>
                </View>
            </View>
            <View style={styles.metricsRow}>
                <View style={styles.metricCard} testID={`${testID}-metric-primary`}>
                    <Text style={styles.metricValue}>{primaryMetricValue}</Text>
                    <Text style={styles.metricLabel}>{primaryMetricLabel}</Text>
                </View>
                <View style={styles.metricCard} testID={`${testID}-metric-secondary`}>
                    <Text style={styles.metricValue}>{secondaryMetricValue}</Text>
                    <Text style={styles.metricLabel}>{secondaryMetricLabel}</Text>
                </View>
            </View>
        </View>
    );
};

export default AthleteHeroCard;
