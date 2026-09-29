import React from 'react';
import { CreateCustomExerciseModal } from './CreateCustomExerciseModal';
import { Exercise } from '../services/ExerciseService';

export interface EditCustomExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (updatedExercise: any) => void;
  exercise: Exercise | null;
}

/**
 * Modal for editing an existing custom exercise.
 * Wraps CreateCustomExerciseModal in edit mode by passing `initialExercise`.
 */
export const EditCustomExerciseModal: React.FC<EditCustomExerciseModalProps> = ({
  visible,
  onClose,
  onSuccess,
  exercise,
}) => {
  return (
    <CreateCustomExerciseModal
      visible={visible}
      initialExercise={exercise}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};

export default EditCustomExerciseModal;
