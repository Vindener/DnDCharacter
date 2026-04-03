import { create } from 'zustand';
import type { CharacterEntity } from '@/domain/types';
import { StatKey } from '@/shared/const/attributes';
import { Spells } from '@/types/Spells';
import { Traits } from '@/types/Traits';
import { Weapon } from '@/types/Weapon';
import { uuid } from 'expo-modules-core';
import { createEmptyCharacter } from '@/shared/helpers/createEmptyCharacter';
import useSyncStore from '@/context/Sync-store';
import { characterLocalRepository } from '@/repositories/characterLocalRepository';

const MAX_CHARACTERS = 10;

interface CharacterStore {
  characters: CharacterEntity[];
  maxCharacters: number;
  currentCharacterId: string | null;
  lastSessionCharacterId: string | null;
  setCurrentCharacterId: (id: string) => void;
  setLastSessionCharacterId: (id: string | null) => Promise<void>;
  loadCharacters: () => Promise<void>;
  saveCharacters: (newCharacters: CharacterEntity[]) => Promise<void>;
  addCharacter: (character: CharacterEntity) => Promise<void>;
  updateCharacter: (id: string, updatedCharacter: CharacterEntity) => Promise<void>;
  updateCharacterAttribute: (id: string, key: StatKey, value: number) => CharacterEntity;
  updateCharacterInventory: (id: string, inventory: string[]) => void;
  updateCharacterProficiencies: (id: string, proficiencies: string[]) => void;
  updateCharacterWeapons: (id: string, weapons: Weapon[]) => void;
  updateCharacterNotes: (id: string, inventory: string) => void;
  updateCharacterCampaign: (id: string, campaign: string) => void;
  updateCharacterBackstory: (id: string, campaign: string) => void;
  updateCharacterAlliesAndOrganizations: (id: string, campaign: string) => void;
  updateCharacterTraits: (id: string, traits: Traits) => void;
  updateCharacterSpells: (id: string, spells: Spells) => void;
  updateCharacterSkills: (id: string, skills: CharacterEntity['skills']) => void;
  updateCharacterCoins: (id: string, coins: { gold: number; silver: number; copper: number }) => void;
  updateCharacterCustomCoins: (id: string, customCoins: { [id: string]: number }) => void;
  removeCharacter: (id: string) => Promise<void>;
}

function normalizeCharacter(character: CharacterEntity): CharacterEntity {
  const normalized = createEmptyCharacter(character);
  return {
    ...normalized,
    id: character.id || normalized.id || uuid.v4(),
  };
}

const useCharacterStore = create<CharacterStore>((set, get) => ({
  characters: [],
  maxCharacters: MAX_CHARACTERS,
  currentCharacterId: null,
  lastSessionCharacterId: null,
  setCurrentCharacterId: (id) => set({ currentCharacterId: id }),
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

  saveCharacters: async (newCharacters: CharacterEntity[]) => {
    try {
      await characterLocalRepository.saveCharacters(newCharacters);
      set({ characters: newCharacters });
    } catch (_error) { /* intentionally ignored */ }
  },

  addCharacter: async (character: CharacterEntity) => {
    const { characters, saveCharacters } = get();
    if (characters.length >= MAX_CHARACTERS) return;
    const characterWithId = normalizeCharacter({ ...character, id: character.id || uuid.v4() });
    const updated = [...characters, characterWithId];
    await saveCharacters(updated);
    console.log(updated);
  },

  updateCharacter: async (id: string, updatedCharacter: CharacterEntity) => {
    const { characters, saveCharacters } = get();
    const updated = characters.map((char) => (char.id === id ? normalizeCharacter(updatedCharacter) : char));
    await saveCharacters(updated);
  },

  updateCharacterAttribute: (id: string, key: StatKey, value: number): CharacterEntity => {
    let updatedCharacter: CharacterEntity;
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
    get().saveCharacters(get().characters);
    return updatedCharacter!;
  },
  updateCharacterInventory: (id: string, inventory: string[]) => {
    const { characters, saveCharacters } = get();
    const updated = characters.map((char) => (char.id === id ? { ...char, inventory } : char));
    set({ characters: updated });
    saveCharacters(updated);
  },
  updateCharacterProficiencies: (id: string, proficiencies: string[]) => {
    const { characters, saveCharacters } = get();
    const updated = characters.map((char) => (char.id === id ? { ...char, proficiencies } : char));
    set({ characters: updated });
    saveCharacters(updated);
  },
  updateCharacterWeapons: (id: string, weapons: Weapon[]) => {
    const { characters, saveCharacters } = get();
    const updated = characters.map((char) => (char.id === id ? { ...char, weapons } : char));
    set({ characters: updated });
    saveCharacters(updated);
  },
  updateCharacterNotes: (id: string, notes: string) => {
    const { characters, saveCharacters } = get();
    const updated = characters.map((char) => (char.id === id ? { ...char, notes } : char));
    set({ characters: updated });
    saveCharacters(updated);
  },
  updateCharacterCampaign: (id: string, campaign: string) => {
    const { characters, saveCharacters } = get();
    const updated = characters.map((char) => (char.id === id ? { ...char, campaign } : char));
    set({ characters: updated });
    saveCharacters(updated);
  },
  updateCharacterBackstory: (id: string, backstory: string) => {
    const { characters, saveCharacters } = get();
    const updated = characters.map((char) => (char.id === id ? { ...char, backstory } : char));
    set({ characters: updated });
    saveCharacters(updated);
  },
  updateCharacterAlliesAndOrganizations: (id: string, alliesAndOrganizations: string) => {
    const { characters, saveCharacters } = get();
    const updated = characters.map((char) => (char.id === id ? { ...char, alliesAndOrganizations } : char));
    set({ characters: updated });
    saveCharacters(updated);
  },
  updateCharacterTraits: (id: string, traits: Traits) => {
    const { characters, saveCharacters } = get();
    const updated = characters.map((char) => (char.id === id ? { ...char, traits } : char));
    set({ characters: updated });
    saveCharacters(updated);
  },
  updateCharacterSpells: (id: string, spells: Spells) => {
    const { characters, saveCharacters } = get();
    const updated = characters.map((char) => (char.id === id ? { ...char, spells } : char));
    set({ characters: updated });
    saveCharacters(updated);
  },
  updateCharacterSkills: (id: string, skills: CharacterEntity['skills']) => {
    const { characters, saveCharacters } = get();
    const updated = characters.map((char) => (char.id === id ? { ...char, skills } : char));
    set({ characters: updated });
    saveCharacters(updated);
  },


  updateCharacterCoins: (id: string, coins: { gold: number; silver: number; copper: number }) => {
    const { characters, saveCharacters } = get();
    const updated = characters.map((char) => (char.id === id ? { ...char, coins } : char));
    set({ characters: updated });
    saveCharacters(updated);
  },

  updateCharacterCustomCoins: (id: string, customCoins: { [id: string]: number }) => {
    const { characters, saveCharacters } = get();
    const updated = characters.map((char) => (char.id === id ? { ...char, customCoins } : char));
    set({ characters: updated });
    saveCharacters(updated);
  },
  removeCharacter: async (id: string) => {
    const { characters, saveCharacters, lastSessionCharacterId, setLastSessionCharacterId } = get();
    const updated = characters.filter((char) => char.id !== id);
    await saveCharacters(updated);
    if (lastSessionCharacterId === id) {
      await setLastSessionCharacterId(null);
    }
    await useSyncStore.getState().removeCharacterSync(id);
  },
}));

export default useCharacterStore;

