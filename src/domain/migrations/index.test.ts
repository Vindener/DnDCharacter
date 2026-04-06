import { describe, expect, it } from 'vitest';
import type { MigrationKind } from '@/domain/migrations';
import {
  LATEST_SCHEMA_VERSION,
  createStorageEnvelope,
  migrateToLatest,
  migrateV1toV2,
  migrateV2toV3,
  normalizeStorageEnvelope,
} from '@/domain/migrations';

const KINDS: MigrationKind[] = [
  'character',
  'dmCampaigns',
  'dmCampaignNotes',
  'dmNotesQueue',
  'dmMonsters',
  'dmPins',
  'dmUserTemplates',
  'appRole',
];

function legacyPayload(kind: MigrationKind): unknown {
  switch (kind) {
    case 'character':
      return {
        id: 'char-1',
        name: 'Legacy Hero',
        customTrackers: [{ id: 'trk-1', label: 'Mana', current: 2, max: 5, resetRule: 'none' }],
        notesBlocks: { session: 'session', campaign: 'campaign', goals: '', relationships: '', quests: '' },
        customSpellLists: [{ id: 'list-1', title: 'Circle', spells: ['Moon Beam'] }],
        customFeatureBlocks: [{ id: 'feat-1', title: 'Class Features', entries: ['Rage'] }],
        homebrewEntries: [],
      };
    case 'dmCampaigns':
      return [{ id: 'campaign-1', name: 'Alpha', nameNormalized: 'alpha', ownerUid: 'u1', owners: ['u1'], editors: [] }];
    case 'dmCampaignNotes':
      return [{ id: 'note-1', campaignId: 'campaign-1', title: 'N', content: 'C', ownerUid: 'u1', owners: ['u1'], editors: [] }];
    case 'dmNotesQueue':
      return [{ id: 'q1', type: 'upsert', noteId: 'note-1', campaignId: 'campaign-1', atMs: 1 }];
    case 'dmMonsters':
      return [{ id: 'm1', name: 'Goblin', stats: { strength: 8, dexterity: 14, constitution: 10, intelligence: 8, wisdom: 8, charisma: 8 } }];
    case 'dmPins':
      return ['m1', 'm1', 'm2'];
    case 'dmUserTemplates':
      return [{ id: 't1', name: 'Template', source: 'user', resource: { label: 'R', current: 1, resetRule: 'none' } }];
    case 'appRole':
      return 'invalid-role';
    default:
      return null;
  }
}

describe('domain/migrations', () => {
  it('runs v1->v2 and v2->v3 for character migrations', () => {
    const legacyCharacter = legacyPayload('character');
    const v2 = migrateV1toV2('character', legacyCharacter) as Record<string, unknown>;
    const v3 = migrateV2toV3('character', v2) as Record<string, unknown>;

    expect(Array.isArray(v2.customResources)).toBe(true);
    expect(v2.customTrackers).toEqual([]);
    expect(Array.isArray(v2.customNotesGroups)).toBe(true);

    expect(Array.isArray(v3.homebrewEntries)).toBe(true);
    expect(v3.customSpellLists).toEqual([]);
    expect(v3.customFeatureBlocks).toEqual([]);
  });

  it('migrates every supported kind to latest schema', () => {
    for (const kind of KINDS) {
      const migrated = migrateToLatest(kind, legacyPayload(kind), 1);
      expect(migrated).toBeDefined();

      if (kind === 'appRole') {
        expect(migrated).toBe('Hybrid');
      }

      if (kind === 'character') {
        const cast = migrated as Record<string, unknown>;
        expect(cast.schemaVersion).toBe(LATEST_SCHEMA_VERSION);
        expect(cast.customTrackers).toEqual([]);
        expect(Array.isArray(cast.customResources)).toBe(true);
      }

      if (kind === 'dmCampaigns' || kind === 'dmCampaignNotes') {
        const arr = migrated as Array<Record<string, unknown>>;
        expect(arr[0]?.schemaVersion).toBe(LATEST_SCHEMA_VERSION);
      }

      if (kind === 'dmPins') {
        expect(migrated).toEqual(['m1', 'm2']);
      }
    }
  });

  it('normalizes legacy storage payloads to envelope semantics at runtime', () => {
    const legacy = [legacyPayload('character')];
    const normalized = normalizeStorageEnvelope('character', legacy, [] as unknown[]);

    expect(normalized.schemaVersion).toBe(LATEST_SCHEMA_VERSION);
    expect(normalized.usedLegacyFormat).toBe(true);
    expect(Array.isArray(normalized.data)).toBe(true);
  });

  it('creates a schema-versioned storage envelope', () => {
    const envelope = createStorageEnvelope('dmCampaigns', legacyPayload('dmCampaigns') as unknown[]);
    expect(envelope.schemaVersion).toBe(LATEST_SCHEMA_VERSION);
    expect(Array.isArray(envelope.data)).toBe(true);
    expect((envelope.data[0] as Record<string, unknown>).schemaVersion).toBe(LATEST_SCHEMA_VERSION);
  });
});
