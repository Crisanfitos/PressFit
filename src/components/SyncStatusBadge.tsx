import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SyncService } from '../services/SyncService';

interface SyncStatusBadgeProps {
  hasPendingSync?: boolean;
  isSynced?: boolean;
  compact?: boolean;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  hasPendingSync,
  isSynced,
  compact = false,
}) => {
  const { colors, isDark } = useTheme();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const fadeAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    let isMounted = true;
    const checkQueue = async () => {
      const res = await SyncService.getQueue();
      if (isMounted) {
        setPendingCount(res.data?.length || 0);
      }
    };
    checkQueue();
    const interval = setInterval(checkQueue, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const showPending = hasPendingSync !== undefined ? hasPendingSync : pendingCount > 0;
  const showSynced = isSynced !== undefined ? isSynced : false;

  if (!showPending && !showSynced) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.badgeContainer,
        showPending ? styles.pendingBadge : styles.syncedBadge,
        showPending
          ? { backgroundColor: isDark ? '#451a03' : '#fef3c7', borderColor: isDark ? '#b45309' : '#f59e0b' }
          : { backgroundColor: isDark ? '#064e3b' : '#d1fae5', borderColor: isDark ? '#047857' : '#10b981' },
        { opacity: fadeAnim },
      ]}
      testID="sync-status-badge"
    >
      <Ionicons
        name={showPending ? 'cloud-upload-outline' : 'checkmark-circle-outline'}
        size={compact ? 12 : 14}
        color={showPending ? (isDark ? '#fbbf24' : '#d97706') : (isDark ? '#34d399' : '#059669')}
        style={styles.icon}
      />
      <Text
        style={[
          styles.badgeText,
          compact && styles.compactText,
          { color: showPending ? (isDark ? '#fef3c7' : '#92400e') : (isDark ? '#a7f3d0' : '#065f46') },
        ]}
      >
        {showPending ? 'Guardado localmente' : 'Sincronizado'}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  pendingBadge: {},
  syncedBadge: {},
  icon: {
    marginRight: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  compactText: {
    fontSize: 10,
  },
});
