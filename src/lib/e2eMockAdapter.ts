import userProfileFixture from '../../e2e/fixtures/user_profile.json';
import weeklyRoutineFixture from '../../e2e/fixtures/weekly_routine.json';
import exerciseCatalogFixture from '../../e2e/fixtures/exercise_catalog.json';
import workoutSessionsFixture from '../../e2e/fixtures/workout_sessions.json';

let mockEnabledOverride: boolean | null = null;

/**
 * Permite forzar dinámicamente el modo de pruebas E2E con Mocks.
 */
export const setE2EMockEnabled = (enabled: boolean) => {
    mockEnabledOverride = enabled;
};

/**
 * Indicador global para saber si la aplicación se ejecuta en modo E2E con Mocks.
 */
export const isE2EMockEnabled = (): boolean => {
    if (mockEnabledOverride !== null) return mockEnabledOverride;
    return process.env.EXPO_PUBLIC_E2E_MOCKS === 'true';
};

/**
 * Fixtures estáticos cargados para pruebas E2E deterministas.
 */
export const e2eFixtures = {
    profile: userProfileFixture,
    weeklyRoutine: weeklyRoutineFixture,
    exerciseCatalog: exerciseCatalogFixture,
    workoutSessions: workoutSessionsFixture,
};

/**
 * Almacén en memoria con estado de transacción mutable para pruebas E2E deterministas.
 */
class E2EMockStore {
    private activeRoutine = JSON.parse(JSON.stringify(weeklyRoutineFixture));
    private currentWorkout: any = null;

    /**
     * Resetea el almacén al estado inicial limpio antes de cada prueba E2E.
     */
    resetStore() {
        this.activeRoutine = JSON.parse(JSON.stringify(weeklyRoutineFixture));
        this.currentWorkout = null;
    }

    getActiveRoutine() {
        return {
            ...this.activeRoutine,
            rutinas_diarias: (this.activeRoutine.dias || []).map((d: any) => ({
                id: d.id,
                dia_semana: d.dia_semana,
                nombre_dia: d.nombre_dia || (d.dia_semana === 1 ? 'Lunes' : 'Martes'),
                nombre: d.nombre,
                descripcion: d.descripcion,
                ejercicios_programados: (d.ejercicios || []).map((ex: any, idx: number) => ({
                    id: `sch-ex-${ex.id || idx}`,
                    rutina_diaria_id: d.id,
                    ejercicio_id: ex.id,
                    orden_ejecucion: idx + 1,
                    tipo_peso: 'total',
                    ejercicio: {
                        id: ex.id,
                        nombre: ex.nombre,
                        titulo: ex.nombre || ex.titulo,
                        grupo_muscular: ex.nombre.includes('Banca') ? 'Pecho' : 'Espalda',
                    },
                    series: Array.from({ length: ex.series_objetivo || 3 }, (_, sIdx) => ({
                        id: `set-${ex.id}-${sIdx + 1}`,
                        ejercicio_programado_id: `sch-ex-${ex.id || idx}`,
                        numero_serie: sIdx + 1,
                        peso_utilizado: 60,
                        repeticiones: 10,
                        rpe: 8,
                    })),
                })),
            })),
        };
    }

    getMockRoutineDay(identifier?: string) {
        if (this.currentWorkout) {
            return this.currentWorkout;
        }

        const days = this.activeRoutine.dias || [];
        let matchedDay = days.find((d: any) =>
            identifier ? (d.id === identifier || d.nombre?.toLowerCase().includes(identifier.toLowerCase()) || d.nombre_dia?.toLowerCase().includes(identifier.toLowerCase())) : true
        );
        if (!matchedDay) {
            matchedDay = days[0];
        }

        return {
            id: matchedDay.id || 'day-001',
            rutina_id: this.activeRoutine.id,
            nombre: matchedDay.nombre,
            nombre_dia: matchedDay.nombre || matchedDay.nombre_dia || 'Lunes',
            descripcion: matchedDay.descripcion || 'Entrenamiento del día E2E',
            dia_semana: matchedDay.dia_semana || 1,
            hora_inicio: null,
            hora_fin: null,
            completada: false,
            ejercicios_programados: matchedDay.ejercicios_programados && matchedDay.ejercicios_programados.length > 0
                ? matchedDay.ejercicios_programados
                : (matchedDay.ejercicios || []).map((ex: any, idx: number) => ({
                id: `sch-ex-${ex.id || idx}`,
                rutina_diaria_id: matchedDay.id || 'day-001',
                ejercicio_id: ex.id,
                orden_ejecucion: idx + 1,
                tipo_peso: 'total',
                ejercicio: {
                    id: ex.id,
                    nombre: ex.nombre,
                    titulo: ex.nombre || ex.titulo,
                    grupo_muscular: ex.nombre.includes('Banca') ? 'Pecho' : 'Espalda',
                },
                series: Array.from({ length: ex.series_objetivo || 3 }, (_, sIdx) => ({
                    id: `set-${ex.id}-${sIdx + 1}`,
                    ejercicio_programado_id: `sch-ex-${ex.id || idx}`,
                    numero_serie: sIdx + 1,
                    peso_utilizado: 60,
                    repeticiones: 10,
                    rpe: 8,
                    descanso_segundos: null,
                    completada: false,
                })),
            })),
        };
    }

