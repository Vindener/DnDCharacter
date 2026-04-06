import { create } from 'zustand';
import type { CharacterEntity } from '@/domain/types';
import { StatKey } from '@/shared/const/attributes';
import { Spells } from '@/types/Spells';
import { Traits } from '@/types/Traits';
import { Weapon } from '@/types/Weapon';
import { createCharacterStoreEffects } from '@/services/storeEffects/characterStoreEffects';

const MAX_CHARACTERS = 10;

export interface CharacterStore {
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
  updateCharacterNotes: (id: string, notes: string) => void;
  updateCharacterCampaign: (id: string, campaign: string) => void;
  updateCharacterBackstory: (id: string, backstory: string) => void;
  updateCharacterAlliesAndOrganizations: (id: string, alliesAndOrganizations: string) => void;
  updateCharacterTraits: (id: string, traits: Traits) => void;
  updateCharacterSpells: (id: string, spells: Spells) => void;
  updateCharacterSkills: (id: string, skills: CharacterEntity['skills']) => void;
  updateCharacterCoins: (id: string, coins: { gold: number; silver: number; copper: number }) => void;
  updateCharacterCustomCoins: (id: string, customCoins: { [id: string]: number }) => void;
  removeCharacter: (id: string) => Promise<void>;
}

const useCharacterStore = create<CharacterStore>((set, get) => {
  const effects = createCharacterStoreEffects({ set, get });

  return {
    characters: [],
    maxCharacters: MAX_CHARACTERS,
    currentCharacterId: null,
    lastSessionCharacterId: null,
    setCurrentCharacterId: (id) => set({ currentCharacterId: id }),
    setLastSessionCharacterId: effects.setLastSessionCharacterId,
    loadCharacters: effects.loadCharacters,
    saveCharacters: effects.saveCharacters,
    addCharacter: effects.addCharacter,
    updateCharacter: effects.updateCharacter,
    updateCharacterAttribute: effects.updateCharacterAttribute,
    updateCharacterInventory: effects.updateCharacterInventory,
    updateCharacterProficiencies: effects.updateCharacterProficiencies,
    updateCharacterWeapons: effects.updateCharacterWeapons,
    updateCharacterNotes: effects.updateCharacterNotes,
    updateCharacterCampaign: effects.updateCharacterCampaign,
    updateCharacterBackstory: effects.updateCharacterBackstory,
    updateCharacterAlliesAndOrganizations: effects.updateCharacterAlliesAndOrganizations,
    updateCharacterTraits: effects.updateCharacterTraits,
    updateCharacterSpells: effects.updateCharacterSpells,
    updateCharacterSkills: effects.updateCharacterSkills,
    updateCharacterCoins: effects.updateCharacterCoins,
    updateCharacterCustomCoins: effects.updateCharacterCustomCoins,
    removeCharacter: effects.removeCharacter,
  };
});

export default useCharacterStore;
