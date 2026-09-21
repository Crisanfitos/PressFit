// Ensure Supabase environment variables exist in CI environments (where .env is gitignored)
process.env.EXPO_PUBLIC_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key-for-jest-tests';

// Tell React 19 test environment that act(...) environment is active
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo Crypto globally
jest.mock('expo-crypto', () => ({
    randomUUID: jest.fn(() => require('crypto').randomUUID()),
}));

// Mock @expo/vector-icons to avoid expo-font/expo-asset native dependency in unit/component tests
jest.mock('@expo/vector-icons', () => {
    const mockReact = require('react');
    const { Text: mockText } = require('react-native');
    return {
        MaterialIcons: (props: any) => mockReact.createElement(mockText, { testID: `icon-${props.name}`, ...props }, props.name),
        Ionicons: (props: any) => mockReact.createElement(mockText, { testID: `icon-${props.name}`, ...props }, props.name),
        FontAwesome: (props: any) => mockReact.createElement(mockText, { testID: `icon-${props.name}`, ...props }, props.name),
    };
});

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => {
    const mockReact = require('react');
    const { View: mockView } = require('react-native');
    const MockGradient = (props: any) => mockReact.createElement(mockView, props, props.children);
    return {
        __esModule: true,
        default: MockGradient,
        LinearGradient: MockGradient,
    };
});

// Mock react-native-gifted-charts
jest.mock('react-native-gifted-charts', () => {
    const mockReact = require('react');
    const { Text: mockText } = require('react-native');
    return {
        LineChart: (props: any) => mockReact.createElement(mockText, { testID: 'line-chart-mock' }, `Points: ${props.data?.length || 0}`),
        BarChart: (props: any) => mockReact.createElement(mockText, { testID: 'bar-chart-mock' }, 'BarChart'),
        PieChart: (props: any) => mockReact.createElement(mockText, { testID: 'pie-chart-mock' }, 'PieChart'),
    };
});

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
    const mockReact = require('react');
    return {
        useNavigation: () => ({
            navigate: jest.fn(),
            goBack: jest.fn(),
            addListener: jest.fn(() => jest.fn()),
        }),
        useFocusEffect: (cb: any) => {
            mockReact.useEffect(() => {
                if (typeof cb === 'function') {
                    const cleanup = cb();
                    return () => {
                        if (typeof cleanup === 'function') cleanup();
                    };
                }
            }, [cb]);
        },
        useRoute: () => ({ params: {} }),
    };
});

// Mock Expo Notifications
jest.mock('expo-notifications', () => ({
    getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    setNotificationCategoryAsync: jest.fn().mockResolvedValue(undefined),
    setNotificationHandler: jest.fn(),
    scheduleNotificationAsync: jest.fn().mockResolvedValue('notif-id'),
    cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock ThemeContext for components that consume it
jest.mock('../../src/context/ThemeContext', () => {
    const defaultTheme = {
        mode: 'dark',
        colors: {
            background: '#0d1117',
            surface: '#161b22',
            surfaceHighlight: '#21262d',
            text: '#f0f6fc',
            textSecondary: '#8b949e',
            border: '#30363d',
            primary: '#238636',
            inputBackground: '#0d1117',
            textOnPrimary: '#ffffff',
            // M3 tokens (required by redesigned screens PF-388+)
            onSurface: '#f0f6fc',
            onSurfaceVariant: '#8b949e',
            surfaceContainerLowest: '#0d1117',
            surfaceContainerLow: '#161b22',
            surfaceContainer: '#21262d',
            surfaceContainerHigh: '#30363d',
            surfaceContainerHighest: '#3a3f47',
            outlineVariant: '#30363d',
            outline: '#8b949e',
            primaryContainer: 'rgba(35, 134, 54, 0.2)',
            onPrimary: '#ffffff',
            onPrimaryContainer: '#aff3c3',
            secondary: '#58a6ff',
            secondaryContainer: 'rgba(88, 166, 255, 0.2)',
            tertiary: '#bc8cff',
            tertiaryContainer: 'rgba(188, 140, 255, 0.2)',
            error: '#ff7b72',
            errorContainer: 'rgba(255, 123, 114, 0.2)',
        },
    };
    return {
        useTheme: () => ({
            theme: defaultTheme,
            themeMode: 'dark',
            setThemeMode: jest.fn(),
            isDark: true,
        }),
        ThemeProvider: ({ children }: { children: any }) => children,
    };
});

// Mock Supabase client
jest.mock('../../src/lib/supabase', () => ({
    supabase: {
        from: jest.fn(),
        auth: {
            getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
            signOut: jest.fn().mockResolvedValue({ error: null }),
        },
    },
}));

// Mock react-native-view-shot
jest.mock('react-native-view-shot', () => ({
    captureRef: jest.fn().mockResolvedValue('file:///mock/path/workout_card.png'),
    releaseCapture: jest.fn(),
}));

// Mock Sentry React Native globally
jest.mock('@sentry/react-native', () => ({
    init: jest.fn(),
    wrap: jest.fn((component: any) => component),
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    withScope: jest.fn((callback: (scope: any) => void) => {
        const scope = {
            setExtras: jest.fn(),
            setTag: jest.fn(),
            setUser: jest.fn(),
            setExtra: jest.fn(),
            setLevel: jest.fn(),
        };
        callback(scope);
    }),
    setUser: jest.fn(),
    addBreadcrumb: jest.fn(),
}));

import i18n from '../../src/i18n';

// Reset i18n language to Spanish before each test to guarantee deterministic UI text across environments (Linux CI vs Windows)
beforeEach(() => {
    if (i18n.language !== 'es') {
        i18n.changeLanguage('es');
    }
});

jest.setTimeout(30000);
