import { create } from 'zustand';
import type { SpellbookSpell, UpsertSpellbookSpellInput } from '@/domain/types';
import { createSpellbookStoreEffects } from '@/services/storeEffects/spellbookStoreEffects';

export interface SpellbookStore {
  spells: SpellbookSpell[];
  favoriteSpellIds: string[];
  pinnedSpellIds: string[];
  spellNotesById: Record<string, string>;
  isLoaded: boolean;
  loadError: string | null;
  loadSpellbook: () => Promise<void>;
  upsertCustomSpell: (input: UpsertSpellbookSpellInput) => Promise<SpellbookSpell | null>;
  removeCustomSpell: (spellId: string) => Promise<void>;
  toggleFavorite: (spellId: string) => Promise<void>;
  togglePinnedSpell: (spellId: string) => Promise<void>;
  updateSpellNote: (spellId: string, note: string) => Promise<void>;
}

const useSpellbookStore = create<SpellbookStore>((set, get) => {
  const effects = createSpellbookStoreEffects({ set, get });

  return {
    spells: [],
    favoriteSpellIds: [],
    pinnedSpellIds: [],
    spellNotesById: {},
    isLoaded: false,
    loadError: null,
    loadSpellbook: effects.loadSpellbook,
    upsertCustomSpell: effects.upsertCustomSpell,
    removeCustomSpell: effects.removeCustomSpell,
    toggleFavorite: effects.toggleFavorite,
    togglePinnedSpell: effects.togglePinnedSpell,
    updateSpellNote: effects.updateSpellNote,
  };
});

export default useSpellbookStore;
