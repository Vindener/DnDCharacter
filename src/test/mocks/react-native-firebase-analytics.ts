// Test-only stub for the native @react-native-firebase/analytics module — vitest runs in
// plain Node, so the real native binding can't load. Mirrors the two methods
// productTelemetry.ts actually calls.
function analytics() {
  return {
    logEvent: async () => undefined,
    setAnalyticsCollectionEnabled: async () => undefined,
  };
}

export default analytics;
