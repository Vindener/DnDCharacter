import { describe, expect, it } from 'vitest';
import {
  applySpellStatus,
  collectCharacterSpellNames,
  getCharacterSpellStatus,
  getPreparedSpellsLimit,
  normalizeSpellName,
} from '@/domain/spellbook';
import { createEmptyCharacter } from '@/shared/helpers/createEmptyCharacter';

const EMPTY_SPELLS = {
  spellcastingAbility: '',
  spellSaveDC: 0,
  spellAttackBonus: 0,
  spellSlots: {},
  knownSpells: [],
  preparedSpells: [],
  cantrips: [],
};

describe('domain/spellbook/characterSpellAdapter', () => {
  it('normalizes spell names and resolves status by name', () => {
    const character = createEmptyCharacter({
      class: 'Wizard',
      spells: {
        ...EMPTY_SPELLS,
        knownSpells: ['Fireball'],
        preparedSpells: ['Shield'],
        cantrips: ['Ray of Frost'],
      },
    });

    expect(normalizeSpellName('  FIREBALL  ')).toBe('fireball');
    expect(getCharacterSpellStatus(character, 'shield')).toBe('prepared');
    expect(getCharacterSpellStatus(character, 'ray OF frost')).toBe('cantrip');
    expect(getCharacterSpellStatus(character, 'fireball')).toBe('known');
    expect(getCharacterSpellStatus(character, 'magic missile')).toBe('available');
  });

  it('collects unique character spell names', () => {
    const character = createEmptyCharacter({
      spells: {
        ...EMPTY_SPELLS,
        knownSpells: ['Fireball', 'fireball', 'Mage Armor'],
        preparedSpells: ['Mage Armor', 'Shield'],
        cantrips: ['Light', 'light'],
      },
    });

    expect(collectCharacterSpellNames(character)).toEqual(['Fireball', 'Mage Armor', 'Shield', 'Light']);
  });

  it('applies spell status transitions and enforces prepared limit', () => {
    const base = createEmptyCharacter({
      class: 'Wizard',
      level: 3,
      spells: { ...EMPTY_SPELLS },
    });

    const known = applySpellStatus(base, 'Magic Missile', 'known');
    expect(known.spells.knownSpells).toContain('Magic Missile');
    expect(known.spells.preparedSpells).toEqual([]);

    const prepared = applySpellStatus(known, 'Magic Missile', 'prepared', { preparedLimit: 1 });
    expect(prepared.spells.preparedSpells).toContain('Magic Missile');
    expect(prepared.spells.knownSpells).toContain('Magic Missile');

    const blocked = applySpellStatus(prepared, 'Shield', 'prepared', { preparedLimit: 1 });
    expect(blocked).toBe(prepared);

    const cantrip = applySpellStatus(prepared, 'Light', 'cantrip');
    expect(cantrip.spells.cantrips).toContain('Light');

    const cleared = applySpellStatus(cantrip, 'Light', 'available');
    expect(cleared.spells.cantrips).not.toContain('Light');
  });

  it('calculates prepared spell limit for prepared casters', () => {
    const wizard = createEmptyCharacter({
      class: 'Wizard',
      level: 5,
      stats: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 16,
        wisdom: 10,
        charisma: 10,
      },
      spells: {
        ...EMPTY_SPELLS,
        spellcastingAbility: 'int',
      },
    });

    expect(getPreparedSpellsLimit(wizard)).toBe(8);
  });
});
