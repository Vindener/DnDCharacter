import { loadMonstersJson, loadSpellsJson } from '@/data/srd';
import type { SpellbookSpell } from '@/types/Spellbook';
import type { MonsterActionDto, MonsterDto } from '@/types/Monster';
import type { SrdBackground, SrdClass, SrdClassFeature, SrdFeatureBase, SrdRace, SrdSubrace } from './types';

type RaceTraitTranslation = { id: string; name: string; summary: string };

type RaceTranslation = {
  id: string;
  name: string;
  traits: RaceTraitTranslation[];
  subraces: Array<{ id: string; traits: RaceTraitTranslation[] }>;
};

type ClassTranslation = {
  id: string;
  name: string;
  features: Array<{ id: string; name: string; summary: string }>;
};

type BackgroundTranslation = {
  id: string;
  name: string;
  feature: { id: string; name: string; summary: string };
};

type EquipmentTranslationsJson = Record<string, string>;

type SpellTranslation = {
  id: string;
  name: string;
  school: string;
  castingTime: string;
  range: string;
  material: string;
  duration: string;
  classes: string[];
  description: string;
  higherLevels: string;
};

type MonsterTranslation = {
  id: string;
  name: string;
  size: string;
  type: string;
  alignment: string;
  speed: string;
  savingThrows: string;
  skills: string;
  damageVulnerabilities: string;
  damageResistances: string;
  damageImmunities: string;
  conditionImmunities: string;
  senses: string;
  languages: string;
  traits: MonsterActionDto[];
  actions: MonsterActionDto[];
  reactions: MonsterActionDto[];
  legendaryActions: MonsterActionDto[];
};

export type LocalizedSpellFields = Pick<
  SpellbookSpell,
  'name' | 'school' | 'castingTime' | 'range' | 'components' | 'duration' | 'classes' | 'description' | 'higherLevels'
>;

// All translation lookups below are built at most once, on first use, instead of at
// module-evaluation time — importing this module (transitively, via any screen that
// needs localized spell/monster text) must not force loading ~1.5 MB of uk translation
// JSON before the first frame (PERF-1).
let spellTranslationById: Map<string, SpellTranslation> | undefined;
let monsterTranslationById: Map<string, MonsterTranslation> | undefined;
let spellSchoolTranslations: Map<string, string> | undefined;
let spellClassTranslations: Map<string, string> | undefined;
let monsterTermTranslations: Map<string, string> | undefined;
let raceTranslationById: Map<string, RaceTranslation> | undefined;
let classTranslationById: Map<string, ClassTranslation> | undefined;
let backgroundTranslationById: Map<string, BackgroundTranslation> | undefined;
let equipmentTranslations: Map<string, string> | undefined;

