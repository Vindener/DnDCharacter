import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LATEST_SCHEMA_VERSION, createStorageEnvelope } from '@/domain/migrations';
import { createSpellRepository } from '@/domain/spellbook';

const { storage, asyncStorageMock } = vi.hoisted(() => {
  const storage = new Map<string, string>();
  return {
    storage,
    asyncStorageMock: {
      getItem: vi.fn(async (key: string) => (storage.has(key) ? storage.get(key)! : null)),
      setItem: vi.fn(async (key: string, value: string) => {
        storage.set(key, value);
      }),
      removeItem: vi.fn(async (key: string) => {
        storage.delete(key);
      }),
    },
  };
});

vi.mock('@react-native-async-storage/async-storage', () => ({ default: asyncStorageMock }));

const SPELLBOOK_STORAGE_KEY = 'SPELLBOOK_V1';
const FAVORITES_STORAGE_KEY = 'SPELLBOOK_FAVORITES_V1';
const PINS_STORAGE_KEY = 'SPELLBOOK_PINS_V1';
const NOTES_STORAGE_KEY = 'SPELLBOOK_NOTES_V1';

function createCustomSpell(id = 'spell-custom-legacy') {
  return {
    id,
    name: 'Legacy Bolt',
    level: 2,
    school: 'Evocation',
    castingTime: '1 action',
    range: '60 ft',
    components: { verbal: true, somatic: true, material: '' },
    duration: 'Instantaneous',
    description: 'Legacy custom',
    higherLevels: '',
    classes: ['Wizard'],
    tags: ['legacy'],
    ritual: false,
    concentration: false,
    damageProfiles: [],
    source: 'user-custom' as const,
    license: 'custom' as const,
    createdAt: 1,
    updatedAt: 1,
  };
}

