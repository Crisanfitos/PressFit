import userProfileFixture from '../../e2e/fixtures/user_profile.json';
import weeklyRoutineFixture from '../../e2e/fixtures/weekly_routine.json';
import exerciseCatalogFixture from '../../e2e/fixtures/exercise_catalog.json';
import workoutSessionsFixture from '../../e2e/fixtures/workout_sessions.json';

/**
 * Indicador global para saber si la aplicación se ejecuta en modo E2E con Mocks.
 */
export const isE2EMockEnabled = (): boolean => {
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
