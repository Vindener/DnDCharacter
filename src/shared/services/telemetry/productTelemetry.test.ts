import { beforeEach, describe, expect, it, vi } from 'vitest';

const { storage, asyncStorageMock, analyticsMock, analyticsFactoryMock } = vi.hoisted(() => {
  const storage = new Map<string, string>();
  const analyticsMock = {
    logEvent: vi.fn(async () => undefined),
    setAnalyticsCollectionEnabled: vi.fn(async () => undefined),
  };
  return {
    storage,
    asyncStorageMock: {
      getItem: vi.fn(async (key: string) => (storage.has(key) ? storage.get(key)! : null)),
      setItem: vi.fn(async (key: string, value: string) => {
        storage.set(key, value);
      }),
    },
    analyticsMock,
    analyticsFactoryMock: vi.fn(() => analyticsMock),
  };
});

vi.mock('@react-native-async-storage/async-storage', () => ({ default: asyncStorageMock }));
vi.mock('@react-native-firebase/analytics', () => ({ default: analyticsFactoryMock }));

import { getProductEvents, isAnalyticsConsentEnabled, setAnalyticsConsent, trackProductEvent } from './productTelemetry';

describe('productTelemetry', () => {
  beforeEach(() => {
    storage.clear();
    setAnalyticsConsent(false);
    vi.clearAllMocks();
  });

  it('defaults to / resets to consent disabled', () => {
    expect(isAnalyticsConsentEnabled()).toBe(false);
  });

  it('when consent is disabled, trackProductEvent does not call analytics and does not write the local buffer', async () => {
    trackProductEvent('app_open');

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(analyticsMock.logEvent).not.toHaveBeenCalled();
    expect(asyncStorageMock.setItem).not.toHaveBeenCalled();
    await expect(getProductEvents()).resolves.toEqual([]);
  });

  it('when consent is enabled, trackProductEvent logs to analytics and writes the local buffer', async () => {
    setAnalyticsConsent(true);
    vi.clearAllMocks(); // drop the setAnalyticsCollectionEnabled(true) call made by setAnalyticsConsent itself

    trackProductEvent('app_open', { source: 'test' });

    await vi.waitFor(() => {
      expect(asyncStorageMock.setItem).toHaveBeenCalled();
    });

    expect(analyticsMock.logEvent).toHaveBeenCalledWith('app_open', { source: 'test' });

    const events = await getProductEvents();
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe('app_open');
    expect(events[0].payload).toEqual({ source: 'test' });
  });

  it('setAnalyticsConsent forwards the choice to analytics().setAnalyticsCollectionEnabled', () => {
    setAnalyticsConsent(true);
    expect(analyticsMock.setAnalyticsCollectionEnabled).toHaveBeenCalledWith(true);
    expect(isAnalyticsConsentEnabled()).toBe(true);

    setAnalyticsConsent(false);
    expect(analyticsMock.setAnalyticsCollectionEnabled).toHaveBeenCalledWith(false);
    expect(isAnalyticsConsentEnabled()).toBe(false);
  });
});
