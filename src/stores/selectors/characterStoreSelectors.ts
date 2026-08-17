import type { CharacterEntity } from '@/domain/types';

export type CharacterStoreBasicsSlice = {
  currentCharacterId: string | null;
  lastSessionCharacterId: string | null;
};

export type CharacterStoreActionsSlice = {
  setLastSessionCharacterId: (id: string | null) => Promise<void>;
  updateCharacter: (id: string, updatedCharacter: CharacterEntity) => Promise<void>;
};

export type CharacterStoreSelectorState = {
  characters: CharacterEntity[];
} & CharacterStoreBasicsSlice &
  CharacterStoreActionsSlice;

export const selectActiveCharacter = (
  state: Pick<CharacterStoreSelectorState, 'characters' | 'currentCharacterId'>,
): CharacterEntity | null => {
  if (!state.characters.length) return null;
  if (!state.currentCharacterId) return state.characters[0];
  return state.characters.find((character) => character.id === state.currentCharacterId) || state.characters[0];
};

export const selectCharacterStoreBasics = (state: CharacterStoreBasicsSlice) => ({
  currentCharacterId: state.currentCharacterId,
  lastSessionCharacterId: state.lastSessionCharacterId,
});

export const selectCharacterStoreActions = (state: CharacterStoreActionsSlice) => ({
  setLastSessionCharacterId: state.setLastSessionCharacterId,
  updateCharacter: state.updateCharacter,
});
