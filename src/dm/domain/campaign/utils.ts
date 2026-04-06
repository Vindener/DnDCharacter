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
