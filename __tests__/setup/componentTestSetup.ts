// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

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

jest.setTimeout(10000);
