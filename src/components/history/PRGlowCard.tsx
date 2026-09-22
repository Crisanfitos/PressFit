import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import type { PRHighlight } from '../../utils/progressHighlights';

export interface PRGlowCardProps {
    pr: PRHighlight;
    onPressShare?: () => void;
    testID?: string;
}

export const PRGlowCard: React.FC<PRGlowCardProps> = ({
    pr,
    onPressShare,
    testID = 'progress-pr-glow-card',
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { colors } = theme;

    const styles = useMemo(
        () =>
            StyleSheet.create({
                card: {
                    backgroundColor: colors.surface,
                    marginHorizontal: 16,
                    marginTop: 16,
                    marginBottom: 8,
                    borderRadius: 18,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.primary,
                    borderLeftWidth: 4,
                    borderLeftColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 3,
                },
                badgeRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 8,
                },
                badge: {
                    backgroundColor: colors.primary,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                },
                badgeText: {
                    fontSize: 10,
                    fontWeight: '800',
                    color: '#FFFFFF',
                    letterSpacing: 0.5,
                },
                title: {
                    fontSize: 20,
                    fontWeight: '800',
                    color: colors.text,
                    marginTop: 4,
                    fontVariant: ['tabular-nums'],
                },
                subtitle: {
                    fontSize: 13,
                    color: colors.textSecondary,
                    marginTop: 4,
                },
                footer: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 12,
                },
                dateText: {
                    fontSize: 12,
                    color: colors.textSecondary,
                },
                shareButton: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: `${colors.primary}1A`,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    gap: 6,
                },
                shareText: {
                    fontSize: 13,
                    fontWeight: '700',
                    color: colors.primary,
                },
            }),
        [colors]
    );

    return (
        <View style={styles.card} testID={testID}>
            <View style={styles.badgeRow}>
                <MaterialIcons name="emoji-events" size={20} color={colors.primary} />
                <View style={{ width: 8 }} />
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {t('progress.newPR', 'NUEVO RÉCORD PERSONAL (PR)')}
                    </Text>
                </View>
            </View>
            <Text style={styles.title} testID={`${testID}-value`}>
                {`${pr.exerciseName}: ${pr.weight} kg × ${pr.reps} reps`}
            </Text>
            <Text style={styles.subtitle}>
                {pr.isOfficialPR
                    ? t('progress.prOfficial', 'Récord oficial registrado en tu historial.')
                    : t('progress.prWeeklyBest', 'Tu mejor marca de la semana.')}
            </Text>
            <View style={styles.footer}>
                <Text style={styles.dateText}>
                    {pr.dateKey || t('progress.thisWeek', 'Esta semana')}
                </Text>
                <TouchableOpacity
                    style={styles.shareButton}
                    onPress={onPressShare}
                    testID={`${testID}-share-button`}
                    accessibilityRole="button"
                >
                    <MaterialIcons name="share" size={16} color={colors.primary} />
                    <Text style={styles.shareText}>
                        {t('progress.shareAchievement', 'Compartir logro')}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default PRGlowCard;
