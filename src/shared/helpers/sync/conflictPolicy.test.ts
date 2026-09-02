import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectConflictPaths, pathToSyncSection, resolveSyncStatus } from '@/shared/helpers/sync/conflictPolicy';

describe('conflictPolicy helpers', () => {
  it('maps paths to sync sections', () => {
    expect(pathToSyncSection('overview.identity')).toBe('overview');
    // COL-4: combat split into sub-sections instead of one monolithic 'combat' bucket.
    expect(pathToSyncSection('combat.hp.current')).toBe('combat.vitals');
    expect(pathToSyncSection('magic.spell-slots.1')).toBe('magic');
    expect(pathToSyncSection('inventory.items')).toBe('inventory');
    expect(pathToSyncSection('homebrew.notes-groups.session')).toBe('notes');
    expect(pathToSyncSection('homebrew.resources.hp')).toBe('homebrew.resources');
    expect(pathToSyncSection('')).toBe('unknown');
  });

  it('maps every new combat/homebrew sub-section prefix, including cross-surface aliases', () => {
    // overview.conditions (player screen) and combat.conditions (DM quick-edit) write the
    // same underlying field and must resolve to the same section (COL-4 cross-surface fix).
    expect(pathToSyncSection('overview.conditions')).toBe('combat.conditions');
    expect(pathToSyncSection('combat.conditions.poisoned')).toBe('combat.conditions');
    expect(pathToSyncSection('combat.core.ac')).toBe('combat.defense');
    expect(pathToSyncSection('combat.weapons.0')).toBe('combat.weapons');
    expect(pathToSyncSection('combat.templates.actions')).toBe('combat.actions');
    // combat.rest touches hp+hitDice together and has no dedicated sub-section — it must
    // fall back to the legacy 'combat' bucket, not 'unknown' (which would silently drop it
    // from conflict detection entirely).
    expect(pathToSyncSection('combat.rest')).toBe('combat');
    expect(pathToSyncSection('homebrew.trackers.0')).toBe('homebrew.trackers');
    // homebrew.entries is folded into the same section as homebrew.sections.
    expect(pathToSyncSection('homebrew.entries.0')).toBe('homebrew.sections');
    expect(pathToSyncSection('homebrew.something-new')).toBe('homebrew');
  });

  it('detects direct and section overlaps for non-commutative paths', () => {
    const conflicts = collectConflictPaths(['overview.identity', 'inventory.items'], ['overview.identity', 'notes.session']);

    expect(conflicts).toContain('overview.identity');
    expect(conflicts).not.toContain('inventory.items');
  });

  it('COL-4 flagship scenario: DM and player both tagging the exact literal combat.hp used by real UI code no longer conflicts, even though both touched the same tag simultaneously', () => {
    const conflicts = collectConflictPaths(['combat.hp'], ['combat.hp']);
    expect(conflicts).toEqual([]);
  });

  it('Виняток 3: homebrew.resources is now commutative (increment-based), no longer a critical-path conflict', () => {
    const conflicts = collectConflictPaths(['homebrew.resources.mana.current'], ['combat.hp.current']);
    expect(conflicts).toEqual([]);
  });

  it('COL-4: HP vs condition is NOT a conflict (different combat sub-sections)', () => {
    const conflicts = collectConflictPaths(['combat.hp.current'], ['combat.conditions.poisoned']);
    expect(conflicts).toEqual([]);
  });

  it('Виняток 3 (supersedes COL-4): HP vs HP is no longer a conflict — hp.current/hp.temp are increment-based and commute; supersedes the original COL-4 assertion that same-sub-section HP writes must conflict', () => {
    const conflicts = collectConflictPaths(['combat.hp.current'], ['combat.hp.max']);
    expect(conflicts).toEqual([]);
  });

  it('COL-4: ac vs hp is NOT a conflict (defense vs vitals)', () => {
    const conflicts = collectConflictPaths(['combat.core.ac'], ['combat.hp.current']);
    expect(conflicts).toEqual([]);
  });

  it('Виняток 3 (supersedes COL-4): overview.conditions vs combat.conditions no longer conflict — both are arrayUnion/arrayRemove-based and commute', () => {
    // Before Виняток 3, these resolved to the same 'combat.conditions' section and were
    // flagged as a conflict requiring manual review. Now that both surfaces write conditions
    // via arrayUnion/arrayRemove, a concurrent add/remove from each surface merges safely
    // without user intervention.
    const conflicts = collectConflictPaths(['overview.conditions'], ['combat.conditions.poisoned']);
    expect(conflicts).toEqual([]);
  });

  it('COL-4: every sync path literal actually used by the character screen maps to a known section', () => {
    const source = readFileSync(resolve(__dirname, '../../../screens/Character/hooks/useCharacterActions.tsx'), 'utf8');

    const found = new Set<string>();
    // TAB_DEFAULT_PATH / TAB_PATH_PREFIX object literal values, e.g. Overview: 'overview.identity',
    for (const match of source.matchAll(/:\s*'([a-z][a-z0-9.-]*)'/g)) {
      found.add(match[1]);
    }
    // Every literal inside a changedPaths array argument, e.g. patchCharacter(fn, ['combat.hp']).
    for (const match of source.matchAll(/\[\s*((?:'[a-z][a-z0-9.-]*'\s*,?\s*)+)\]/g)) {
      for (const literalMatch of match[1].matchAll(/'([a-z][a-z0-9.-]*)'/g)) {
        found.add(literalMatch[1]);
      }
    }

    const syncLikePaths = Array.from(found).filter((path) => /^(overview|combat|magic|inventory|notes|homebrew)\./.test(path));

    // Belt-and-suspenders: fail loudly if the extraction regex itself stops matching anything,
    // instead of vacuously passing an empty list.
    expect(syncLikePaths.length).toBeGreaterThanOrEqual(20);

    const unknownPaths = syncLikePaths.filter((path) => pathToSyncSection(path) === 'unknown');
    expect(unknownPaths).toEqual([]);
  });

  it('resolves sync status states', () => {
    expect(
      resolveSyncStatus({ hasCloud: false, hasPendingPaths: false, hasConflictPaths: false, localRevision: 0, cloudRevision: 0 }),
    ).toBe('local-only');
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
