import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BrokenPRDetail } from '../../services/PersonalRecordService';
import { HapticService } from '../../services/HapticService';

export interface PRCelebrationModalProps {
    visible: boolean;
    exerciseName: string;
    brokenPRs: BrokenPRDetail[];
    onClose: () => void;
    onShare?: () => void;
    colors?: {
        surface?: string;
        surfaceHighlight?: string;
        text?: string;
        textSecondary?: string;
        primary?: string;
        border?: string;
        [key: string]: any;
    };
}

export const PRCelebrationModal: React.FC<PRCelebrationModalProps> = ({
    visible,
    exerciseName,
    brokenPRs = [],
    onClose,
    onShare,
    colors,
}) => {
    if (!visible) return null;

    const surfaceBg = colors?.surface || '#1e293b';
    const textColor = colors?.text || '#ffffff';
    const textSec = colors?.textSecondary || '#94a3b8';
    const primaryColor = colors?.primary || '#f59e0b';
    const borderColor = colors?.border || '#334155';

    const handleContinue = () => {
        HapticService.selection();
        onClose();
    };

    const handleShare = () => {
        HapticService.selection();
        if (onShare) {
            onShare();
        }
    };

    const getIconForPRType = (type: string) => {
        switch (type) {
            case 'weight':
                return 'fitness-center';
            case 'volume':
                return 'trending-up';
            case '1rm':
                return 'flash-on';
            default:
                return 'emoji-events';
        }
    };

    const getTypeName = (type: string) => {
        switch (type) {
            case 'weight':
                return 'Peso Máximo';
            case 'volume':
                return 'Tonelaje de Serie';
            case '1rm':
                return 'Mejor 1RM Estimado';
            default:
                return 'Récord Personal';
        }
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={handleContinue}
            statusBarTranslucent
        >
            <View testID="pr-celebration-modal" style={styles.overlay}>
                <Pressable
                    testID="pr-celebration-backdrop"
                    style={styles.backdrop}
                    onPress={handleContinue}
                />
                <View
                    style={[
                        styles.card,
                        {
                            backgroundColor: surfaceBg,
                            borderColor: borderColor,
                        },
                    ]}
                >
                    {/* Header Trophy Banner */}
                    <View style={styles.trophyContainer}>
                        <View style={styles.trophyGlow}>
                            <MaterialIcons name="emoji-events" size={48} color="#eab308" />
                        </View>
                    </View>

                    <Text style={styles.celebrationSub}>¡NUEVO RÉCORD PERSONAL!</Text>
                    <Text style={[styles.exerciseTitle, { color: textColor }]} numberOfLines={2}>
                        {exerciseName}
                    </Text>

                    {/* Broken PR list */}
                    <View style={styles.prList}>
                        {brokenPRs.map((pr, index) => {
                            const diff = Math.round((pr.newValue - pr.previousValue) * 100) / 100;
                            const hasPrevious = pr.previousValue > 0;

                            return (
                                <View
                                    key={`${pr.type}-${index}`}
                                    testID={`pr-broken-item-${index}`}
                                    style={[
                                        styles.prItem,
                                        {
                                            backgroundColor: colors?.surfaceHighlight || '#334155',
                                            borderColor: '#ca8a04',
                                        },
                                    ]}
                                >
                                    <View style={styles.prItemHeader}>
                                        <MaterialIcons
                                            name={getIconForPRType(pr.type) as any}
                                            size={18}
                                            color="#eab308"
                                            style={{ marginRight: 6 }}
                                        />
                                        <Text style={styles.prItemType}>{getTypeName(pr.type)}</Text>
                                    </View>

                                    <View style={styles.prValuesRow}>
                                        <Text style={[styles.newValueText, { color: textColor }]}>
                                            {pr.newValue} kg
                                        </Text>
                                        {hasPrevious && (
                                            <View style={styles.diffBadge}>
                                                <Text style={styles.diffText}>
                                                    +{diff} kg (antes {pr.previousValue} kg)
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Action buttons */}
                    <View style={styles.actionsContainer}>
                        {Boolean(onShare) && (
                            <TouchableOpacity
                                testID="pr-modal-share-button"
                                style={[styles.secondaryButton, { borderColor: primaryColor }]}
                                onPress={handleShare}
                                activeOpacity={0.8}
                            >
                                <MaterialIcons
                                    name="share"
                                    size={18}
                                    color={primaryColor}
                                    style={{ marginRight: 6 }}
                                />
                                <Text style={[styles.secondaryButtonText, { color: primaryColor }]}>
                                    Compartir
                                </Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            testID="pr-modal-continue-button"
                            style={[
                                styles.primaryButton,
                                { backgroundColor: primaryColor },
                                !onShare && { flex: 1 },
                            ]}
                            onPress={handleContinue}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.primaryButtonText}>¡A por más!</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 20,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    card: {
        width: '100%',
        maxWidth: 380,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1.5,
        shadowColor: '#eab308',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    trophyContainer: {
        marginBottom: 12,
    },
    trophyGlow: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(234, 179, 8, 0.18)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#eab308',
    },
    celebrationSub: {
        fontSize: 13,
        fontWeight: '900',
        color: '#eab308',
        letterSpacing: 1.2,
        marginBottom: 4,
    },
    exerciseTitle: {
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 16,
    },
    prList: {
        width: '100%',
        marginBottom: 20,
    },
    prItem: {
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
    },
    prItemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    prItemType: {
        fontSize: 12,
        fontWeight: '700',
        color: '#eab308',
        textTransform: 'uppercase',
    },
    prValuesRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    newValueText: {
        fontSize: 20,
        fontWeight: '900',
    },
    diffBadge: {
        backgroundColor: 'rgba(34, 197, 94, 0.18)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginLeft: 8,
    },
    diffText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#22c55e',
    },
    actionsContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    primaryButton: {
        flex: 2,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '800',
    },
    secondaryButton: {
        flex: 1.2,
        height: 48,
        borderRadius: 12,
        borderWidth: 1.5,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: '700',
    },
});

export default PRCelebrationModal;
