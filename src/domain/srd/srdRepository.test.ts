import { describe, expect, it } from 'vitest';
import {
  getClassProgression,
  getConditions,
  getEquipment,
  getSrdMonsters,
  getSrdReferences,
  getSrdSpells,
  getSrdClassProgressions,
  getSrdClasses,
  getSrdRaces,
  validateAllSrdCollections,
} from './srdRepository';

function expectSrdMetadata(item: { source?: unknown; license?: unknown; tags?: unknown }) {
  expect(item.source).toBe('srd-5.1');
  expect(item.license).toBe('ogl-1.0a');
  expect(Array.isArray(item.tags)).toBe(true);
  expect((item.tags as string[]).length).toBeGreaterThan(0);
}

describe('srdRepository', () => {
  it('loads SRD races, classes, equipment, and conditions', () => {
    expect(getSrdRaces().length).toBeGreaterThan(0);
    expect(getSrdClasses().length).toBeGreaterThan(0);
    expect(getEquipment().length).toBeGreaterThan(0);
    expect(getConditions().length).toBeGreaterThan(0);
    expect(getSrdSpells().length).toBeGreaterThan(100);
    expect(getSrdMonsters().length).toBeGreaterThan(100);
    expect(getSrdReferences().length).toBeGreaterThan(0);
  });

  it('keeps all race ids unique', () => {
    const ids = getSrdRaces().map((race) => race.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps spell, monster, and reference ids unique', () => {
    const spellIds = getSrdSpells().map((spell) => spell.id);
    const monsterIds = getSrdMonsters().map((monster) => monster.id);
    const referenceIds = getSrdReferences().map((entry) => entry.id);

    expect(new Set(spellIds).size).toBe(spellIds.length);
    expect(new Set(monsterIds).size).toBe(monsterIds.length);
    expect(new Set(referenceIds).size).toBe(referenceIds.length);
  });

  it('keeps all class ids unique and excludes homebrew artificer', () => {
    const ids = getSrdClasses().map((srdClass) => srdClass.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain('artificer');
  });

  it('has class progression for levels 1-20 for every SRD class', () => {
    getSrdClasses().forEach((srdClass) => {
      for (let level = 1; level <= 20; level += 1) {
        expect(getClassProgression(srdClass.id, level), `${srdClass.id} level ${level}`).toBeDefined();
      }
    });
    expect(getSrdClassProgressions()).toHaveLength(getSrdClasses().length);
  });

  it('includes required source metadata on content items', () => {
    getSrdRaces().forEach((race) => {
      expectSrdMetadata(race);
      race.traits.forEach(expectSrdMetadata);
      race.subraces.forEach((subrace) => {
        expectSrdMetadata(subrace);
        subrace.traits.forEach(expectSrdMetadata);
      });
    });
    getSrdClasses().forEach((srdClass) => {
      expectSrdMetadata(srdClass);
      srdClass.features.forEach(expectSrdMetadata);
    });
    getEquipment().forEach(expectSrdMetadata);
    getConditions().forEach(expectSrdMetadata);
    getSrdSpells().forEach((spell) => {
      expectSrdMetadata(spell);
      expect(spell.description).toEqual(expect.any(String));
      expect(spell.components).toEqual(
        expect.objectContaining({
          verbal: expect.any(Boolean),
          somatic: expect.any(Boolean),
          material: expect.any(String),
        }),
      );
    });
    getSrdMonsters().forEach((monster) => {
      expectSrdMetadata(monster);
      expect(monster.abilities.strength).toEqual(expect.any(Number));
      expect(monster.actions).toEqual(expect.any(Array));
    });
    getSrdReferences().forEach((entry) => {
      expectSrdMetadata(entry);
      expect(entry.title).toEqual(expect.any(String));
      expect(entry.entries).toEqual(expect.any(Array));
    });
  });

  // Runtime getSrdX() getters use a typed cast, not Zod (PERF-1) — this is the one place
  // in `npm run test:unit` that still exercises the real Zod schemas against the real
  // SRD JSON, mirroring what scripts/validate-srd.mjs does at build time.
  it('validates every SRD collection against its Zod schema (build-time check, exercised here too)', () => {
    expect(() => validateAllSrdCollections()).not.toThrow();
  });
});
