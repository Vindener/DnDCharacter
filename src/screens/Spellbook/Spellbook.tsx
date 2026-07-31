import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import useThemeStore from '@/context/Theme-store';
import useCharacterStore from '@/context/Character-store';
import useSpellbookStore from '@/context/Spellbook-store';
import { applySpellStatus, collectCharacterSpellNames, getCharacterSpellStatus, getPreparedSpellsLimit, normalizeSpellName } from '@/domain/spellbook';
import { Modal } from '@/shared/components/Modal/Modal';
import { formatSchemaErrors, safeParseSpellFormInput, SPELL_DAMAGE_TYPES } from '@/domain/schemas';
import type { CharacterSpellStatus, SpellComponents, SpellDamageProfile, SpellbookSpell } from '@/types/Spellbook';
import type { CharacterViewModel } from '@/types/Character';
import type { SpellbookRouteParams } from '@/navigation/sharedTypes';
import { SkeletonSpellbook } from '@/shared/ui/skeleton';
import {
  filterSpellbookSpells,
  type SpellbookBooleanFilter as BooleanFilter,
  type SpellbookFilterTab as SpellbookTab,
  type SpellbookLevelFilter as LevelFilter,
} from './spellbookFilters';
import { getStyles } from './styles';
import { shouldDisplaySourceMetadata } from '@/shared/helpers/sourcePresentation';
import {
  getLocalizedSpellClass,
  getLocalizedSpellFields,
  getLocalizedSpellSchool,
} from '@/domain/srd/localization';

type Props = {
  route: {
    params?: SpellbookRouteParams;
  };
};
type DisplaySpell = {
  name: string;
  school: string;
  castingTime: string;
  range: string;
  components: SpellComponents;
  duration: string;
  description: string;
  higherLevels: string;
  classes: string[];
  damageProfiles: SpellDamageProfile[];
};

