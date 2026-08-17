import { beforeEach, describe, expect, it, vi } from 'vitest';

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

import { loadMonstersState } from '@/dm/repositories/monsterRepository';
import { loadAppRole } from '@/dm/repositories/appRoleRepository';
import { loadTrackerTemplates } from '@/dm/repositories/trackerTemplatesRepository';

describe('dm/repositories storage migrations', () => {
  beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
  });

  it('loads legacy plain-string role and normalizes it', async () => {
    storage.set('APP_ROLE_MODE_V1', 'DM');

    const role = await loadAppRole();

    expect(role).toBe('DM');
  });

  it('loads legacy monsters and pins payloads', async () => {
    storage.set(
      'monsters',
      JSON.stringify([
        {
          id: 'monster-1',
          name: 'Goblin',
          stats: { strength: 8, dexterity: 14, constitution: 10, intelligence: 8, wisdom: 8, charisma: 8 },
        },
      ]),
    );
    storage.set('monster-pins', JSON.stringify(['monster-1', 'missing']));
    storage.set('monster-favorites', JSON.stringify(['monster-1', 'missing']));

    const next = await loadMonstersState();

    expect(next.monsters).toHaveLength(1);
    expect(next.pinnedMonsterIds).toEqual(['monster-1']);
    expect(next.favoriteMonsterIds).toEqual(['monster-1']);
  });

  it('loads legacy user templates payload', async () => {
    storage.set(
      'RESOURCE_USER_TEMPLATES_V1',
      JSON.stringify([
        {
          id: 'tpl-1',
          name: 'Template',
          resource: { label: 'Mana', current: 2, max: 5, resetRule: 'none' },
        },
      ]),
    );

    const templates = await loadTrackerTemplates();

    expect(templates).toHaveLength(1);
    expect(templates[0].resource.label).toBe('Mana');
  });
});
