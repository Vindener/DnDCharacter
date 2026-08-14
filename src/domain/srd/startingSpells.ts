import { getSrdSpells } from './srdRepository';
import { srdSpellToSpellbookSpell } from './adapters';
import { getLocalizedSpellFields } from './localization';
import type { SrdSpell } from './types';

function localizedSpellName(spell: SrdSpell, locale: string): string {
  return getLocalizedSpellFields(srdSpellToSpellbookSpell(spell), locale).name;
}

export type StartingSpellMode = 'known' | 'prepared' | 'none';

interface ClassLevel1SpellProfile {
  mode: StartingSpellMode;
  cantripsKnown: number;
  spellsKnown: number;
}

// SRD 5.1 level-1 spellcasting numbers (PHB class tables). Paladin and Ranger get their
// spellcasting feature at 2nd level, not 1st, so they intentionally suggest nothing here.
const CLASS_LEVEL1_SPELL_PROFILES: Record<string, ClassLevel1SpellProfile> = {
  Bard: { mode: 'known', cantripsKnown: 2, spellsKnown: 4 },
  Cleric: { mode: 'prepared', cantripsKnown: 3, spellsKnown: 2 },
  Druid: { mode: 'prepared', cantripsKnown: 2, spellsKnown: 2 },
  Sorcerer: { mode: 'known', cantripsKnown: 4, spellsKnown: 2 },
  Warlock: { mode: 'known', cantripsKnown: 2, spellsKnown: 2 },
  Wizard: { mode: 'known', cantripsKnown: 3, spellsKnown: 6 },
};

export function getClassLevel1SpellMode(className: string): StartingSpellMode {
  return CLASS_LEVEL1_SPELL_PROFILES[className]?.mode ?? 'none';
}

function spellsForClassAndLevel(className: string, level: number): SrdSpell[] {
  return getSrdSpells().filter((spell) => spell.level === level && spell.classes.includes(className));
}

export interface StartingSpellSuggestion {
  mode: StartingSpellMode;
  cantrips: string[];
  spells: string[];
}

/** Best-effort starter spells for a class at level 1 — a suggestion the player is meant to freely edit. */
export function getSuggestedStartingSpells(className: string, locale: string): StartingSpellSuggestion {
  const profile = CLASS_LEVEL1_SPELL_PROFILES[className];
  if (!profile) return { mode: 'none', cantrips: [], spells: [] };

  return {
    mode: profile.mode,
    cantrips: spellsForClassAndLevel(className, 0)
      .slice(0, profile.cantripsKnown)
      .map((spell) => localizedSpellName(spell, locale)),
    spells: spellsForClassAndLevel(className, 1)
      .slice(0, profile.spellsKnown)
      .map((spell) => localizedSpellName(spell, locale)),
  };
}

export interface Level1SpellOption {
  id: string;
  name: string;
}

/** Full eligible list for the level-1 spell-picker modal, not just the auto-fill suggestion subset. */
export function getEligibleLevel1Spells(
  className: string,
  locale: string,
): { cantrips: Level1SpellOption[]; leveled: Level1SpellOption[] } {
  if (getClassLevel1SpellMode(className) === 'none') return { cantrips: [], leveled: [] };

  const toOption = (spell: SrdSpell): Level1SpellOption => ({ id: spell.id, name: localizedSpellName(spell, locale) });

  return {
    cantrips: spellsForClassAndLevel(className, 0).map(toOption),
    leveled: spellsForClassAndLevel(className, 1).map(toOption),
  };
}
