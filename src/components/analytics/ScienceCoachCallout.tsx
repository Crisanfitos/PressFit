import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';

export interface ScienceCoachCalloutProps {
    title: string;
    message: string;
    ctaLabel: string;
    onPressCta?: () => void;
    testID?: string;
}

export const ScienceCoachCallout: React.FC<ScienceCoachCalloutProps> = ({
    title,
    message,
    ctaLabel,
    onPressCta,
    testID = 'hypertrophy-coach-callout',
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
                    marginBottom: 16,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderLeftWidth: 4,
                    borderLeftColor: colors.primary,
                },
                headerRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 8,
                },
                iconBadge: {
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: `${colors.primary}20`,
                    marginRight: 10,
                },
                title: {
                    fontSize: 14,
                    fontWeight: '700',
                    color: colors.text,
                    flex: 1,
                },
                message: {
                    fontSize: 13,
                    color: colors.textSecondary,
                    lineHeight: 19,
                    marginBottom: 12,
                },
                cta: {
                    alignSelf: 'flex-start',
                    backgroundColor: colors.primary,
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 10,
                },
                ctaText: {
                    fontSize: 13,
                    fontWeight: '700',
                    color: '#FFFFFF',
                },
            }),
        [colors]
    );

    return (
        <View style={styles.card} testID={testID}>
            <View style={styles.headerRow}>
                <View style={styles.iconBadge}>
                    <MaterialIcons name="military-tech" size={18} color={colors.primary} />
                </View>
                <Text style={styles.title}>{title}</Text>
            </View>
            <Text style={styles.message} testID={`${testID}-message`}>
                {message}
            </Text>
            <TouchableOpacity
                style={styles.cta}
                onPress={onPressCta}
                testID={`${testID}-cta`}
                accessibilityRole="button"
                accessibilityLabel={t('progress.hypertrophyAdjustVolume', ctaLabel)}
            >
                <Text style={styles.ctaText}>
                    {t('progress.hypertrophyAdjustVolume', ctaLabel)}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default ScienceCoachCallout;
