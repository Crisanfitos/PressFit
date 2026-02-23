import { useState, useEffect, useCallback, useContext } from 'react';
import { ExerciseService } from '../services/ExerciseService';
import { AuthContext } from '../context/AuthContext';

export const useExerciseNote = (exerciseId: string) => {
    const authContext = useContext(AuthContext);
    const user = authContext?.user;
    const [note, setNote] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetchNote = useCallback(async () => {
        if (!user || !exerciseId) return;

        setLoading(true);
        const { data } = await ExerciseService.getPersonalNote(user.id, exerciseId);
        setNote(data);
        setLoading(false);
    }, [user, exerciseId]);

    const saveNote = async (content: string) => {
        if (!user || !exerciseId) return { success: false, error: 'No user or exercise ID' };

        setSaving(true);
        const { error } = await ExerciseService.savePersonalNote(user.id, exerciseId, content);
        setSaving(false);

        if (!error) {
            setNote(content);
            return { success: true, error: null };
        }
        return { success: false, error };
    };

    useEffect(() => {
        fetchNote();
    }, [fetchNote]);

    return {
        note,
        loading,
        saving,
        saveNote,
        refreshNote: fetchNote
    };
};
