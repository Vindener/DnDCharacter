import { describe, expect, it } from 'vitest';
import { parseCampaignInitiative } from '@/domain/schemas';
import { LATEST_SCHEMA_VERSION } from '@/domain/migrations';

describe('campaignInitiative.schema', () => {
  it('normalizes a tracker payload and its combatants', () => {
    const parsed = parseCampaignInitiative({
      id: 'campaign-1',
      campaignId: 'campaign-1',
      ownerUid: 'u-1',
      round: 2,
      activeCombatantId: 'player-1',
      combatants: [
        { id: 'player-1', name: ' Aragorn ', source: 'player', roll: 18, initiativeMod: 3, hpCurrent: 30, hpMax: 30 },
        { id: 'monster-1', name: 'Goblin', source: 'monster', roll: 12, initiativeMod: 2, hpCurrent: 7 },
      ],
      syncStatus: 'Synced',
    });

    expect(parsed.schemaVersion).toBe(LATEST_SCHEMA_VERSION);
    expect(parsed.round).toBe(2);
    expect(parsed.combatants).toHaveLength(2);
    expect(parsed.combatants[0].name).toBe('Aragorn');
    expect(parsed.syncStatus).toBe('Synced');
  });

  it('drops combatants missing required id/name and falls back to safe defaults', () => {
    const parsed = parseCampaignInitiative({
      id: 'campaign-1',
      campaignId: 'campaign-1',
      combatants: [
        { id: '', name: 'No id' },
        { id: 'ok-1', name: '' },
        { id: 'ok-2', name: 'Valid' },
      ],
      round: -5,
      syncStatus: 'not-a-real-status',
    });

    expect(parsed.combatants).toHaveLength(1);
    expect(parsed.combatants[0].id).toBe('ok-2');
    expect(parsed.round).toBe(1);
    expect(parsed.syncStatus).toBe('Local only');
    expect(parsed.activeCombatantId).toBeNull();
  });

  it('caps combatants at 40 entries', () => {
    const combatants = Array.from({ length: 60 }, (_, index) => ({ id: `c-${index}`, name: `Combatant ${index}` }));
    const parsed = parseCampaignInitiative({ id: 'campaign-1', campaignId: 'campaign-1', combatants });

    expect(parsed.combatants).toHaveLength(40);
  });
});
