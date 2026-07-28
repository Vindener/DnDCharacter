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
import { markStartup, printStartupTrace } from '@/shared/services/telemetry/startupTrace';

const AppStatusBar = () => {
  const isDark = useThemeStore((s) => s.isDark);

  return <StatusBar style={isDark ? 'light' : 'dark'} />;
};

// PERF-1: fires once after AppNavigator's sibling subtree first commits — a proxy for
// "AppNavigator first render" that doesn't require touching anything under src/navigation.
// This is the last of the 5 startup marks chronologically, so the one summary print lives here.
function NavigatorRenderProbe({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    markStartup('navigator-first-render');
    printStartupTrace();
  }, []);

  return <>{children}</>;
}

export default function App() {
  markStartup('app-start');
  const [isI18nReady, setIsI18nReady] = React.useState(false);

  React.useEffect(() => {
    initI18n()
      .catch((error) => {
        console.warn('[i18n] Failed to initialize:', error);
      })
      .finally(() => {
        markStartup('i18n-ready');
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
          <NavigatorRenderProbe>
            <AppNavigator />
          </NavigatorRenderProbe>
          <Toast />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
