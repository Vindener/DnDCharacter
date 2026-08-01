import type { DMCampaign } from '@/dm/domain/types';

export function normalizeCampaignName(name: string): string {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim();
}

export function slugifyCampaignName(name: string): string {
  const normalized = normalizeCampaignName(name).replace(/\s+/g, '-');
  return normalized || 'campaign';
}

export function buildCampaignId(name: string): string {
  return `campaign-${slugifyCampaignName(name)}`;
}

export function sortCampaignsByRecency(items: DMCampaign[]): DMCampaign[] {
  return [...items].sort((a, b) => b.updatedAtMs - a.updatedAtMs || a.name.localeCompare(b.name));
}

const CAMPAIGN_SUMMARY_MAX_LENGTH = 500;
const CAMPAIGN_PARTY_LEVEL_MIN = 1;
const CAMPAIGN_PARTY_LEVEL_MAX = 20;

export function sanitizeCampaignSummary(input: unknown): string | undefined {
  if (input == null) return undefined;
  const trimmed = String(input).trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, CAMPAIGN_SUMMARY_MAX_LENGTH);
}

export function clampPartyLevelEstimate(input: unknown): number | undefined {
  if (input == null) return undefined;
  const num = Number(input);
  if (!Number.isFinite(num)) return undefined;
  return Math.min(CAMPAIGN_PARTY_LEVEL_MAX, Math.max(CAMPAIGN_PARTY_LEVEL_MIN, Math.round(num)));
}
