import { describe, expect, it } from 'vitest';
import {
  getClassProgression,
  getConditions,
  getEquipment,
  getSrdClassProgressions,
  getSrdClasses,
  getSrdRaces,
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
  });

  it('keeps all race ids unique', () => {
    const ids = getSrdRaces().map((race) => race.id);
    expect(new Set(ids).size).toBe(ids.length);
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
  });
});

