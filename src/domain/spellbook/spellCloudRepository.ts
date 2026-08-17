import type { SpellbookState, SpellCloudRepository } from './spellRepository';

export function createSpellCloudRepository(): SpellCloudRepository {
  return {
    pullSpellbookState: async () => null,
    pushSpellbookState: async (_state: SpellbookState) => {},
  };
}
