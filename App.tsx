import React from 'react';
import './src/i18n';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { AlertProvider } from './src/context/AlertContext';
import RootNavigator from './src/navigation/RootNavigator';
import { SentryService } from './src/services/SentryService';
import { OfflineBanner } from './src/components/OfflineBanner';
import { checkActiveRestTimer, cancelTimerNotification } from './src/services/TimerNotificationService';
import { OfflineStorageService } from './src/services/OfflineStorageService';

SentryService.init();


export default function App() {
  React.useEffect(() => {
    OfflineStorageService.initialize().catch(() => { });
    checkActiveRestTimer().then(({ active }) => {
      if (!active) {
        cancelTimerNotification().catch(() => { });
      }
    }).catch(() => { });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <AlertProvider>
              <OfflineBanner />
              <RootNavigator />
            </AlertProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
