import { z } from 'zod';
import {
  ABILITY_KEYS,
  POINT_BUY_BUDGET,
  isStandardArrayComplete,
  pointBuySpent,
  type ShareTarget,
  type StartMethod,
  type StatMethod,
  type StorageMode,
} from '@/screens/CreateCharacter/createCharacterWizard';
import { safeParseWithIssues, toBoolean, toNumber, toTrimmedString } from './utils';

export type { StorageMode, StatMethod } from '@/screens/CreateCharacter/createCharacterWizard';

export type CreateCharacterWizardPayload = {
  step: number;
  startMethod: StartMethod;
  name: string;
  level: number;
  isCustomRace: boolean;
  customRace: string;
  selectedClass: string;
  customClassName: string;
  backgroundKey: string;
  customBackground: string;
  statMethod: StatMethod;
  stats: Record<string, number>;
  pointBuyStats: Record<string, number>;
  manualStats: Record<string, string>;
  rollStats: Record<string, string>;
  hpMax: number;
  hpCurrent: number;
  hitDice: string;
  ac: number;
  speed: number;
  proficiencyBonus: number;
  storageMode: StorageMode;
  shareTarget: ShareTarget;
  inviteEmail: string;
  isOnline: boolean;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const START_METHODS: StartMethod[] = ['standard-5e', 'quick', 'homebrew-blank', 'import'];
const STAT_METHODS: StatMethod[] = ['array', 'pointbuy', 'manual', 'roll', 'random'];
const SHARE_TARGETS: ShareTarget[] = ['none', 'dm', 'player'];

function normalizeRecordStrings(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
    out[key] = toTrimmedString(item);
  });
  return out;
}

function normalizeRecordNumbers(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, number> = {};
  Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
    out[key] = Math.floor(toNumber(item, 0));
  });
  return out;
}

function normalizeWizardPayload(raw: unknown): CreateCharacterWizardPayload {
  const cast = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const startMethodRaw = toTrimmedString(cast.startMethod);
  const statMethodRaw = toTrimmedString(cast.statMethod);
  const storageMode = toTrimmedString(cast.storageMode) === 'local-cloud' ? 'local-cloud' : 'local-only';
  const shareTargetRaw = toTrimmedString(cast.shareTarget);

  return {
    step: Math.floor(toNumber(cast.step, 1)),
    startMethod: START_METHODS.includes(startMethodRaw as StartMethod) ? (startMethodRaw as StartMethod) : 'standard-5e',
    name: toTrimmedString(cast.name),
    level: Math.floor(toNumber(cast.level, 1)),
    isCustomRace: toBoolean(cast.isCustomRace, false),
    customRace: toTrimmedString(cast.customRace),
    selectedClass: toTrimmedString(cast.selectedClass),
    customClassName: toTrimmedString(cast.customClassName),
    backgroundKey: toTrimmedString(cast.backgroundKey),
    customBackground: toTrimmedString(cast.customBackground),
    statMethod: STAT_METHODS.includes(statMethodRaw as StatMethod) ? (statMethodRaw as StatMethod) : 'array',
    stats: normalizeRecordNumbers(cast.stats),
    pointBuyStats: normalizeRecordNumbers(cast.pointBuyStats),
    manualStats: normalizeRecordStrings(cast.manualStats),
    rollStats: normalizeRecordStrings(cast.rollStats),
    hpMax: Math.floor(toNumber(cast.hpMax, 1)),
    hpCurrent: Math.floor(toNumber(cast.hpCurrent, 1)),
    hitDice: toTrimmedString(cast.hitDice),
    ac: Math.floor(toNumber(cast.ac, 10)),
    speed: Math.floor(toNumber(cast.speed, 30)),
    proficiencyBonus: Math.floor(toNumber(cast.proficiencyBonus, 2)),
    storageMode,
    shareTarget: SHARE_TARGETS.includes(shareTargetRaw as ShareTarget) ? (shareTargetRaw as ShareTarget) : 'none',
    inviteEmail: toTrimmedString(cast.inviteEmail),
    isOnline: toBoolean(cast.isOnline, true),
  };
}

function validateIdentity(value: CreateCharacterWizardPayload, ctx: z.RefinementCtx): void {
  if (!value.name) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['name'], message: 'Введіть ім’я персонажа.' });
  }
  if (!Number.isFinite(value.level) || value.level < 1 || value.level > 20) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['level'], message: 'Рівень має бути від 1 до 20.' });
  }
}

function validateRaceClassBackground(value: CreateCharacterWizardPayload, ctx: z.RefinementCtx): void {
  if (value.isCustomRace && !value.customRace) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customRace'], message: 'Для власної раси вкажіть назву.' });
  }
  if (value.selectedClass === 'custom' && !value.customClassName) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customClassName'], message: 'Для власного класу введіть назву.' });
  }
  if (value.backgroundKey === 'custom' && !value.customBackground) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customBackground'], message: 'Для власної предісторії введіть назву.' });
  }
}

