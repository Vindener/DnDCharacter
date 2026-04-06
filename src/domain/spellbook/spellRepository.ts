import { uuid } from 'expo-modules-core';
import { parseSpellUpsertInput } from '@/domain/schemas';
import { spellMapper } from '@/domain/mappers';
import type { SpellDamageProfile, SpellbookSpell, UpsertSpellbookSpellInput } from './spellbookEntity';
import { normalizeSpellName } from './characterSpellAdapter';
import { createSpellCloudRepository } from './spellCloudRepository';
import { createSpellLocalRepository } from './spellLocalRepository';

export interface SpellbookState {
  spells: SpellbookSpell[];
  favoriteSpellIds: string[];
}

export interface SpellLocalRepository {
  loadSpellbookState: () => Promise<SpellbookState>;
  saveSpells: (spells: SpellbookSpell[]) => Promise<void>;
  saveFavoriteSpellIds: (favoriteSpellIds: string[]) => Promise<void>;
}

export interface SpellCloudRepository {
  pullSpellbookState: () => Promise<Partial<SpellbookState> | null>;
  pushSpellbookState: (state: SpellbookState) => Promise<void>;
}

export interface SpellRepository {
  loadSpellbook: () => Promise<SpellbookState>;
  upsertCustomSpell: (
    currentState: SpellbookState,
    input: UpsertSpellbookSpellInput,
  ) => Promise<{ state: SpellbookState; spell: SpellbookSpell | null }>;
  removeCustomSpell: (currentState: SpellbookState, spellId: string) => Promise<SpellbookState>;
  toggleFavorite: (currentState: SpellbookState, spellId: string) => Promise<SpellbookState>;
}

type SpellRepositoryOptions = {
  localRepository?: SpellLocalRepository;
  cloudRepository?: SpellCloudRepository;
};

function toDamageProfiles(
  input: SpellbookSpell['damageProfiles'] | Array<Omit<SpellDamageProfile, 'id'> | SpellDamageProfile>,
): SpellbookSpell['damageProfiles'] {
  return spellMapper.normalizeSpellbookDamageProfiles(input || []);
}

async function safePush(cloudRepository: SpellCloudRepository, state: SpellbookState): Promise<void> {
  try {
    await cloudRepository.pushSpellbookState(state);
  } catch (_error) {
    /* intentionally ignored */
  }
}

function mergeCloudState(localState: SpellbookState, _cloudState: Partial<SpellbookState> | null): SpellbookState {
  return localState;
}

export function createSpellRepository(options: SpellRepositoryOptions = {}): SpellRepository {
  const localRepository = options.localRepository || createSpellLocalRepository();
  const cloudRepository = options.cloudRepository || createSpellCloudRepository();

  return {
    loadSpellbook: async () => {
      const localState = await localRepository.loadSpellbookState();
      let cloudState: Partial<SpellbookState> | null = null;

      try {
        cloudState = await cloudRepository.pullSpellbookState();
      } catch (_error) {
        /* intentionally ignored */
      }

      return mergeCloudState(localState, cloudState);
    },

    upsertCustomSpell: async (currentState, input) => {
      const normalizedInput = parseSpellUpsertInput(input);
      const name = String(normalizedInput.name || '').trim();
      if (!name) return { state: currentState, spell: null };

      const normalizedName = normalizeSpellName(name);
      const currentSpells = currentState.spells || [];
      const byId = normalizedInput.spellId
        ? currentSpells.find((spell) => spell.id === normalizedInput.spellId)
        : null;
      const existingCustomByName = currentSpells.find(
        (spell) => spell.source === 'custom' && normalizeSpellName(spell.name) === normalizedName,
      );
      const existing = byId?.source === 'custom' ? byId : existingCustomByName || byId;

      if (existing) {
        if (existing.source !== 'custom') {
          const now = Date.now();
          const createdFromBase = spellMapper.spellbookMapper.draftToEntity({
            ...existing,
            id: `spell-custom-${uuid.v4()}`,
            source: 'custom',
            name,
            level: normalizedInput.level ?? existing.level,
            school: String(normalizedInput.school || existing.school || 'Власне').trim() || 'Власне',
            description: String(normalizedInput.description || existing.description || '').trim(),
            tags: Array.isArray(normalizedInput.tags)
              ? normalizedInput.tags.map((tag) => String(tag || '').trim()).filter(Boolean)
              : existing.tags,
            damageProfiles: toDamageProfiles(normalizedInput.damageProfiles ?? existing.damageProfiles),
            createdAt: now,
            updatedAt: now,
          });

          const nextState: SpellbookState = {
            ...currentState,
            spells: [createdFromBase, ...currentSpells],
          };

          await localRepository.saveSpells(nextState.spells);
          await safePush(cloudRepository, nextState);
          return { state: nextState, spell: createdFromBase };
        }

        const updated = spellMapper.spellbookMapper.draftToEntity({
          ...existing,
          name,
          level: normalizedInput.level ?? existing.level,
          school: String(normalizedInput.school || existing.school || 'Універсальна').trim() || 'Універсальна',
          description: String(normalizedInput.description || existing.description || '').trim(),
          tags: Array.isArray(normalizedInput.tags)
            ? normalizedInput.tags.map((tag) => String(tag || '').trim()).filter(Boolean)
            : existing.tags,
          damageProfiles: toDamageProfiles(normalizedInput.damageProfiles ?? existing.damageProfiles),
          updatedAt: Date.now(),
        });

        const nextState: SpellbookState = {
          ...currentState,
          spells: currentSpells.map((spell) => (spell.id === existing.id ? updated : spell)),
        };

        await localRepository.saveSpells(nextState.spells);
        await safePush(cloudRepository, nextState);
        return { state: nextState, spell: updated };
      }

      const created = spellMapper.spellbookInputToEntity({
        ...normalizedInput,
        name,
        spellId: normalizedInput.spellId || `spell-custom-${uuid.v4()}`,
      });

      const nextState: SpellbookState = {
        ...currentState,
        spells: [created, ...currentSpells],
      };

      await localRepository.saveSpells(nextState.spells);
      await safePush(cloudRepository, nextState);
      return { state: nextState, spell: created };
    },

    removeCustomSpell: async (currentState, spellId) => {
      const target = currentState.spells.find((spell) => spell.id === spellId);
      if (!target || target.source !== 'custom') return currentState;

      const nextState: SpellbookState = {
        spells: currentState.spells.filter((spell) => spell.id !== spellId),
        favoriteSpellIds: currentState.favoriteSpellIds.filter((id) => id !== spellId),
      };

      await Promise.all([
        localRepository.saveSpells(nextState.spells),
        localRepository.saveFavoriteSpellIds(nextState.favoriteSpellIds),
      ]);
      await safePush(cloudRepository, nextState);
      return nextState;
    },

    toggleFavorite: async (currentState, spellId) => {
      const current = currentState.favoriteSpellIds || [];
      const favoriteSpellIds = current.includes(spellId)
        ? current.filter((id) => id !== spellId)
        : [spellId, ...current];

      const nextState: SpellbookState = {
        ...currentState,
        favoriteSpellIds,
      };

      await localRepository.saveFavoriteSpellIds(nextState.favoriteSpellIds);
      await safePush(cloudRepository, nextState);
      return nextState;
    },
  };
}