const TABS: SpellbookTab[] = ['all', 'prepared', 'known', 'favorites', 'custom'];
const LEVEL_FILTERS: LevelFilter[] = ['all', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const BOOLEAN_FILTERS: BooleanFilter[] = ['all', 'yes', 'no'];

function componentsToText(components: SpellComponents, emptyLabel: string): string {
  const parts: string[] = [];
  if (components.verbal) parts.push('V');
  if (components.somatic) parts.push('S');
  if (components.material) parts.push(`M (${components.material})`);
  return parts.length ? parts.join(', ') : emptyLabel;
}

function damageProfilesToText(profiles: SpellDamageProfile[]): string {
  return (profiles || [])
    .map((profile) => {
      const parts = [profile.label, profile.formula, profile.damageType];
      if (profile.condition) parts.push(profile.condition);
      return parts.join(' | ');
    })
    .join('\n');
}

function getDisplaySpell(spell: SpellbookSpell, language: string): DisplaySpell {
  const localized = getLocalizedSpellFields(spell, language);
  return {
    ...localized,
    damageProfiles: spell.damageProfiles,
  };
}

function isEditableSpellSource(spell: SpellbookSpell): boolean {
  return spell.source === 'user-custom' || spell.source === 'homebrew' || spell.source === 'imported';
}

function getSourceLabel(t: (key: string, options?: Record<string, unknown>) => string, source: SpellbookSpell['source']): string | null {
  if (!shouldDisplaySourceMetadata(source)) return null;
  if (source === 'user-custom') return t('sources.userCustom');
  return t(`sources.${source}`);
}

function getLicenseLabel(t: (key: string, options?: Record<string, unknown>) => string, license: SpellbookSpell['license']): string | null {
  if (license === 'ogl-1.0a') return null;
  return t(`licenses.${license}`);
}

function hasCasterSetup(character: CharacterViewModel | null): boolean {
  if (!character) return false;
  const slotLevels = Object.keys(character.spells?.spellSlots || {});
  return Boolean(
    character.spells?.spellcastingAbility ||
      slotLevels.length ||
      character.spells?.cantrips?.length ||
      character.spells?.knownSpells?.length ||
      character.spells?.preparedSpells?.length,
  );
}

function buildImportedSpell(name: string, importedSchool: string, importedTag: string): SpellbookSpell {
  const key = normalizeSpellName(name).replace(/\s+/g, '-');
  return {
    id: `spell-imported-${key}`,
    name,
    level: 1,
    school: importedSchool,
    castingTime: '',
    range: '',
    components: { verbal: false, somatic: false, material: '' },
    duration: '',
    description: '',
    higherLevels: '',
    classes: [],
    tags: [importedTag],
    ritual: false,
    concentration: false,
    damageProfiles: [],
    source: 'imported',
    license: 'unknown',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

const Spellbook = ({ route }: Props) => {
  const { t, i18n } = useTranslation('spellbook');
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => getStyles(colors), [colors]);
  const sortLocale = i18n.language === 'uk' ? 'uk' : 'en';
  const params = route.params;
  const mode = params?.mode || 'player';
  const isDmMode = mode === 'dm';

  const characters = useCharacterStore((s) => s.characters);
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId);
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);

  const spells = useSpellbookStore((s) => s.spells);
  const favoriteSpellIds = useSpellbookStore((s) => s.favoriteSpellIds);
  const pinnedSpellIds = useSpellbookStore((s) => s.pinnedSpellIds);
  const spellNotesById = useSpellbookStore((s) => s.spellNotesById);
  const isLoaded = useSpellbookStore((s) => s.isLoaded);
  const loadError = useSpellbookStore((s) => s.loadError);
  const loadSpellbook = useSpellbookStore((s) => s.loadSpellbook);
  const upsertCustomSpell = useSpellbookStore((s) => s.upsertCustomSpell);
  const removeCustomSpell = useSpellbookStore((s) => s.removeCustomSpell);
  const toggleFavorite = useSpellbookStore((s) => s.toggleFavorite);
  const togglePinnedSpell = useSpellbookStore((s) => s.togglePinnedSpell);
  const updateSpellNote = useSpellbookStore((s) => s.updateSpellNote);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState<SpellbookTab>(params?.initialTab || 'all');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [classFilter, setClassFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [ritualFilter, setRitualFilter] = useState<BooleanFilter>('all');
  const [concentrationFilter, setConcentrationFilter] = useState<BooleanFilter>('all');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(params?.characterId || '');
  const [selectedSpellId, setSelectedSpellId] = useState<string | null>(params?.initialSpellId || null);
  const [noteDraft, setNoteDraft] = useState('');

  const [isSpellModalVisible, setIsSpellModalVisible] = useState(false);
  const [editingSpell, setEditingSpell] = useState<SpellbookSpell | null>(null);
  const [modalName, setModalName] = useState('');
  const [modalLevel, setModalLevel] = useState('1');
  const [modalSchool, setModalSchool] = useState(t('defaults.customSchool'));
  const [modalCastingTime, setModalCastingTime] = useState(t('defaults.castingTime'));
  const [modalRange, setModalRange] = useState('');
  const [modalComponents, setModalComponents] = useState('V, S');
  const [modalDuration, setModalDuration] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalHigherLevels, setModalHigherLevels] = useState('');
  const [modalClasses, setModalClasses] = useState('');
  const [modalTags, setModalTags] = useState('');
  const [modalRitual, setModalRitual] = useState(false);
  const [modalConcentration, setModalConcentration] = useState(false);
  const [modalDamageProfiles, setModalDamageProfiles] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    loadSpellbook().catch(() => {});
  }, [loadSpellbook]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (params?.characterId) {
      setSelectedCharacterId(params.characterId);
      return;
    }
    if (isDmMode) {
      setSelectedCharacterId('');
      return;
    }
    if (!characters.length) {
      setSelectedCharacterId('');
      return;
    }
    const hasSelected = selectedCharacterId && characters.some((character) => character.id === selectedCharacterId);
    if (hasSelected) return;
    const hasCurrent = currentCharacterId && characters.some((character) => character.id === currentCharacterId);
    setSelectedCharacterId(hasCurrent ? currentCharacterId || '' : characters[0].id);
  }, [characters, currentCharacterId, isDmMode, params?.characterId, selectedCharacterId]);

  const selectedCharacter = useMemo(
    () => characters.find((character) => character.id === selectedCharacterId) || null,
    [characters, selectedCharacterId],
  );
  const selectedCharacterIsCaster = hasCasterSetup(selectedCharacter);
  const canUseCharacterActions = Boolean(selectedCharacter && selectedCharacterIsCaster && !isDmMode);

  const selectedPreparedSpellNames = useMemo(() => {
    const names = new Set<string>();
    (selectedCharacter?.spells?.preparedSpells || []).forEach((name) => {
      const key = normalizeSpellName(name);
      if (key) names.add(key);
    });
    return names;
  }, [selectedCharacter?.spells?.preparedSpells]);
  const selectedPreparedLimit = useMemo(() => getPreparedSpellsLimit(selectedCharacter), [selectedCharacter]);
  const selectedPreparedCount = selectedPreparedSpellNames.size;

  const favoriteSet = useMemo(() => new Set(favoriteSpellIds), [favoriteSpellIds]);
  const pinnedSet = useMemo(() => new Set(pinnedSpellIds), [pinnedSpellIds]);

  const spellbookWithCharacterImports = useMemo<SpellbookSpell[]>(() => {
    const byName = new Map<string, SpellbookSpell>();
    spells.forEach((spell) => {
      const key = normalizeSpellName(spell.name);
      if (!key || byName.has(key)) return;
      byName.set(key, spell);
    });

    characters.forEach((character) => {
      collectCharacterSpellNames(character).forEach((name) => {
        const key = normalizeSpellName(name);
        if (!key || byName.has(key)) return;
        byName.set(key, buildImportedSpell(name, t('defaults.importedSchool'), t('sources.imported')));
      });
    });

    return Array.from(byName.values());
  }, [characters, spells, t]);

  const selectedSpell = useMemo(
    () => spellbookWithCharacterImports.find((spell) => spell.id === selectedSpellId) || null,
    [selectedSpellId, spellbookWithCharacterImports],
  );

  useEffect(() => {
    setNoteDraft(selectedSpell ? spellNotesById[selectedSpell.id] || '' : '');
  }, [selectedSpell, spellNotesById]);

  useEffect(() => {
    if (!params?.initialSpellId || !isLoaded) return;
    const exists = spellbookWithCharacterImports.some((spell) => spell.id === params.initialSpellId);
    if (exists) setSelectedSpellId(params.initialSpellId);
  }, [isLoaded, params?.initialSpellId, spellbookWithCharacterImports]);

  const classOptions = useMemo(() => {
    const values = new Set<string>();
    spellbookWithCharacterImports.forEach((spell) => spell.classes.forEach((className) => values.add(className)));
    return Array.from(values).sort((a, b) =>
      getLocalizedSpellClass(a, sortLocale).localeCompare(getLocalizedSpellClass(b, sortLocale), sortLocale),
    );
  }, [sortLocale, spellbookWithCharacterImports]);

  const schoolOptions = useMemo(() => {
    const values = new Set<string>();
    spellbookWithCharacterImports.forEach((spell) => {
      if (spell.school) values.add(spell.school);
    });
    return Array.from(values).sort((a, b) =>
      getLocalizedSpellSchool(a, sortLocale).localeCompare(getLocalizedSpellSchool(b, sortLocale), sortLocale),
    );
  }, [sortLocale, spellbookWithCharacterImports]);

  const filteredSpells = useMemo(() => {
    return filterSpellbookSpells({
      spells: spellbookWithCharacterImports,
      search: debouncedSearch,
      activeTab,
      levelFilter,
      classFilter,
      schoolFilter,
      ritualFilter,
      concentrationFilter,
      favoriteSpellIds,
      pinnedSpellIds,
      selectedCharacter,
      isGmMode: isDmMode,
      locale: sortLocale,
    });
  }, [
    activeTab,
    classFilter,
    concentrationFilter,
    favoriteSpellIds,
    isDmMode,
    levelFilter,
    pinnedSpellIds,
    ritualFilter,
    schoolFilter,
    debouncedSearch,
    selectedCharacter,
    sortLocale,
    spellbookWithCharacterImports,
  ]);

  const activeFilterCount =
    Number(levelFilter !== 'all') +
    Number(classFilter !== 'all') +
    Number(schoolFilter !== 'all') +
    Number(ritualFilter !== 'all') +
    Number(concentrationFilter !== 'all');

  const clearFilters = () => {
    setLevelFilter('all');
    setClassFilter('all');
    setSchoolFilter('all');
    setRitualFilter('all');
    setConcentrationFilter('all');
  };

  const assignSpellStatus = (spellName: string, status: CharacterSpellStatus) => {
    if (!selectedCharacter || !canUseCharacterActions) return;

    const updated = applySpellStatus(selectedCharacter, spellName, status, { preparedLimit: selectedPreparedLimit });
    if (status === 'prepared' && updated === selectedCharacter && selectedPreparedLimit !== null) {
      const key = normalizeSpellName(spellName);
      const alreadyPrepared = selectedPreparedSpellNames.has(key);
      if (!alreadyPrepared && selectedPreparedCount >= selectedPreparedLimit) {
        setNotice(t('notices.preparedLimit', { count: selectedPreparedCount, limit: selectedPreparedLimit }));
        return;
      }
    }

    setNotice('');
    void updateCharacter(selectedCharacter.id, updated);
  };

  const openCreateSpellModal = () => {
    setEditingSpell(null);
    setModalName('');
    setModalLevel('1');
    setModalSchool(t('defaults.customSchool'));
    setModalCastingTime(t('defaults.castingTime'));
    setModalRange('');
    setModalComponents('V, S');
    setModalDuration('');
    setModalDescription('');
    setModalHigherLevels('');
    setModalClasses('');
    setModalTags(t('defaults.customTag'));
    setModalRitual(false);
    setModalConcentration(false);
    setModalDamageProfiles('');
    setIsSpellModalVisible(true);
  };

  const openEditSpellModal = (spell: SpellbookSpell) => {
    setEditingSpell(spell);
    setModalName(spell.name);
    setModalLevel(String(spell.level));
    setModalSchool(spell.school || t('defaults.customSchool'));
    setModalCastingTime(spell.castingTime || '');
    setModalRange(spell.range || '');
    setModalComponents(componentsToText(spell.components, t('labels.noComponents')));
    setModalDuration(spell.duration || '');
    setModalDescription(spell.description || '');
    setModalHigherLevels(spell.higherLevels || '');
    setModalClasses(spell.classes.join(', '));
    setModalTags(spell.tags.join(', '));
    setModalRitual(spell.ritual);
    setModalConcentration(spell.concentration);
    setModalDamageProfiles(damageProfilesToText(spell.damageProfiles || []));
    setIsSpellModalVisible(true);
  };

  const submitSpellModal = async () => {
    const validation = safeParseSpellFormInput({
      spellId: editingSpell?.id,
      name: modalName,
      level: modalLevel,
      school: modalSchool,
      castingTime: modalCastingTime,
      range: modalRange,
      components: modalComponents,
      duration: modalDuration,
      description: modalDescription,
      higherLevels: modalHigherLevels,
      classes: modalClasses,
      tags: modalTags,
      ritual: modalRitual,
      concentration: modalConcentration,
      damageProfiles: modalDamageProfiles,
    });
    if (!validation.ok) {
      setNotice(formatSchemaErrors(validation.issues)[0] || t('errors.invalidSpell'));
      return;
    }

    const saved = await upsertCustomSpell(validation.data);
    const level = validation.data.level ?? 1;
    if (saved && canUseCharacterActions && selectedCharacter) {
      const nextStatus: CharacterSpellStatus = level === 0 ? 'cantrip' : 'known';
      const updated = applySpellStatus(selectedCharacter, saved.name, nextStatus);
      void updateCharacter(selectedCharacter.id, updated);
    }

    setNotice('');
    setIsSpellModalVisible(false);
  };

  const saveDmNote = () => {
    if (!selectedSpell) return;
    void updateSpellNote(selectedSpell.id, noteDraft);
  };

  const renderStatusActions = (spell: SpellbookSpell) => {
    const status = getCharacterSpellStatus(selectedCharacter, spell.name);
    const canSetPrepared =
      !selectedCharacter || selectedPreparedLimit === null || status === 'prepared' || selectedPreparedCount < selectedPreparedLimit;

    if (isDmMode) {
      return null;
    }
    if (!selectedCharacter) {
      return <Text style={styles.metaMuted}>{t('characterActions.selectCharacter')}</Text>;
    }
    if (!canUseCharacterActions) {
      return <Text style={styles.metaMuted}>{t('characterActions.notCaster')}</Text>;
    }

    return (
      <View style={styles.statusButtonsRow}>
        {(['available', 'known', 'prepared', 'cantrip'] as CharacterSpellStatus[]).map((nextStatus) => (
          <Pressable
            key={`${spell.id}-${nextStatus}`}
            style={[
              styles.statusButton,
              status === nextStatus ? styles.statusButtonActive : null,
              nextStatus === 'prepared' && !canSetPrepared ? { opacity: 0.45 } : null,
            ]}
            onPress={() => assignSpellStatus(spell.name, nextStatus)}
            android_ripple={{ color: colors.ripple }}
            disabled={nextStatus === 'prepared' && !canSetPrepared}
          >
            <Text style={[styles.statusButtonText, status === nextStatus ? styles.statusButtonTextActive : null]}>
              {t(`status.${nextStatus}`)}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  };

  const renderSpellCard = ({ item }: { item: SpellbookSpell }) => {
    const status = getCharacterSpellStatus(selectedCharacter, item.name);
    const isFavorite = favoriteSet.has(item.id);
    const isPinned = pinnedSet.has(item.id);
    const canFavorite = item.source !== 'imported';
    const display = getDisplaySpell(item, sortLocale);
    const sourceLabel = getSourceLabel(t, item.source);

    return (
      <Pressable
        style={styles.card}
        testID='spellbook.spellCard'
        onPress={() => setSelectedSpellId(item.id)}
        android_ripple={{ color: colors.ripple }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderMain}>
            <Text style={styles.spellName}>{display.name}</Text>
            <Text style={styles.meta}>
              {item.level === 0 ? t('levels.cantrip') : t('levels.level', { level: item.level })} · {display.school || t('labels.unknownSchool')}
            </Text>
            {sourceLabel ? (
              <View style={styles.tagRow}>
                <View style={styles.sourceBadge} testID='spellbook.sourceBadge'>
                  <Text style={styles.sourceBadgeText}>{sourceLabel}</Text>
                </View>
              </View>
            ) : null}
          </View>
          {isDmMode ? (
            <Pressable
              onPress={() => void togglePinnedSpell(item.id)}
              android_ripple={{ color: colors.ripple }}
              style={styles.favoriteButton}
            >
              <MaterialCommunityIcons name={isPinned ? 'pin' : 'pin-outline'} size={20} color={isPinned ? colors.highlight : colors.textSecondary} />
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => {
              if (canFavorite) void toggleFavorite(item.id);
            }}
            android_ripple={{ color: colors.ripple }}
            style={styles.favoriteButton}
            disabled={!canFavorite}
          >
            <MaterialCommunityIcons
              name={isFavorite ? 'star' : 'star-outline'}
              size={20}
              color={isFavorite ? colors.highlight : canFavorite ? colors.textSecondary : colors.muted}
            />
          </Pressable>
        </View>

        <View style={styles.metadataGrid}>
          <Text style={styles.metadataText}>{t('labels.cast')}: {display.castingTime || '—'}</Text>
          <Text style={styles.metadataText}>{t('labels.range')}: {display.range || '—'}</Text>
          <Text style={styles.metadataText}>{t('labels.components')}: {componentsToText(display.components, t('labels.noComponents'))}</Text>
          <Text style={styles.metadataText}>{t('labels.duration')}: {display.duration || '—'}</Text>
        </View>

        <View style={styles.tagRow}>
          <View style={[styles.smallTag, item.concentration ? styles.smallTagActive : null]}>
            <Text style={[styles.smallTagText, item.concentration ? styles.smallTagTextActive : null]}>
              {t('labels.concentration')}: {item.concentration ? t('boolean.yes') : t('boolean.no')}
            </Text>
          </View>
          <View style={[styles.smallTag, item.ritual ? styles.smallTagActive : null]}>
            <Text style={[styles.smallTagText, item.ritual ? styles.smallTagTextActive : null]}>{t('labels.ritual')}: {item.ritual ? t('boolean.yes') : t('boolean.no')}</Text>
          </View>
        </View>

        <View style={styles.statusLine}>
          <Text style={styles.statusText}>{t('labels.status')}: {t(`status.${status}`)}</Text>
        </View>

        {renderStatusActions(item)}

        <View style={styles.cardActionRow}>
          <Pressable style={styles.cardActionButton} onPress={() => setSelectedSpellId(item.id)} android_ripple={{ color: colors.ripple }}>
            <MaterialCommunityIcons name='text-box-search-outline' size={14} color={colors.text} />
            <Text style={styles.cardActionText}>{t('actions.quickView')}</Text>
          </Pressable>
          <Pressable style={styles.cardActionButton} onPress={() => openEditSpellModal(item)} android_ripple={{ color: colors.ripple }}>
            <MaterialCommunityIcons name='pencil-outline' size={14} color={colors.text} />
            <Text style={styles.cardActionText}>{isEditableSpellSource(item) ? t('actions.edit') : t('actions.copy')}</Text>
          </Pressable>
          {isEditableSpellSource(item) ? (
            <Pressable style={styles.deleteCustomButton} onPress={() => void removeCustomSpell(item.id)} android_ripple={{ color: colors.ripple }}>
              <Text style={styles.deleteCustomButtonText}>{t('actions.delete')}</Text>
            </Pressable>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container} testID='spellbook.screen'>
      <View style={styles.headerRow}>
        <View style={styles.headerMeta}>
          <Text style={styles.title}>{t('title')}</Text>
          <Text style={styles.hint}>{isDmMode ? t('hint.dm') : t('hint.player')}</Text>
        </View>
        <Pressable style={styles.headerAction} onPress={openCreateSpellModal} android_ripple={{ color: colors.ripple }}>
          <MaterialCommunityIcons name='plus' size={16} color={colors.onPrimary} />
          <Text style={styles.headerActionText}>{t('actions.add')}</Text>
        </Pressable>
      </View>

      <View style={styles.offlineBanner}>
        <MaterialCommunityIcons name='cloud-off-outline' size={16} color={colors.onInfo} />
        <Text style={styles.offlineBannerText}>{t('offlineBanner')}</Text>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder={t('search.placeholder')}
        placeholderTextColor={colors.textSecondary}
        style={styles.search}
        testID='spellbook.searchInput'
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
        {TABS.map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tabButton, activeTab === tab ? styles.tabButtonActive : null]}
            onPress={() => setActiveTab(tab)}
            android_ripple={{ color: colors.ripple }}
            testID={`spellbook.tab.${tab}`}
          >
            <Text style={[styles.tabButtonText, activeTab === tab ? styles.tabButtonTextActive : null]}>{t(`tabs.${tab}`)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.filtersBlock}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {LEVEL_FILTERS.map((item) => (
            <Pressable
              key={`level-${String(item)}`}
              style={[styles.chip, levelFilter === item ? styles.chipActive : null]}
              onPress={() => setLevelFilter(item)}
              android_ripple={{ color: colors.ripple }}
            >
              <Text style={[styles.chipText, levelFilter === item ? styles.chipTextActive : null]}>
                {item === 'all' ? t('filters.all') : item === 0 ? t('levels.cantrip') : String(item)}
              </Text>
            </Pressable>
          ))}
          <Pressable style={[styles.chip, classFilter !== 'all' ? styles.chipActive : null]} onPress={() => setClassFilter('all')} android_ripple={{ color: colors.ripple }}>
            <Text style={[styles.chipText, classFilter !== 'all' ? styles.chipTextActive : null]}>{classFilter === 'all' ? t('filters.class') : getLocalizedSpellClass(classFilter, sortLocale)}</Text>
          </Pressable>
          {classOptions.map((className) => (
            <Pressable
              key={`class-${className}`}
              style={[styles.chip, classFilter === className ? styles.chipActive : null]}
              onPress={() => setClassFilter(className)}
              android_ripple={{ color: colors.ripple }}
            >
              <Text style={[styles.chipText, classFilter === className ? styles.chipTextActive : null]}>{getLocalizedSpellClass(className, sortLocale)}</Text>
            </Pressable>
          ))}
          <Pressable style={[styles.chip, schoolFilter !== 'all' ? styles.chipActive : null]} onPress={() => setSchoolFilter('all')} android_ripple={{ color: colors.ripple }}>
            <Text style={[styles.chipText, schoolFilter !== 'all' ? styles.chipTextActive : null]}>{schoolFilter === 'all' ? t('filters.school') : getLocalizedSpellSchool(schoolFilter, sortLocale)}</Text>
          </Pressable>
          {schoolOptions.map((school) => (
            <Pressable
              key={`school-${school}`}
              style={[styles.chip, schoolFilter === school ? styles.chipActive : null]}
              onPress={() => setSchoolFilter(school)}
              android_ripple={{ color: colors.ripple }}
            >
              <Text style={[styles.chipText, schoolFilter === school ? styles.chipTextActive : null]}>{getLocalizedSpellSchool(school, sortLocale)}</Text>
            </Pressable>
          ))}
          {BOOLEAN_FILTERS.map((item) => (
            <Pressable
              key={`ritual-${item}`}
              style={[styles.chip, ritualFilter === item && item !== 'all' ? styles.chipActive : null]}
              onPress={() => setRitualFilter(item)}
              android_ripple={{ color: colors.ripple }}
            >
              <Text style={[styles.chipText, ritualFilter === item && item !== 'all' ? styles.chipTextActive : null]}>
                {t('labels.ritual')}: {t(`boolean.${item}`)}
              </Text>
            </Pressable>
          ))}
          {BOOLEAN_FILTERS.map((item) => (
            <Pressable
              key={`concentration-${item}`}
              style={[styles.chip, concentrationFilter === item && item !== 'all' ? styles.chipActive : null]}
              onPress={() => setConcentrationFilter(item)}
              android_ripple={{ color: colors.ripple }}
            >
              <Text style={[styles.chipText, concentrationFilter === item && item !== 'all' ? styles.chipTextActive : null]}>
                {t('labels.concentration')}: {t(`boolean.${item}`)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        {activeFilterCount ? (
          <View style={styles.activeFiltersRow}>
            <Text style={styles.preparedInfo}>{t('filters.active', { count: activeFilterCount })}</Text>
            <Pressable style={styles.clearButton} onPress={clearFilters} android_ripple={{ color: colors.ripple }}>
              <Text style={styles.clearButtonText}>{t('filters.clear')}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {!isDmMode ? (
        <View style={styles.characterPickerBlock}>
          <Text style={styles.sectionLabel}>{t('characterBinding.title')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            <Pressable style={[styles.chip, !selectedCharacter ? styles.chipActive : null]} onPress={() => setSelectedCharacterId('')} android_ripple={{ color: colors.ripple }}>
              <Text style={[styles.chipText, !selectedCharacter ? styles.chipTextActive : null]}>{t('characterBinding.referenceOnly')}</Text>
            </Pressable>
            {characters.map((character) => (
              <Pressable
                key={`char-${character.id}`}
                style={[styles.chip, selectedCharacter?.id === character.id ? styles.chipActive : null]}
                onPress={() => setSelectedCharacterId(character.id)}
                android_ripple={{ color: colors.ripple }}
              >
                <Text style={[styles.chipText, selectedCharacter?.id === character.id ? styles.chipTextActive : null]}>
                  {character.name || t('characterBinding.characterFallback')}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {selectedCharacter && selectedPreparedLimit !== null ? <Text style={styles.preparedInfo}>{t('characterBinding.prepared', { count: selectedPreparedCount, limit: selectedPreparedLimit })}</Text> : null}
          {selectedCharacter && !selectedCharacterIsCaster ? <Text style={styles.preparedWarning}>{t('characterBinding.notCaster')}</Text> : null}
          {notice ? <Text style={styles.preparedWarning}>{notice}</Text> : null}
        </View>
      ) : null}

      {isDmMode && pinnedSpellIds.length ? <Text style={styles.preparedInfo}>{t('pinnedHint')}</Text> : null}
      {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}
      {!loadError && !isLoaded ? <SkeletonSpellbook /> : null}

      {!loadError && isLoaded ? (
        <FlatList
          data={filteredSpells}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={renderSpellCard}
          ListEmptyComponent={<Text style={styles.empty}>{t('empty')}</Text>}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews
        />
      ) : null}

      <Modal
        isVisible={Boolean(selectedSpell)}
        onClose={() => setSelectedSpellId(null)}
        title={selectedSpell ? getDisplaySpell(selectedSpell, sortLocale).name : t('detail.title')}
        subtitle={selectedSpell ? `${selectedSpell.level === 0 ? t('levels.cantrip') : t('levels.level', { level: selectedSpell.level })} · ${getDisplaySpell(selectedSpell, sortLocale).school}` : undefined}
      >
        {selectedSpell ? (
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps='handled'>
            {(() => {
              const display = getDisplaySpell(selectedSpell, sortLocale);
              const sourceLabel = getSourceLabel(t, selectedSpell.source);
              const licenseLabel = getLicenseLabel(t, selectedSpell.license);
              return (
                <>
            <View style={styles.metadataGrid}>
              <Text style={styles.metadataText}>{t('labels.castingTime')}: {display.castingTime || '—'}</Text>
              <Text style={styles.metadataText}>{t('labels.range')}: {display.range || '—'}</Text>
              <Text style={styles.metadataText}>{t('labels.components')}: {componentsToText(display.components, t('labels.noComponents'))}</Text>
              <Text style={styles.metadataText}>{t('labels.duration')}: {display.duration || '—'}</Text>
            </View>
            <View style={styles.tagRow}>
              {sourceLabel ? (
                <View style={styles.sourceBadge} testID='spellbook.detailSourceBadge'>
                  <Text style={styles.sourceBadgeText}>{sourceLabel}</Text>
                </View>
              ) : null}
              <View style={[styles.smallTag, selectedSpell.concentration ? styles.smallTagActive : null]}>
                <Text style={[styles.smallTagText, selectedSpell.concentration ? styles.smallTagTextActive : null]}>
                  {t('labels.concentration')}: {selectedSpell.concentration ? t('boolean.yes') : t('boolean.no')}
                </Text>
              </View>
              <View style={[styles.smallTag, selectedSpell.ritual ? styles.smallTagActive : null]}>
                <Text style={[styles.smallTagText, selectedSpell.ritual ? styles.smallTagTextActive : null]}>{t('labels.ritual')}: {selectedSpell.ritual ? t('boolean.yes') : t('boolean.no')}</Text>
              </View>
            </View>
            <Text style={styles.modalLabel}>{t('labels.description')}</Text>
            <Text style={styles.description}>{display.description || t('detail.noDescription')}</Text>
            {display.higherLevels ? (
              <>
                <Text style={styles.modalLabel}>{t('labels.higherLevels')}</Text>
                <Text style={styles.description}>{display.higherLevels}</Text>
              </>
            ) : null}
            <Text style={styles.modalLabel}>{t('labels.classes')}</Text>
            <Text style={styles.description}>{display.classes.length ? display.classes.join(', ') : '—'}</Text>
            <Text style={styles.modalLabel}>{t('labels.tags')}</Text>
            <Text style={styles.description}>{selectedSpell.tags.length ? selectedSpell.tags.join(', ') : '—'}</Text>
            {sourceLabel ? (
              <>
                <Text style={styles.modalLabel}>{t('labels.sourceMetadata')}</Text>
                <Text style={styles.description}>
                  {t('labels.source')}: {sourceLabel}
                  {licenseLabel ? ` · ${t('labels.license')}: ${licenseLabel}` : ''}
                </Text>
              </>
            ) : null}
            {display.damageProfiles.length ? (
              <View style={styles.damageBlock}>
                {display.damageProfiles.map((damage) => (
                  <Text key={damage.id} style={styles.damageLine}>
                    {damage.label}: {damage.formula} {damage.damageType}
                    {damage.condition ? ` (${damage.condition})` : ''}
                  </Text>
                ))}
              </View>
            ) : null}
                </>
              );
            })()}
            {renderStatusActions(selectedSpell)}
            <View style={styles.cardActionRow}>
              <Pressable style={styles.cardActionButton} onPress={() => void toggleFavorite(selectedSpell.id)} android_ripple={{ color: colors.ripple }}>
                <MaterialCommunityIcons name={favoriteSet.has(selectedSpell.id) ? 'star' : 'star-outline'} size={14} color={colors.text} />
                <Text style={styles.cardActionText}>{favoriteSet.has(selectedSpell.id) ? t('actions.removeFavorite') : t('actions.addFavorite')}</Text>
              </Pressable>
              {isDmMode ? (
                <Pressable style={styles.cardActionButton} onPress={() => void togglePinnedSpell(selectedSpell.id)} android_ripple={{ color: colors.ripple }}>
                  <MaterialCommunityIcons name={pinnedSet.has(selectedSpell.id) ? 'pin' : 'pin-outline'} size={14} color={colors.text} />
                  <Text style={styles.cardActionText}>{pinnedSet.has(selectedSpell.id) ? t('actions.unpin') : t('actions.pin')}</Text>
                </Pressable>
              ) : null}
            </View>
            {isDmMode ? (
              <>
                <Text style={styles.modalLabel}>{t('dmNotes.title')}</Text>
                <TextInput
                  value={noteDraft}
                  onChangeText={setNoteDraft}
                  placeholder={t('dmNotes.placeholder')}
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.modalInput, styles.modalInputMultiline]}
                  multiline
                />
                <Pressable style={styles.headerAction} onPress={saveDmNote} android_ripple={{ color: colors.ripple }}>
                  <MaterialCommunityIcons name='content-save-outline' size={16} color={colors.onPrimary} />
                  <Text style={styles.headerActionText}>{t('dmNotes.save')}</Text>
                </Pressable>
              </>
            ) : null}
          </ScrollView>
        ) : null}
      </Modal>

      <Modal
        isVisible={isSpellModalVisible}
        onClose={() => setIsSpellModalVisible(false)}
        onSubmit={() => void submitSpellModal()}
        title={editingSpell ? t('form.editTitle') : t('form.newTitle')}
        subtitle={editingSpell && !isEditableSpellSource(editingSpell) ? t('form.copySubtitle') : t('form.localSubtitle')}
      >
        <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps='handled'>
          <Text style={styles.modalLabel}>{t('form.name')}</Text>
          <TextInput value={modalName} onChangeText={setModalName} placeholder={t('form.placeholders.name')} placeholderTextColor={colors.textSecondary} style={styles.modalInput} />
          <Text style={styles.modalLabel}>{t('form.level')}</Text>
          <TextInput value={modalLevel} onChangeText={setModalLevel} keyboardType='number-pad' placeholder='1' placeholderTextColor={colors.textSecondary} style={styles.modalInput} />
          <Text style={styles.modalLabel}>{t('form.school')}</Text>
          <TextInput value={modalSchool} onChangeText={setModalSchool} placeholder={t('form.placeholders.school')} placeholderTextColor={colors.textSecondary} style={styles.modalInput} />
          <Text style={styles.modalLabel}>{t('form.castingTime')}</Text>
          <TextInput value={modalCastingTime} onChangeText={setModalCastingTime} placeholder={t('defaults.castingTime')} placeholderTextColor={colors.textSecondary} style={styles.modalInput} />
          <Text style={styles.modalLabel}>{t('form.range')}</Text>
          <TextInput value={modalRange} onChangeText={setModalRange} placeholder={t('form.placeholders.range')} placeholderTextColor={colors.textSecondary} style={styles.modalInput} />
          <Text style={styles.modalLabel}>{t('form.components')}</Text>
          <TextInput value={modalComponents} onChangeText={setModalComponents} placeholder={t('form.placeholders.components')} placeholderTextColor={colors.textSecondary} style={styles.modalInput} />
          <Text style={styles.modalLabel}>{t('form.duration')}</Text>
          <TextInput value={modalDuration} onChangeText={setModalDuration} placeholder={t('form.placeholders.duration')} placeholderTextColor={colors.textSecondary} style={styles.modalInput} />
          <View style={styles.toggleRow}>
            <Pressable style={[styles.statusButton, modalRitual ? styles.statusButtonActive : null]} onPress={() => setModalRitual((value) => !value)} android_ripple={{ color: colors.ripple }}>
              <Text style={[styles.statusButtonText, modalRitual ? styles.statusButtonTextActive : null]}>{t('labels.ritual')}</Text>
            </Pressable>
            <Pressable style={[styles.statusButton, modalConcentration ? styles.statusButtonActive : null]} onPress={() => setModalConcentration((value) => !value)} android_ripple={{ color: colors.ripple }}>
              <Text style={[styles.statusButtonText, modalConcentration ? styles.statusButtonTextActive : null]}>{t('labels.concentration')}</Text>
            </Pressable>
          </View>
          <Text style={styles.modalLabel}>{t('form.description')}</Text>
          <TextInput value={modalDescription} onChangeText={setModalDescription} placeholder={t('form.placeholders.description')} placeholderTextColor={colors.textSecondary} style={[styles.modalInput, styles.modalInputMultiline]} multiline />
          <Text style={styles.modalLabel}>{t('form.higherLevels')}</Text>
          <TextInput value={modalHigherLevels} onChangeText={setModalHigherLevels} placeholder={t('form.placeholders.higherLevels')} placeholderTextColor={colors.textSecondary} style={[styles.modalInput, styles.modalInputMultiline]} multiline />
          <Text style={styles.modalLabel}>{t('form.classes')}</Text>
          <TextInput value={modalClasses} onChangeText={setModalClasses} placeholder='Wizard, Sorcerer' placeholderTextColor={colors.textSecondary} style={styles.modalInput} />
          <Text style={styles.modalLabel}>{t('form.tags')}</Text>
          <TextInput value={modalTags} onChangeText={setModalTags} placeholder={t('form.placeholders.tags')} placeholderTextColor={colors.textSecondary} style={styles.modalInput} />
          <Text style={styles.modalLabel}>{t('form.damageProfiles')}</Text>
          <TextInput
            value={modalDamageProfiles}
            onChangeText={setModalDamageProfiles}
            placeholder={t('form.placeholders.damageProfiles')}
            placeholderTextColor={colors.textSecondary}
            style={[styles.modalInput, styles.modalInputLarge]}
            multiline
          />
          <Text style={styles.modalHint}>{t('form.damageProfileFormat')}</Text>
          <Text style={styles.modalHint}>{t('form.damageTypes', { types: SPELL_DAMAGE_TYPES.join(', ') })}</Text>
        </ScrollView>
      </Modal>
    </View>
  );
};

export default Spellbook;
