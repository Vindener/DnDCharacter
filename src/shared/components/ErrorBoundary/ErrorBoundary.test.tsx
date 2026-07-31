import React from 'react';
import { Text } from 'react-native';
import { act, create } from 'react-test-renderer';
import type { ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary/ErrorBoundary';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  recordError: vi.fn(),
  trackProductEvent: vi.fn(),
}));

vi.mock('@react-native-firebase/crashlytics', () => ({
  default: () => ({
    recordError: mocks.recordError,
    setUserId: vi.fn(async () => null),
  }),
}));

vi.mock('@/shared/services/telemetry/productTelemetry', () => ({
  trackProductEvent: mocks.trackProductEvent,
}));

vi.mock('@/i18n', () => ({
  default: {
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
  },
}));

vi.mock('@/context/Theme-store', async () => {
  const { darkColors } = await import('@/shared/styles/theme');
  return {
    default: <T,>(selector: (state: { colors: typeof darkColors }) => T): T => selector({ colors: darkColors }),
  };
});

let shouldThrow = true;

function Bomb(): React.ReactElement {
  if (shouldThrow) {
    throw new Error('boom');
  }
  return <Text testID='bomb.ok'>OK</Text>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = true;
    mocks.recordError.mockClear();
    mocks.trackProductEvent.mockClear();
  });

  it('renders children when nothing throws', () => {
    let tree!: ReactTestRenderer;

    act(() => {
      tree = create(
        <ErrorBoundary>
          <Text testID='child'>OK</Text>
        </ErrorBoundary>,
      );
    });

    expect(tree.root.findByProps({ testID: 'child' })).toBeTruthy();
    expect(mocks.recordError).not.toHaveBeenCalled();

    act(() => tree.unmount());
  });

  it('shows the recovery screen and logs to Crashlytics and telemetry when a child throws', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let tree!: ReactTestRenderer;

    act(() => {
      tree = create(
        <ErrorBoundary>
          <Bomb />
        </ErrorBoundary>,
      );
    });

    expect(tree.root.findByProps({ testID: 'error-boundary.screen' })).toBeTruthy();
    expect(tree.root.findByProps({ testID: 'error-boundary.restart' })).toBeTruthy();
    expect(mocks.recordError).toHaveBeenCalledTimes(1);
    expect(mocks.trackProductEvent).toHaveBeenCalledWith('app_crashed', { errorName: 'Error' });

    act(() => tree.unmount());
    consoleErrorSpy.mockRestore();
  });

  it('restart button clears the error and re-renders children', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let tree!: ReactTestRenderer;

    act(() => {
      tree = create(
        <ErrorBoundary>
          <Bomb />
        </ErrorBoundary>,
      );
    });

    expect(tree.root.findByProps({ testID: 'error-boundary.screen' })).toBeTruthy();

    shouldThrow = false;
    act(() => {
      tree.root.findByProps({ testID: 'error-boundary.restart' }).props.onPress();
    });

    expect(tree.root.findByProps({ testID: 'bomb.ok' })).toBeTruthy();
    expect(() => tree.root.findByProps({ testID: 'error-boundary.screen' })).toThrow();

    act(() => tree.unmount());
    consoleErrorSpy.mockRestore();
  });
});
