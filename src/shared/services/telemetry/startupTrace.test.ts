import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getStartupMarks,
  isStartupTraceEnabled,
  markStartup,
  printStartupTrace,
  resetStartupTraceForTests,
} from '@/shared/services/telemetry/startupTrace';

const ORIGINAL_ENV_FLAG = process.env.EXPO_PUBLIC_STARTUP_TRACE;

function setDev(value: boolean | undefined) {
  if (value === undefined) {
    vi.unstubAllGlobals();
    return;
  }
  vi.stubGlobal('__DEV__', value);
}

beforeEach(() => {
  resetStartupTraceForTests();
  delete process.env.EXPO_PUBLIC_STARTUP_TRACE;
  setDev(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  if (ORIGINAL_ENV_FLAG === undefined) {
    delete process.env.EXPO_PUBLIC_STARTUP_TRACE;
  } else {
    process.env.EXPO_PUBLIC_STARTUP_TRACE = ORIGINAL_ENV_FLAG;
  }
});

describe('isStartupTraceEnabled', () => {
  it('is disabled by default (no __DEV__, no env flag) — the release default', () => {
    expect(isStartupTraceEnabled()).toBe(false);
  });

  it('is enabled when __DEV__ is true', () => {
    setDev(true);
    expect(isStartupTraceEnabled()).toBe(true);
  });

  it('is enabled in a release-like environment when EXPO_PUBLIC_STARTUP_TRACE=1', () => {
    process.env.EXPO_PUBLIC_STARTUP_TRACE = '1';
    expect(isStartupTraceEnabled()).toBe(true);
  });

  it('stays disabled for any other value of the env flag', () => {
    process.env.EXPO_PUBLIC_STARTUP_TRACE = 'true';
    expect(isStartupTraceEnabled()).toBe(false);
  });
});

describe('markStartup', () => {
  it('records nothing when tracing is disabled', () => {
    markStartup('entry');
    expect(getStartupMarks()).toEqual([]);
  });

  it('records marks with deltas from the previous mark and from the trace start, once enabled', () => {
    setDev(true);
    const dateSpy = vi.spyOn(Date, 'now');
    dateSpy.mockReturnValueOnce(1_000).mockReturnValueOnce(1_120).mockReturnValueOnce(1_500);

    markStartup('entry');
    markStartup('srd-parsed');
    markStartup('app-start');

    const marks = getStartupMarks();
    expect(marks.map((m) => m.name)).toEqual(['entry', 'srd-parsed', 'app-start']);
    expect(marks[0]).toMatchObject({ sinceStartMs: 0, sincePrevMs: 0 });
    expect(marks[1]).toMatchObject({ sinceStartMs: 120, sincePrevMs: 120 });
    expect(marks[2]).toMatchObject({ sinceStartMs: 500, sincePrevMs: 380 });
  });

  it('is idempotent per name — a second call for the same mark is ignored, deltas stay based on the first', () => {
    setDev(true);
    const dateSpy = vi.spyOn(Date, 'now');
    dateSpy.mockReturnValueOnce(1_000).mockReturnValueOnce(1_050).mockReturnValueOnce(9_999);

    markStartup('app-start');
    markStartup('i18n-ready');
    markStartup('app-start'); // e.g. a re-render calling the same mark again

    expect(getStartupMarks().map((m) => m.name)).toEqual(['app-start', 'i18n-ready']);
  });
});

describe('printStartupTrace', () => {
  it('does nothing when tracing is disabled', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const tableSpy = vi.spyOn(console, 'table').mockImplementation(() => {});

    markStartup('entry');
    printStartupTrace();

    expect(logSpy).not.toHaveBeenCalled();
    expect(tableSpy).not.toHaveBeenCalled();
  });

  it('does nothing when enabled but there are no marks yet', () => {
    setDev(true);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const tableSpy = vi.spyOn(console, 'table').mockImplementation(() => {});

    printStartupTrace();

    expect(logSpy).not.toHaveBeenCalled();
    expect(tableSpy).not.toHaveBeenCalled();
  });

  it('prints a console.table in DEV', () => {
    setDev(true);
    const tableSpy = vi.spyOn(console, 'table').mockImplementation(() => {});

    markStartup('entry');
    printStartupTrace();

    expect(tableSpy).toHaveBeenCalledTimes(1);
    const [rows] = tableSpy.mock.calls[0] as [Array<Record<string, unknown>>];
    expect(rows[0].mark).toBe('entry');
  });

  it('prints plain adb-friendly log lines outside DEV (release + env flag)', () => {
    process.env.EXPO_PUBLIC_STARTUP_TRACE = '1';
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const tableSpy = vi.spyOn(console, 'table').mockImplementation(() => {});

    markStartup('entry');
    markStartup('app-start');
    printStartupTrace();

    expect(tableSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[startup-trace]'));
    expect(logSpy.mock.calls.some(([line]) => typeof line === 'string' && line.includes('entry'))).toBe(true);
    expect(logSpy.mock.calls.some(([line]) => typeof line === 'string' && line.includes('app-start'))).toBe(true);
  });
});
