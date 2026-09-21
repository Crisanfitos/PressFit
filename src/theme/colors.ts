export const palette = {
    // Brand PressFit / Stitch M3
    primaryDarkMint: '#9fffac',
    primaryContainerDarkMint: '#13ec6d',
    primaryLightNavy: '#00236f',
    primaryContainerLightNavy: '#1e3a8a',

    // Grayscale / Dark Surfaces
    backgroundDark: '#131316',
    surfaceDark: '#131316',
    surfaceContainerLowestDark: '#0e0e11',
    surfaceContainerLowDark: '#1b1b1e',
    surfaceContainerDark: '#1f1f22',
    surfaceContainerHighDark: '#2a2a2d',
    surfaceContainerHighestDark: '#353438',
    surfaceBrightDark: '#39393c',

    // Grayscale / Light Surfaces
    backgroundLight: '#faf8ff',
    surfaceLight: '#faf8ff',
    surfaceContainerLowestLight: '#ffffff',
    surfaceContainerLowLight: '#f2f3ff',
    surfaceContainerLight: '#eaedff',
    surfaceContainerHighLight: '#e2e7ff',
    surfaceContainerHighestLight: '#dae2fd',
    surfaceBrightLight: '#faf8ff',

    // Status - Accessible contrast
    success: '#00C851',
    successBg: 'rgba(0, 200, 81, 0.2)',
    warning: '#FF9F1A',
    warningBg: 'rgba(255, 159, 26, 0.2)',
    info: '#60a5fa',
    infoBg: 'rgba(59, 130, 246, 0.15)',
    errorDark: '#ffb4ab',
    errorContainerDark: '#93000a',
    errorLight: '#ba1a1a',
    errorContainerLight: '#ffdad6',

    // Legacy Grayscale
    black: '#000000',
    white: '#ffffff',
    zinc950: '#0a0a0a',
    zinc900: '#18181b',
    zinc800: '#27272a',
    zinc700: '#3f3f46',
    zinc500: '#71717a',
    zinc400: '#a1a1aa',
    zinc300: '#d4d4d8',
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray500: '#6b7280',
    gray800: '#1f2937',
    gray900: '#111827',
};

export interface ThemeColors {
    // Material 3 Primary Palette
    primary: string;
    primaryContainer: string;
    onPrimary: string;
    onPrimaryContainer: string;
    inversePrimary: string;
    primaryFixed: string;
    primaryFixedDim: string;
    onPrimaryFixed: string;
    onPrimaryFixedVariant: string;

    // Material 3 Secondary Palette
    secondary: string;
    secondaryContainer: string;
    onSecondary: string;
    onSecondaryContainer: string;
    secondaryFixed: string;
    secondaryFixedDim: string;
    onSecondaryFixed: string;
    onSecondaryFixedVariant: string;

    // Material 3 Tertiary Palette
    tertiary: string;
    tertiaryContainer: string;
    onTertiary: string;
    onTertiaryContainer: string;
    tertiaryFixed: string;
    tertiaryFixedDim: string;
    onTertiaryFixed: string;
    onTertiaryFixedVariant: string;

    // Material 3 Surface Hierarchy
    background: string;
    onBackground: string;
    surface: string;
    onSurface: string;
    surfaceDim: string;
    surfaceBright: string;
    surfaceContainerLowest: string;
    surfaceContainerLow: string;
    surfaceContainer: string;
    surfaceContainerHigh: string;
    surfaceContainerHighest: string;
    surfaceVariant: string;
    onSurfaceVariant: string;
    surfaceTint: string;
    inverseSurface: string;
    inverseOnSurface: string;

    // Material 3 Outlines & Borders
    outline: string;
    outlineVariant: string;

    // Material 3 Error Palette
    error: string;
    errorContainer: string;
    onError: string;
    onErrorContainer: string;

    // Backward Compatibility Tokens
    primaryDark: string;
    primaryLight: string;
    primaryText: string;
    backgroundDark: string;
    surfaceHighlight: string;
    text: string;
    textSecondary: string;
    textOnPrimary: string;
    border: string;
    inputBackground: string;
    tabBar: string;
    headerBackground: string;

    // Status System
    statusSuccess: string;
    statusSuccessBg: string;
    statusSuccessText: string;
    statusSummaryContextText: string;
    statusWarning: string;
    statusWarningBg: string;
    statusWarningText: string;
    statusInfo: string;
    statusInfoBg: string;
    statusInfoText: string;
    statusError: string;
    statusErrorBg: string;
    statusErrorText: string;

    // Short Status Aliases
    success?: string;
    info?: string;

    // Optional Kebab-case index signature for dynamic or Tailwind-like lookup
    [key: string]: string | undefined;
}

