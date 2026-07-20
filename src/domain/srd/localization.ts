import spellTranslationsJson from '@/data/locales/uk/spells.json';
import monsterTranslationsJson from '@/data/locales/uk/monsters.json';
import canonicalSpellsJson from '@/data/srd/spells.json';
import canonicalMonstersJson from '@/data/srd/monsters.json';
import type { SpellbookSpell } from '@/types/Spellbook';
import type { MonsterActionDto, MonsterDto } from '@/types/Monster';

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

const spellTranslations = spellTranslationsJson as SpellTranslation[];
const monsterTranslations = monsterTranslationsJson as MonsterTranslation[];
const spellTranslationById = new Map(spellTranslations.map((entry) => [entry.id, entry]));
const monsterTranslationById = new Map(monsterTranslations.map((entry) => [entry.id, entry]));

const spellSchoolTranslations = new Map<string, string>();
const spellClassTranslations = new Map<string, string>();
canonicalSpellsJson.forEach((spell, index) => {
  const translation = spellTranslations[index];
  if (!translation || translation.id !== spell.id) return;
  spellSchoolTranslations.set(spell.school, translation.school);
  spell.classes.forEach((className, classIndex) => {
    spellClassTranslations.set(className, translation.classes[classIndex] || className);
  });
});

const monsterTermTranslations = new Map<string, string>();
canonicalMonstersJson.forEach((monster, index) => {
  const translation = monsterTranslations[index];
  if (!translation || translation.id !== monster.id) return;
  monsterTermTranslations.set(monster.size, translation.size);
  monsterTermTranslations.set(monster.type, translation.type);
  monsterTermTranslations.set(monster.alignment, translation.alignment);
});

function getCanonicalId(id: string, prefix: string): string {
  return id.startsWith(prefix) ? id.slice(prefix.length) : id;
}

function actionsToText(actions: MonsterActionDto[]): string {
  return actions.map((action) => `${action.name}. ${action.description}`.trim()).join('\n\n');
}

export function getLocalizedSpellFields(spell: SpellbookSpell, language: string): LocalizedSpellFields {
  const translation = language === 'uk' && spell.source === 'srd-5.1'
    ? spellTranslationById.get(getCanonicalId(spell.id, 'srd-spell-'))
    : undefined;

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
  return language === 'uk' ? spellSchoolTranslations.get(value) || value : value;
}

export function getLocalizedSpellClass(value: string, language: string): string {
  return language === 'uk' ? spellClassTranslations.get(value) || value : value;
}

export function getLocalizedMonsterTerm(value: string, language: string): string {
  return language === 'uk' ? monsterTermTranslations.get(value) || value : value;
}

export function getLocalizedMonster(monster: MonsterDto, language: string): MonsterDto {
  const translation = language === 'uk' && monster.source === 'srd-5.1'
    ? monsterTranslationById.get(getCanonicalId(monster.id, 'srd-monster-'))
    : undefined;
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
  ].filter(Boolean).join(' ');
}
