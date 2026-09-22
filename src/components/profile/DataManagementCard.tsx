import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import {
    buildBackupPayload,
    validateBackup,
    type GymPreferences,
} from '../../utils/gymPreferences';
import { ShareService } from '../../services/ShareService';
import { LogService } from '../../services/LogService';
import * as FileSystem from 'expo-file-system';

export interface DataManagementCardProps {
    prefs: GymPreferences;
    profileSnapshot: Record<string, unknown>;
    onRestorePrefs: (prefs: GymPreferences) => void;
    testID?: string;
}

export const DataManagementCard: React.FC<DataManagementCardProps> = ({
    prefs,
    profileSnapshot,
    onRestorePrefs,
    testID = 'profile-data-card',
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { colors } = theme;
    const [busy, setBusy] = useState<'export' | 'import' | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);

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
                button: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    padding: 13,
                    gap: 8,
                    marginBottom: 10,
                },
                buttonText: { fontWeight: '700', color: colors.text, fontSize: 14 },
                feedback: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
            }),
        [colors]
    );

    const handleExport = useCallback(async () => {
        setBusy('export');
        setFeedback(null);
        try {
            const payload = buildBackupPayload(prefs);
            await ShareService.share({
                title: t('profile.backupTitle', 'Backup PressFit'),
                message: JSON.stringify({ ...payload, profileSnapshot }, null, 2),
            });
            setFeedback(t('profile.backupShared', 'Backup listo para compartir.'));
        } catch (error) {
            LogService.error('Error exporting backup:', error);
            setFeedback(t('profile.backupError', 'No se pudo generar el backup.'));
        } finally {
            setBusy(null);
        }
    }, [prefs, profileSnapshot, t]);

    const handleImport = useCallback(async () => {
        setBusy('import');
        setFeedback(null);
        try {
            const picked = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true,
            });
            if (picked.canceled || !picked.assets?.[0]?.uri) {
                setBusy(null);
                return;
            }
            const raw = await FileSystem.readAsStringAsync(picked.assets[0].uri, {
                encoding: 'utf8',
            });
            const result = validateBackup(JSON.parse(raw));
            if (!result.valid || !result.prefs) {
                setFeedback(result.error || t('profile.backupInvalid', 'Backup no válido.'));
            } else {
                onRestorePrefs(result.prefs);
                setFeedback(t('profile.backupRestored', 'Preferencias restauradas correctamente.'));
            }
        } catch (error) {
            LogService.error('Error importing backup:', error);
            setFeedback(t('profile.backupInvalid', 'Backup no válido.'));
        } finally {
            setBusy(null);
        }
    }, [onRestorePrefs, t]);

    return (
        <View style={styles.card} testID={testID}>
            <Text style={styles.title}>
                {t('profile.dataManagement', 'Gestión de datos')}
            </Text>
            <TouchableOpacity
                style={styles.button}
                onPress={handleExport}
                disabled={busy !== null}
                testID={`${testID}-export-button`}
            >
                {busy === 'export' ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                    <MaterialIcons name="ios-share" size={18} color={colors.primary} />
                )}
                <Text style={styles.buttonText}>
                    {t('profile.exportBackup', 'Exportar backup JSON')}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.button}
                onPress={handleImport}
                disabled={busy !== null}
                testID={`${testID}-import-button`}
            >
                {busy === 'import' ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                    <MaterialIcons name="file-download" size={18} color={colors.primary} />
                )}
                <Text style={styles.buttonText}>
                    {t('profile.importBackup', 'Importar backup JSON')}
                </Text>
            </TouchableOpacity>
            {!!feedback && (
                <Text style={styles.feedback} testID={`${testID}-feedback`}>
                    {feedback}
                </Text>
            )}
        </View>
    );
};

export default DataManagementCard;
