/**
 * SocialCardCanvas — Styled achievement/workout summary card for social sharing.
 *
 * Pure presentational component that renders a fixed-size card with PressFit
 * branding, workout stats, and optional Personal Records. Designed to be
 * captured by react-native-view-shot in PF-163.
 *
 * Supports two aspect ratios:
 *  - '9:16' (Instagram Story) — default
 *  - '1:1'  (Instagram Post / Square)
 *
 * @module components/social/SocialCardCanvas
 */

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import {
  styles,
  CARD_DIMENSIONS,
  formatDuration,
  formatVolume,
} from './SocialCardCanvas.styles';

// ============================================================================
// Types
// ============================================================================

export type CardAspectRatio = '9:16' | '1:1';

export interface PersonalRecordHighlight {
  exerciseName: string;
  weight: number;
  reps: number;
}

export interface SocialCardData {
  workoutName: string;
  date: string;
  duration: number | null;
  exerciseCount: number;
  totalSets: number;
  totalVolume: number;
  personalRecords?: PersonalRecordHighlight[];
  userName?: string;
}

export interface SocialCardCanvasProps {
  data: SocialCardData;
  aspectRatio?: CardAspectRatio;
  testID?: string;
}

// ============================================================================
// Stats item data
// ============================================================================

interface StatEntry {
  value: string;
  label: string;
}

const buildStats = (data: SocialCardData): StatEntry[] => [
  { value: formatDuration(data.duration), label: 'Duración' },
  { value: String(data.exerciseCount), label: 'Ejercicios' },
  { value: String(data.totalSets), label: 'Series' },
  { value: formatVolume(data.totalVolume), label: 'Volumen' },
];

// ============================================================================
// Component
// ============================================================================

const SocialCardCanvas: React.FC<SocialCardCanvasProps> = ({
  data,
  aspectRatio = '9:16',
  testID,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const dimensions = CARD_DIMENSIONS[aspectRatio];
  const isSquare = aspectRatio === '1:1';
  const stats = useMemo(() => buildStats(data), [data]);
  const hasPRs = (data.personalRecords?.length ?? 0) > 0;

  return (
    <View
      testID={testID ?? 'social-card-canvas'}
      style={[
        styles.cardContainer,
        {
          width: dimensions.width,
          height: dimensions.height,
          backgroundColor: colors.background,
        },
      ]}
    >
      {/* ── Header gradient ── */}
      <LinearGradient
        colors={[colors.primary, colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerGradient}
      >
        <Text
          testID="social-card-logo"
          style={[styles.logoText, { color: colors.primaryText }]}
        >
          PRESSFIT
        </Text>
        <Text style={[styles.logoSubtext, { color: colors.primaryText }]}>
          WORKOUT TRACKER
        </Text>
      </LinearGradient>

      {/* ── Title section ── */}
      <View style={styles.titleSection}>
        <Text
          testID="social-card-workout-name"
          style={[styles.workoutName, { color: colors.text }]}
          numberOfLines={2}
        >
          {data.workoutName}
        </Text>
        <Text
          testID="social-card-date"
          style={[styles.dateText, { color: colors.text }]}
        >
          {data.date}
        </Text>
      </View>

      {/* ── Stats grid ── */}
      <View
        testID="social-card-stats"
        style={styles.statsGrid}
      >
        {stats.map((stat, index) => (
          <View
            key={stat.label}
            style={isSquare ? styles.statItemRow : styles.statItem}
          >
            <Text
              testID={`social-card-stat-value-${index}`}
              style={[styles.statValue, { color: colors.primary }]}
            >
              {stat.value}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* ── Divider ── */}
      {hasPRs && (
        <View style={[styles.divider, { backgroundColor: colors.text }]} />
      )}

      {/* ── PR section (conditional) ── */}
      {hasPRs && (
        <View testID="social-card-prs" style={styles.prSection}>
          <Text style={[styles.prTitle, { color: colors.primary }]}>
            🏆 Personal Records
          </Text>
          {data.personalRecords!.map((pr, idx) => (
            <View key={`pr-${idx}`} style={styles.prItem}>
              <Text style={styles.prEmoji}>💪</Text>
              <Text style={[styles.prText, { color: colors.text }]}>
                {pr.exerciseName}
              </Text>
              <Text style={[styles.prWeight, { color: colors.primary }]}>
                {pr.weight}kg × {pr.reps}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Footer ── */}
      <View style={[styles.footer, { marginTop: 'auto' as unknown as number }]}>
        {data.userName ? (
          <Text
            testID="social-card-username"
            style={[styles.footerUser, { color: colors.text }]}
          >
            @{data.userName}
          </Text>
        ) : (
          <View />
        )}
        <Text style={[styles.footerBrand, { color: colors.text }]}>
          powered by PressFit
        </Text>
      </View>
    </View>
  );
};

export default SocialCardCanvas;
