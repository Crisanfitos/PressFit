import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { CreateCustomExerciseModal } from '../../src/components/CreateCustomExerciseModal';
import { ExerciseService } from '../../src/services/ExerciseService';
import { ThemeProvider } from '../../src/context/ThemeContext';

jest.mock('../../src/services/ExerciseService', () => ({
  ExerciseService: {
    createCustomExercise: jest.fn(),
  },
}));

describe('CreateCustomExerciseModal', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderModal = async (props = defaultProps) => {
    return render(
      <ThemeProvider>
        <CreateCustomExerciseModal {...props} />
      </ThemeProvider>
    );
  };

  it('renders correctly when visible', async () => {
    const { getByTestId, getByText } = await renderModal();

    expect(getByTestId('create-custom-exercise-modal')).toBeTruthy();
    expect(getByText('Nuevo Ejercicio Personalizado')).toBeTruthy();
    expect(getByTestId('custom-exercise-name-input')).toBeTruthy();
    expect(getByTestId('custom-exercise-submit-button')).toBeTruthy();
  });

  it('shows error message if title is empty on submit', async () => {
    const { getByTestId, getByText } = await renderModal();

    const submitBtn = getByTestId('custom-exercise-submit-button');
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    await waitFor(() => {
      expect(getByText('El título del ejercicio es obligatorio.')).toBeTruthy();
    });
    expect(ExerciseService.createCustomExercise).not.toHaveBeenCalled();
  });

  it('calls ExerciseService.createCustomExercise and triggers callbacks on valid submission', async () => {
    (ExerciseService.createCustomExercise as jest.Mock).mockResolvedValueOnce({
      data: { id: 'custom-ex-123', titulo: 'Dominadas Con Lastre' },
      error: null,
    });

    const { getByTestId } = await renderModal();

    const input = getByTestId('custom-exercise-name-input');
    await act(async () => {
      fireEvent.changeText(input, 'Dominadas Con Lastre');
    });

    const submitBtn = getByTestId('custom-exercise-submit-button');
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    await waitFor(() => {
      expect(ExerciseService.createCustomExercise).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: 'Dominadas Con Lastre',
          grupo_muscular: 'Pecho',
        })
      );
    });

    expect(defaultProps.onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'custom-ex-123' })
    );
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when cancel button is pressed', async () => {
    const { getByTestId } = await renderModal();

    const cancelBtn = getByTestId('custom-exercise-cancel-button');
    await act(async () => {
      fireEvent.press(cancelBtn);
    });

    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
