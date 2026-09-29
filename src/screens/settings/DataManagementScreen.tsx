import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { ExportService } from '../../services/export/ExportService';
import { ImportService } from '../../services/import/ImportService';
import { HapticService } from '../../services/HapticService';

interface DataManagementScreenProps {
    navigation: any;
}

export const DataManagementScreen: React.FC<DataManagementScreenProps> = ({ navigation }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { colors } = theme;
    const auth = useContext(AuthContext);
    const { showAlert, showToast } = useAlert();

    const userId = auth?.user?.id;

    const [exportingCSV, setExportingCSV] = useState(false);
    const [exportingJSON, setExportingJSON] = useState(false);
    const [importingJSON, setImportingJSON] = useState(false);
    const [purgingCache, setPurgingCache] = useState(false);

    // Export CSV
    const handleExportCSV = async () => {
        if (!userId) return;
        setExportingCSV(true);
        HapticService.selection();
        try {
            const { data, error } = await ExportService.exportWorkoutHistoryToCSV(userId);
            if (error || !data) {
                showAlert({
                    type: 'error',
                    title: t('common.error', 'Error'),
                    message: t('dataManagement.exportCsvError', 'No se pudo exportar el historial a CSV.'),
                });
            } else {
                showToast({
                    message: t('dataManagement.exportCsvSuccess', `Historial exportado (${data.rowCount} series).`),
                    type: 'success',
                });
            }
        } catch {
            showAlert({
                type: 'error',
                title: t('common.error', 'Error'),
                message: t('dataManagement.exportCsvError', 'No se pudo exportar el historial a CSV.'),
            });
        } finally {
            setExportingCSV(false);
        }
    };

    // Export JSON Backup
    const handleExportJSON = async () => {
        if (!userId) return;
        setExportingJSON(true);
        HapticService.selection();
        try {
            const { data, error } = await ExportService.exportBackupToJSON(userId);
            if (error || !data) {
                showAlert({
                    type: 'error',
                    title: t('common.error', 'Error'),
                    message: t('dataManagement.exportJsonError', 'No se pudo generar la copia de seguridad.'),
                });
            } else {
                showToast({
                    message: t('dataManagement.exportJsonSuccess', 'Copia de seguridad exportada con éxito.'),
                    type: 'success',
                });
            }
        } catch {
            showAlert({
                type: 'error',
                title: t('common.error', 'Error'),
                message: t('dataManagement.exportJsonError', 'No se pudo generar la copia de seguridad.'),
            });
        } finally {
            setExportingJSON(false);
        }
    };

    // Import JSON Backup
    const handleImportJSON = async () => {
        if (!userId) return;
        HapticService.selection();
        try {
            const fileRes = await ImportService.pickBackupFile();
            if (fileRes.error) {
                showAlert({
                    type: 'error',
                    title: t('common.error', 'Error'),
                    message: t('dataManagement.filePickerError', 'Error al seleccionar el archivo.'),
                });
                return;
            }

            if (!fileRes.data) {
                // User cancelled file selection
                return;
            }

            const { content, name } = fileRes.data;

            showAlert({
                type: 'confirm',
                title: t('dataManagement.importConfirmTitle', 'Restaurar Copia de Seguridad'),
                message: t(
                    'dataManagement.importConfirmMsg',
                    `¿Deseas restaurar la copia "${name}"? Se sincronizarán los entrenamientos y rutinas sin duplicar los registros existentes.`
                ),
                buttons: [
                    {
                        text: t('common.cancel', 'Cancelar'),
                        style: 'cancel',
                    },
                    {
                        text: t('dataManagement.confirmImport', 'Restaurar'),
                        onPress: async () => {
                            setImportingJSON(true);
                            try {
                                const importRes = await ImportService.importBackup(content, userId);
                                if (importRes.error || !importRes.data) {
                                    showAlert({
                                        type: 'error',
                                        title: t('common.error', 'Error'),
                                        message:
                                            (importRes.error as Error)?.message ||
                                            t('dataManagement.importFailed', 'Error al procesar el archivo.'),
                                    });
                                } else {
                                    const {
                                        workoutsImported,
                                        routinesImported,
                                        exercisesImported,
                                        skippedCount,
                                    } = importRes.data;
                                    showAlert({
                                        type: 'success',
                                        title: t('common.success', 'Éxito'),
                                        message: t(
                                            'dataManagement.importSuccessMsg',
                                            `Restauración completada:\n• ${workoutsImported} entrenamientos\n• ${routinesImported} plantillas\n• ${exercisesImported} ejercicios personalizados\n(${skippedCount} elementos omitidos por duplicidad)`
                                        ),
                                    });
                                }
                            } finally {
                                setImportingJSON(false);
                            }
                        },
                    },
                ],
            });
        } catch {
            showAlert({
                type: 'error',
                title: t('common.error', 'Error'),
                message: t('dataManagement.importFailed', 'Error al procesar el archivo de copia de seguridad.'),
            });
        }
    };

    // Purge local cache
    const handlePurgeCache = () => {
        HapticService.selection();
        showAlert({
            type: 'warning',
            title: t('dataManagement.purgeConfirmTitle', 'Purgar Caché Local'),
            message: t(
                'dataManagement.purgeConfirmMsg',
                '¿Deseas vaciar la memoria caché y datos temporales guardados localmente? Tus datos sincronizados en la nube se mantendrán a salvo.'
            ),
            buttons: [
                {
                    text: t('common.cancel', 'Cancelar'),
                    style: 'cancel',
                },
                {
                    text: t('dataManagement.confirmPurge', 'Purgar Caché'),
                    style: 'destructive',
                    onPress: async () => {
                        setPurgingCache(true);
                        try {
                            const res = await ImportService.purgeLocalCache();
                            if (res.data?.cleared) {
                                showToast({
                                    message: t('dataManagement.purgeSuccess', 'Caché local purgada con éxito.'),
                                    type: 'success',
                                });
                            }
                        } finally {
                            setPurgingCache(false);
                        }
                    },
                },
            ],
        });
    };

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
            testID="data-management-screen"
        >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    testID="back-button"
                    style={styles.headerButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {t('dataManagement.title', 'Gestión de Datos')}
                </Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Section 1: Export Data */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        {t('dataManagement.exportSectionTitle', 'Exportar Datos')}
                    </Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                        {t(
                            'dataManagement.exportSectionSubtitle',
                            'Exporta tu historial de entrenamientos para análisis en hojas de cálculo o descarga una copia de respaldo completa.'
                        )}
                    </Text>

                    {/* Export CSV Button */}
                    <TouchableOpacity
                        testID="export-csv-button"
                        style={[styles.actionButton, { borderColor: colors.border, backgroundColor: colors.background }]}
                        onPress={handleExportCSV}
                        disabled={exportingCSV}
                    >
                        <View style={styles.actionLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
                                <MaterialIcons name="table-chart" size={22} color={colors.primary} />
                            </View>
                            <View style={styles.actionTextContainer}>
                                <Text style={[styles.actionTitle, { color: colors.text }]}>
                                    {t('dataManagement.exportCsvTitle', 'Exportar a CSV (Excel / Sheets)')}
                                </Text>
                                <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                                    {t('dataManagement.exportCsvDesc', 'Series, repeticiones, cargas, RPE y 1RM')}
                                </Text>
                            </View>
                        </View>
                        {exportingCSV ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
                        )}
                    </TouchableOpacity>

                    {/* Export JSON Backup Button */}
                    <TouchableOpacity
                        testID="export-json-button"
                        style={[styles.actionButton, { borderColor: colors.border, backgroundColor: colors.background }]}
                        onPress={handleExportJSON}
                        disabled={exportingJSON}
                    >
                        <View style={styles.actionLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
                                <MaterialIcons name="cloud-download" size={22} color={colors.primary} />
                            </View>
                            <View style={styles.actionTextContainer}>
                                <Text style={[styles.actionTitle, { color: colors.text }]}>
                                    {t('dataManagement.exportJsonTitle', 'Exportar Copia de Seguridad (JSON)')}
                                </Text>
                                <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                                    {t('dataManagement.exportJsonDesc', 'Respaldo completo y versionado (schemaVersion: 1)')}
                                </Text>
                            </View>
                        </View>
                        {exportingJSON ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Section 2: Import Backup */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        {t('dataManagement.importSectionTitle', 'Restaurar Copia de Seguridad')}
                    </Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                        {t(
                            'dataManagement.importSectionSubtitle',
                            'Restaura tus rutinas y sesiones desde un archivo .json validado con verificación de integridad.'
                        )}
                    </Text>

                    <TouchableOpacity
                        testID="import-json-button"
                        style={[styles.actionButton, { borderColor: colors.border, backgroundColor: colors.background }]}
                        onPress={handleImportJSON}
                        disabled={importingJSON}
                    >
                        <View style={styles.actionLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
                                <MaterialIcons name="cloud-upload" size={22} color={colors.primary} />
                            </View>
                            <View style={styles.actionTextContainer}>
                                <Text style={[styles.actionTitle, { color: colors.text }]}>
                                    {t('dataManagement.importJsonTitle', 'Importar Respaldo (.json)')}
                                </Text>
                                <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                                    {t('dataManagement.importJsonDesc', 'Validación Zod e inserción idempotente')}
                                </Text>
                            </View>
                        </View>
                        {importingJSON ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Section 3: Maintenance & Cache */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        {t('dataManagement.cacheSectionTitle', 'Mantenimiento')}
                    </Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                        {t(
                            'dataManagement.cacheSectionSubtitle',
                            'Libera espacio de almacenamiento local eliminando cachés y datos temporales sin alterar tus datos sincronizados.'
                        )}
                    </Text>

                    <TouchableOpacity
                        testID="purge-cache-button"
                        style={[styles.actionButton, { borderColor: colors.border, backgroundColor: colors.background }]}
                        onPress={handlePurgeCache}
                        disabled={purgingCache}
                    >
                        <View style={styles.actionLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: '#ef444420' }]}>
                                <MaterialIcons name="delete-sweep" size={22} color="#ef4444" />
                            </View>
                            <View style={styles.actionTextContainer}>
                                <Text style={[styles.actionTitle, { color: '#ef4444' }]}>
                                    {t('dataManagement.purgeCacheTitle', 'Purgar Caché Local')}
                                </Text>
                                <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                                    {t('dataManagement.purgeCacheDesc', 'Eliminar temporales de AsyncStorage')}
                                </Text>
                            </View>
                        </View>
                        {purgingCache ? (
                            <ActivityIndicator size="small" color="#ef4444" />
                        ) : (
                            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSpacer: {
        width: 32,
    },
    scrollContent: {
        padding: 16,
        gap: 16,
    },
    card: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        gap: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    sectionSubtitle: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 4,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    actionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionTextContainer: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    actionDescription: {
        fontSize: 12,
    },
});

export default DataManagementScreen;
