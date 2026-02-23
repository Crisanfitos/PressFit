import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';

const { width } = Dimensions.get('window');

type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

interface AlertConfig {
    title?: string;
    message: string;
    type?: AlertType;
    buttons?: AlertButton[];
}

interface AlertContextType {
    showAlert: (config: AlertConfig) => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertProviderProps {
    children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
    const { theme } = useTheme();
    const { colors } = theme;
    const [visible, setVisible] = useState(false);
    const [config, setConfig] = useState<AlertConfig>({
        title: '',
        message: '',
        type: 'info',
        buttons: [{ text: 'OK' }],
    });

    const showAlert = useCallback((alertConfig: AlertConfig) => {
        setConfig({
            title: alertConfig.title,
            message: alertConfig.message,
            type: alertConfig.type || 'info',
            buttons: alertConfig.buttons || [{ text: 'OK' }],
        });
        setVisible(true);
    }, []);

    const hideAlert = useCallback(() => {
        setVisible(false);
    }, []);

    const getIconName = (type: AlertType): keyof typeof MaterialIcons.glyphMap => {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'error';
            case 'warning': return 'warning';
            case 'confirm': return 'help';
            default: return 'info';
        }
    };

    const getIconColor = (type: AlertType): string => {
        switch (type) {
            case 'success': return colors.statusSuccess;
            case 'error': return colors.statusError;
            case 'warning': return colors.statusWarning;
            default: return colors.statusInfo;
        }
    };

    const styles = StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
        },
        container: {
            width: width - 48,
            maxWidth: 340,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 24,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
        },
        iconContainer: {
            marginBottom: 16,
        },
        title: {
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: 8,
            textAlign: 'center',
        },
        message: {
            fontSize: 15,
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: 24,
            lineHeight: 22,
        },
        buttonContainer: {
            flexDirection: 'row',
            gap: 12,
            width: '100%',
        },
        button: {
            flex: 1,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
        },
        defaultButton: {
            backgroundColor: colors.primary,
        },
        cancelButton: {
            backgroundColor: colors.surfaceHighlight,
            borderWidth: 1,
            borderColor: colors.border,
        },
        destructiveButton: {
            backgroundColor: colors.statusError,
        },
        buttonText: {
            fontSize: 15,
            fontWeight: '600',
        },
        defaultButtonText: {
            color: colors.background,
        },
        cancelButtonText: {
            color: colors.text,
        },
        destructiveButtonText: {
            color: '#fff',
        },
    });

    const handleButtonPress = (button: AlertButton) => {
        hideAlert();
        if (button.onPress) {
            button.onPress();
        }
    };

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={hideAlert}
            >
                <View style={styles.overlay}>
                    <View style={styles.container}>
                        <View style={styles.iconContainer}>
                            <MaterialIcons
                                name={getIconName(config.type || 'info')}
                                size={48}
                                color={getIconColor(config.type || 'info')}
                            />
                        </View>
                        {config.title && <Text style={styles.title}>{config.title}</Text>}
                        <Text style={styles.message}>{config.message}</Text>
                        <View style={styles.buttonContainer}>
                            {config.buttons?.map((button, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.button,
                                        button.style === 'destructive' ? styles.destructiveButton :
                                            button.style === 'cancel' ? styles.cancelButton :
                                                styles.defaultButton,
                                    ]}
                                    onPress={() => handleButtonPress(button)}
                                >
                                    <Text style={[
                                        styles.buttonText,
                                        button.style === 'destructive' ? styles.destructiveButtonText :
                                            button.style === 'cancel' ? styles.cancelButtonText :
                                                styles.defaultButtonText,
                                    ]}>
                                        {button.text}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>
        </AlertContext.Provider>
    );
};

export const useAlert = (): AlertContextType => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

export { AlertContext };
