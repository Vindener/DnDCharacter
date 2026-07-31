// Test-only stub for the native @react-native-firebase/crashlytics module — vitest runs in
// plain Node, so the real native binding can't load. Mirrors the two methods ErrorBoundary.tsx
// and App.tsx actually call.
function crashlytics() {
  return {
    recordError: () => undefined,
    setUserId: async () => null,
  };
}

export default crashlytics;
