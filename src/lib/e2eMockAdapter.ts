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
 * Almacén en memoria para interceptar y servir datos deterministas en pruebas E2E.
 */
class E2EMockStore {
    private activeRoutine = JSON.parse(JSON.stringify(weeklyRoutineFixture));
    private currentWorkout: any = null;

    reset() {
        this.activeRoutine = JSON.parse(JSON.stringify(weeklyRoutineFixture));
        this.currentWorkout = null;
    }

    getMockRoutineDay(identifier?: string) {
        const days = this.activeRoutine.dias || [];
        let matchedDay = days.find((d: any) =>
            identifier ? d.nombre.toLowerCase().includes(identifier.toLowerCase()) : true
        );
        if (!matchedDay) {
            matchedDay = days[0];
        }

        return {
            id: matchedDay.id || 'day-001',
            rutina_id: this.activeRoutine.id,
            nombre: matchedDay.nombre,
            descripcion: matchedDay.descripcion || 'Entrenamiento del día E2E',
            dia_semana: matchedDay.dia_semana || 1,
            hora_inicio: this.currentWorkout?.hora_inicio || null,
            hora_fin: this.currentWorkout?.hora_fin || null,
            completada: !!this.currentWorkout?.completada,
            ejercicios_programados: (matchedDay.ejercicios || []).map((ex: any, idx: number) => ({
                id: `sch-ex-${ex.id || idx}`,
                rutina_diaria_id: matchedDay.id || 'day-001',
                ejercicio_id: ex.id,
                orden_ejecucion: idx + 1,
                tipo_peso: 'total',
                ejercicio: {
                    id: ex.id,
                    titulo: ex.nombre,
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

    startWorkout(dayId: string) {
        const day = this.getMockRoutineDay(dayId);
        this.currentWorkout = {
            ...day,
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
}

export const mockStore = new E2EMockStore();
