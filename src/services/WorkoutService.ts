import { WorkoutQueryService } from './WorkoutQueryService';
import { WorkoutMutationService } from './WorkoutMutationService';
import { WorkoutSetMutationService } from './WorkoutSetMutationService';
import { WorkoutOfflineService, isSchemaColumnError } from './WorkoutOfflineService';

// Re-export utility functions and specialized services
export { isSchemaColumnError };
export { WorkoutOfflineService };
export { WorkoutQueryService };
export { WorkoutMutationService };
export { WorkoutSetMutationService };
export { retryWithBackoff, isNetworkError } from '../utils/networkRetry';

/**
 * Unified WorkoutService facade maintaining 100% backward compatibility
 * with the original WorkoutService API.
 */
export const WorkoutService = {
    // Queries
    getWorkoutDetails: WorkoutQueryService.getWorkoutDetails,
    getSeriesForExercise: WorkoutQueryService.getSeriesForExercise,
    getLastCompletedWorkoutForDay: WorkoutQueryService.getLastCompletedWorkoutForDay,
    getExerciseHistory: WorkoutQueryService.getExerciseHistory,

    // Lifecycle & Structure Mutations
    createWorkout: WorkoutMutationService.createWorkout,
    completeWorkout: WorkoutMutationService.completeWorkout,
    removeExerciseFromRoutine: WorkoutMutationService.removeExerciseFromRoutine,
    addExerciseToWorkout: WorkoutMutationService.addExerciseToWorkout,
    removeExerciseFromWorkout: WorkoutMutationService.removeExerciseFromWorkout,
    updateWeightType: WorkoutMutationService.updateWeightType,
    swapExerciseInWorkout: WorkoutMutationService.swapExerciseInWorkout,

    // Set Mutations
    addSet: WorkoutSetMutationService.addSet,
    updateSet: WorkoutSetMutationService.updateSet,
    deleteSet: WorkoutSetMutationService.deleteSet,
};
