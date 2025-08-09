import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CharacterDto } from '@/types/Character';
import { StatKey } from '@/shared/const/attributes';
import { Spells } from '@/types/Spells';
import { Traits } from '@/types/Traits';
import { Weapon } from '@/types/Weapon';
import { uuid } from 'expo-modules-core';

const MAX_CHARACTERS = 15;

interface CharacterStore {
  characters: CharacterDto[];
  maxCharacters: number;
  currentCharacterId: string | null;
  setCurrentCharacterId: (id: string) => void;
  loadCharacters: () => Promise<void>;
  saveCharacters: (newCharacters: CharacterDto[]) => Promise<void>;
  addCharacter: (character: CharacterDto) => Promise<void>;
  updateCharacter: (id: string, updatedCharacter: CharacterDto) => Promise<void>;
  updateCharacterAttribute: (id: string, key: StatKey, value: number) => CharacterDto;
  updateCharacterInventory: (id: string, inventory: string[]) => void;
  updateCharacterProficiencies: (id: string, proficiencies: string[]) => void;
  updateCharacterWeapons: (id: string, weapons: Weapon[]) => void;
  updateCharacterNotes: (id: string, inventory: string) => void;
  updateCharacterCampaign: (id: string, campaign: string) => void;
  updateCharacterBackstory: (id: string, campaign: string) => void;
  updateCharacterAlliesAndOrganizations: (id: string, campaign: string) => void;
  updateCharacterTraits: (id: string, traits: Traits) => void;
  updateCharacterSpells: (id: string, spells: Spells) => void;
  updateCharacterSkills: (id: string, skills: { [key: string]: number }) => void;
  updateCharacterCoins: (id: string, coins: { gold: number; silver: number; copper: number }) => void;
  updateCharacterCustomCoins: (id: string, customCoins: { [id: string]: number }) => void;
  removeCharacter: (id: string) => Promise<void>;
}

const STORAGE_KEY = 'characters';

const useCharacterStore = create<CharacterStore>((set, get) => ({
  characters: [],
  maxCharacters: MAX_CHARACTERS,
  currentCharacterId: null,
  setCurrentCharacterId: (id) => set({ currentCharacterId: id }),

  loadCharacters: async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed: CharacterDto[] = JSON.parse(jsonValue || '[]');
      const filtered = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      set({ characters: filtered });
    } catch {}
  },

  saveCharacters: async (newCharacters: CharacterDto[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newCharacters));
      set({ characters: newCharacters });
    } catch {}
  },

  addCharacter: async (character: CharacterDto) => {
    const { characters, saveCharacters } = get();
    if (characters.length >= MAX_CHARACTERS) return;
    const characterWithId = { ...character, id: character.id || uuid.v4() };
    const updated = [...characters, characterWithId];
    await saveCharacters(updated);
    console.log(updated);
  },

  updateCharacter: async (id: string, updatedCharacter: CharacterDto) => {
    const { characters, saveCharacters } = get();
    const updated = characters.map((char) => (char.id === id ? updatedCharacter : char));
    await saveCharacters(updated);
  },

  updateCharacterAttribute: (id: string, key: StatKey, value: number): CharacterDto => {
    let updatedCharacter: CharacterDto;
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
  updateCharacterSkills: (id: string, skills: { [key: string]: number }) => {
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
    const { characters, saveCharacters } = get();
    const updated = characters.filter((char) => char.id !== id);
    await saveCharacters(updated);
  },
}));

export default useCharacterStore;
