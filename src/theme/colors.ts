export const palette = {
    // Brand
    primary: '#13ec6d',
    primaryDark: '#0fb854',
    primaryLight: 'rgba(19, 236, 109, 0.2)',

    // Grayscale Dark
    black: '#000000',
    zinc950: '#0a0a0a',
    zinc900: '#18181b',
    zinc800: '#27272a',
    zinc700: '#3f3f46',
    zinc500: '#71717a',
    zinc400: '#a1a1aa',
    zinc300: '#d4d4d8',
    white: '#ffffff',

    // Grayscale Light
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray500: '#6b7280',
    gray800: '#1f2937',
    gray900: '#111827',

    // Status - Enhanced contrast for accessibility
    success: '#00C851',      // Intenso verde para "Completado"
    successBg: 'rgba(0, 200, 81, 0.2)',
    warning: '#FF9F1A',      // Naranja-amarillo para "En progreso"
    warningBg: 'rgba(255, 159, 26, 0.2)',
    info: '#60a5fa',
    infoBg: 'rgba(59, 130, 246, 0.15)',
    error: '#FF3B30',        // Rojo intenso para "Sin hacer"
    errorBg: 'rgba(255, 59, 48, 0.15)',
};

export interface ThemeColors {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    background: string;
    backgroundDark: string;
    surface: string;
    surfaceHighlight: string;
    text: string;
    textSecondary: string;
    border: string;
    inputBackground: string;
    statusSuccess: string;
    statusSuccessBg: string;
    statusWarning: string;
    statusWarningBg: string;
    statusInfo: string;
    statusInfoBg: string;
    statusError: string;
    statusErrorBg: string;
    tabBar: string;
    headerBackground: string;
    // Aliases for compatibility
    success?: string;
    info?: string;
    error?: string;
}

export interface Theme {
    mode: 'dark' | 'light';
    colors: ThemeColors;
}

export const themes: { dark: Theme; light: Theme } = {
    dark: {
        mode: 'dark',
        colors: {
            primary: palette.primary,
            primaryDark: palette.primaryDark,
            primaryLight: palette.primaryLight,
            background: '#102218',
            backgroundDark: '#102218',
            surface: 'rgba(24, 24, 27, 0.6)',
            surfaceHighlight: palette.zinc800,
            text: palette.white,
            textSecondary: palette.zinc400,
            border: 'rgba(255, 255, 255, 0.1)',
            inputBackground: palette.zinc900,

            // Status
            statusSuccess: palette.success,
            statusSuccessBg: palette.successBg,
            statusWarning: palette.warning,
            statusWarningBg: palette.warningBg,
            statusInfo: palette.info,
            statusInfoBg: palette.infoBg,
            statusError: palette.error,
            statusErrorBg: palette.errorBg,

            // Aliases
            success: palette.success,
            info: palette.info,
            error: palette.error,

            // Navigation
            tabBar: 'rgba(16, 34, 24, 0.95)',
            headerBackground: 'rgba(16, 34, 24, 0.8)',
        }
    },
    light: {
        mode: 'light',
        colors: {
            primary: '#13ec6d',
            primaryDark: '#059669',
            primaryLight: 'rgba(19, 236, 109, 0.1)',

            background: '#f4f7f5',
            backgroundDark: '#ffffff',
            surface: '#ffffff',
            surfaceHighlight: '#f0fdf4',
            inputBackground: '#ffffff',

            text: '#102218',
            textSecondary: '#52525b',

            border: '#e4e4e7',

            statusSuccess: '#16a34a',
            statusSuccessBg: '#dcfce7',
            statusWarning: '#ca8a04',
            statusWarningBg: '#fef9c3',
            statusInfo: '#2563eb',
            statusInfoBg: '#dbeafe',
            statusError: '#dc2626',
            statusErrorBg: '#fee2e2',

            // Aliases
            success: '#16a34a',
            info: '#2563eb',
            error: '#dc2626',

            tabBar: 'rgba(255, 255, 255, 0.9)',
            headerBackground: 'rgba(255, 255, 255, 0.8)',
        }
    }
};

// Backward compatibility
export const colors = themes.dark.colors;