function ensureLocalizationLoaded(): void {
  if (spellTranslationById !== undefined) return;

  // eslint-disable-next-line @typescript-eslint/no-require-imports -- deliberate lazy require(), see PERF-1
  const spellTranslations = require('../../data/locales/uk/spells.json') as SpellTranslation[];
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- deliberate lazy require(), see PERF-1
  const monsterTranslations = require('../../data/locales/uk/monsters.json') as MonsterTranslation[];
  const canonicalSpellsJson = loadSpellsJson() as Array<{ id: string; school: string; classes: string[] }>;
  const canonicalMonstersJson = loadMonstersJson() as Array<{ id: string; size: string; type: string; alignment: string }>;

  spellTranslationById = new Map(spellTranslations.map((entry) => [entry.id, entry]));
  monsterTranslationById = new Map(monsterTranslations.map((entry) => [entry.id, entry]));

  spellSchoolTranslations = new Map<string, string>();
  spellClassTranslations = new Map<string, string>();
  canonicalSpellsJson.forEach((spell, index) => {
    const translation = spellTranslations[index];
    if (!translation || translation.id !== spell.id) return;
    spellSchoolTranslations!.set(spell.school, translation.school);
    spell.classes.forEach((className, classIndex) => {
      spellClassTranslations!.set(className, translation.classes[classIndex] || className);
    });
  });

  monsterTermTranslations = new Map<string, string>();
  canonicalMonstersJson.forEach((monster, index) => {
    const translation = monsterTranslations[index];
    if (!translation || translation.id !== monster.id) return;
    monsterTermTranslations!.set(monster.size, translation.size);
    monsterTermTranslations!.set(monster.type, translation.type);
    monsterTermTranslations!.set(monster.alignment, translation.alignment);
  });

  // eslint-disable-next-line @typescript-eslint/no-require-imports -- deliberate lazy require(), see PERF-1
  const raceTranslations = require('../../data/locales/uk/races.json') as RaceTranslation[];
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- deliberate lazy require(), see PERF-1
  const classTranslations = require('../../data/locales/uk/classes.json') as ClassTranslation[];
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- deliberate lazy require(), see PERF-1
  const backgroundTranslations = require('../../data/locales/uk/backgrounds.json') as BackgroundTranslation[];
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- deliberate lazy require(), see PERF-1
  const equipmentTranslationsJson = require('../../data/locales/uk/equipment.json') as EquipmentTranslationsJson;

  raceTranslationById = new Map(raceTranslations.map((entry) => [entry.id, entry]));
  classTranslationById = new Map(classTranslations.map((entry) => [entry.id, entry]));
  backgroundTranslationById = new Map(backgroundTranslations.map((entry) => [entry.id, entry]));
  equipmentTranslations = new Map(Object.entries(equipmentTranslationsJson));
}

// Lets a screen pay the one-time require()+Map-build cost while its skeleton is still on
// screen (e.g. right after data starts loading), instead of it landing inside the first
// useMemo that consumes getLocalizedX() once real data arrives — that useMemo runs during
// the very render that replaces the skeleton, so an unwarmed cache there is felt as a freeze.
export function warmSrdLocalizationCache(): void {
  ensureLocalizationLoaded();
}

function getCanonicalId(id: string, prefix: string): string {
  return id.startsWith(prefix) ? id.slice(prefix.length) : id;
}

function actionsToText(actions: MonsterActionDto[]): string {
  return actions.map((action) => `${action.name}. ${action.description}`.trim()).join('\n\n');
}

export function getLocalizedSpellFields(spell: SpellbookSpell, language: string): LocalizedSpellFields {
  ensureLocalizationLoaded();
  const translation =
    language === 'uk' && spell.source === 'srd-5.1' ? spellTranslationById!.get(getCanonicalId(spell.id, 'srd-spell-')) : undefined;

  if (!translation) {
    return {
      name: spell.name,
      school: spell.school,
      castingTime: spell.castingTime,
      range: spell.range,
      components: spell.components,
      duration: spell.duration,
      classes: spell.classes,
      description: spell.description,
      higherLevels: spell.higherLevels,
    };
  }

  return {
    name: translation.name,
    school: translation.school,
    castingTime: translation.castingTime,
    range: translation.range,
    components: { ...spell.components, material: translation.material },
    duration: translation.duration,
    classes: translation.classes,
    description: translation.description,
    higherLevels: translation.higherLevels,
  };
}

export function getLocalizedSpellSearchText(spell: SpellbookSpell, language: string): string {
  const fields = getLocalizedSpellFields(spell, language);
  return [
    fields.name,
    fields.school,
    fields.castingTime,
    fields.range,
    fields.components.material,
    fields.duration,
    fields.classes.join(' '),
    fields.description,
    fields.higherLevels,
  ].join(' ');
}

export function getLocalizedSpellSchool(value: string, language: string): string {
  ensureLocalizationLoaded();
  return language === 'uk' ? spellSchoolTranslations!.get(value) || value : value;
}

export function getLocalizedSpellClass(value: string, language: string): string {
  ensureLocalizationLoaded();
  return language === 'uk' ? spellClassTranslations!.get(value) || value : value;
}

export function getLocalizedMonsterTerm(value: string, language: string): string {
  ensureLocalizationLoaded();
  return language === 'uk' ? monsterTermTranslations!.get(value) || value : value;
}

