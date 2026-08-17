import type { SpellbookSpell } from '@/domain/spellbook/spellbookEntity';
import type { MonsterDto } from '@/types/Monster';
import type { SrdMonster, SrdMonsterAction, SrdSpell } from './types';

function actionListToText(actions: SrdMonsterAction[]): string {
  return actions.map((action) => `${action.name}. ${action.description}`.trim()).join('\n\n');
}

export function srdSpellToSpellbookSpell(spell: SrdSpell): SpellbookSpell {
  return {
    id: `srd-spell-${spell.id}`,
    name: spell.name,
    level: spell.level,
    school: spell.school,
    castingTime: spell.castingTime,
    range: spell.range,
    components: spell.components,
    duration: spell.duration,
    description: spell.description,
    higherLevels: spell.higherLevels,
    classes: spell.classes,
    tags: spell.tags,
    ritual: spell.ritual,
    concentration: spell.concentration,
    damageProfiles: [],
    source: spell.source,
    license: spell.license,
    createdAt: 0,
    updatedAt: 0,
  };
}

export function srdMonsterToMonsterDto(monster: SrdMonster): MonsterDto {
  return {
    id: `srd-monster-${monster.id}`,
    name: monster.name,
    size: monster.size,
    type: monster.type,
    alignment: monster.alignment,
    challenge: monster.challengeRating,
    challengeRating: monster.challengeRating,
    xp: monster.xp,
    source: monster.source,
    license: monster.license,
    tags: monster.tags,
    armorClass: monster.armorClass,
    hitPoints: monster.hitPoints,
    hitDice: monster.hitDice,
    speed: monster.speed,
    savingThrows: monster.savingThrows,
    skills: monster.skills,
    damageVulnerabilities: monster.damageVulnerabilities,
    damageResistances: monster.damageResistances,
    damageImmunities: monster.damageImmunities,
    conditionImmunities: monster.conditionImmunities,
    senses: monster.senses,
    languages: monster.languages,
    traits: actionListToText(monster.traits),
    actions: actionListToText(monster.actions),
    reactions: actionListToText(monster.reactions),
    legendaryActions: actionListToText(monster.legendaryActions),
    normalizedTraits: monster.traits,
    normalizedActions: monster.actions,
    normalizedReactions: monster.reactions,
    normalizedLegendaryActions: monster.legendaryActions,
    isCustom: false,
    stats: monster.abilities,
  };
}
