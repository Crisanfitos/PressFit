import React from 'react';
import './src/i18n';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { AlertProvider } from './src/context/AlertContext';
import RootNavigator from './src/navigation/RootNavigator';
import { ErrorReportingService } from './src/services/ErrorReportingService';
import { OfflineBanner } from './src/components/OfflineBanner';
import { checkActiveRestTimer, cancelTimerNotification } from './src/services/TimerNotificationService';
import { OfflineStorageService } from './src/services/OfflineStorageService';
import { SyncService } from './src/services/SyncService';

ErrorReportingService.init();


function App() {
  React.useEffect(() => {
    OfflineStorageService.initialize().catch(() => { });
    checkActiveRestTimer().then(({ active }) => {
      if (!active) {
        cancelTimerNotification().catch(() => { });
      }
    }).catch(() => { });

    const unsubscribeSync = SyncService.initNetworkListener();
    return () => {
      unsubscribeSync();
    };
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

export default App;
