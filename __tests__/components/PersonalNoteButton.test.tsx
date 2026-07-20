import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { PersonalNoteButton } from '../../src/components/PersonalNoteButton';
import { useExerciseNote } from '../../src/hooks/useExerciseNote';

jest.mock('../../src/hooks/useExerciseNote');

const mockUseExerciseNote = useExerciseNote as jest.MockedFunction<typeof useExerciseNote>;

describe('PersonalNoteButton Component (RNTL)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders placeholder text when exercise has no personal note', async () => {
        mockUseExerciseNote.mockReturnValue({
            note: null,
            loading: false,
            saving: false,
            saveNote: jest.fn(),
        } as any);

        const { getByText } = await render(
            <PersonalNoteButton exerciseId="ex-1" />
        );

        expect(getByText('Añadir nota personal...')).toBeTruthy();
    });

    it('renders existing note text when exercise note exists', async () => {
        mockUseExerciseNote.mockReturnValue({
            note: 'Codos bien cerrados al bajar',
            loading: false,
            saving: false,
            saveNote: jest.fn(),
        } as any);

        const { getByText } = await render(
            <PersonalNoteButton exerciseId="ex-1" />
        );

        expect(getByText('Codos bien cerrados al bajar')).toBeTruthy();
    });

    it('opens modal when clicking placeholder, allowing user to edit and save note', async () => {
        const mockSaveNote = jest.fn().mockResolvedValue({ success: true });
        mockUseExerciseNote.mockReturnValue({
            note: 'Nota inicial',
            loading: false,
            saving: false,
            saveNote: mockSaveNote,
        } as any);

        const { getByText, findByText, findByDisplayValue, rerender } = await render(
            <PersonalNoteButton exerciseId="ex-1" />
        );

        // Edit button ✏️
        fireEvent.press(getByText('✏️'));

        expect(await findByText('Nota Personal')).toBeTruthy();

        const input = await findByDisplayValue('Nota inicial');
        fireEvent.changeText(input, 'Mantener la vista al frente');

        await rerender(<PersonalNoteButton exerciseId="ex-1" />);

        await act(async () => {
            fireEvent.press(getByText('Guardar'));
        });

        expect(mockSaveNote).toHaveBeenCalledWith('Mantener la vista al frente');
    });
});
