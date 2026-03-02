import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

export interface MenuItem {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
}

interface SideDrawerProps {
  visible: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
}

export const SideDrawer: React.FC<SideDrawerProps> = ({ visible, onClose, menuItems }) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateX, overlayOpacity]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        </Animated.View>

        <Animated.View
          style={[
            styles.drawer,
            {
              width: DRAWER_WIDTH,
              backgroundColor: colors.background,
              borderRightColor: colors.border,
              transform: [{ translateX }],
            },
          ]}
        >
          <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
            <MaterialIcons name="fitness-center" size={28} color={colors.primary} />
            <Text style={[styles.drawerTitle, { color: colors.text }]}>PressFit</Text>
          </View>

          <View style={styles.menuList}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  onClose();
                  item.onPress();
                }}
                activeOpacity={0.7}
              >
                <MaterialIcons name={item.icon} size={24} color={colors.textSecondary} />
                <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRightWidth: 1,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    gap: 12,
  },
  drawerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  menuList: {
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 16,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
});
