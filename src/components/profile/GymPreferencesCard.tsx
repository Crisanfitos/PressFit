import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { REST_PRESETS, type GymPreferences, type WeightUnit } from '../../utils/gymPreferences';

export interface GymPreferencesCardProps {
    prefs: GymPreferences;
    onChange: (patch: Partial<GymPreferences>) => void;
    onOpenPlates: () => void;
    testID?: string;
}

export const GymPreferencesCard: React.FC<GymPreferencesCardProps> = ({
    prefs,
    onChange,
    onOpenPlates,
    testID = 'profile-gym-prefs',
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { colors } = theme;

    const styles = useMemo(
        () =>
            StyleSheet.create({
                card: {
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    marginBottom: 16,
                },
                title: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 },
                rowLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
                segmented: { flexDirection: 'row', gap: 8, marginBottom: 14 },
                segment: {
                    flex: 1,
                    paddingVertical: 9,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: 'center',
                    backgroundColor: colors.background,
                },
                segmentActive: { backgroundColor: colors.primary, borderColor: colors.primary },
                segmentText: { fontSize: 13, fontWeight: '700', color: colors.text },
                segmentTextActive: { color: '#FFFFFF' },
                presetRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
                switchRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 8,
                },
                switchLabel: { fontSize: 14, color: colors.text, fontWeight: '600' },
                divider: { height: 1, backgroundColor: colors.border, marginVertical: 6 },
                plateRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 8,
                    gap: 12,
                },
                plateTextBlock: { flex: 1 },
                plateTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
                plateDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
            }),
        [colors]
    );

    const setUnit = (unit: WeightUnit) => onChange({ weightUnit: unit });

    return (
        <View style={styles.card} testID={testID}>
            <Text style={styles.title}>
                {t('profile.gymPrefs', 'Preferencias de gimnasio')}
            </Text>

            <Text style={styles.rowLabel}>{t('profile.weightUnit', 'Unidad de peso')}</Text>
            <View style={styles.segmented}>
                {(['kg', 'lb'] as WeightUnit[]).map((u) => {
                    const active = prefs.weightUnit === u;
                    return (
                        <TouchableOpacity
                            key={u}
                            style={[styles.segment, active && styles.segmentActive]}
                            onPress={() => setUnit(u)}
                            testID={`${testID}-unit-${u}`}
                        >
                            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                                {u.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <Text style={styles.rowLabel}>
                {t('profile.defaultRest', 'Descanso por defecto')}
            </Text>
            <View style={styles.presetRow}>
                {REST_PRESETS.map((sec) => {
                    const active = prefs.defaultRestSec === sec;
                    return (
                        <TouchableOpacity
                            key={sec}
                            style={[styles.segment, active && styles.segmentActive]}
                            onPress={() => onChange({ defaultRestSec: sec })}
                            testID={`${testID}-rest-${sec}`}
                        >
                            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                                {`${sec}s`}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>
                    {t('profile.restSound', 'Sonido al finalizar descanso')}
                </Text>
                <Switch
                    value={prefs.restSound}
                    onValueChange={(v) => onChange({ restSound: v })}
                    testID={`${testID}-sound-switch`}
                    trackColor={{ false: colors.border, true: `${colors.primary}50` }}
                    thumbColor={prefs.restSound ? colors.primary : colors.textSecondary}
                />
            </View>
            <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>
                    {t('profile.restVibration', 'Vibración táctil')}
                </Text>
                <Switch
                    value={prefs.restVibration}
                    onValueChange={(v) => onChange({ restVibration: v })}
                    testID={`${testID}-vibration-switch`}
                    trackColor={{ false: colors.border, true: `${colors.primary}50` }}
                    thumbColor={prefs.restVibration ? colors.primary : colors.textSecondary}
                />
            </View>

            <View style={styles.divider} />
            <TouchableOpacity
                style={styles.plateRow}
                onPress={onOpenPlates}
                testID="plate-settings-navigation-button"
            >
                <MaterialIcons name="fitness-center" size={22} color={colors.textSecondary} />
                <View style={styles.plateTextBlock}>
                    <Text style={styles.plateTitle}>
                        {t('profile.plateSettings', 'Discos y Barras')}
                    </Text>
                    <Text style={styles.plateDesc}>
                        {t('profile.plateSettingsDesc', 'Configura tu barra e inventario de discos')}
                    </Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
        </View>
    );
};

export default GymPreferencesCard;
