import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Modal,
    Alert,

} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { RoutineService } from '../services/RoutineService';

interface WeeklyRoutine {
    id: string;
    nombre: string;
    objetivo?: string;
    activa: boolean;

    created_at?: string;
    [key: string]: any;
}

type RoutineEditorScreenProps = {
    navigation: any;
};

const RoutineEditorScreen: React.FC<RoutineEditorScreenProps> = ({ navigation }) => {
    const { theme } = useTheme();
    const { colors } = theme;
    const authContext = useContext(AuthContext);
    const userId = authContext?.user?.id;

    const [routines, setRoutines] = useState<WeeklyRoutine[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newRoutineName, setNewRoutineName] = useState('');
    const [newRoutineGoal, setNewRoutineGoal] = useState('');




    useEffect(() => {
        if (userId) {
            loadRoutines();
        }
    }, [userId]);

    const loadRoutines = async () => {
        if (!userId) return;
        setLoading(true);
        const { data } = await RoutineService.getAllWeeklyRoutines(userId);
        if (data) {
            setRoutines(data);
        }
        setLoading(false);
    };

    const handleCreateRoutine = async () => {
        if (!userId || !newRoutineName.trim()) return;

        const { data, error } = await RoutineService.createWeeklyRoutine({
            usuario_id: userId,
            nombre: newRoutineName.trim(),
            objetivo: newRoutineGoal.trim() || undefined,
            es_plantilla: true,
            activa: routines.filter(r => r.activa).length === 0,
        });

        if (!error && data) {
            setRoutines([data, ...routines]);
            setShowCreateModal(false);
            setNewRoutineName('');
            setNewRoutineGoal('');
        }
    };

    const handleSetActive = async (routine: WeeklyRoutine) => {
        if (routine.activa) return;

        // Deactivate all others and activate this one
        for (const r of routines) {
            if (r.activa) {
                await RoutineService.updateWeeklyRoutine(r.id, { activa: false });
            }
        }
        await RoutineService.updateWeeklyRoutine(routine.id, { activa: true });
        loadRoutines();
    };

    const handleDeleteRoutine = async (routineId: string) => {
        Alert.alert(
            'Eliminar Rutina',
            '¿Estás seguro de que quieres eliminar esta rutina? Esta acción no se puede deshacer.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        await RoutineService.deleteWeeklyRoutine(routineId);
                        loadRoutines();
                    },
                },
            ]
        );
    };



    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        backButton: {
            marginRight: 16,
        },
        headerTitle: {
            fontSize: 22,
            fontWeight: 'bold',
            color: colors.text,
        },
        content: {
            flex: 1,
            padding: 20,
        },
        routineCard: {
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
        },
        routineCardActive: {
            borderColor: colors.primary,
            borderWidth: 2,
        },
        routineHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
        },
        routineName: {
            fontSize: 18,
            fontWeight: '600',
            color: colors.text,
            flex: 1,
        },
        activeBadge: {
            backgroundColor: colors.primary,
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12,
        },
        activeBadgeText: {
            color: colors.background,
            fontSize: 12,
            fontWeight: '600',
        },
        routineGoal: {
            fontSize: 14,
            color: colors.textSecondary,
            marginBottom: 12,
        },
        routineActions: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: 8,
        },
        actionButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 8,
            backgroundColor: colors.inputBackground,
        },
        actionButtonText: {
            marginLeft: 4,
            fontSize: 14,
            color: colors.text,
        },
        deleteButton: {
            backgroundColor: `${colors.statusError}20`,
        },
        emptyState: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 60,
        },
        emptyStateText: {
            fontSize: 18,
            color: colors.textSecondary,
            marginTop: 16,
            marginBottom: 24,
        },
        createButton: {
            backgroundColor: colors.primary,
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: 12,
        },
        createButtonText: {
            color: colors.background,
            fontSize: 16,
            fontWeight: '600',
        },
        fab: {
            position: 'absolute',
            bottom: 100,
            right: 20,
            backgroundColor: colors.primary,
            width: 60,
            height: 60,
            borderRadius: 30,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
        },
        // Modal styles
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            padding: 24,
        },
        modalContent: {
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 24,
        },
        modalTitle: {
            fontSize: 22,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: 24,
            textAlign: 'center',
        },
        inputGroup: {
            marginBottom: 20,
        },
        inputLabel: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.textSecondary,
            marginBottom: 8,
        },
        input: {
            backgroundColor: colors.inputBackground,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 16,
            color: colors.text,
        },
        modalButtons: {
            flexDirection: 'row',
            gap: 12,
            marginTop: 8,
        },
        modalButton: {
            flex: 1,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
        },
        cancelButton: {
            backgroundColor: colors.inputBackground,
        },
        cancelButtonText: {
            color: colors.text,
            fontSize: 16,
            fontWeight: '600',
        },
        confirmButton: {
            backgroundColor: colors.primary,
        },
        confirmButtonText: {
            color: colors.background,
            fontSize: 16,
            fontWeight: '600',
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mis Plantillas</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
                {routines.length === 0 && !loading ? (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="fitness-center" size={64} color={colors.textSecondary} />
                        <Text style={styles.emptyStateText}>No tienes plantillas creadas</Text>
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={() => setShowCreateModal(true)}
                        >
                            <Text style={styles.createButtonText}>Crear Primera Plantilla</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {routines.map((routine) => (
                            <View
                                key={routine.id}
                                style={[styles.routineCard, routine.activa && styles.routineCardActive]}
                            >
                                <View style={styles.routineHeader}>
                                    <Text style={styles.routineName}>{routine.nombre}</Text>
                                    {routine.activa && (
                                        <View style={styles.activeBadge}>
                                            <Text style={styles.activeBadgeText}>ACTIVA</Text>
                                        </View>
                                    )}
                                </View>

                                {routine.objetivo && (
                                    <Text style={styles.routineGoal}>{routine.objetivo}</Text>
                                )}

                                <View style={styles.routineActions}>
                                    {!routine.activa && (
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() => handleSetActive(routine)}
                                        >
                                            <MaterialIcons name="check-circle-outline" size={18} color={colors.primary} />
                                            <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                                                Activar
                                            </Text>
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => navigation.navigate('RoutineDetail', { routineId: routine.id })}
                                    >
                                        <MaterialIcons name="edit" size={18} color={colors.text} />
                                        <Text style={styles.actionButtonText}>Editar</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.deleteButton]}
                                        onPress={() => handleDeleteRoutine(routine.id)}
                                    >
                                        <MaterialIcons name="delete" size={18} color={colors.statusError} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>

            {/* FAB */}
            {routines.length > 0 && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => setShowCreateModal(true)}
                >
                    <MaterialIcons name="add" size={28} color={colors.background} />
                </TouchableOpacity>
            )}

            {/* Create Modal */}
            <Modal
                visible={showCreateModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCreateModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Nueva Plantilla</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Nombre de la Plantilla</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="ej. Volumen 4 días"
                                placeholderTextColor={colors.textSecondary}
                                value={newRoutineName}
                                onChangeText={setNewRoutineName}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Objetivo (opcional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="ej. Ganar masa muscular"
                                placeholderTextColor={colors.textSecondary}
                                value={newRoutineGoal}
                                onChangeText={setNewRoutineGoal}
                            />
                        </View>



                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowCreateModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleCreateRoutine}
                            >
                                <Text style={styles.confirmButtonText}>Crear</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>


        </SafeAreaView>
    );
};

export default RoutineEditorScreen;
