import { describe, expect, it } from 'vitest';
import { collectConflictPaths, pathToSyncSection, resolveSyncStatus } from '@/shared/helpers/sync/conflictPolicy';

describe('conflictPolicy helpers', () => {
  it('maps paths to sync sections', () => {
    expect(pathToSyncSection('overview.identity')).toBe('overview');
    expect(pathToSyncSection('combat.hp.current')).toBe('combat');
    expect(pathToSyncSection('magic.spell-slots.1')).toBe('magic');
    expect(pathToSyncSection('inventory.items')).toBe('inventory');
    expect(pathToSyncSection('homebrew.notes-groups.session')).toBe('notes');
    expect(pathToSyncSection('homebrew.resources.hp')).toBe('homebrew');
    expect(pathToSyncSection('')).toBe('unknown');
  });

  it('detects direct, section and critical path overlaps', () => {
    const conflicts = collectConflictPaths(
      ['overview.identity', 'combat.hp.current', 'inventory.items'],
      ['combat.hp.max', 'notes.session'],
    );

    expect(conflicts).toContain('combat.hp.current');
    expect(conflicts).not.toContain('overview.identity');
    expect(conflicts).not.toContain('inventory.items');
  });

  it('marks critical local paths as conflict when cloud has any critical path', () => {
    const conflicts = collectConflictPaths(['homebrew.resources.mana.current'], ['combat.hp.current']);
    expect(conflicts).toEqual(['homebrew.resources.mana.current']);
  });

  it('resolves sync status states', () => {
    expect(resolveSyncStatus({ hasCloud: false, hasPendingPaths: false, hasConflictPaths: false, localRevision: 0, cloudRevision: 0 })).toBe(
      'local-only',
    );
    expect(resolveSyncStatus({ hasCloud: true, hasPendingPaths: true, hasConflictPaths: false, localRevision: 1, cloudRevision: 1 })).toBe(
      'pending-upload',
    );
    expect(resolveSyncStatus({ hasCloud: true, hasPendingPaths: false, hasConflictPaths: false, localRevision: 1, cloudRevision: 2 })).toBe(
      'pending-download',
    );
    expect(resolveSyncStatus({ hasCloud: true, hasPendingPaths: false, hasConflictPaths: true, localRevision: 3, cloudRevision: 3 })).toBe(
      'conflict',
    );
    expect(resolveSyncStatus({ hasCloud: true, hasPendingPaths: false, hasConflictPaths: false, localRevision: 4, cloudRevision: 4 })).toBe(
      'in-sync',
    );
  });
});