describe('domain/spellbook/spellRepository', () => {
  beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
  });

  it('loads legacy storage format and rewrites to envelope format', async () => {
    const custom = createCustomSpell();
    storage.set(SPELLBOOK_STORAGE_KEY, JSON.stringify([custom]));
    storage.set(FAVORITES_STORAGE_KEY, JSON.stringify([custom.id, 'unknown-id']));
    storage.set(PINS_STORAGE_KEY, JSON.stringify([custom.id, 'unknown-id']));
    storage.set(NOTES_STORAGE_KEY, JSON.stringify({ [custom.id]: 'Use on round two', 'unknown-id': 'drop' }));

    const repository = createSpellRepository();
    const state = await repository.loadSpellbook();

    expect(state.spells.some((spell) => spell.id === custom.id)).toBe(true);
    expect(state.spells.length).toBeGreaterThan(1);
    expect(state.favoriteSpellIds).toEqual([custom.id]);
    expect(state.pinnedSpellIds).toEqual([custom.id]);
    expect(state.spellNotesById).toEqual({ [custom.id]: 'Use on round two' });

    const storedSpells = JSON.parse(storage.get(SPELLBOOK_STORAGE_KEY) || '{}');
    const storedFavorites = JSON.parse(storage.get(FAVORITES_STORAGE_KEY) || '{}');
    const storedPins = JSON.parse(storage.get(PINS_STORAGE_KEY) || '{}');
    const storedNotes = JSON.parse(storage.get(NOTES_STORAGE_KEY) || '{}');

    expect(storedSpells.schemaVersion).toBe(LATEST_SCHEMA_VERSION);
    expect(Array.isArray(storedSpells.data)).toBe(true);
    expect(storedFavorites.schemaVersion).toBe(LATEST_SCHEMA_VERSION);
    expect(storedFavorites.data).toEqual([custom.id]);
    expect(storedPins.schemaVersion).toBe(LATEST_SCHEMA_VERSION);
    expect(storedPins.data).toEqual([custom.id]);
    expect(storedNotes.schemaVersion).toBe(LATEST_SCHEMA_VERSION);
    expect(storedNotes.data).toEqual({ [custom.id]: 'Use on round two' });
  });

  it('loads envelope storage format', async () => {
    const custom = createCustomSpell('spell-custom-envelope');
    storage.set(SPELLBOOK_STORAGE_KEY, JSON.stringify(createStorageEnvelope('spellbookSpells', [custom])));
    storage.set(FAVORITES_STORAGE_KEY, JSON.stringify(createStorageEnvelope('spellbookFavorites', [custom.id])));

    const repository = createSpellRepository();
    const state = await repository.loadSpellbook();

    expect(state.spells.some((spell) => spell.id === custom.id)).toBe(true);
    expect(state.favoriteSpellIds).toEqual([custom.id]);
  });

  it('upserts custom spells and persists state', async () => {
    const repository = createSpellRepository();
    const loaded = await repository.loadSpellbook();

    const result = await repository.upsertCustomSpell(loaded, {
      name: 'New Spell',
      level: 3,
      school: 'Evocation',
      castingTime: '1 Action',
      range: '150 ft',
      components: 'V, S, M (ruby dust)',
      duration: 'Instantaneous',
      higherLevels: '+1d6 per level',
      classes: 'Wizard, Sorcerer',
      ritual: false,
      concentration: true,
      tags: ['test'],
    });

    expect(result.spell).toBeTruthy();
    expect(result.spell?.source).toBe('user-custom');
    expect(result.spell?.license).toBe('custom');
    expect(result.spell?.castingTime).toBe('1 Action');
    expect(result.spell?.range).toBe('150 ft');
    expect(result.spell?.components.material).toBe('ruby dust');
    expect(result.spell?.duration).toBe('Instantaneous');
    expect(result.spell?.higherLevels).toBe('+1d6 per level');
    expect(result.spell?.classes).toEqual(['Wizard', 'Sorcerer']);
    expect(result.spell?.concentration).toBe(true);
    expect(result.state.spells.some((spell) => spell.id === result.spell?.id)).toBe(true);

    const storedSpells = JSON.parse(storage.get(SPELLBOOK_STORAGE_KEY) || '{}');
    expect(storedSpells.schemaVersion).toBe(LATEST_SCHEMA_VERSION);
    expect(storedSpells.data.some((spell: { id: string }) => spell.id === result.spell?.id)).toBe(true);
  });

  it('removes custom spells and cleans up favorites', async () => {
    const repository = createSpellRepository();
    const loaded = await repository.loadSpellbook();
    const created = await repository.upsertCustomSpell(loaded, { name: 'Temporary Spell' });
    expect(created.spell).toBeTruthy();

    const withFavorite = await repository.toggleFavorite(created.state, created.spell!.id);
    expect(withFavorite.favoriteSpellIds).toContain(created.spell!.id);
    const withPin = await repository.togglePinnedSpell(withFavorite, created.spell!.id);
    const withNote = await repository.updateSpellNote(withPin, created.spell!.id, 'Boss opener');

    const removed = await repository.removeCustomSpell(withNote, created.spell!.id);
    expect(removed.spells.some((spell) => spell.id === created.spell!.id)).toBe(false);
    expect(removed.favoriteSpellIds).not.toContain(created.spell!.id);
    expect(removed.pinnedSpellIds).not.toContain(created.spell!.id);
    expect(removed.spellNotesById[created.spell!.id]).toBeUndefined();
  });

  it('toggles favorites on and off', async () => {
    const repository = createSpellRepository();
    const loaded = await repository.loadSpellbook();
    const targetId = loaded.spells[0].id;

    const added = await repository.toggleFavorite(loaded, targetId);
    expect(added.favoriteSpellIds).toContain(targetId);

    const removed = await repository.toggleFavorite(added, targetId);
    expect(removed.favoriteSpellIds).not.toContain(targetId);
  });

  it('toggles pinned spells and persists DM notes', async () => {
    const repository = createSpellRepository();
    const loaded = await repository.loadSpellbook();
    const targetId = loaded.spells[0].id;

    const pinned = await repository.togglePinnedSpell(loaded, targetId);
    expect(pinned.pinnedSpellIds).toContain(targetId);

    const withNote = await repository.updateSpellNote(pinned, targetId, 'Counterspell if cast near boss.');
    expect(withNote.spellNotesById[targetId]).toBe('Counterspell if cast near boss.');

    const clearedNote = await repository.updateSpellNote(withNote, targetId, '');
    expect(clearedNote.spellNotesById[targetId]).toBeUndefined();

    const unpinned = await repository.togglePinnedSpell(clearedNote, targetId);
    expect(unpinned.pinnedSpellIds).not.toContain(targetId);
  });

  it('keeps local behavior unchanged when cloud contract is present', async () => {
    const pullSpellbookState = vi.fn(async () => ({
      spells: [createCustomSpell('spell-cloud-1')],
      favoriteSpellIds: ['spell-cloud-1'],
    }));
    const pushSpellbookState = vi.fn(async () => {});

    const repository = createSpellRepository({
      cloudRepository: {
        pullSpellbookState,
        pushSpellbookState,
      },
    });

    const loaded = await repository.loadSpellbook();
    expect(pullSpellbookState).toHaveBeenCalledTimes(1);
    expect(loaded.spells.some((spell) => spell.id === 'spell-cloud-1')).toBe(false);

    await repository.upsertCustomSpell(loaded, { name: 'Cloud Probe' });
    expect(pushSpellbookState).toHaveBeenCalled();
  });
});