function validateStats(value: CreateCharacterWizardPayload, ctx: z.RefinementCtx): void {
  if (value.statMethod === 'array') {
    const stats = {
      strength: value.stats.strength ?? 0,
      dexterity: value.stats.dexterity ?? 0,
      constitution: value.stats.constitution ?? 0,
      intelligence: value.stats.intelligence ?? 0,
      wisdom: value.stats.wisdom ?? 0,
      charisma: value.stats.charisma ?? 0,
    };
    if (!isStandardArrayComplete(stats)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['stats'], message: 'Розподіліть усі шість значень стандартного масиву.' });
    }
  }

  if (value.statMethod === 'pointbuy') {
    const spent = pointBuySpent({
      strength: value.pointBuyStats.strength ?? 8,
      dexterity: value.pointBuyStats.dexterity ?? 8,
      constitution: value.pointBuyStats.constitution ?? 8,
      intelligence: value.pointBuyStats.intelligence ?? 8,
      wisdom: value.pointBuyStats.wisdom ?? 8,
      charisma: value.pointBuyStats.charisma ?? 8,
    });
    if (spent > POINT_BUY_BUDGET) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['pointBuyStats'], message: 'Розподіл балів перевищує ліміт 27.' });
    }
  }

  if (value.statMethod === 'manual' || value.statMethod === 'roll' || value.statMethod === 'random') {
    const source = value.statMethod === 'manual' ? value.manualStats : value.rollStats;
    ABILITY_KEYS.forEach((ability) => {
      const score = Number(source[ability]);
      if (!Number.isFinite(score) || score < 1 || score > 30) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [value.statMethod === 'manual' ? 'manualStats' : 'rollStats', ability],
          message: 'Характеристика має бути від 1 до 30.',
        });
      }
    });
  }
}

function validateCombat(value: CreateCharacterWizardPayload, ctx: z.RefinementCtx): void {
  if (value.hpMax < 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['hpMax'], message: 'Максимальні HP мають бути більше 0.' });
  }
  if (value.hpCurrent < 0 || value.hpCurrent > Math.max(1, value.hpMax)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['hpCurrent'], message: 'Поточні HP мають бути в межах максимуму.' });
  }
  if (!value.hitDice) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['hitDice'], message: 'Вкажіть hit dice.' });
  }
  if (value.ac < 0 || value.speed < 0 || value.proficiencyBonus < 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['combat'], message: 'Бойові значення мають бути додатними.' });
  }
}

function validateStorage(value: CreateCharacterWizardPayload, ctx: z.RefinementCtx): void {
  if (value.storageMode === 'local-cloud' && !value.isOnline) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['storageMode'], message: 'Хмарне створення недоступне офлайн.' });
  }
  if (value.shareTarget !== 'none') {
    if (value.storageMode === 'local-only') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['storageMode'], message: 'Шерінг доступний тільки у режимі "Локально + Хмара".' });
    }
    if (!value.inviteEmail) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['inviteEmail'], message: 'Вкажіть email, щоб додати редактора.' });
    }
  }
  if (value.inviteEmail && !EMAIL_REGEX.test(value.inviteEmail)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['inviteEmail'], message: 'Електронна пошта для шерінгу має некоректний формат.' });
  }
}

const createCharacterWizardBaseSchema = z.any().transform((value) => normalizeWizardPayload(value));

export const createCharacterWizardSchema = createCharacterWizardBaseSchema.superRefine((value, ctx) => {
  validateIdentity(value, ctx);
  validateRaceClassBackground(value, ctx);
  validateStats(value, ctx);
  validateCombat(value, ctx);
  validateStorage(value, ctx);
});

const createCharacterWizardStepSchemas: Record<number, z.ZodType<CreateCharacterWizardPayload>> = {
  2: createCharacterWizardBaseSchema.superRefine(validateIdentity),
  3: createCharacterWizardBaseSchema.superRefine(validateRaceClassBackground),
  4: createCharacterWizardBaseSchema.superRefine(validateStats),
  5: createCharacterWizardBaseSchema.superRefine(validateCombat),
  10: createCharacterWizardBaseSchema.superRefine(validateStorage),
  11: createCharacterWizardSchema,
};

export function parseCreateCharacterWizard(input: unknown): CreateCharacterWizardPayload {
  return createCharacterWizardSchema.parse(input);
}

export function safeParseCreateCharacterWizard(input: unknown) {
  return safeParseWithIssues(createCharacterWizardSchema, input);
}

export function safeParseCreateCharacterWizardStep(input: unknown, step: number) {
  const schema = createCharacterWizardStepSchemas[step];
  if (!schema) {
    return {
      ok: true,
      data: normalizeWizardPayload(input),
      issues: [],
    };
  }
  return safeParseWithIssues(schema, input);
}

export function normalizeCreateCharacterWizard(input: unknown): CreateCharacterWizardPayload {
  return createCharacterWizardBaseSchema.parse(input);
}
