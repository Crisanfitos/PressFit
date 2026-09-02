import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top' | 'bottom';

export interface ToastConfig {
  message: string;
  title?: string;
  type?: ToastType;
  duration?: number;
  position?: ToastPosition;
  onPress?: () => void;
  onDismiss?: () => void;
}

export interface ToastProps {
  visible: boolean;
  config: ToastConfig | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ visible, config, onDismiss }) => {
  const { theme } = useTheme();
  const { colors } = theme;

  const position = config?.position || 'top';
  const type = config?.type || 'info';
  const duration =
    config?.duration ??
    (type === 'error' || type === 'warning' ? 5000 : 3000);

  const translateY = useRef(new Animated.Value(position === 'bottom' ? 60 : -60)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const getIconName = (t: ToastType): keyof typeof MaterialIcons.glyphMap => {
    switch (t) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getIconColor = (t: ToastType): string => {
    switch (t) {
      case 'success':
        return colors.statusSuccess;
      case 'error':
        return colors.statusError;
      case 'warning':
        return colors.statusWarning;
      default:
        return colors.statusInfo;
    }
  };

  const dismissWithAnimation = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (activeAnimRef.current) {
      activeAnimRef.current.stop();
    }

    const dismissAnim = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(translateY, {
        toValue: position === 'bottom' ? 60 : -60,
        duration: 200,
        useNativeDriver: false,
      }),
    ]);
    activeAnimRef.current = dismissAnim;
    dismissAnim.start(() => {
      onDismiss();
      if (config?.onDismiss) {
        config.onDismiss();
      }
    });
  }, [opacity, translateY, position, onDismiss, config]);

  useEffect(() => {
    if (visible && config) {
      translateY.setValue(position === 'bottom' ? 60 : -60);
      opacity.setValue(0);

      if (activeAnimRef.current) {
        activeAnimRef.current.stop();
      }

      const enterAnim = Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
      ]);
      activeAnimRef.current = enterAnim;
      enterAnim.start();

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      if (duration > 0) {
        timerRef.current = setTimeout(() => {
          dismissWithAnimation();
        }, duration);
      }
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (activeAnimRef.current) {
        activeAnimRef.current.stop();
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (activeAnimRef.current) {
        activeAnimRef.current.stop();
      }
    };
  }, [visible, config, duration, position, dismissWithAnimation]);

  if (!visible || !config) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      left: 16,
      right: 16,
      [position]: 24,
      zIndex: 9999,
      alignItems: 'center',
    },
    toastBox: {
      width: Math.min(width - 32, 420),
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderLeftWidth: 4,
      borderLeftColor: getIconColor(type),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    iconWrap: {
      marginRight: 12,
    },
    contentWrap: {
      flex: 1,
    },
    title: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 2,
    },
    message: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    closeButton: {
      padding: 4,
      marginLeft: 8,
    },
  });

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View
        testID="toast-box"
        style={[
          styles.toastBox,
          {
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
          activeOpacity={config.onPress ? 0.7 : 1}
          onPress={config.onPress ? config.onPress : undefined}
          disabled={!config.onPress}
          testID="toast-touchable"
        >
          <View style={styles.iconWrap}>
            <MaterialIcons
              name={getIconName(type)}
              size={24}
              color={getIconColor(type)}
            />
          </View>
          <View style={styles.contentWrap}>
            {config.title && (
              <Text style={styles.title} numberOfLines={1} testID="toast-title">
                {config.title}
              </Text>
            )}
            <Text style={styles.message} numberOfLines={2} testID="toast-message">
              {config.message}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={dismissWithAnimation}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID="toast-dismiss-button"
        >
          <MaterialIcons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};
