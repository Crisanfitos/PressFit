import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { PersonalNoteButton } from '../../src/components/PersonalNoteButton';
import { useExerciseNote } from '../../src/hooks/useExerciseNote';

jest.mock('../../src/hooks/useExerciseNote');

const mockUseExerciseNote = useExerciseNote as jest.MockedFunction<typeof useExerciseNote>;

describe('PersonalNoteButton Component (RNTL)', () => {
    const mockSaveNote = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseExerciseNote.mockReturnValue({
            note: null,
            loading: false,
            saving: false,
            saveNote: mockSaveNote,
            loadNote: jest.fn(),
        } as any);
    });

    it('renders placeholder text when exercise has no personal note', async () => {
        const { getByText } = await render(<PersonalNoteButton exerciseId="ex-1" />);
        expect(getByText('Añadir nota personal...')).toBeTruthy();
    });

    it('renders existing note text when exercise note exists', async () => {
        mockUseExerciseNote.mockReturnValue({
            note: 'Mantener la espalda recta',
            loading: false,
            saving: false,
            saveNote: mockSaveNote,
            loadNote: jest.fn(),
        } as any);

        const { getByText } = await render(<PersonalNoteButton exerciseId="ex-1" />);
        expect(getByText('Mantener la espalda recta')).toBeTruthy();
    });

    it('expands and collapses long text when Ver más is pressed', async () => {
        const longText = 'A'.repeat(160);
        mockUseExerciseNote.mockReturnValue({
            note: longText,
            loading: false,
            saving: false,
            saveNote: mockSaveNote,
            loadNote: jest.fn(),
        } as any);

        const { getByText, findByText } = await render(<PersonalNoteButton exerciseId="ex-1" />);
        expect(getByText('Ver más')).toBeTruthy();

        fireEvent.press(getByText('Ver más'));
        expect(await findByText('Ver menos')).toBeTruthy();
    });
});
