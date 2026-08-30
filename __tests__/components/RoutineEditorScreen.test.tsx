import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import RoutineEditorScreen from '../../src/screens/RoutineEditorScreen';
import { RoutineService } from '../../src/services/RoutineService';
import { AuthContext } from '../../src/context/AuthContext';

jest.mock('../../src/services/RoutineService', () => ({
  RoutineService: {
    getAllWeeklyRoutines: jest.fn(),
    createWeeklyRoutine: jest.fn(),
    updateWeeklyRoutine: jest.fn(),
    deleteWeeklyRoutine: jest.fn(),
  },
}));

describe('RoutineEditorScreen Component (RNTL)', () => {
  const mockNavigation = { navigate: jest.fn(), addListener: jest.fn(() => jest.fn()) } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (RoutineService.getAllWeeklyRoutines as jest.Mock).mockResolvedValue({
      data: [
        { id: 'r1', nombre: 'Rutina Torso-Pierna', objetivo: 'Fuerza', activa: true },
        { id: 'r2', nombre: 'Rutina Push Pull Legs', objetivo: 'Hipertrofia', activa: false },
      ],
      error: null,
    });
  });

  it('renders routine editor title and routine list', async () => {
    const { findByText } = await render(
      <AuthContext.Provider value={{ user: { id: 'u1' } } as any}>
        <RoutineEditorScreen navigation={mockNavigation} />
      </AuthContext.Provider>
    );

    expect(await findByText('Mis Plantillas')).toBeTruthy();
    expect(await findByText('Rutina Torso-Pierna')).toBeTruthy();
    expect(await findByText('Rutina Push Pull Legs')).toBeTruthy();
  });

  it('opens creation modal and creates new weekly routine', async () => {
    (RoutineService.createWeeklyRoutine as jest.Mock).mockResolvedValue({
      data: { id: 'r3', nombre: 'Nueva Rutina 5D', activa: false },
      error: null,
    });

    const { getByTestId, findByPlaceholderText, findByText } = await render(
      <AuthContext.Provider value={{ user: { id: 'u1' } } as any}>
        <RoutineEditorScreen navigation={mockNavigation} />
      </AuthContext.Provider>
    );

    const fabBtn = await waitFor(() => getByTestId('create-routine-fab'));
    fireEvent.press(fabBtn);

    const nameInput = await findByPlaceholderText(/ej. Volumen 4 días/i);
    fireEvent.changeText(nameInput, 'Nueva Rutina 5D');

    const saveBtn = await findByText('Crear');
    fireEvent.press(saveBtn);

    await waitFor(() => {
      expect(RoutineService.createWeeklyRoutine).toHaveBeenCalledWith(expect.objectContaining({
        nombre: 'Nueva Rutina 5D',
      }));
    });
  });

  it('handles setting a inactive routine active', async () => {
    (RoutineService.updateWeeklyRoutine as jest.Mock).mockResolvedValue({ data: {}, error: null });

    const { findByText } = await render(
      <AuthContext.Provider value={{ user: { id: 'u1' } } as any}>
        <RoutineEditorScreen navigation={mockNavigation} />
      </AuthContext.Provider>
    );

    const activateBtn = await findByText(/Activar/i);
    fireEvent.press(activateBtn);

    await waitFor(() => {
      expect(RoutineService.updateWeeklyRoutine).toHaveBeenCalledWith('r2', { activa: true });
    });
  });

  it('automatically transfers active status to next routine when active routine is deleted (PF-BUG-057)', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((title, msg, buttons: any) => {
      const deleteBtn = buttons?.find((b: any) => b.text === 'Eliminar' || b.style === 'destructive');
      deleteBtn?.onPress?.();
    });

    (RoutineService.deleteWeeklyRoutine as jest.Mock).mockResolvedValue({ error: null });
    (RoutineService.updateWeeklyRoutine as jest.Mock).mockResolvedValue({ data: {}, error: null });

    const { getByTestId } = await render(
      <AuthContext.Provider value={{ user: { id: 'u1' } } as any}>
        <RoutineEditorScreen navigation={mockNavigation} />
      </AuthContext.Provider>
    );

    const deleteBtn = await waitFor(() => getByTestId('delete-routine-button-0'));
    fireEvent.press(deleteBtn);

    await waitFor(() => {
      expect(RoutineService.deleteWeeklyRoutine).toHaveBeenCalledWith('r1');
      expect(RoutineService.updateWeeklyRoutine).toHaveBeenCalledWith('r2', { activa: true });
    });
  });

  it('does not activate another routine when an inactive routine is deleted', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((title, msg, buttons: any) => {
      const deleteBtn = buttons?.find((b: any) => b.text === 'Eliminar' || b.style === 'destructive');
      deleteBtn?.onPress?.();
    });

    (RoutineService.deleteWeeklyRoutine as jest.Mock).mockResolvedValue({ error: null });

    const { getByTestId } = await render(
      <AuthContext.Provider value={{ user: { id: 'u1' } } as any}>
        <RoutineEditorScreen navigation={mockNavigation} />
      </AuthContext.Provider>
    );

    const deleteBtn = await waitFor(() => getByTestId('delete-routine-button-1'));
    fireEvent.press(deleteBtn);

    await waitFor(() => {
      expect(RoutineService.deleteWeeklyRoutine).toHaveBeenCalledWith('r2');
      expect(RoutineService.updateWeeklyRoutine).not.toHaveBeenCalled();
    });
  });
});

