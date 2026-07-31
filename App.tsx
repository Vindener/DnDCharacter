import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import crashlytics from '@react-native-firebase/crashlytics';
import AppNavigator from './src/navigation/AppNavigator';
// PERF-4: 'expo-dev-client' patches the release bundle's dev menu/inspector hooks in even
// when built for production, so it's only pulled in when running in a dev build.
if (__DEV__) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- conditional side-effect import can't be a static `import`
  require('expo-dev-client');
}
import { AuthProvider, useAuth } from '@/shared/services/auth/auth';
import Toast from 'react-native-toast-message';
import { initI18n } from '@/i18n';
import useThemeStore from '@/context/Theme-store';
import { markStartup, printStartupTrace } from '@/shared/services/telemetry/startupTrace';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary/ErrorBoundary';

const AppStatusBar = () => {
  const isDark = useThemeStore((s) => s.isDark);

  return <StatusBar style={isDark ? 'light' : 'dark'} />;
};

// REL-1 / P3.4: keeps Crashlytics' user association in sync with both auth state and the
// user's analytics consent (CLAUDE.md §8.1) — no consent means no uid on crash reports.
const CrashlyticsUserBinding = () => {
  const { user } = useAuth();
  const analyticsConsentEnabled = useThemeStore((s) => s.analyticsConsentEnabled);

  React.useEffect(() => {
    const uid = analyticsConsentEnabled && user ? user.uid : '';
    void crashlytics()
      .setUserId(uid)
      .catch(() => {
        /* intentionally ignored */
      });
  }, [user, analyticsConsentEnabled]);

  return null;
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
    <ErrorBoundary>
      <AuthProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <AppStatusBar />
            <CrashlyticsUserBinding />
            <NavigatorRenderProbe>
              <AppNavigator />
            </NavigatorRenderProbe>
            <Toast />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </AuthProvider>
    </ErrorBoundary>
  );
}
