import React, { ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SentryService } from '../services/SentryService';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        SentryService.captureException(error, { errorInfo });
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return <DefaultErrorFallback onRetry={this.handleRetry} error={this.state.error} />;
        }

        return this.props.children;
    }
}

const DefaultErrorFallback: React.FC<{ onRetry: () => void; error: Error | null }> = ({ onRetry }) => {
    const { theme } = useTheme();
    const { colors } = theme;

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
        },
        iconContainer: {
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: theme.mode === 'dark' ? '#3b1d1d' : '#fee2e2',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
        },
        title: {
            fontSize: 22,
            fontWeight: 'bold',
            color: colors.text,
            textAlign: 'center',
            marginBottom: 10,
        },
        message: {
            fontSize: 16,
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: 24,
            lineHeight: 22,
        },
        retryButton: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.primary,
            paddingVertical: 14,
            paddingHorizontal: 24,
            borderRadius: 12,
            gap: 8,
        },
        retryButtonText: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#fff',
        },
    });

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialIcons name="error-outline" size={36} color="#ef4444" />
      </View>
      <Text style={styles.title}>¡Ups! Algo salió mal</Text>
      <Text style={styles.message}>
        Ha ocurrido un error inesperado al renderizar esta pantalla. Por favor, reintenta o vuelve a cargar la app.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <MaterialIcons name="refresh" size={20} color="#fff" />
        <Text style={styles.retryButtonText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ErrorBoundary;
