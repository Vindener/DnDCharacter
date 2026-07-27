import { describe, expect, it } from 'vitest';
import { mapSyncPathsToFieldPaths } from '@/repositories/syncPathFieldMap';

describe('mapSyncPathsToFieldPaths', () => {
  it('maps each known narrow token to its exact field paths', () => {
    expect(mapSyncPathsToFieldPaths(['combat.hp'])).toEqual({ kind: 'narrow', fieldPaths: ['hp'] });
    expect(mapSyncPathsToFieldPaths(['combat.weapons'])).toEqual({ kind: 'narrow', fieldPaths: ['weapons'] });
    expect(mapSyncPathsToFieldPaths(['overview.session-mode'])).toEqual({ kind: 'narrow', fieldPaths: ['sessionMode'] });
    expect(mapSyncPathsToFieldPaths(['overview.saving-throws'])).toEqual({ kind: 'narrow', fieldPaths: ['savingThrows'] });
    expect(mapSyncPathsToFieldPaths(['overview.stats'])).toEqual({ kind: 'narrow', fieldPaths: ['stats'] });
    expect(mapSyncPathsToFieldPaths(['magic.slots'])).toEqual({ kind: 'narrow', fieldPaths: ['spells.spellSlots'] });
    expect(mapSyncPathsToFieldPaths(['inventory.items'])).toEqual({ kind: 'narrow', fieldPaths: ['inventory'] });
    expect(mapSyncPathsToFieldPaths(['homebrew.fields'])).toEqual({ kind: 'narrow', fieldPaths: ['customFields'] });
    expect(mapSyncPathsToFieldPaths(['homebrew.resources'])).toEqual({ kind: 'narrow', fieldPaths: ['customResources'] });
    expect(mapSyncPathsToFieldPaths(['homebrew.sections'])).toEqual({ kind: 'narrow', fieldPaths: ['customSections'] });
    expect(mapSyncPathsToFieldPaths(['homebrew.entries'])).toEqual({ kind: 'narrow', fieldPaths: ['homebrewEntries'] });
    expect(mapSyncPathsToFieldPaths(['homebrew.notes-groups'])).toEqual({ kind: 'narrow', fieldPaths: ['customNotesGroups'] });
  });

  it('maps combat.templates sub-tokens to their nested combatTemplates field paths', () => {
    expect(mapSyncPathsToFieldPaths(['combat.templates.actions'])).toEqual({
      kind: 'narrow',
      fieldPaths: ['combatTemplates.actions'],
    });
    expect(mapSyncPathsToFieldPaths(['combat.templates.bonus-actions'])).toEqual({
      kind: 'narrow',
      fieldPaths: ['combatTemplates.bonusActions'],
    });
    expect(mapSyncPathsToFieldPaths(['combat.templates.reactions'])).toEqual({
      kind: 'narrow',
      fieldPaths: ['combatTemplates.reactions'],
    });
  });

  it('treats combat.conditions and overview.conditions as aliases of the same field', () => {
    expect(mapSyncPathsToFieldPaths(['combat.conditions'])).toEqual({ kind: 'narrow', fieldPaths: ['conditions'] });
    expect(mapSyncPathsToFieldPaths(['overview.conditions'])).toEqual({ kind: 'narrow', fieldPaths: ['conditions'] });
    expect(mapSyncPathsToFieldPaths(['combat.conditions', 'overview.conditions'])).toEqual({
      kind: 'narrow',
      fieldPaths: ['conditions'],
    });
  });

  it('unions fields from a mix of several safe tokens without duplicates', () => {
    const result = mapSyncPathsToFieldPaths(['combat.hp', 'overview.stats']);
    expect(result.kind).toBe('narrow');
    if (result.kind === 'narrow') {
      expect(result.fieldPaths.sort()).toEqual(['hp', 'stats']);
    }
  });

  it('overview.skills does not include skillProficiencies (not part of the CharacterSheet cloud schema)', () => {
    expect(mapSyncPathsToFieldPaths(['overview.skills'])).toEqual({ kind: 'narrow', fieldPaths: ['skills'] });
  });

  it('inventory.equipment is a known narrow token with no content fields (CharacterSheet has no equipment key today)', () => {
    expect(mapSyncPathsToFieldPaths(['inventory.equipment'])).toEqual({ kind: 'narrow', fieldPaths: [] });
  });

  it('falls back when a single unknown or tab-default token is present, even alongside safe ones', () => {
    expect(mapSyncPathsToFieldPaths(['overview.identity'])).toEqual({ kind: 'fallback' });
    expect(mapSyncPathsToFieldPaths(['magic.core'])).toEqual({ kind: 'fallback' });
    expect(mapSyncPathsToFieldPaths(['inventory.core'])).toEqual({ kind: 'fallback' });
    expect(mapSyncPathsToFieldPaths(['combat.rest'])).toEqual({ kind: 'fallback' });
    expect(mapSyncPathsToFieldPaths(['combat.templates'])).toEqual({ kind: 'fallback' });
    expect(mapSyncPathsToFieldPaths(['combat.hp', 'overview.identity'])).toEqual({ kind: 'fallback' });
    expect(mapSyncPathsToFieldPaths(['does-not-exist'])).toEqual({ kind: 'fallback' });
  });

  it('falls back when there are no paths at all', () => {
    expect(mapSyncPathsToFieldPaths([])).toEqual({ kind: 'fallback' });
    expect(mapSyncPathsToFieldPaths(null)).toEqual({ kind: 'fallback' });
    expect(mapSyncPathsToFieldPaths(undefined)).toEqual({ kind: 'fallback' });
  });
});
