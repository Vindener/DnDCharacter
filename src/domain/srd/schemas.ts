import { z } from 'zod';
import type {
  SrdBackground,
  SrdClass,
  SrdClassProgression,
  SrdCondition,
  SrdEquipmentItem,
  SrdLanguage,
  SrdRace,
  SrdSkill,
} from './types';

const abilityIds = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const;
const skillIds = [
  'acrobatics',
  'animalHandling',
  'arcana',
  'athletics',
  'deception',
  'history',
  'insight',
  'intimidation',
  'investigation',
  'medicine',
  'nature',
  'perception',
  'performance',
  'persuasion',
  'religion',
  'sleightOfHand',
  'stealth',
  'survival',
] as const;

const srdBaseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  source: z.literal('srd-5.1'),
  license: z.literal('ogl-1.0a'),
  tags: z.array(z.string().min(1)).min(1),
});

const srdFeatureSchema = srdBaseSchema.extend({
  summary: z.string().min(1),
});

const abilityIncreaseSchema = z.partialRecord(z.enum(abilityIds), z.number());

const flexibleAbilityScoreIncreaseSchema = z.object({
  count: z.number().int().min(1),
  amount: z.number().int().min(1),
  exclude: z.array(z.enum(abilityIds)).optional(),
});

const subraceSchema = srdBaseSchema.extend({
  abilityScoreIncreases: abilityIncreaseSchema.optional(),
  flexibleAbilityScoreIncrease: flexibleAbilityScoreIncreaseSchema.optional(),
  languages: z.array(z.string()).optional(),
  traits: z.array(srdFeatureSchema),
});

export const srdRaceSchema = srdBaseSchema.extend({
  speed: z.number().int().min(0),
  abilityScoreIncreases: abilityIncreaseSchema.optional(),
  flexibleAbilityScoreIncrease: flexibleAbilityScoreIncreaseSchema.optional(),
  languages: z.array(z.string()),
  traits: z.array(srdFeatureSchema),
  subraces: z.array(subraceSchema),
}) satisfies z.ZodType<SrdRace>;

export const srdClassSchema = srdBaseSchema.extend({
  hitDie: z.number().int().min(1),
  primaryAbilities: z.array(z.enum(abilityIds)),
  savingThrows: z.array(z.enum(abilityIds)),
  proficiencies: z.array(z.string()),
  spellcastingAbility: z.enum(abilityIds).optional(),
  skillChoices: z.object({
    choose: z.number().int().min(0),
    from: z.array(z.enum(skillIds)),
  }),
  startingEquipment: z.object({
    base: z.array(z.string()),
    choices: z.array(z.object({ label: z.string(), options: z.array(z.string()) })),
  }),
  features: z.array(srdFeatureSchema.extend({ level: z.number().int().min(1).max(20) })),
}) satisfies z.ZodType<SrdClass>;

export const srdClassProgressionSchema = srdBaseSchema.omit({ name: true }).extend({
  classId: z.string().min(1),
  levels: z.array(z.object({
    level: z.number().int().min(1).max(20),
    proficiencyBonus: z.number().int().min(2).max(6),
    features: z.array(z.string()),
  })).length(20),
}) satisfies z.ZodType<SrdClassProgression>;

export const srdEquipmentItemSchema = srdBaseSchema.extend({
  category: z.string().min(1),
}) satisfies z.ZodType<SrdEquipmentItem>;

export const srdConditionSchema = srdFeatureSchema satisfies z.ZodType<SrdCondition>;

export const srdSkillSchema = srdBaseSchema.extend({
  ability: z.enum(abilityIds),
}) satisfies z.ZodType<SrdSkill>;

export const srdLanguageSchema = srdBaseSchema.extend({
  category: z.enum(['standard', 'exotic']),
}) satisfies z.ZodType<SrdLanguage>;

export const srdBackgroundSchema = srdBaseSchema.extend({
  skills: z.array(z.enum(skillIds)),
  tools: z.array(z.string()),
  languages: z.number().int().min(0),
  equipment: z.array(z.string()),
  feature: srdFeatureSchema,
  startingGold: z.number().int().min(0),
}) satisfies z.ZodType<SrdBackground>;

export function parseSrdArray<T>(schema: z.ZodType<T>, value: unknown): T[] {
  return z.array(schema).parse(value);
}
