import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDmStoreEffects } from '@/services/storeEffects/dmStoreEffects';
import type { DmStore } from '@/stores/dmStore';

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

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: asyncStorageMock,
}));

const ROLE_STORAGE_KEY = 'APP_ROLE_MODE_V1';
const MONSTERS_STORAGE_KEY = 'monsters';
const PINS_STORAGE_KEY = 'monster-pins';
const FAVORITES_STORAGE_KEY = 'monster-favorites';
const USER_TEMPLATES_STORAGE_KEY = 'RESOURCE_USER_TEMPLATES_V1';

function createHarness() {
  let state: DmStore = {
    monsters: [],
    pinnedMonsterIds: [],
    favoriteMonsterIds: [],
    isLoaded: false,
    loadError: null,
    role: 'Hybrid',
    userTemplates: [],
    loadMonsters: async () => {},
    saveMonsters: async () => {},
    addMonster: async () => {},
    addMonsters: async () => {},
    updateMonster: async () => {},
    removeMonster: async () => {},
    togglePinnedMonster: async () => {},
    toggleFavoriteMonster: async () => {},
    clearPinnedMonsters: async () => {},
    setRole: async () => {},
    loadRole: async () => {},
    loadUserTemplates: async () => {},
    addUserTemplateFromResource: async () => {},
    removeUserTemplate: async () => {},
  };

  const set: Parameters<typeof createDmStoreEffects>[0]['set'] = (partial) => {
    const next = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...next };
  };
  const get = () => state;

  const effects = createDmStoreEffects({ set, get });
  return {
    effects,
    getState: () => state,
  };
}

beforeEach(() => {
  storage.clear();
  vi.clearAllMocks();
});

describe('dmStoreEffects migration pipeline', () => {
  it('loads legacy plain-string role and normalizes it', async () => {
    storage.set(ROLE_STORAGE_KEY, 'DM');
    const harness = createHarness();

    await harness.effects.loadRole();

    expect(harness.getState().role).toBe('DM');
  });

  it('loads legacy monsters and pins payloads', async () => {
    storage.set(
      MONSTERS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'monster-1',
          name: 'Goblin',
          stats: { strength: 8, dexterity: 14, constitution: 10, intelligence: 8, wisdom: 8, charisma: 8 },
        },
      ]),
    );
    storage.set(PINS_STORAGE_KEY, JSON.stringify(['monster-1', 'missing']));
    storage.set(FAVORITES_STORAGE_KEY, JSON.stringify(['monster-1', 'missing']));

    const harness = createHarness();
    await harness.effects.loadMonsters();

    expect(harness.getState().monsters.length).toBeGreaterThan(1);
    expect(harness.getState().monsters.some((monster) => monster.source === 'srd-5.1')).toBe(true);
    expect(harness.getState().pinnedMonsterIds).toEqual(['monster-1']);
    expect(harness.getState().favoriteMonsterIds).toEqual(['monster-1']);
    expect(harness.getState().isLoaded).toBe(true);
  });

  it('toggles favorite monsters and cleans favorites when a monster is removed', async () => {
    const harness = createHarness();
    await harness.effects.addMonster({
      id: 'monster-1',
      name: 'Goblin',
      stats: { strength: 8, dexterity: 14, constitution: 10, intelligence: 8, wisdom: 8, charisma: 8 },
    });

    await harness.effects.toggleFavoriteMonster('monster-1');

    expect(harness.getState().favoriteMonsterIds).toEqual(['monster-1']);
    expect(storage.get(FAVORITES_STORAGE_KEY)).toContain('monster-1');

    await harness.effects.removeMonster('monster-1');

    expect(harness.getState().favoriteMonsterIds).toEqual([]);
    expect(harness.getState().pinnedMonsterIds).toEqual([]);
  });

  it('saves custom monster combat metadata', async () => {
    const harness = createHarness();
    await harness.effects.addMonster({
      id: 'custom-1',
      name: 'Ash Goblin',
      size: 'Small',
      type: 'Humanoid',
      mainAttack: 'Scimitar',
      attackBonus: '+4',
      damage: '1d6+2',
      traits: 'Nimble Escape',
      reactions: '',
      legendaryActions: '',
      isCustom: true,
      stats: { strength: 8, dexterity: 14, constitution: 10, intelligence: 8, wisdom: 8, charisma: 8 },
    });

    expect(harness.getState().monsters[0].mainAttack).toBe('Scimitar');
    expect(harness.getState().monsters[0].isCustom).toBe(true);
    expect(harness.getState().monsters[0].source).toBe('user-custom');
    expect(harness.getState().monsters[0].license).toBe('custom');
    const stored = JSON.parse(storage.get(MONSTERS_STORAGE_KEY) || '{}');
    expect(stored.data.some((monster: { source?: string }) => monster.source === 'srd-5.1')).toBe(false);
  });

  it('persists pinned SRD monsters without writing SRD records into monster storage', async () => {
    const harness = createHarness();
    await harness.effects.loadMonsters();
    const srdMonster = harness.getState().monsters.find((monster) => monster.source === 'srd-5.1');
    expect(srdMonster).toBeTruthy();

    await harness.effects.togglePinnedMonster(srdMonster!.id);

    expect(harness.getState().pinnedMonsterIds).toContain(srdMonster!.id);
    expect(storage.get(PINS_STORAGE_KEY)).toContain(srdMonster!.id);
    const stored = JSON.parse(storage.get(MONSTERS_STORAGE_KEY) || '{"data":[]}');
    expect((stored.data || []).some((monster: { source?: string }) => monster.source === 'srd-5.1')).toBe(false);
  });

  it('loads legacy user templates payload', async () => {
    storage.set(
      USER_TEMPLATES_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'tpl-1',
          name: 'Template',
          resource: { label: 'Mana', current: 2, max: 5, resetRule: 'none' },
        },
      ]),
    );

    const harness = createHarness();
    await harness.effects.loadUserTemplates();

    expect(harness.getState().userTemplates).toHaveLength(1);
    expect(harness.getState().userTemplates[0].resource.label).toBe('Mana');
  });
});
