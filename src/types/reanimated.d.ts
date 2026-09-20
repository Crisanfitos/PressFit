import 'react-native';

declare module 'react-native' {
    interface ImageProps {
        sharedTransitionTag?: string;
    }
    interface ViewProps {
        sharedTransitionTag?: string;
    }
}
