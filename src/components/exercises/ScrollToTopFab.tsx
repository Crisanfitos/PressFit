import React from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../types/theme';

export interface ScrollToTopFabProps {
    visible: boolean;
    opacity: Animated.Value;
    colors: ThemeColors;
    onScrollToTop: () => void;
}

export const ScrollToTopFab: React.FC<ScrollToTopFabProps> = ({
    visible,
    opacity,
    colors,
    onScrollToTop,
}) => {
    return (
        <Animated.View
            style={[
                styles.scrollTopFab,
                { backgroundColor: colors.primary, opacity },
            ]}
            pointerEvents={visible ? 'auto' : 'none'}
        >
            <TouchableOpacity onPress={onScrollToTop} style={styles.scrollTopFabInner} activeOpacity={0.8}>
                <MaterialIcons name="keyboard-arrow-up" size={28} color={colors.textOnPrimary} />
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    scrollTopFab: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        width: 48,
        height: 48,
        borderRadius: 24,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
    },
    scrollTopFabInner: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default ScrollToTopFab;