    getMockWorkoutStats(routineDayId?: string) {
        if (!this.currentWorkout) {
            return {
                isCompleted: false,
                startTime: null,
                endTime: null,
                duration: null,
                exerciseCount: 2,
            };
        }
        return {
            isCompleted: !!this.currentWorkout.completada,
            startTime: this.currentWorkout.hora_inicio || null,
            endTime: this.currentWorkout.hora_fin || null,
            duration: this.currentWorkout.completada ? 45 : null,
            exerciseCount: (this.currentWorkout.ejercicios_programados || []).length || 2,
        };
    }

    startWorkout(dayId: string) {
        this.currentWorkout = null;
        const baseDay = this.getMockRoutineDay(dayId);
        this.currentWorkout = {
            ...baseDay,
            hora_inicio: new Date().toISOString(),
            hora_fin: null,
            completada: false,
        };
        return this.currentWorkout;
    }

    completeWorkout() {
        if (this.currentWorkout) {
            this.currentWorkout.completada = true;
            this.currentWorkout.hora_fin = new Date().toISOString();
        }
        return this.currentWorkout;
    }

    updateSet(setId: string, updates: any) {
        if (this.currentWorkout?.ejercicios_programados) {
            for (const ex of this.currentWorkout.ejercicios_programados) {
                if (ex.series) {
                    const targetSet = ex.series.find((s: any) => s.id === setId);
                    if (targetSet) {
                        Object.assign(targetSet, updates);
                        return targetSet;
                    }
                }
            }
        }
        return null;
    }

    addSet(exerciseId: string) {
        if (!this.currentWorkout) {
            this.currentWorkout = this.getMockRoutineDay();
        }
        const exercises = this.currentWorkout.ejercicios_programados || [];
        let targetEx = exercises.find((e: any) => e.ejercicio_id === exerciseId || e.id === exerciseId);
        if (!targetEx && exercises.length > 0) {
            targetEx = exercises[0];
        }
        if (targetEx) {
            if (!targetEx.series) targetEx.series = [];
            const nextNum = targetEx.series.length + 1;
            const newSet = {
                id: `set-${targetEx.ejercicio_id || exerciseId}-${nextNum}-${Date.now()}`,
                ejercicio_programado_id: targetEx.id,
                numero_serie: nextNum,
                peso_utilizado: 0,
                repeticiones: 0,
                rpe: null,
                descanso_segundos: null,
                completada: false,
            };
            targetEx.series.push(newSet);
            return newSet;
        }
        return null;
    }

    deleteSet(setId: string) {
        if (this.currentWorkout?.ejercicios_programados) {
            for (const ex of this.currentWorkout.ejercicios_programados) {
                if (ex.series) {
                    const idx = ex.series.findIndex((s: any) => s.id === setId);
                    if (idx !== -1) {
                        ex.series.splice(idx, 1);
                        ex.series.forEach((s: any, i: number) => {
                            s.numero_serie = i + 1;
                        });
                        return true;
                    }
                }
            }
        }
        return false;
    }

    updateDayDescription(dayId: string, descripcion: string) {
        const days = this.activeRoutine.dias || [];
        const day = days.find((d: any) => d.id === dayId || d.nombre.toLowerCase().includes(dayId.toLowerCase()));
        if (day) {
            day.descripcion = descripcion;
        }
        if (this.currentWorkout) {
            this.currentWorkout.descripcion = descripcion;
        }
        return day || { id: dayId, descripcion };
    }

    addExercisesToRoutineDay(routineDayId: string, exerciseIds: string[]) {
        const target = this.currentWorkout || (this.activeRoutine.dias || []).find((d: any) => d.id === routineDayId);
        if (target) {
            if (!target.ejercicios_programados) target.ejercicios_programados = [];
            for (const id of exerciseIds) {
                const foundCat = (this.catalogExercises || []).find((c: any) => c.id === id);
                const name = foundCat?.nombre || 'Ejercicio Nuevo';
                target.ejercicios_programados.push({
                    id: `ep-${Date.now()}-${id}`,
                    ejercicio_id: id,
                    orden_ejecucion: target.ejercicios_programados.length + 1,
                    ejercicio: { id, nombre: name },
                    series: [
                        { id: `s-new-1`, numero_serie: 1, peso_utilizado: 50, repeticiones: 10, rpe: 8 }
                    ]
                });
            }
        }
        return true;
    }

    deleteExerciseFromRoutineDay(routineExerciseIdOrExerciseId: string) {
        if (this.currentWorkout?.ejercicios_programados) {
            this.currentWorkout.ejercicios_programados = this.currentWorkout.ejercicios_programados.filter(
                (e: any) => e.id !== routineExerciseIdOrExerciseId && e.ejercicio_id !== routineExerciseIdOrExerciseId
            );
        }
        for (const day of this.activeRoutine.dias || []) {
            if (day.ejercicios_programados) {
                day.ejercicios_programados = day.ejercicios_programados.filter(
                    (e: any) => e.id !== routineExerciseIdOrExerciseId && e.ejercicio_id !== routineExerciseIdOrExerciseId
                );
            }
        }
        return true;
    }

    updateSet(setId: string, updates: any) {
        let updatedSet: any = null;
        const updateSeriesList = (seriesList: any[]) => {
            for (const s of seriesList || []) {
                if (s.id === setId) {
                    Object.assign(s, updates);
                    updatedSet = s;
                }
            }
        };

        if (this.currentWorkout?.ejercicios_programados) {
            for (const ex of this.currentWorkout.ejercicios_programados) {
                updateSeriesList(ex.series);
            }
        }
        for (const day of this.activeRoutine.dias || []) {
            if (day.ejercicios_programados) {
                for (const ex of day.ejercicios_programados) {
                    updateSeriesList(ex.series);
                }
            }
        }
        return updatedSet;
    }
}

export const mockStore = new E2EMockStore();
