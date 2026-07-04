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

vi.mock('@react-native-async-storage/async-storage', () => ({ default: asyncStorageMock }));

import { characterLocalRepository } from '@/repositories/characterLocalRepository';
import { LATEST_SCHEMA_VERSION } from '@/domain/migrations';

const CHARACTERS_STORAGE_KEY = 'characters';

describe('characterLocalRepository migration pipeline', () => {
  beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
  });

  it('loads legacy character array through migration pipeline', async () => {
    storage.set(
      CHARACTERS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'char-legacy',
          name: 'Legacy',
          class: 'Wizard',
          race: 'Human',
          customTrackers: [{ id: 'trk-1', label: 'Mana', current: 2, max: 5, resetRule: 'none' }],
        },
      ]),
    );

    const characters = await characterLocalRepository.loadCharacters();

    expect(characters).toHaveLength(1);
    expect(characters[0].id).toBe('char-legacy');
    expect(characters[0].schemaVersion).toBe(LATEST_SCHEMA_VERSION);
    expect(characters[0].customTrackers).toEqual([]);
  });

  it('saves characters in schema-versioned envelope', async () => {
    await characterLocalRepository.saveCharacters([
      {
        id: 'char-new',
        name: 'New',
        class: 'Fighter',
        race: 'Elf',
        level: 1,
        experience: 0,
        initiative: 0,
        speed: 30,
        ac: 10,
        stats: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
        savingThrows: { strength: false, dexterity: false, constitution: false, intelligence: false, wisdom: false, charisma: false },
        skills: {
          acrobatics: 0,
          animalHandling: 0,
          arcana: 0,
          athletics: 0,
          deception: 0,
          history: 0,
          insight: 0,
          intimidation: 0,
          investigation: 0,
          medicine: 0,
          nature: 0,
          perception: 0,
          performance: 0,
          persuasion: 0,
          religion: 0,
          sleightOfHand: 0,
          stealth: 0,
          survival: 0,
        },
        proficiencies: [],
        hp: { max: 10, current: 10, temp: 0 },
        hitDice: '1d10',
        deathSaves: { successes: 0, failures: 0 },
        inventory: [],
        traits: { personality: '', ideals: '', bonds: '', flaws: '' },
        spells: { spellcastingAbility: '', spellSaveDC: 0, spellAttackBonus: 0, spellSlots: {}, knownSpells: [], preparedSpells: [], cantrips: [] },
      },
    ]);

    const stored = JSON.parse(storage.get(CHARACTERS_STORAGE_KEY) || '{}');
    expect(stored.schemaVersion).toBe(LATEST_SCHEMA_VERSION);
    expect(Array.isArray(stored.data)).toBe(true);
    expect(stored.data[0].schemaVersion).toBe(LATEST_SCHEMA_VERSION);
  });
});
