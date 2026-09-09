/**
 * SocialCardCanvas styles — ViewShot-compatible styled card for social sharing.
 *
 * Provides fixed-dimension layouts for 9:16 (Story) and 1:1 (Post) aspect ratios.
 * All styles use View/Text only (no ScrollView) for ViewShot compatibility.
 *
 * @module components/social/SocialCardCanvas.styles
 */

import { StyleSheet } from 'react-native';
import type { CardAspectRatio } from './SocialCardCanvas';

// ============================================================================
// Dimension constants
// ============================================================================

const CARD_WIDTH = 360;

export const CARD_DIMENSIONS: Record<CardAspectRatio, { width: number; height: number }> = {
  '9:16': { width: CARD_WIDTH, height: 640 },
  '1:1':  { width: CARD_WIDTH, height: 360 },
};

// ============================================================================
// Utility — format helpers
// ============================================================================

/**
 * Format workout duration from minutes into a human-readable string.
 * Returns "--" when null/undefined, "Xm" for < 60, "Xh YYm" for >= 60.
 */
export const formatDuration = (minutes: number | null | undefined): string => {
  if (minutes == null || minutes <= 0) return '--';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${h}h`;
};

/**
 * Format volume number with thousands separators and "kg" suffix.
 */
export const formatVolume = (volume: number): string => {
  if (volume <= 0) return '0 kg';
  return `${volume.toLocaleString('es-ES', { maximumFractionDigits: 0 })} kg`;
};

// ============================================================================
// Shared styles
// ============================================================================

export const styles = StyleSheet.create({
  // Container
  cardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },

  // Header gradient
  headerGradient: {
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
  },
  logoSubtext: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 4,
    marginTop: 2,
    textTransform: 'uppercase',
    opacity: 0.7,
  },

  // Title section
  titleSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  workoutName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '400',
    opacity: 0.6,
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statItem: {
    width: '50%',
    paddingHorizontal: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statItemRow: {
    width: '25%',
    paddingHorizontal: 4,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.5,
  },

  // Divider
  divider: {
    height: 1,
    marginHorizontal: 24,
    opacity: 0.15,
  },

  // PR section
  prSection: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  prTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  prItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  prEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  prText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  prWeight: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerUser: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.5,
  },
  footerBrand: {
    fontSize: 10,
    fontWeight: '400',
    opacity: 0.3,
    letterSpacing: 1,
  },
});
