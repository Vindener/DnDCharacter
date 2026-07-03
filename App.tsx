import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import 'expo-dev-client';
import { AuthProvider } from '@/shared/services/auth/auth';
import Toast from 'react-native-toast-message';
import { initI18n } from '@/i18n';

export default function App() {
  const [isI18nReady, setIsI18nReady] = React.useState(false);

  React.useEffect(() => {
    initI18n()
      .catch((error) => {
        console.warn('[i18n] Failed to initialize:', error);
      })
      .finally(() => {
        setIsI18nReady(true);
      });
  }, []);

  if (!isI18nReady) {
    return null;
  }

  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppNavigator />
        <Toast />
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
