import { Alert } from 'react-native';

export const getGhostValue = (
    previousWorkout: any,
    exerciseId: string,
    setNumber: number,
    field: 'weight' | 'reps' | 'rpe'
): string | null => {
    if (!previousWorkout?.ejercicios_programados) return null;
    const prevExercise = previousWorkout.ejercicios_programados.find(
        (ep: any) => ep.ejercicio_id === exerciseId || ep.ejercicio?.id === exerciseId || ep.id === exerciseId
    );
    if (!prevExercise) return null;
    const sets: any[] = prevExercise.series_realizadas || prevExercise.series || [];
    if (!sets || sets.length === 0) return null;

    let prevSet = sets.find((s: any) => s.numero_serie === setNumber);
    if (!prevSet && sets.length > 0) prevSet = sets[sets.length - 1];
    if (!prevSet) return null;

    const val = field === 'reps' ? prevSet.repeticiones : field === 'rpe' ? prevSet.rpe : prevSet.peso_utilizado;
    return val !== undefined && val > 0 ? String(val) : null;
};

export const confirmDeleteExercise = (
    exerciseName: string,
    onConfirm: () => Promise<void>
) => {
    Alert.alert('Eliminar Ejercicio', `¿Estás seguro de eliminar "${exerciseName}"?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
            text: 'Eliminar',
            style: 'destructive',
            onPress: onConfirm,
        },
    ]);
};

export const confirmDeleteSet = (onConfirm: () => Promise<void>) => {
    Alert.alert('Eliminar Serie', '¿Estás seguro de eliminar esta serie?', [
        { text: 'Cancelar', style: 'cancel' },
        {
            text: 'Eliminar',
            style: 'destructive',
            onPress: onConfirm,
        },
    ]);
};
