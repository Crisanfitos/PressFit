import React, { useEffect, useRef, useState } from 'react';
import { Text, Animated, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export interface OfflineBannerProps {
  /** Optional override for testing or manual visibility control */
  isOffline?: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOffline: overrideOffline }) => {
  const networkStatus = useNetworkStatus();
  const isOffline = overrideOffline !== undefined ? overrideOffline : networkStatus.isOffline;

  const [wasOffline, setWasOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);

  const animY = useRef(new Animated.Value(-60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

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
            toValue: -60,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowRestored(false);
          setWasOffline(false);
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOffline, wasOffline]);

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
        isRestored ? styles.bannerRestored : styles.bannerOffline,
        {
          transform: [{ translateY: animY }],
          opacity: opacityAnim,
        },
      ]}
    >
      <MaterialIcons
        name={isRestored ? 'wifi' : 'wifi-off'}
        size={18}
        color="#FFFFFF"
        testID={isRestored ? 'icon-wifi' : 'icon-wifi-off'}
      />
      <Text style={styles.bannerText}>
        {isRestored
          ? 'Conexión restablecida — Sincronizando cambios'
          : 'Modo Offline — Los cambios se guardarán localmente'}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 9999,
  },
  bannerOffline: {
    backgroundColor: '#DC2626', // Vibrant modern red
  },
  bannerRestored: {
    backgroundColor: '#059669', // Emerald green
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default OfflineBanner;
