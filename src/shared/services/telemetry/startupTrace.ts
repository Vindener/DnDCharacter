// PERF-1: minimal startup-timing marks that work in a release build too — always on in DEV,
// gated behind EXPO_PUBLIC_STARTUP_TRACE=1 otherwise. This module only MEASURES; it must not
// grow into an optimization (no lazy-loading, no module restructuring here).
//
// Origin: React Native's own runtime sets global.__BUNDLE_START_TIME__ before any bundle
// module executes, which is the closest available "true" start of JS bundle evaluation
// (earlier than any mark our own code could record). We fall back to the first mark's own
// timestamp when that global isn't present (e.g. running under vitest).

export type StartupMark = {
  name: string;
  atMs: number;
  sinceStartMs: number;
  sincePrevMs: number;
};

function isDev(): boolean {
  return typeof __DEV__ !== 'undefined' && Boolean(__DEV__);
}

export function isStartupTraceEnabled(): boolean {
  return isDev() || process.env.EXPO_PUBLIC_STARTUP_TRACE === '1';
}

function getBundleStartMs(): number | undefined {
  const rnGlobals = globalThis as unknown as { __BUNDLE_START_TIME__?: number };
  return typeof rnGlobals.__BUNDLE_START_TIME__ === 'number' ? rnGlobals.__BUNDLE_START_TIME__ : undefined;
}

const marks: StartupMark[] = [];
const seenNames = new Set<string>();
let startMs: number | null = null;

// Idempotent by name: a mark call sitting in a component body/effect can legitimately fire
// more than once (re-renders, remounts) without skewing the recorded deltas.
export function markStartup(name: string): void {
  if (!isStartupTraceEnabled() || seenNames.has(name)) return;
  seenNames.add(name);

  const atMs = Date.now();
  if (startMs === null) startMs = getBundleStartMs() ?? atMs;
  const prevMs = marks.length ? marks[marks.length - 1].atMs : startMs;
  marks.push({ name, atMs, sinceStartMs: atMs - startMs, sincePrevMs: atMs - prevMs });
}

export function getStartupMarks(): StartupMark[] {
  return [...marks];
}

// Test-only: lets each test start from a clean slate instead of sharing module-level state.
export function resetStartupTraceForTests(): void {
  marks.length = 0;
  seenNames.clear();
  startMs = null;
}

export function printStartupTrace(): void {
  if (!isStartupTraceEnabled() || !marks.length) return;

  if (isDev() && typeof console.table === 'function') {
    console.table(
      marks.map((mark) => ({
        mark: mark.name,
        '+prev (ms)': mark.sincePrevMs,
        '+start (ms)': mark.sinceStartMs,
      })),
    );
    return;
  }

  // Release path: one line per mark, adb logcat-friendly (a multi-line table gets split
  // across separate logcat entries and loses its shape).
  console.log('[startup-trace] ---- PERF-1 startup summary ----');
  marks.forEach((mark) => {
    console.log(`[startup-trace] ${mark.name} +${mark.sincePrevMs}ms (t+${mark.sinceStartMs}ms)`);
  });
}
