import { create } from 'zustand';
import type { SpellbookSpell, UpsertSpellbookSpellInput } from '@/domain/types';
import { createSpellbookStoreEffects } from '@/services/storeEffects/spellbookStoreEffects';

export interface SpellbookStore {
  spells: SpellbookSpell[];
  favoriteSpellIds: string[];
  isLoaded: boolean;
  loadError: string | null;
  loadSpellbook: () => Promise<void>;
  upsertCustomSpell: (input: UpsertSpellbookSpellInput) => Promise<SpellbookSpell | null>;
  removeCustomSpell: (spellId: string) => Promise<void>;
  toggleFavorite: (spellId: string) => Promise<void>;
}

const useSpellbookStore = create<SpellbookStore>((set, get) => {
  const effects = createSpellbookStoreEffects({ set, get });

  return {
    spells: [],
    favoriteSpellIds: [],
    isLoaded: false,
    loadError: null,
    loadSpellbook: effects.loadSpellbook,
    upsertCustomSpell: effects.upsertCustomSpell,
    removeCustomSpell: effects.removeCustomSpell,
    toggleFavorite: effects.toggleFavorite,
  };
});

export default useSpellbookStore;
