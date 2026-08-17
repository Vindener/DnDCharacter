import { createSpellRepository } from '@/domain/spellbook';
import type { SpellbookStore } from '@/stores/spellbookStore';

type SetSpellbookStore = (partial: Partial<SpellbookStore> | ((state: SpellbookStore) => Partial<SpellbookStore>)) => void;

type SpellbookStoreContext = {
  set: SetSpellbookStore;
  get: () => SpellbookStore;
};

type SpellbookStoreEffects = Pick<
  SpellbookStore,
  'loadSpellbook' | 'upsertCustomSpell' | 'removeCustomSpell' | 'toggleFavorite' | 'togglePinnedSpell' | 'updateSpellNote'
>;

export function createSpellbookStoreEffects({ set, get }: SpellbookStoreContext): SpellbookStoreEffects {
  const spellRepository = createSpellRepository();

  return {
    loadSpellbook: async () => {
      try {
        const state = await spellRepository.loadSpellbook();
        set({
          spells: state.spells,
          favoriteSpellIds: state.favoriteSpellIds,
          pinnedSpellIds: state.pinnedSpellIds,
          spellNotesById: state.spellNotesById,
          isLoaded: true,
          loadError: null,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Не вдалося завантажити книгу заклять.';
        set({ spells: [], favoriteSpellIds: [], pinnedSpellIds: [], spellNotesById: {}, isLoaded: true, loadError: message });
      }
    },

    upsertCustomSpell: async (input) => {
      if (!get().isLoaded) {
        await get().loadSpellbook();
      }

      const currentState = {
        spells: get().spells,
        favoriteSpellIds: get().favoriteSpellIds,
        pinnedSpellIds: get().pinnedSpellIds,
        spellNotesById: get().spellNotesById,
      };

      const result = await spellRepository.upsertCustomSpell(currentState, input);
      set({
        spells: result.state.spells,
        favoriteSpellIds: result.state.favoriteSpellIds,
        pinnedSpellIds: result.state.pinnedSpellIds,
        spellNotesById: result.state.spellNotesById,
      });

      return result.spell;
    },

    removeCustomSpell: async (spellId) => {
      if (!get().isLoaded) {
        await get().loadSpellbook();
      }

      const currentState = {
        spells: get().spells,
        favoriteSpellIds: get().favoriteSpellIds,
        pinnedSpellIds: get().pinnedSpellIds,
        spellNotesById: get().spellNotesById,
      };

      const nextState = await spellRepository.removeCustomSpell(currentState, spellId);
      set({
        spells: nextState.spells,
        favoriteSpellIds: nextState.favoriteSpellIds,
        pinnedSpellIds: nextState.pinnedSpellIds,
        spellNotesById: nextState.spellNotesById,
      });
    },

    toggleFavorite: async (spellId) => {
      if (!get().isLoaded) {
        await get().loadSpellbook();
      }

      const currentState = {
        spells: get().spells,
        favoriteSpellIds: get().favoriteSpellIds,
        pinnedSpellIds: get().pinnedSpellIds,
        spellNotesById: get().spellNotesById,
      };

      const nextState = await spellRepository.toggleFavorite(currentState, spellId);
      set({ favoriteSpellIds: nextState.favoriteSpellIds });
    },

    togglePinnedSpell: async (spellId) => {
      if (!get().isLoaded) {
        await get().loadSpellbook();
      }

      const currentState = {
        spells: get().spells,
        favoriteSpellIds: get().favoriteSpellIds,
        pinnedSpellIds: get().pinnedSpellIds,
        spellNotesById: get().spellNotesById,
      };

      const nextState = await spellRepository.togglePinnedSpell(currentState, spellId);
      set({ pinnedSpellIds: nextState.pinnedSpellIds });
    },

    updateSpellNote: async (spellId, note) => {
      if (!get().isLoaded) {
        await get().loadSpellbook();
      }

      const currentState = {
        spells: get().spells,
        favoriteSpellIds: get().favoriteSpellIds,
        pinnedSpellIds: get().pinnedSpellIds,
        spellNotesById: get().spellNotesById,
      };

      const nextState = await spellRepository.updateSpellNote(currentState, spellId, note);
      set({ spellNotesById: nextState.spellNotesById });
    },
  };
}
