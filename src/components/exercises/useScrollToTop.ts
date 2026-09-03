import { useState, useRef, useEffect, useCallback } from 'react';
import { FlatList, Animated } from 'react-native';

export const useScrollToTop = (threshold = 6) => {
    const flatListRef = useRef<FlatList>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const scrollTopOpacity = useRef(new Animated.Value(0)).current;

    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 10 }).current;
    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
            if (viewableItems.length === 0) return;
            const minIndex = Math.min(...viewableItems.map((v) => v.index ?? 0));
            setShowScrollTop(minIndex >= threshold);
        }
    ).current;

    useEffect(() => {
        Animated.timing(scrollTopOpacity, {
            toValue: showScrollTop ? 1 : 0,
            duration: 250,
            useNativeDriver: true,
        }).start();
    }, [showScrollTop, scrollTopOpacity]);

    const handleScrollToTop = useCallback(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, []);

    return {
        flatListRef,
        showScrollTop,
        scrollTopOpacity,
        onViewableItemsChanged,
        viewabilityConfig,
        handleScrollToTop,
    };
};
