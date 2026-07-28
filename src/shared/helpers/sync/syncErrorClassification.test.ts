import { describe, expect, it } from 'vitest';
import { classifySyncError, getFirestoreErrorCode } from '@/shared/helpers/sync/syncErrorClassification';

function firestoreError(code: string): Error {
  const error = new Error(`[${code}] boom`);
  (error as unknown as { code: string }).code = code;
  return error;
}

describe('getFirestoreErrorCode', () => {
  it('extracts a string .code from an error-like object', () => {
    expect(getFirestoreErrorCode(firestoreError('firestore/permission-denied'))).toBe('firestore/permission-denied');
  });

  it('returns an empty string when there is no .code', () => {
    expect(getFirestoreErrorCode(new Error('plain error'))).toBe('');
    expect(getFirestoreErrorCode(null)).toBe('');
    expect(getFirestoreErrorCode(undefined)).toBe('');
    expect(getFirestoreErrorCode('not an object')).toBe('');
  });
});

describe('classifySyncError', () => {
  it('classifies offline/connectivity codes as expected (silent queue)', () => {
    expect(classifySyncError(firestoreError('firestore/unavailable'))).toEqual({
      code: 'firestore/unavailable',
      severity: 'expected',
      isConflict: false,
    });
    expect(classifySyncError(firestoreError('firestore/deadline-exceeded')).severity).toBe('expected');
    expect(classifySyncError(firestoreError('firestore/cancelled')).severity).toBe('expected');
  });

  it('classifies permission-denied, resource-exhausted, invalid-argument and not-found as unexpected (visible)', () => {
    expect(classifySyncError(firestoreError('firestore/permission-denied')).severity).toBe('unexpected');
    expect(classifySyncError(firestoreError('firestore/resource-exhausted')).severity).toBe('unexpected');
    expect(classifySyncError(firestoreError('firestore/invalid-argument')).severity).toBe('unexpected');
    expect(classifySyncError(firestoreError('firestore/not-found')).severity).toBe('unexpected');
  });

  it('flags firestore/aborted as a conflict, distinct from a plain unexpected error', () => {
    const classified = classifySyncError(firestoreError('firestore/aborted'));
    expect(classified.isConflict).toBe(true);
    expect(classified.severity).toBe('unexpected');
  });

  it('defaults to unexpected/visible for an error with no code at all, rather than hiding it', () => {
    const classified = classifySyncError(new Error('Not signed in'));
    expect(classified.severity).toBe('unexpected');
    expect(classified.isConflict).toBe(false);
    expect(classified.code).toBe('');
  });
});
