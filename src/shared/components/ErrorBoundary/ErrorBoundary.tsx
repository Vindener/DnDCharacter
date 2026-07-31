import React from 'react';
import { View } from 'react-native';
import crashlytics from '@react-native-firebase/crashlytics';
import i18n from '@/i18n';
import useThemeStore from '@/context/Theme-store';
import { Button, Text } from '@/shared/ui';
import { trackProductEvent } from '@/shared/services/telemetry/productTelemetry';
import { getStyles } from '@/shared/components/ErrorBoundary/style';

// react-i18next's useTranslation() defaults to Suspense mode and can throw a Promise
// (not an Error) while i18n is still initializing — an ErrorBoundary fallback must not
// depend on that. Calling i18n.t() directly bypasses the hook/Suspense path entirely and
// falls back to defaultValue when resources aren't loaded yet.
function translate(key: string, defaultValue: string): string {
  return i18n.t(key, { ns: 'common', defaultValue });
}

interface ErrorFallbackProps {
  onRestart: () => void;
}

function ErrorFallback({ onRestart }: ErrorFallbackProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = getStyles(colors);

  return (
    <View style={styles.container} testID='error-boundary.screen'>
      <Text variant='titleLg' weight='bold' style={styles.title}>
        {translate('errorBoundary.title', 'Something went wrong')}
      </Text>
      <Text variant='body' tone='secondary' style={styles.message}>
        {translate('errorBoundary.message', 'Your character data is safe on this device. You can try again.')}
      </Text>
      <Button
        title={translate('errorBoundary.restart', 'Restart')}
        variant='primary'
        onPress={onRestart}
        style={styles.restartButton}
        testID='error-boundary.restart'
      />
    </View>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    try {
      crashlytics().recordError(error, error.name);
    } catch {
      /* native Crashlytics module unavailable (e.g. Expo Go, unbuilt dev client) */
    }

    trackProductEvent('app_crashed', { errorName: error.name });
  }

  private handleRestart = (): void => {
    this.setState({ hasError: false });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return <ErrorFallback onRestart={this.handleRestart} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
