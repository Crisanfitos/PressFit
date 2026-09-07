export interface WorkoutDayExercise {
    id: string;
    ejercicio_id: string;
    ejercicio: {
        titulo: string;
        grupo_muscular?: string;
        imagen_url?: string;
    };
    series?: any[];
}

export interface WorkoutStats {
    exerciseCount: number;
    duration: number | null;
    isCompleted: boolean;
    startTime: string | null;
    endTime: string | null;
}