export interface Theme {
    mode: 'dark' | 'light';
    colors: ThemeColors;
    isDark?: boolean;
}

export const themes: { dark: Theme; light: Theme } = {
    dark: {
        mode: 'dark',
        isDark: true,
        colors: {
            // M3 Primary
            primary: '#9fffac',
            primaryContainer: '#13ec6d',
            onPrimary: '#003914',
            onPrimaryContainer: '#00652a',
            inversePrimary: '#006e2e',
            primaryFixed: '#67ff8c',
            primaryFixedDim: '#00e468',
            onPrimaryFixed: '#002109',
            onPrimaryFixedVariant: '#005321',

            // M3 Secondary
            secondary: '#b6ccbc',
            secondaryContainer: '#384b3f',
            onSecondary: '#223429',
            onSecondaryContainer: '#a5baab',
            secondaryFixed: '#d2e8d8',
            secondaryFixedDim: '#b6ccbc',
            onSecondaryFixed: '#0d1f15',
            onSecondaryFixedVariant: '#384b3f',

            // M3 Tertiary
            tertiary: '#a0ffa7',
            tertiaryContainer: '#45ea6e',
            onTertiary: '#003911',
            onTertiaryContainer: '#006525',
            tertiaryFixed: '#6aff86',
            tertiaryFixedDim: '#3ce368',
            onTertiaryFixed: '#002107',
            onTertiaryFixedVariant: '#00531d',

            // M3 Surfaces
            background: '#131316',
            onBackground: '#e4e1e6',
            surface: '#131316',
            onSurface: '#e4e1e6',
            surfaceDim: '#131316',
            surfaceBright: '#39393c',
            surfaceContainerLowest: '#0e0e11',
            surfaceContainerLow: '#1b1b1e',
            surfaceContainer: '#1f1f22',
            surfaceContainerHigh: '#2a2a2d',
            surfaceContainerHighest: '#353438',
            surfaceVariant: '#353438',
            onSurfaceVariant: '#bacbb8',
            surfaceTint: '#00e468',
            inverseSurface: '#e4e1e6',
            inverseOnSurface: '#303033',

            // M3 Outlines
            outline: '#859583',
            outlineVariant: '#3b4b3c',

            // M3 Error
            error: '#ffb4ab',
            errorContainer: '#93000a',
            onError: '#690005',
            onErrorContainer: '#ffdad6',

            // Backward Compatibility
            primaryDark: '#00e468',
            primaryLight: 'rgba(159, 255, 172, 0.2)',
            primaryText: '#003914',
            backgroundDark: '#0e0e11',
            surfaceHighlight: '#2a2a2d',
            text: '#e4e1e6',
            textSecondary: '#bacbb8',
            textOnPrimary: '#003914',
            border: '#3b4b3c',
            inputBackground: '#1b1b1e',
            tabBar: 'rgba(14, 14, 17, 0.95)',
            headerBackground: 'rgba(19, 19, 22, 0.9)',

            // Status
            statusSuccess: '#00C851',
            statusSuccessBg: 'rgba(0, 200, 81, 0.2)',
            statusSuccessText: '#003914',
            statusSummaryContextText: '#003914',
            statusWarning: '#FF9F1A',
            statusWarningBg: 'rgba(255, 159, 26, 0.2)',
            statusWarningText: '#102218',
            statusInfo: '#60a5fa',
            statusInfoBg: 'rgba(59, 130, 246, 0.15)',
            statusInfoText: '#ffffff',
            statusError: '#ffb4ab',
            statusErrorBg: 'rgba(147, 0, 10, 0.25)',
            statusErrorText: '#ffffff',

            // Aliases
            success: '#00C851',
            info: '#60a5fa',

            // Kebab-case mappings for Tailwind consistency
            'surface-container-lowest': '#0e0e11',
            'surface-container-low': '#1b1b1e',
            'surface-container': '#1f1f22',
            'surface-container-high': '#2a2a2d',
            'surface-container-highest': '#353438',
            'surface-bright': '#39393c',
            'surface-dim': '#131316',
            'surface-variant': '#353438',
            'surface-tint': '#00e468',
            'on-surface': '#e4e1e6',
            'on-surface-variant': '#bacbb8',
            'outline-variant': '#3b4b3c',
            'primary-container': '#13ec6d',
            'on-primary': '#003914',
            'on-primary-container': '#00652a',
            'secondary-container': '#384b3f',
            'on-secondary': '#223429',
            'on-secondary-container': '#a5baab',
            'tertiary-container': '#45ea6e',
            'on-tertiary': '#003911',
            'on-tertiary-container': '#006525',
            'error-container': '#93000a',
            'on-error': '#690005',
            'on-error-container': '#ffdad6',
            'inverse-surface': '#e4e1e6',
            'inverse-on-surface': '#303033',
            'inverse-primary': '#006e2e',
        }
    },
    light: {
        mode: 'light',
        isDark: false,
        colors: {
            // M3 Primary
            primary: '#00236f',
            primaryContainer: '#1e3a8a',
            onPrimary: '#ffffff',
            onPrimaryContainer: '#90a8ff',
            inversePrimary: '#b6c4ff',
            primaryFixed: '#dce1ff',
            primaryFixedDim: '#b6c4ff',
            onPrimaryFixed: '#00164e',
            onPrimaryFixedVariant: '#264191',

            // M3 Secondary
            secondary: '#9d4300',
            secondaryContainer: '#fd761a',
            onSecondary: '#ffffff',
            onSecondaryContainer: '#5c2400',
            secondaryFixed: '#ffdbca',
            secondaryFixedDim: '#ffb690',
            onSecondaryFixed: '#341100',
            onSecondaryFixedVariant: '#783200',

            // M3 Tertiary
            tertiary: '#4e0058',
            tertiaryContainer: '#720080',
            onTertiary: '#ffffff',
            onTertiaryContainer: '#f57cff',
            tertiaryFixed: '#ffd6fb',
            tertiaryFixedDim: '#fda9ff',
            onTertiaryFixed: '#36003d',
            onTertiaryFixedVariant: '#7d008c',

            // M3 Surfaces
            background: '#faf8ff',
            onBackground: '#131b2e',
            surface: '#faf8ff',
            onSurface: '#131b2e',
            surfaceDim: '#d2d9f4',
            surfaceBright: '#faf8ff',
            surfaceContainerLowest: '#ffffff',
            surfaceContainerLow: '#f2f3ff',
            surfaceContainer: '#eaedff',
            surfaceContainerHigh: '#e2e7ff',
            surfaceContainerHighest: '#dae2fd',
            surfaceVariant: '#dae2fd',
            onSurfaceVariant: '#444651',
            surfaceTint: '#4059aa',
            inverseSurface: '#283044',
            inverseOnSurface: '#eef0ff',

            // M3 Outlines
            outline: '#757682',
            outlineVariant: '#c5c5d3',

            // M3 Error
            error: '#ba1a1a',
            errorContainer: '#ffdad6',
            onError: '#ffffff',
            onErrorContainer: '#93000a',

            // Backward Compatibility
            primaryDark: '#00164e',
            primaryLight: 'rgba(0, 35, 111, 0.1)',
            primaryText: '#ffffff',
            backgroundDark: '#ffffff',
            surfaceHighlight: '#e2e7ff',
            text: '#131b2e',
            textSecondary: '#444651',
            textOnPrimary: '#ffffff',
            border: '#c5c5d3',
            inputBackground: '#f2f3ff',
            tabBar: 'rgba(255, 255, 255, 0.95)',
            headerBackground: 'rgba(250, 248, 255, 0.9)',

            // Status
            statusSuccess: '#16a34a',
            statusSuccessBg: '#dcfce7',
            statusSuccessText: '#ffffff',
            statusSummaryContextText: '#131b2e',
            statusWarning: '#ca8a04',
            statusWarningBg: '#fef9c3',
            statusWarningText: '#ffffff',
            statusInfo: '#2563eb',
            statusInfoBg: '#dbeafe',
            statusInfoText: '#ffffff',
            statusError: '#ba1a1a',
            statusErrorBg: '#ffdad6',
            statusErrorText: '#ffffff',

            // Aliases
            success: '#16a34a',
            info: '#2563eb',

            // Kebab-case mappings for Tailwind consistency
            'surface-container-lowest': '#ffffff',
            'surface-container-low': '#f2f3ff',
            'surface-container': '#eaedff',
            'surface-container-high': '#e2e7ff',
            'surface-container-highest': '#dae2fd',
            'surface-bright': '#faf8ff',
            'surface-dim': '#d2d9f4',
            'surface-variant': '#dae2fd',
            'surface-tint': '#4059aa',
            'on-surface': '#131b2e',
            'on-surface-variant': '#444651',
            'outline-variant': '#c5c5d3',
            'primary-container': '#1e3a8a',
            'on-primary': '#ffffff',
            'on-primary-container': '#90a8ff',
            'secondary-container': '#fd761a',
            'on-secondary': '#ffffff',
            'on-secondary-container': '#5c2400',
            'tertiary-container': '#720080',
            'on-tertiary': '#ffffff',
            'on-tertiary-container': '#f57cff',
            'error-container': '#ffdad6',
            'on-error': '#ffffff',
            'on-error-container': '#93000a',
            'inverse-surface': '#283044',
            'inverse-on-surface': '#eef0ff',
            'inverse-primary': '#b6c4ff',
        }
    }
};

// Backward compatibility export
export const colors = themes.dark.colors;
