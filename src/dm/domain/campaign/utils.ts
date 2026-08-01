import type { DMCampaign } from '@/dm/domain/types';

export function normalizeCampaignName(name: string): string {
  // Unicode-aware (\p{L}/\p{N} with the u flag) so non-Latin names (e.g. Ukrainian
  // Cyrillic) keep their letters instead of being stripped down to an empty string —
  // an empty nameNormalized used to make sanitizeCampaign/mapCloudCampaign in
  // campaignRepository.ts treat the whole campaign as invalid and silently drop it.
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
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

// Not a bottomless array in a single Firestore document — capped like other campaign-scoped lists.
export const CAMPAIGN_PINNED_ITEMS_CAP = 20;

export function sanitizeCampaignPinnedIds(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const unique = Array.from(new Set(input.map((item) => String(item || '')).filter(Boolean)));
  return unique.slice(-CAMPAIGN_PINNED_ITEMS_CAP);
}
