import { z } from 'zod';

export type SchemaIssue = {
  path: string;
  message: string;
};

export type SafeSchemaResult<T> =
  | {
      ok: true;
      data: T;
      issues: [];
    }
  | {
      ok: false;
      data: null;
      issues: SchemaIssue[];
    };

export function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export function toString(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

export function toTrimmedString(value: unknown, fallback = ''): string {
  return toString(value, fallback).trim();
}

export function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

export function clampNumber(value: number, min?: number, max?: number): number {
  let next = value;
  if (typeof min === 'number') next = Math.max(min, next);
  if (typeof max === 'number') next = Math.min(max, next);
  return next;
}

export function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return fallback;
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return fallback;
}

export function toStringArray(value: unknown, options?: { dedupe?: boolean }): string[] {
  if (!Array.isArray(value)) return [];
  const list = value
    .map((item) => toTrimmedString(item))
    .filter(Boolean);
  if (!options?.dedupe) return list;
  return Array.from(new Set(list));
}

export function toFiniteStringRecord(value: unknown): Record<string, number> {
  const record = asRecord(value);
  const out: Record<string, number> = {};
  Object.entries(record).forEach(([key, item]) => {
    const numeric = Number(item);
    if (!key || !Number.isFinite(numeric)) return;
    out[key] = numeric;
  });
  return out;
}

export function safeParseWithIssues<T>(
  schema: z.ZodType<T>,
  input: unknown,
): SafeSchemaResult<T> {
  const result = schema.safeParse(input);
  if (result.success) {
    return {
      ok: true,
      data: result.data,
      issues: [],
    };
  }

  return {
    ok: false,
    data: null,
    issues: result.error.issues.map((issue) => ({
      path: issue.path.map((part) => String(part)).join('.'),
      message: issue.message,
    })),
  };
}

export function formatSchemaErrors(issues: Array<Pick<SchemaIssue, 'path' | 'message'>>): string[] {
  return issues.map((issue) => {
    if (!issue.path) return issue.message;
    return `${issue.path}: ${issue.message}`;
  });
}
