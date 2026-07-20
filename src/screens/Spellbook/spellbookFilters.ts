import type { CharacterViewModel } from '@/types/Character';
import type { SpellbookSpell } from '@/types/Spellbook';
import { getCharacterSpellStatus } from '@/domain/spellbook';
import { getLocalizedSpellFields, getLocalizedSpellSearchText } from '@/domain/srd/localization';

export type SpellbookFilterTab = 'all' | 'prepared' | 'known' | 'favorites' | 'custom';
export type SpellbookLevelFilter = 'all' | number;
export type SpellbookBooleanFilter = 'all' | 'yes' | 'no';

export interface SpellbookFilterOptions {
  spells: SpellbookSpell[];
  search: string;
  activeTab: SpellbookFilterTab;
  levelFilter: SpellbookLevelFilter;
  classFilter: string;
  schoolFilter: string;
  ritualFilter: SpellbookBooleanFilter;
  concentrationFilter: SpellbookBooleanFilter;
  favoriteSpellIds: string[];
  pinnedSpellIds: string[];
  selectedCharacter: CharacterViewModel | null;
  isGmMode: boolean;
  locale: string;
}

function componentsToSearchText(spell: SpellbookSpell): string {
  return [
    spell.components.verbal ? 'verbal v' : '',
    spell.components.somatic ? 'somatic s' : '',
    spell.components.material ? `material m ${spell.components.material}` : '',
  ].join(' ');
}

function isCustomLikeSpell(spell: SpellbookSpell): boolean {
  return spell.source !== 'srd-5.1';
}

export function filterSpellbookSpells(options: SpellbookFilterOptions): SpellbookSpell[] {
  const favoriteSet = new Set(options.favoriteSpellIds);
  const pinnedSet = new Set(options.pinnedSpellIds);
  const filter = options.search.trim().toLowerCase();

  return options.spells
    .filter((spell) => {
      const status = getCharacterSpellStatus(options.selectedCharacter, spell.name);
      if (options.activeTab === 'prepared' && status !== 'prepared') return false;
      if (options.activeTab === 'known' && status !== 'known' && status !== 'cantrip') return false;
      if (options.activeTab === 'favorites' && !favoriteSet.has(spell.id)) return false;
      if (options.activeTab === 'custom' && !isCustomLikeSpell(spell)) return false;
      if (options.levelFilter !== 'all' && spell.level !== options.levelFilter) return false;
      if (options.classFilter !== 'all' && !spell.classes.includes(options.classFilter)) return false;
      if (options.schoolFilter !== 'all' && spell.school !== options.schoolFilter) return false;
      if (options.ritualFilter !== 'all' && spell.ritual !== (options.ritualFilter === 'yes')) return false;
      if (options.concentrationFilter !== 'all' && spell.concentration !== (options.concentrationFilter === 'yes')) return false;
      if (!filter) return true;

      const damageText = spell.damageProfiles
        .map((profile) => `${profile.label} ${profile.formula} ${profile.damageType} ${profile.condition || ''}`)
        .join(' ');
      const haystack = [
        spell.name,
        spell.school,
        spell.castingTime,
        spell.range,
        componentsToSearchText(spell),
        spell.duration,
        spell.description,
        spell.higherLevels,
        spell.classes.join(' '),
        spell.tags.join(' '),
        spell.source,
        spell.license,
        damageText,
        getLocalizedSpellSearchText(spell, options.locale),
      ].join(' ').toLowerCase();
      return haystack.includes(filter);
    })
    .sort((a, b) => {
      if (options.isGmMode) {
        const pinDelta = Number(pinnedSet.has(b.id)) - Number(pinnedSet.has(a.id));
        if (pinDelta) return pinDelta;
      }
      if (a.level !== b.level) return a.level - b.level;
      return getLocalizedSpellFields(a, options.locale).name.localeCompare(
        getLocalizedSpellFields(b, options.locale).name,
        options.locale,
      );
    });
}
