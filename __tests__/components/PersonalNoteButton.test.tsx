import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { PersonalNoteButton } from '../../src/components/PersonalNoteButton';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { useExerciseNote } from '../../src/hooks/useExerciseNote';

jest.mock('../../src/hooks/useExerciseNote');
const mockUseExerciseNote = useExerciseNote as jest.MockedFunction<typeof useExerciseNote>;

describe('PersonalNoteButton Component (RNTL)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders null when loading and no note', async () => {
    mockUseExerciseNote.mockReturnValue({
      note: null,
      loading: true,
      saving: false,
      saveNote: jest.fn(),
      refreshNote: jest.fn(),
    });

    const { queryByTestId } = await render(
      <ThemeProvider>
        <PersonalNoteButton exerciseId="ex-1" />
      </ThemeProvider>
    );

    expect(queryByTestId('add-note-button')).toBeNull();
  });

  it('renders add note placeholder button when no note exists', async () => {
    mockUseExerciseNote.mockReturnValue({
      note: null,
      loading: false,
      saving: false,
      saveNote: jest.fn(),
      refreshNote: jest.fn(),
    });

    const { getByTestId, getByText } = await render(
      <ThemeProvider>
        <PersonalNoteButton exerciseId="ex-1" />
      </ThemeProvider>
    );

    expect(getByTestId('add-note-button')).toBeTruthy();
    expect(getByText(/Añadir nota personal/i)).toBeTruthy();
  });

  it('opens modal and allows typing and saving new note', async () => {
    const mockSaveNote = jest.fn().mockResolvedValue({ success: true, error: null });
    mockUseExerciseNote.mockReturnValue({
      note: null,
      loading: false,
      saving: false,
      saveNote: mockSaveNote,
      refreshNote: jest.fn(),
    });

    const { getByTestId } = await render(
      <ThemeProvider>
        <PersonalNoteButton exerciseId="ex-1" />
      </ThemeProvider>
    );

    fireEvent.press(getByTestId('add-note-button'));

    let input: any;
    await waitFor(() => {
      input = getByTestId('note-text-input');
      expect(input).toBeTruthy();
    });

    await act(async () => {
      fireEvent.changeText(input, 'Mantener codos a 45 grados');
    });

    await act(async () => {
      fireEvent.press(getByTestId('note-save-button'));
    });

    await waitFor(() => {
      expect(mockSaveNote).toHaveBeenCalledWith('Mantener codos a 45 grados');
    });
  });

  it('renders existing note and opens edit modal', async () => {
    const mockSaveNote = jest.fn().mockResolvedValue({ success: true, error: null });
    mockUseExerciseNote.mockReturnValue({
      note: 'Espalda recta y codos cerrados',
      loading: false,
      saving: false,
      saveNote: mockSaveNote,
      refreshNote: jest.fn(),
    });

    const { getByTestId, findByTestId } = await render(
      <ThemeProvider>
        <PersonalNoteButton exerciseId="ex-1" />
      </ThemeProvider>
    );

    expect(await findByTestId('note-display-text')).toBeTruthy();

    fireEvent.press(getByTestId('edit-note-button'));

    const cancelBtn = await findByTestId('note-cancel-button');
    expect(cancelBtn).toBeTruthy();

    fireEvent.press(cancelBtn);
  });
});
