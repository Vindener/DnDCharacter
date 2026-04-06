import { createSpellRepository } from '@/domain/spellbook';
import type { SpellbookStore } from '@/stores/spellbookStore';

type SetSpellbookStore = (
  partial:
    | Partial<SpellbookStore>
    | ((state: SpellbookStore) => Partial<SpellbookStore>),
) => void;

type SpellbookStoreContext = {
  set: SetSpellbookStore;
  get: () => SpellbookStore;
};

type SpellbookStoreEffects = Pick<
  SpellbookStore,
  'loadSpellbook' | 'upsertCustomSpell' | 'removeCustomSpell' | 'toggleFavorite'
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
          isLoaded: true,
        });
      } catch {
        set({ spells: [], favoriteSpellIds: [], isLoaded: true });
      }
    },

    upsertCustomSpell: async (input) => {
      if (!get().isLoaded) {
        await get().loadSpellbook();
      }

      const currentState = {
        spells: get().spells,
        favoriteSpellIds: get().favoriteSpellIds,
      };

      const result = await spellRepository.upsertCustomSpell(currentState, input);
      set({
        spells: result.state.spells,
        favoriteSpellIds: result.state.favoriteSpellIds,
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
      };

      const nextState = await spellRepository.removeCustomSpell(currentState, spellId);
      set({
        spells: nextState.spells,
        favoriteSpellIds: nextState.favoriteSpellIds,
      });
    },

    toggleFavorite: async (spellId) => {
      if (!get().isLoaded) {
        await get().loadSpellbook();
      }

      const currentState = {
        spells: get().spells,
        favoriteSpellIds: get().favoriteSpellIds,
      };

      const nextState = await spellRepository.toggleFavorite(currentState, spellId);
      set({ favoriteSpellIds: nextState.favoriteSpellIds });
    },
  };
}
