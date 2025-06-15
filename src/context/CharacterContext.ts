import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CharacterDto } from '@/types/Character';

const MAX_CHARACTERS = 15;

interface CharacterStore {
  characters: CharacterDto[];
  maxCharacters: number;
  loadCharacters: () => Promise<void>;
  saveCharacters: (newCharacters: CharacterDto[]) => Promise<void>;
  addCharacter: (character: CharacterDto) => Promise<void>;
  updateCharacter: (index: number, updatedCharacter: CharacterDto) => Promise<void>;
  removeCharacter: (index: number) => Promise<void>;
}

const STORAGE_KEY = 'characters';

const useCharacterStore = create<CharacterStore>((set, get) => ({
  characters: [],
  maxCharacters: MAX_CHARACTERS,

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
    const updated = [...characters, character];
    await saveCharacters(updated);
  },

  updateCharacter: async (index: number, updatedCharacter: CharacterDto) => {
    const { characters, saveCharacters } = get();
    const updated = characters.map((char, i) => (i === index ? updatedCharacter : char));
    await saveCharacters(updated);
  },

  removeCharacter: async (index: number) => {
    const { characters, saveCharacters } = get();
    const updated = characters.filter((_, i) => i !== index);
    await saveCharacters(updated);
  },
}));

export default useCharacterStore;
