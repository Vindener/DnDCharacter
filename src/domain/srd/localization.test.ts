import { describe, expect, it } from 'vitest';
import { srdMonsterToMonsterDto, srdSpellToSpellbookSpell } from './adapters';
import { getSrdBackgrounds, getSrdClasses, getSrdMonsters, getSrdRaceById, getSrdRaces, getSrdSpells } from './srdRepository';
import {
  getLocalizedBackgroundFeature,
  getLocalizedClassFeatures,
  getLocalizedEquipmentText,
  getLocalizedMonster,
  getLocalizedMonsterSearchText,
  getLocalizedRaceTraits,
  getLocalizedSpellFields,
  getLocalizedSpellSearchText,
  getLocalizedSubraceTraits,
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

  it('covers every race, class, and background without changing identity metadata', () => {
    expect(getSrdRaces()).toHaveLength(9);
    expect(getSrdClasses()).toHaveLength(12);
    expect(getSrdBackgrounds()).toHaveLength(1);

    getSrdRaces().forEach((race) => {
      getLocalizedRaceTraits(race, 'uk').forEach((trait) => {
        expect(trait.name).not.toMatch(/[A-Za-z]{2}/);
      });
      race.subraces.forEach((subrace) => {
        getLocalizedSubraceTraits(race, subrace, 'uk').forEach((trait) => {
          expect(trait.name).not.toMatch(/[A-Za-z]{2}/);
        });
      });
    });

    getSrdClasses().forEach((srdClass) => {
      getLocalizedClassFeatures(srdClass, 'uk').forEach((feature) => {
        expect(feature.name).not.toMatch(/[A-Za-z]{2}/);
      });
    });

    getSrdBackgrounds().forEach((background) => {
      expect(getLocalizedBackgroundFeature(background, 'uk').name).not.toMatch(/[A-Za-z]{2}/);
    });
  });

  it('localizes a representative race trait and class feature, and falls back to English for en', () => {
    const halfling = getSrdRaceById('halfling')!;
    const luckyTrait = getLocalizedRaceTraits(halfling, 'uk').find((trait) => trait.id === 'halfling-lucky');
    expect(luckyTrait?.name).toBe('Талан');
    expect(getLocalizedRaceTraits(halfling, 'en')).toBe(halfling.traits);

    const fighter = getSrdClasses().find((srdClass) => srdClass.id === 'fighter')!;
    const secondWind = getLocalizedClassFeatures(fighter, 'uk').find((feature) => feature.id === 'fighter-second-wind');
    expect(secondWind?.name).toBe('Другий шанс');
    expect(getLocalizedClassFeatures(fighter, 'en')).toBe(fighter.features);

    const acolyte = getSrdBackgrounds().find((background) => background.id === 'acolyte')!;
    expect(getLocalizedBackgroundFeature(acolyte, 'uk').name).toBe('Прихисток вірян');
    expect(getLocalizedBackgroundFeature(acolyte, 'en')).toBe(acolyte.feature);
  });

  it('has an equipment translation for every free-text equipment string in classes.json and backgrounds.json', () => {
    const strings = new Set<string>();
    getSrdClasses().forEach((srdClass) => {
      srdClass.startingEquipment.base.forEach((item) => strings.add(item));
      srdClass.startingEquipment.choices.forEach((choice) => {
        strings.add(choice.label);
        choice.options.forEach((option) => strings.add(option));
      });
    });
    getSrdBackgrounds().forEach((background) => background.equipment.forEach((item) => strings.add(item)));

    strings.forEach((text) => {
      expect(getLocalizedEquipmentText(text, 'uk')).not.toBe(text);
    });
    strings.forEach((text) => {
      expect(getLocalizedEquipmentText(text, 'en')).toBe(text);
    });
  });
});
