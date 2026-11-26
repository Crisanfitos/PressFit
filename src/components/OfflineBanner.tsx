import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { NetworkService } from '../services/NetworkService';
import { SyncService } from '../services/SyncService';
import { HapticService } from '../services/HapticService';

export interface OfflineBannerProps {
  /** Optional override for testing or manual visibility control */
  isOffline?: boolean;
  /** Optional callback invoked when the user taps the manual retry button */
  onRetry?: () => void | Promise<void>;
}

const HIDDEN_TRANSLATE_Y = -120;

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOffline: overrideOffline,
  onRetry,
}) => {
  const { t } = useTranslation();
  const networkStatus = useNetworkStatus();
  const isOffline = overrideOffline !== undefined ? overrideOffline : networkStatus.isOffline;

  const insets = useContext(SafeAreaInsetsContext);
  const fallbackTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const topInset = insets ? insets.top : fallbackTop;

  const [wasOffline, setWasOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const animY = useRef(new Animated.Value(HIDDEN_TRANSLATE_Y)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const isMountedRef = useRef(true);
  const isRetryingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isOffline) {
      setWasOffline(true);
      setShowRestored(false);
      Animated.parallel([
        Animated.timing(animY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (wasOffline) {
      // Transitioning back online
      setShowRestored(true);
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(animY, {
            toValue: HIDDEN_TRANSLATE_Y,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (isMountedRef.current) {
            setShowRestored(false);
            setWasOffline(false);
          }
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOffline, wasOffline, animY, opacityAnim]);

  const handleRetry = async () => {
    if (isRetryingRef.current) return;
    isRetryingRef.current = true;
    setIsRetrying(true);
    HapticService.selection?.();
    try {
      if (onRetry) {
        await onRetry();
      }
      const freshState = networkStatus.refresh
        ? await networkStatus.refresh()
        : NetworkService.refreshNetworkState
          ? await NetworkService.refreshNetworkState()
          : await NetworkService.getNetworkState();

      if (freshState && !freshState.isOffline && freshState.isConnected && SyncService?.processQueue) {
        await SyncService.processQueue().catch(() => {});
      }
    } finally {
      isRetryingRef.current = false;
      if (isMountedRef.current) {
        setIsRetrying(false);
      }
    }
  };

  if (!isOffline && !showRestored) {
    return null;
  }

  const isRestored = !isOffline && showRestored;

  return (
    <Animated.View
      testID="offline-banner"
      accessibilityRole="alert"
      style={[
        styles.banner,
        {
          paddingTop: topInset + 8,
          paddingBottom: 8,
        },
        isRestored ? styles.bannerRestored : styles.bannerOffline,
        {
          transform: [{ translateY: animY }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.contentRow}>
        <View style={styles.messageRow}>
          <MaterialIcons
            name={isRestored ? 'wifi' : 'wifi-off'}
            size={18}
            color="#FFFFFF"
            testID={isRestored ? 'icon-wifi' : 'icon-wifi-off'}
          />
          <Text style={styles.bannerText} numberOfLines={2}>
            {isRestored
              ? t('network.restoredBanner', 'Conexión restablecida — Sincronizando cambios')
              : t('network.offlineBanner', 'Modo Offline — Los cambios se guardarán localmente')}
          </Text>
        </View>

        {!isRestored && (
          <TouchableOpacity
            testID="offline-retry-button"
            accessibilityRole="button"
            accessibilityLabel={t('network.retryConnection', 'Reintentar conexión')}
            disabled={isRetrying}
            onPress={handleRetry}
            style={[styles.retryButton, isRetrying && styles.retryButtonDisabled]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.75}
          >
            {isRetrying ? (
              <ActivityIndicator size="small" color="#FFFFFF" testID="offline-retry-spinner" />
            ) : (
              <>
                <MaterialIcons name="refresh" size={16} color="#FFFFFF" testID="icon-refresh" />
                <Text style={styles.retryButtonText}>{t('network.retry', 'Reintentar')}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    paddingHorizontal: 16,
    zIndex: 9999,
  },
  bannerOffline: {
    backgroundColor: '#DC2626',
  },
  bannerRestored: {
    backgroundColor: '#059669',
  },
  contentRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  messageRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  retryButtonDisabled: {
    opacity: 0.75,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default OfflineBanner;
