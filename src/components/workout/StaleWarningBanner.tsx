import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface StaleWarningBannerProps {
    daysDiff?: number | string;
}

export const StaleWarningBanner: React.FC<StaleWarningBannerProps> = ({ daysDiff }) => {
    return (
        <View style={styles.banner} testID="stale-warning-banner">
            <MaterialIcons name="warning-amber" size={20} color="#d97706" style={{ marginRight: 8 }} />
            <Text style={styles.text}>
                Referencia de hace {daysDiff ?? '15+'} días (&gt;14 días). Considera ajustar las cargas sugeridas.
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef3c7',
        borderColor: '#f59e0b',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    text: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: '#92400e',
    },
});

export default StaleWarningBanner;
