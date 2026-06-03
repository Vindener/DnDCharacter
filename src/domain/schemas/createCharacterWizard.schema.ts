import { z } from 'zod';
import { safeParseWithIssues, toBoolean, toNumber, toTrimmedString } from './utils';

export type StorageMode = 'local-only' | 'local-cloud';
export type StatMethod = 'array' | 'pointbuy';

export type CreateCharacterWizardPayload = {
  name: string;
  level: number;
  isCustomRace: boolean;
  customRace: string;
  selectedClass: string;
  customClassName: string;
  backgroundKey: string;
  customBackground: string;
  storageMode: StorageMode;
  inviteEmail: string;
  statMethod: StatMethod;
  pointBuyValid: boolean;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeWizardPayload(raw: unknown): CreateCharacterWizardPayload {
  const cast = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const storageMode = toTrimmedString(cast.storageMode) === 'local-cloud' ? 'local-cloud' : 'local-only';
  const statMethod = toTrimmedString(cast.statMethod) === 'pointbuy' ? 'pointbuy' : 'array';

  return {
    name: toTrimmedString(cast.name),
    level: Math.floor(toNumber(cast.level, 1)),
    isCustomRace: toBoolean(cast.isCustomRace, false),
    customRace: toTrimmedString(cast.customRace),
    selectedClass: toTrimmedString(cast.selectedClass),
    customClassName: toTrimmedString(cast.customClassName),
    backgroundKey: toTrimmedString(cast.backgroundKey),
    customBackground: toTrimmedString(cast.customBackground),
    storageMode,
    inviteEmail: toTrimmedString(cast.inviteEmail),
    statMethod,
    pointBuyValid: toBoolean(cast.pointBuyValid, true),
  };
}

function validateStep2(value: CreateCharacterWizardPayload, ctx: z.RefinementCtx): void {
  if (!value.name) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['name'], message: 'Введіть ім’я персонажа.' });
  }
  if (!Number.isFinite(value.level) || value.level < 1 || value.level > 20) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['level'], message: 'Рівень має бути від 1 до 20.' });
  }
  if (value.isCustomRace && !value.customRace) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customRace'], message: 'Для власної раси вкажіть назву.' });
  }
}

function validateStep3(value: CreateCharacterWizardPayload, ctx: z.RefinementCtx): void {
  if (value.selectedClass === 'custom' && !value.customClassName) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customClassName'], message: 'Для власного класу введіть назву.' });
  }
}

function validateStep4(value: CreateCharacterWizardPayload, ctx: z.RefinementCtx): void {
  if (value.statMethod === 'pointbuy' && !value.pointBuyValid) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['pointBuyValid'], message: 'Розподіл балів перевищує ліміт 27.' });
  }
}

function validateStep5(value: CreateCharacterWizardPayload, ctx: z.RefinementCtx): void {
  if (value.backgroundKey === 'custom' && !value.customBackground) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customBackground'], message: 'Для власної предісторії введіть назву.' });
  }
}

function validateStep6(value: CreateCharacterWizardPayload, ctx: z.RefinementCtx): void {
  if (!value.inviteEmail) return;
  if (!EMAIL_REGEX.test(value.inviteEmail)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['inviteEmail'],
      message: 'Електронна пошта для шерінгу має некоректний формат.',
    });
  }
  if (value.storageMode === 'local-only') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['storageMode'],
      message: 'Шерінг доступний тільки у режимі "Локально + Хмара".',
    });
  }
}

const createCharacterWizardBaseSchema = z.any().transform((value) => normalizeWizardPayload(value));

export const createCharacterWizardSchema = createCharacterWizardBaseSchema.superRefine((value, ctx) => {
  validateStep2(value, ctx);
  validateStep3(value, ctx);
  validateStep4(value, ctx);
  validateStep5(value, ctx);
  validateStep6(value, ctx);
});

const createCharacterWizardStepSchemas: Record<number, z.ZodType<CreateCharacterWizardPayload>> = {
  2: createCharacterWizardBaseSchema.superRefine(validateStep2),
  3: createCharacterWizardBaseSchema.superRefine(validateStep3),
  4: createCharacterWizardBaseSchema.superRefine(validateStep4),
  5: createCharacterWizardBaseSchema.superRefine(validateStep5),
  6: createCharacterWizardBaseSchema.superRefine(validateStep6),
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

