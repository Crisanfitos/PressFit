import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { SyncService } from '../../services/SyncService';
import { SyncStatusBadge } from '../SyncStatusBadge';
import { LogService } from '../../services/LogService';

export const SyncStatusCard: React.FC<{ testID?: string }> = ({
    testID = 'profile-sync-card',
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { colors } = theme;
    const [pending, setPending] = useState<number | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [lastCheck, setLastCheck] = useState<Date | null>(null);

    const refresh = useCallback(async () => {
        try {
            const res = await SyncService.getQueue();
            setPending(res.data?.length || 0);
            setLastCheck(new Date());
        } catch (error) {
            LogService.error('Error checking sync queue:', error);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const handleManualSync = useCallback(async () => {
        if (syncing) return;
        setSyncing(true);
        try {
            await SyncService.processQueue();
        } catch (error) {
            LogService.error('Error running manual sync:', error);
        } finally {
            await refresh();
            setSyncing(false);
        }
    }, [syncing, refresh]);

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
                row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
                textBlock: { flex: 1 },
                title: { fontSize: 15, fontWeight: '700', color: colors.text },
                subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
                dot: { width: 10, height: 10, borderRadius: 5 },
                syncButton: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: `${colors.primary}1A`,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    borderRadius: 10,
                    gap: 6,
                },
                syncText: { fontSize: 13, fontWeight: '700', color: colors.primary },
            }),
        [colors]
    );

    const isSynced = pending === 0;

    return (
        <View style={styles.card} testID={testID}>
            <View style={styles.row}>
                <View
                    style={[styles.dot, { backgroundColor: isSynced ? '#10B981' : '#F59E0B' }]}
                    testID={`${testID}-dot`}
                />
                <View style={styles.textBlock}>
                    <Text style={styles.title}>
                        {t('profile.cloudSync', 'Sincronización Cloud')}
                    </Text>
                    <Text style={styles.subtitle} testID={`${testID}-status`}>
                        {pending === null
                            ? t('profile.syncChecking', 'Comprobando…')
                            : isSynced
                              ? t('profile.syncedOk', 'Sincronizado con Supabase')
                              : t('profile.pendingSync', `${pending} cambios pendientes`)}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.syncButton}
                    onPress={handleManualSync}
                    disabled={syncing}
                    testID={`${testID}-manual-button`}
                    accessibilityRole="button"
                >
                    {syncing ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <MaterialIcons name="sync" size={16} color={colors.primary} />
                    )}
                    <Text style={styles.syncText}>{t('profile.syncNow', 'Sincronizar')}</Text>
                </TouchableOpacity>
            </View>
            <SyncStatusBadge alwaysShow compact />
            {!!lastCheck && (
                <Text style={[styles.subtitle, { marginTop: 6 }]}>
                    {t('profile.lastCheck', `Revisado ${lastCheck.toLocaleTimeString()}`)}
                </Text>
            )}
        </View>
    );
};

export default SyncStatusCard;
