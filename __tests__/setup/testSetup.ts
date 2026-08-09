// Ensure Supabase environment variables exist in CI environments (where .env is gitignored)
process.env.EXPO_PUBLIC_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key-for-jest-tests';

// Tell React 19 test environment that act(...) environment is active
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock AsyncStorage globally (required for React Native)
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock NetInfo globally for React Native network connectivity tests
jest.mock('@react-native-community/netinfo', () =>
    require('@react-native-community/netinfo/jest/netinfo-mock')
);

// Mock expo-network globally for Expo network connectivity tests
jest.mock('expo-network', () => ({
    getNetworkStateAsync: jest.fn().mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: 'WIFI',
    }),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
    const mockReact = require('react');
    const { Text: mockText } = require('react-native');
    return {
        MaterialIcons: (props: any) => mockReact.createElement(mockText, { testID: `icon-${props.name}`, ...props }, props.name),
        Ionicons: (props: any) => mockReact.createElement(mockText, { testID: `icon-${props.name}`, ...props }, props.name),
        FontAwesome: (props: any) => mockReact.createElement(mockText, { testID: `icon-${props.name}`, ...props }, props.name),
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

// Extended timeout for tests
jest.setTimeout(10000);
