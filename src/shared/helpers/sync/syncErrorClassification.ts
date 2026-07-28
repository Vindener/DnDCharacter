// COL-7: classifies Firestore write failures so the sync path can decide what stays a
// silent offline-queue retry and what must surface to the user. Based on error CODES
// (stable, namespaced e.g. "firestore/permission-denied"), never on message text — messages
// are free-form and can't be matched reliably across SDK versions or locales.
export type SyncErrorSeverity = 'expected' | 'unexpected';

export type ClassifiedSyncError = {
  code: string;
  severity: SyncErrorSeverity;
  isConflict: boolean;
};

// Transient/connectivity conditions: same silent-queue behavior as being offline.
const EXPECTED_FIRESTORE_CODES: ReadonlySet<string> = new Set([
  'firestore/unavailable',
  'firestore/deadline-exceeded',
  'firestore/cancelled',
]);

// 'aborted' is Firestore's code for a transaction that lost a write race (too much
// contention) — the closest real signal to an application-level "conflict".
const CONFLICT_FIRESTORE_CODES: ReadonlySet<string> = new Set(['firestore/aborted']);

export function getFirestoreErrorCode(error: unknown): string {
  const code = (error as { code?: unknown } | null | undefined)?.code;
  return typeof code === 'string' ? code : '';
}

export function classifySyncError(error: unknown): ClassifiedSyncError {
  const code = getFirestoreErrorCode(error);
  return {
    code,
    severity: EXPECTED_FIRESTORE_CODES.has(code) ? 'expected' : 'unexpected',
    isConflict: CONFLICT_FIRESTORE_CODES.has(code),
  };
}
