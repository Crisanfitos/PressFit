/**
 * Component tests for SocialCardCanvas.
 *
 * Verifies rendering with different data scenarios and aspect ratios.
 * PF-162
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../src/context/ThemeContext';
import SocialCardCanvas from '../../src/components/social/SocialCardCanvas';
import type { SocialCardData } from '../../src/components/social/SocialCardCanvas';

// ============================================================================
// Test data
// ============================================================================

const minimalData: SocialCardData = {
  workoutName: 'Push Day',
  date: '09 Sep 2026',
  duration: 55,
  exerciseCount: 5,
  totalSets: 20,
  totalVolume: 8500,
};

const fullData: SocialCardData = {
  ...minimalData,
  personalRecords: [
    { exerciseName: 'Bench Press', weight: 120, reps: 5 },
    { exerciseName: 'Overhead Press', weight: 70, reps: 8 },
  ],
  userName: 'fituser',
};

const dataWithNullDuration: SocialCardData = {
  ...minimalData,
  duration: null,
};

// ============================================================================
// Tests
// ============================================================================

describe('SocialCardCanvas (PF-162)', () => {
  describe('Rendering with minimal data (no PRs, no username)', () => {
    it('renders card container with testID', async () => {
      const { getByTestId } = await render(
        <ThemeProvider>
          <SocialCardCanvas data={minimalData} />
        </ThemeProvider>
      );
      expect(getByTestId('social-card-canvas')).toBeTruthy();
    });

    it('renders the PressFit logo', async () => {
      const { getByTestId } = await render(
        <ThemeProvider>
          <SocialCardCanvas data={minimalData} />
        </ThemeProvider>
      );
      expect(getByTestId('social-card-logo')).toBeTruthy();
    });

    it('renders workout name', async () => {
      const { getByText } = await render(
        <ThemeProvider>
          <SocialCardCanvas data={minimalData} />
        </ThemeProvider>
      );
      expect(getByText('Push Day')).toBeTruthy();
    });

    it('renders the date', async () => {
      const { getByText } = await render(
        <ThemeProvider>
          <SocialCardCanvas data={minimalData} />
        </ThemeProvider>
      );
      expect(getByText('09 Sep 2026')).toBeTruthy();
    });

    it('renders stats grid with 4 stat values', async () => {
      const { getByTestId } = await render(
        <ThemeProvider>
          <SocialCardCanvas data={minimalData} />
        </ThemeProvider>
      );
      expect(getByTestId('social-card-stats')).toBeTruthy();
      expect(getByTestId('social-card-stat-value-0')).toBeTruthy();
      expect(getByTestId('social-card-stat-value-1')).toBeTruthy();
      expect(getByTestId('social-card-stat-value-2')).toBeTruthy();
      expect(getByTestId('social-card-stat-value-3')).toBeTruthy();
    });

    it('does not render PR section when no PRs', async () => {
      const { queryByTestId } = await render(
        <ThemeProvider>
          <SocialCardCanvas data={minimalData} />
        </ThemeProvider>
      );
      expect(queryByTestId('social-card-prs')).toBeNull();
    });

    it('does not render username when not provided', async () => {
      const { queryByTestId } = await render(
        <ThemeProvider>
          <SocialCardCanvas data={minimalData} />
        </ThemeProvider>
      );
      expect(queryByTestId('social-card-username')).toBeNull();
    });
  });

  describe('Rendering with full data (PRs + username)', () => {
    it('renders PR section when personalRecords are provided', async () => {
      const { getByTestId } = await render(
        <ThemeProvider>
          <SocialCardCanvas data={fullData} />
        </ThemeProvider>
      );
      expect(getByTestId('social-card-prs')).toBeTruthy();
    });

    it('renders username', async () => {
      const { getByTestId } = await render(
        <ThemeProvider>
          <SocialCardCanvas data={fullData} />
        </ThemeProvider>
      );
      expect(getByTestId('social-card-username')).toBeTruthy();
    });

    it('renders PR exercise names', async () => {
      const { getByText } = await render(
        <ThemeProvider>
          <SocialCardCanvas data={fullData} />
        </ThemeProvider>
      );
      expect(getByText('Bench Press')).toBeTruthy();
      expect(getByText('Overhead Press')).toBeTruthy();
    });
  });

  describe('Null duration handling', () => {
    it('renders "--" for duration when null', async () => {
      const { getByText } = await render(
        <ThemeProvider>
          <SocialCardCanvas data={dataWithNullDuration} />
        </ThemeProvider>
      );
      expect(getByText('--')).toBeTruthy();
    });
  });

  describe('Aspect ratio support', () => {
    it('defaults to 9:16 aspect ratio', async () => {
      const { getByTestId } = await render(
        <ThemeProvider>
          <SocialCardCanvas data={minimalData} />
        </ThemeProvider>
      );
      const card = getByTestId('social-card-canvas');
      const flatStyle = Array.isArray(card.props.style)
        ? Object.assign({}, ...card.props.style)
        : card.props.style;
      expect(flatStyle.width).toBe(360);
      expect(flatStyle.height).toBe(640);
    });

    it('renders with 1:1 aspect ratio when specified', async () => {
      const { getByTestId } = await render(
        <ThemeProvider>
          <SocialCardCanvas data={minimalData} aspectRatio="1:1" />
        </ThemeProvider>
      );
      const card = getByTestId('social-card-canvas');
      const flatStyle = Array.isArray(card.props.style)
        ? Object.assign({}, ...card.props.style)
        : card.props.style;
      expect(flatStyle.width).toBe(360);
      expect(flatStyle.height).toBe(360);
    });
  });

  describe('Custom testID', () => {
    it('applies custom testID when provided', async () => {
      const { getByTestId } = await render(
        <ThemeProvider>
          <SocialCardCanvas data={minimalData} testID="custom-card" />
        </ThemeProvider>
      );
      expect(getByTestId('custom-card')).toBeTruthy();
    });
  });

  describe('Empty personalRecords array', () => {
    it('does not render PR section when personalRecords is empty array', async () => {
      const dataWithEmptyPRs: SocialCardData = {
        ...minimalData,
        personalRecords: [],
      };
      const { queryByTestId } = await render(
        <ThemeProvider>
          <SocialCardCanvas data={dataWithEmptyPRs} />
        </ThemeProvider>
      );
      expect(queryByTestId('social-card-prs')).toBeNull();
    });
  });
});