export function getLocalizedMonster(monster: MonsterDto, language: string): MonsterDto {
  ensureLocalizationLoaded();
  const translation =
    language === 'uk' && monster.source === 'srd-5.1' ? monsterTranslationById!.get(getCanonicalId(monster.id, 'srd-monster-')) : undefined;
  if (!translation) return monster;

  return {
    ...monster,
    name: translation.name,
    size: translation.size,
    type: translation.type,
    alignment: translation.alignment,
    speed: translation.speed,
    savingThrows: translation.savingThrows,
    skills: translation.skills,
    damageVulnerabilities: translation.damageVulnerabilities,
    damageResistances: translation.damageResistances,
    damageImmunities: translation.damageImmunities,
    conditionImmunities: translation.conditionImmunities,
    senses: translation.senses,
    languages: translation.languages,
    traits: actionsToText(translation.traits),
    actions: actionsToText(translation.actions),
    reactions: actionsToText(translation.reactions),
    legendaryActions: actionsToText(translation.legendaryActions),
    normalizedTraits: translation.traits,
    normalizedActions: translation.actions,
    normalizedReactions: translation.reactions,
    normalizedLegendaryActions: translation.legendaryActions,
  };
}

export function getLocalizedMonsterSearchText(monster: MonsterDto, language: string): string {
  const localized = getLocalizedMonster(monster, language);
  return [
    localized.name,
    localized.size,
    localized.type,
    localized.alignment,
    localized.speed,
    localized.savingThrows,
    localized.skills,
    localized.damageVulnerabilities,
    localized.damageResistances,
    localized.damageImmunities,
    localized.conditionImmunities,
    localized.senses,
    localized.languages,
    localized.traits,
    localized.actions,
    localized.reactions,
    localized.legendaryActions,
  ]
    .filter(Boolean)
    .join(' ');
}

export function getLocalizedRaceTraits(race: SrdRace, language: string): SrdFeatureBase[] {
  ensureLocalizationLoaded();
  const translation = language === 'uk' && race.source === 'srd-5.1' ? raceTranslationById!.get(race.id) : undefined;
  if (!translation) return race.traits;
  return race.traits.map((trait, index) => {
    const t = translation.traits[index];
    return t && t.id === trait.id ? { ...trait, name: t.name, summary: t.summary } : trait;
  });
}

export function getLocalizedSubraceTraits(race: SrdRace, subrace: SrdSubrace, language: string): SrdFeatureBase[] {
  ensureLocalizationLoaded();
  const raceTranslation = language === 'uk' && race.source === 'srd-5.1' ? raceTranslationById!.get(race.id) : undefined;
  const subraceTranslation = raceTranslation?.subraces.find((entry) => entry.id === subrace.id);
  if (!subraceTranslation) return subrace.traits;
  return subrace.traits.map((trait, index) => {
    const t = subraceTranslation.traits[index];
    return t && t.id === trait.id ? { ...trait, name: t.name, summary: t.summary } : trait;
  });
}

export function getLocalizedClassFeatures(srdClass: SrdClass, language: string): SrdClassFeature[] {
  ensureLocalizationLoaded();
  const translation = language === 'uk' && srdClass.source === 'srd-5.1' ? classTranslationById!.get(srdClass.id) : undefined;
  if (!translation) return srdClass.features;
  return srdClass.features.map((feature, index) => {
    const t = translation.features[index];
    return t && t.id === feature.id ? { ...feature, name: t.name, summary: t.summary } : feature;
  });
}

export function getLocalizedBackgroundFeature(background: SrdBackground, language: string): SrdFeatureBase {
  ensureLocalizationLoaded();
  const translation = language === 'uk' && background.source === 'srd-5.1' ? backgroundTranslationById!.get(background.id) : undefined;
  if (!translation || translation.feature.id !== background.feature.id) return background.feature;
  return { ...background.feature, name: translation.feature.name, summary: translation.feature.summary };
}

export function getLocalizedEquipmentText(text: string, language: string): string {
  ensureLocalizationLoaded();
  if (language !== 'uk') return text;
  return equipmentTranslations!.get(text) || text;
}
