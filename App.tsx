import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import 'expo-dev-client';
import { AuthProvider } from '@/shared/services/auth/auth';
import Toast from 'react-native-toast-message';
import { initI18n } from '@/i18n';
import useThemeStore from '@/context/Theme-store';

const AppStatusBar = () => {
  const isDark = useThemeStore((s) => s.isDark);

  return <StatusBar style={isDark ? 'light' : 'dark'} />;
};

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
        <SafeAreaProvider>
          <AppStatusBar />
          <AppNavigator />
          <Toast />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
