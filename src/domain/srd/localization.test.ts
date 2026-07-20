import { describe, expect, it } from 'vitest';
import { srdMonsterToMonsterDto, srdSpellToSpellbookSpell } from './adapters';
import { getSrdMonsters, getSrdSpells } from './srdRepository';
import {
  getLocalizedMonster,
  getLocalizedMonsterSearchText,
  getLocalizedSpellFields,
  getLocalizedSpellSearchText,
} from './localization';

describe('SRD Ukrainian localization overlays', () => {
  it('covers every spell and monster without changing identity metadata', () => {
    const spells = getSrdSpells().map(srdSpellToSpellbookSpell);
    const monsters = getSrdMonsters().map(srdMonsterToMonsterDto);

    expect(spells).toHaveLength(319);
    expect(monsters).toHaveLength(317);

    spells.forEach((spell) => {
      const localized = getLocalizedSpellFields(spell, 'uk');
      expect(localized.name).not.toMatch(/[A-Za-z]{2}/);
      expect(spell.id).toMatch(/^srd-spell-/);
      expect(spell.source).toBe('srd-5.1');
      expect(spell.license).toBe('ogl-1.0a');
    });

    monsters.forEach((monster) => {
      const localized = getLocalizedMonster(monster, 'uk');
      expect(localized.name).not.toMatch(/[A-Za-z]{2}/);
      expect(localized.id).toBe(monster.id);
      expect(localized.source).toBe(monster.source);
      expect(localized.license).toBe(monster.license);
    });
  });

  it('localizes representative spell fields and keeps dice formulas intact', () => {
    const fireball = srdSpellToSpellbookSpell(getSrdSpells().find((spell) => spell.id === 'fireball')!);
    const localized = getLocalizedSpellFields(fireball, 'uk');

    expect(localized.name).toBe('Вогняна куля');
    expect(localized.school).toBe('Втілення');
    expect(localized.description).toContain('8d6');
    expect(getLocalizedSpellSearchText(fireball, 'uk')).toContain('Вогняна куля');
    expect(getLocalizedSpellFields(fireball, 'en').name).toBe('Fireball');
  });

  it('localizes representative monster statblock fields and removes PDF boilerplate', () => {
    const deva = srdMonsterToMonsterDto(getSrdMonsters().find((monster) => monster.id === 'deva')!);
    const localized = getLocalizedMonster(deva, 'uk');

    expect(localized.name).toBe('Дева');
    expect(localized.type).toBe('небесний');
    expect(localized.senses).toContain('темний зір');
    expect(localized.senses).not.toContain('System Reference Document');
    expect(getLocalizedMonsterSearchText(deva, 'uk')).toContain('Магічний опір');
    expect(getLocalizedMonster(deva, 'en')).toBe(deva);
  });
});
