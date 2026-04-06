import { uuid } from 'expo-modules-core';
import type { CharacterEntity } from '@/domain/types';
import { parseCharacter } from '@/domain/schemas';
import { characterLocalRepository } from '@/repositories/characterLocalRepository';
import useSyncStore from '@/stores/syncStore';
import type { CharacterStore } from '@/stores/characterStore';

type SetCharacterStore = (
  partial:
    | Partial<CharacterStore>
    | ((state: CharacterStore) => Partial<CharacterStore>),
) => void;

type CharacterStoreContext = {
  set: SetCharacterStore;
  get: () => CharacterStore;
};

type CharacterStoreEffects = Pick<
  CharacterStore,
  | 'setLastSessionCharacterId'
  | 'loadCharacters'
  | 'saveCharacters'
  | 'addCharacter'
  | 'updateCharacter'
  | 'updateCharacterAttribute'
  | 'updateCharacterInventory'
  | 'updateCharacterProficiencies'
  | 'updateCharacterWeapons'
  | 'updateCharacterNotes'
  | 'updateCharacterCampaign'
  | 'updateCharacterBackstory'
  | 'updateCharacterAlliesAndOrganizations'
  | 'updateCharacterTraits'
  | 'updateCharacterSpells'
  | 'updateCharacterSkills'
  | 'updateCharacterCoins'
  | 'updateCharacterCustomCoins'
  | 'removeCharacter'
>;

function normalizeCharacter(character: CharacterEntity): CharacterEntity {
  const normalized = parseCharacter(character);
  return {
    ...normalized,
    id: character.id || normalized.id || uuid.v4(),
  };
}

export function createCharacterStoreEffects({ set, get }: CharacterStoreContext): CharacterStoreEffects {
  const saveCharacters: CharacterStore['saveCharacters'] = async (newCharacters) => {
    try {
      await characterLocalRepository.saveCharacters(newCharacters);
      set({ characters: newCharacters });
    } catch (_error) { /* intentionally ignored */ }
  };

  const persistUpdatedCharacters = (updatedCharacters: CharacterEntity[]) => {
    set({ characters: updatedCharacters });
    void saveCharacters(updatedCharacters);
  };

  return {
    setLastSessionCharacterId: async (id) => {
      try {
        if (id) {
          await characterLocalRepository.saveLastSessionCharacterId(id);
        } else {
          await characterLocalRepository.clearLastSessionCharacterId();
        }
        set({ lastSessionCharacterId: id || null });
      } catch (_error) { /* intentionally ignored */ }
    },

    loadCharacters: async () => {
      try {
        const [storedCharacters, storedLastSessionId] = await Promise.all([
          characterLocalRepository.loadCharacters(),
          characterLocalRepository.loadLastSessionCharacterId(),
        ]);
        const filtered = Array.isArray(storedCharacters) ? storedCharacters.filter(Boolean).map((item) => normalizeCharacter(item)) : [];
        const existingIds = new Set(filtered.map((character) => character.id));
        const safeLastSessionId = storedLastSessionId && existingIds.has(storedLastSessionId) ? storedLastSessionId : null;
        set({ characters: filtered, lastSessionCharacterId: safeLastSessionId });
        if (!safeLastSessionId && storedLastSessionId) {
          await characterLocalRepository.clearLastSessionCharacterId();
        }
      } catch (_error) { /* intentionally ignored */ }
    },

    saveCharacters,

    addCharacter: async (character) => {
      const { characters, maxCharacters } = get();
      if (characters.length >= maxCharacters) return;
      const characterWithId = normalizeCharacter({ ...character, id: character.id || uuid.v4() });
      const updated = [...characters, characterWithId];
      await saveCharacters(updated);
    },

    updateCharacter: async (id, updatedCharacter) => {
      const { characters } = get();
      const updated = characters.map((char) => (char.id === id ? normalizeCharacter(updatedCharacter) : char));
      await saveCharacters(updated);
    },

    updateCharacterAttribute: (id, key, value) => {
      let updatedCharacter: CharacterEntity | undefined;
      set((state) => {
        const updated = state.characters.map((char) => {
          if (char.id !== id) return char;
          updatedCharacter = {
            ...char,
            stats: {
              ...char.stats,
              [key]: value,
            },
          };
          return updatedCharacter;
        });
        return { characters: updated };
      });
      void saveCharacters(get().characters);
      return updatedCharacter || get().characters.find((character) => character.id === id)!;
    },

    updateCharacterInventory: (id, inventory) => {
      const updated = get().characters.map((char) => (char.id === id ? { ...char, inventory } : char));
      persistUpdatedCharacters(updated);
    },

    updateCharacterProficiencies: (id, proficiencies) => {
      const updated = get().characters.map((char) => (char.id === id ? { ...char, proficiencies } : char));
      persistUpdatedCharacters(updated);
    },

    updateCharacterWeapons: (id, weapons) => {
      const updated = get().characters.map((char) => (char.id === id ? { ...char, weapons } : char));
      persistUpdatedCharacters(updated);
    },

    updateCharacterNotes: (id, notes) => {
      const updated = get().characters.map((char) => (char.id === id ? { ...char, notes } : char));
      persistUpdatedCharacters(updated);
    },

    updateCharacterCampaign: (id, campaign) => {
      const updated = get().characters.map((char) => (char.id === id ? { ...char, campaign } : char));
      persistUpdatedCharacters(updated);
    },

    updateCharacterBackstory: (id, backstory) => {
      const updated = get().characters.map((char) => (char.id === id ? { ...char, backstory } : char));
      persistUpdatedCharacters(updated);
    },

    updateCharacterAlliesAndOrganizations: (id, alliesAndOrganizations) => {
      const updated = get().characters.map((char) => (char.id === id ? { ...char, alliesAndOrganizations } : char));
      persistUpdatedCharacters(updated);
    },

    updateCharacterTraits: (id, traits) => {
      const updated = get().characters.map((char) => (char.id === id ? { ...char, traits } : char));
      persistUpdatedCharacters(updated);
    },

    updateCharacterSpells: (id, spells) => {
      const updated = get().characters.map((char) => (char.id === id ? { ...char, spells } : char));
      persistUpdatedCharacters(updated);
    },

    updateCharacterSkills: (id, skills) => {
      const updated = get().characters.map((char) => (char.id === id ? { ...char, skills } : char));
      persistUpdatedCharacters(updated);
    },

    updateCharacterCoins: (id, coins) => {
      const updated = get().characters.map((char) => (char.id === id ? { ...char, coins } : char));
      persistUpdatedCharacters(updated);
    },

    updateCharacterCustomCoins: (id, customCoins) => {
      const updated = get().characters.map((char) => (char.id === id ? { ...char, customCoins } : char));
      persistUpdatedCharacters(updated);
    },

    removeCharacter: async (id) => {
      const { characters, lastSessionCharacterId } = get();
      const updated = characters.filter((char) => char.id !== id);
      await saveCharacters(updated);
      if (lastSessionCharacterId === id) {
        await get().setLastSessionCharacterId(null);
      }
      await useSyncStore.getState().removeCharacterSync(id);
    },
  };
}
