import { uuid } from 'expo-modules-core';
import { parseSpellUpsertInput } from '@/domain/schemas';
import { spellMapper } from '@/domain/mappers';
import type { SpellComponents, SpellDamageProfile, SpellbookSpell, UpsertSpellbookSpellInput } from './spellbookEntity';
import { normalizeSpellName } from './characterSpellAdapter';
import { createSpellCloudRepository } from './spellCloudRepository';
import { createSpellLocalRepository } from './spellLocalRepository';

export interface SpellbookState {
  spells: SpellbookSpell[];
  favoriteSpellIds: string[];
  pinnedSpellIds: string[];
  spellNotesById: Record<string, string>;
}

export interface SpellLocalRepository {
  loadSpellbookState: () => Promise<SpellbookState>;
  saveSpells: (spells: SpellbookSpell[]) => Promise<void>;
  saveFavoriteSpellIds: (favoriteSpellIds: string[]) => Promise<void>;
  savePinnedSpellIds: (pinnedSpellIds: string[]) => Promise<void>;
  saveSpellNotesById: (spellNotesById: Record<string, string>) => Promise<void>;
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
  togglePinnedSpell: (currentState: SpellbookState, spellId: string) => Promise<SpellbookState>;
  updateSpellNote: (currentState: SpellbookState, spellId: string, note: string) => Promise<SpellbookState>;
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

function normalizeInputComponents(value: UpsertSpellbookSpellInput['components'] | undefined, fallback: SpellComponents): SpellComponents {
  if (!value || typeof value === 'string') return fallback;
  return value;
}

function normalizeInputClasses(value: UpsertSpellbookSpellInput['classes'] | undefined, fallback: string[]): string[] {
  if (!value || typeof value === 'string') return fallback;
  return value;
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

function isEditableSpell(spell: SpellbookSpell | null | undefined): boolean {
  return spell?.source === 'user-custom' || spell?.source === 'homebrew' || spell?.source === 'imported';
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
        (spell) => spell.source === 'user-custom' && normalizeSpellName(spell.name) === normalizedName,
      );
      const existing = isEditableSpell(byId) ? byId : existingCustomByName || byId;

      if (existing) {
        if (!isEditableSpell(existing)) {
          const now = Date.now();
          const createdFromBase = spellMapper.spellbookMapper.draftToEntity({
            ...existing,
            id: `spell-custom-${uuid.v4()}`,
            source: 'user-custom',
            license: 'custom',
            name,
            level: normalizedInput.level ?? existing.level,
            school: String(normalizedInput.school || existing.school || 'Власне').trim() || 'Власне',
            castingTime: normalizedInput.castingTime ?? existing.castingTime,
            range: normalizedInput.range ?? existing.range,
            components: normalizeInputComponents(normalizedInput.components, existing.components),
            duration: normalizedInput.duration ?? existing.duration,
            description: String(normalizedInput.description || existing.description || '').trim(),
            higherLevels: normalizedInput.higherLevels ?? existing.higherLevels,
            classes: normalizeInputClasses(normalizedInput.classes, existing.classes),
            tags: Array.isArray(normalizedInput.tags)
              ? normalizedInput.tags.map((tag) => String(tag || '').trim()).filter(Boolean)
              : existing.tags,
            ritual: normalizedInput.ritual ?? existing.ritual,
            concentration: normalizedInput.concentration ?? existing.concentration,
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
          castingTime: normalizedInput.castingTime ?? existing.castingTime,
          range: normalizedInput.range ?? existing.range,
          components: normalizeInputComponents(normalizedInput.components, existing.components),
          duration: normalizedInput.duration ?? existing.duration,
          description: String(normalizedInput.description || existing.description || '').trim(),
          higherLevels: normalizedInput.higherLevels ?? existing.higherLevels,
          classes: normalizeInputClasses(normalizedInput.classes, existing.classes),
          tags: Array.isArray(normalizedInput.tags)
            ? normalizedInput.tags.map((tag) => String(tag || '').trim()).filter(Boolean)
            : existing.tags,
          ritual: normalizedInput.ritual ?? existing.ritual,
          concentration: normalizedInput.concentration ?? existing.concentration,
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
      if (!target || !isEditableSpell(target)) return currentState;

      const nextState: SpellbookState = {
        spells: currentState.spells.filter((spell) => spell.id !== spellId),
        favoriteSpellIds: currentState.favoriteSpellIds.filter((id) => id !== spellId),
        pinnedSpellIds: currentState.pinnedSpellIds.filter((id) => id !== spellId),
        spellNotesById: Object.fromEntries(Object.entries(currentState.spellNotesById).filter(([id]) => id !== spellId)),
      };

      await Promise.all([
        localRepository.saveSpells(nextState.spells),
        localRepository.saveFavoriteSpellIds(nextState.favoriteSpellIds),
        localRepository.savePinnedSpellIds(nextState.pinnedSpellIds),
        localRepository.saveSpellNotesById(nextState.spellNotesById),
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

    togglePinnedSpell: async (currentState, spellId) => {
      const current = currentState.pinnedSpellIds || [];
      const pinnedSpellIds = current.includes(spellId)
        ? current.filter((id) => id !== spellId)
        : [spellId, ...current];

      const nextState: SpellbookState = {
        ...currentState,
        pinnedSpellIds,
      };

      await localRepository.savePinnedSpellIds(nextState.pinnedSpellIds);
      return nextState;
    },

    updateSpellNote: async (currentState, spellId, note) => {
      const trimmed = String(note || '').trim();
      const spellNotesById = { ...(currentState.spellNotesById || {}) };
      if (trimmed) {
        spellNotesById[spellId] = trimmed;
      } else {
        delete spellNotesById[spellId];
      }

      const nextState: SpellbookState = {
        ...currentState,
        spellNotesById,
      };

      await localRepository.saveSpellNotesById(nextState.spellNotesById);
      return nextState;
    },
  };
}
