import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface PRBadgeProps {
    size?: 'small' | 'medium';
    style?: StyleProp<ViewStyle>;
    testID?: string;
}

export const PRBadge: React.FC<PRBadgeProps> = ({
    size = 'small',
    style,
    testID = 'pr-badge',
}) => {
    const isSmall = size === 'small';

    return (
        <View
            testID={testID}
            style={[
                styles.container,
                isSmall ? styles.containerSmall : styles.containerMedium,
                style,
            ]}
        >
            <MaterialIcons
                name="emoji-events"
                size={isSmall ? 10 : 13}
                color="#b45309"
                style={styles.icon}
            />
            <Text style={[styles.text, isSmall ? styles.textSmall : styles.textMedium]}>
                PR
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fef08a',
        borderWidth: 1,
        borderColor: '#eab308',
        borderRadius: 4,
    },
    containerSmall: {
        paddingHorizontal: 4,
        paddingVertical: 1,
        marginHorizontal: 2,
    },
    containerMedium: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginHorizontal: 4,
    },
    icon: {
        marginRight: 2,
    },
    text: {
        fontWeight: '800',
        color: '#854d0e',
        letterSpacing: 0.5,
    },
    textSmall: {
        fontSize: 9,
        lineHeight: 11,
    },
    textMedium: {
        fontSize: 11,
        lineHeight: 14,
    },
});

export default PRBadge;
