import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { ShareModal } from '../../src/components/social/ShareModal';
import { ShareService } from '../../src/services/ShareService';
import { SocialCardData } from '../../src/components/social/SocialCardCanvas';

jest.mock('../../src/services/ShareService', () => ({
  ShareService: {
    captureAndShare: jest.fn().mockResolvedValue({ success: true }),
    captureCard: jest.fn().mockResolvedValue('file:///tmp/mock-card.png'),
    share: jest.fn().mockResolvedValue({ success: true }),
    buildShareMessage: jest.fn().mockReturnValue('Mock Message'),
  },
}));

describe('ShareModal Component (RNTL) - PF-164', () => {
  const mockClose = jest.fn();

  const mockData: SocialCardData = {
    workoutName: 'Día de Pecho y Tríceps',
    date: '9 sept 2026',
    duration: 52,
    exerciseCount: 4,
    totalSets: 14,
    totalVolume: 12500,
    userName: 'alexfit',
    personalRecords: [
      { exerciseName: 'Press de Banca', weight: 105, reps: 5 },
    ],
  };

  const renderComponent = async (props: Partial<React.ComponentProps<typeof ShareModal>> = {}) => {
    return await render(
      <ThemeProvider>
        <ShareModal
          visible={true}
          onClose={mockClose}
          data={mockData}
          {...props}
        />
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when visible is false', async () => {
    const { queryByTestId } = await renderComponent({ visible: false });
    expect(queryByTestId('share-modal')).toBeNull();
  });

  it('renders nothing when data is null', async () => {
    const { queryByTestId } = await renderComponent({ data: null });
    expect(queryByTestId('share-modal')).toBeNull();
  });

  it('renders modal header, format tabs, card preview and action buttons when visible with data', async () => {
    const { getByTestId, getByText } = await renderComponent();

    expect(getByTestId('share-modal')).toBeTruthy();
    expect(getByText('¡Entrenamiento Completado!')).toBeTruthy();
    expect(getByText('Comparte tu progreso y celebra tu esfuerzo')).toBeTruthy();
    expect(getByTestId('share-modal-close-btn')).toBeTruthy();
    expect(getByTestId('share-modal-format-story')).toBeTruthy();
    expect(getByTestId('share-modal-format-square')).toBeTruthy();
    expect(getByTestId('share-modal-canvas')).toBeTruthy();
    expect(getByTestId('share-modal-share-btn')).toBeTruthy();
    expect(getByTestId('share-modal-done-btn')).toBeTruthy();
  });

  it('toggles aspect ratio between 9:16 (Story) and 1:1 (Square)', async () => {
    const { getByTestId } = await renderComponent();

    const storyTab = getByTestId('share-modal-format-story');
    const squareTab = getByTestId('share-modal-format-square');

    // Switch to square (1:1)
    fireEvent.press(squareTab);
    await waitFor(() => {
      const squareCard = getByTestId('share-modal-canvas');
      const squareStyle = Array.isArray(squareCard.props.style)
        ? Object.assign({}, ...squareCard.props.style)
        : squareCard.props.style;
      expect(squareStyle.height).toBe(360);
    });

    // Switch back to story (9:16)
    fireEvent.press(storyTab);
    await waitFor(() => {
      const storyCard = getByTestId('share-modal-canvas');
      const storyStyle = Array.isArray(storyCard.props.style)
        ? Object.assign({}, ...storyCard.props.style)
        : storyCard.props.style;
      expect(storyStyle.height).toBe(640);
    });
  });

  it('calls onClose when close icon button is pressed', async () => {
    const { getByTestId } = await renderComponent();

    fireEvent.press(getByTestId('share-modal-close-btn'));
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Listo button is pressed', async () => {
    const { getByTestId } = await renderComponent();

    fireEvent.press(getByTestId('share-modal-done-btn'));
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('calls ShareService.captureAndShare when Compartir button is pressed', async () => {
    const { getByTestId } = await renderComponent();

    const shareBtn = getByTestId('share-modal-share-btn');
    fireEvent.press(shareBtn);

    await waitFor(() => {
      expect(ShareService.captureAndShare).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          data: mockData,
          title: expect.stringContaining('Día de Pecho y Tríceps'),
        })
      );
    });
  });
});
