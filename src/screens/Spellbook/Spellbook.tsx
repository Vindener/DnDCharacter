import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useThemeStore from '@/context/Theme-store';
import useCharacterStore from '@/context/Character-store';
import useSpellbookStore from '@/context/Spellbook-store';
import { applySpellStatus, collectCharacterSpellNames, getCharacterSpellStatus, getPreparedSpellsLimit, normalizeSpellName } from '@/domain/spellbook';
import { Modal } from '@/shared/components/Modal/Modal';
import { formatSchemaErrors, safeParseSpellFormInput, SPELL_DAMAGE_TYPES } from '@/domain/schemas';
import type { CharacterSpellStatus, SpellComponents, SpellDamageProfile, SpellbookSpell } from '@/types/Spellbook';
import type { CharacterViewModel } from '@/types/Character';
import type { TabStackParamList } from '@/navigation/TabNavigator';
import { SkeletonSpellbook } from '@/shared/ui/skeleton';
import { getStyles } from './styles';

type Props = StackScreenProps<TabStackParamList, 'Spellbook'>;
type SpellbookTab = 'all' | 'prepared' | 'known' | 'favorites' | 'custom';
type LevelFilter = 'all' | number;
type BooleanFilter = 'all' | 'yes' | 'no';

const TABS: Array<{ id: SpellbookTab; label: string }> = [
  { id: 'all', label: 'Всі' },
  { id: 'prepared', label: 'Підготовлені' },
  { id: 'known', label: 'Відомі' },
  { id: 'favorites', label: 'Улюблені' },
  { id: 'custom', label: 'Власні' },
];

const LEVEL_FILTERS: Array<{ id: LevelFilter; label: string }> = [
  { id: 'all', label: 'Усі' },
  { id: 0, label: 'Каніпс' },
  { id: 1, label: '1' },
  { id: 2, label: '2' },
  { id: 3, label: '3' },
  { id: 4, label: '4' },
  { id: 5, label: '5' },
  { id: 6, label: '6' },
  { id: 7, label: '7' },
  { id: 8, label: '8' },
  { id: 9, label: '9' },
];

const BOOLEAN_FILTERS: Array<{ id: BooleanFilter; label: string }> = [
  { id: 'all', label: 'Усі' },
  { id: 'yes', label: 'Так' },
  { id: 'no', label: 'Ні' },
];

const SPELL_STATUS_LABEL: Record<CharacterSpellStatus, string> = {
  available: 'Доступне',
  known: 'Відоме',
  prepared: 'Підготовлене',
  cantrip: 'Каніпс',
};

function sourceLabel(source: SpellbookSpell['source']): string {
  if (source === 'custom') return 'власне';
  if (source === 'imported') return 'імпортоване';
  return 'системне';
}

function formatLevel(level: number): string {
  return level === 0 ? 'Каніпс' : `Рівень ${level}`;
}

function componentsToText(components: SpellComponents): string {
  const parts: string[] = [];
  if (components.verbal) parts.push('V');
  if (components.somatic) parts.push('S');
  if (components.material) parts.push(`M (${components.material})`);
  return parts.length ? parts.join(', ') : 'Немає';
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

function buildImportedSpell(name: string): SpellbookSpell {
  const key = normalizeSpellName(name).replace(/\s+/g, '-');
  return {
    id: `spell-imported-${key}`,
    name,
    level: 1,
    school: 'З листа персонажа',
    castingTime: '',
    range: '',
    components: { verbal: false, somatic: false, material: '' },
    duration: '',
    description: '',
    higherLevels: '',
    classes: [],
    tags: ['імпортоване'],
    ritual: false,
    concentration: false,
    damageProfiles: [],
    source: 'imported',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

const Spellbook = ({ route }: Props) => {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => getStyles(colors), [colors]);
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
  const [modalSchool, setModalSchool] = useState('Власне');
  const [modalCastingTime, setModalCastingTime] = useState('1 дія');
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
        byName.set(key, buildImportedSpell(name));
      });
    });

    return Array.from(byName.values());
  }, [characters, spells]);

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
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'uk'));
  }, [spellbookWithCharacterImports]);

  const schoolOptions = useMemo(() => {
    const values = new Set<string>();
    spellbookWithCharacterImports.forEach((spell) => {
      if (spell.school) values.add(spell.school);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'uk'));
  }, [spellbookWithCharacterImports]);

  const filteredSpells = useMemo(() => {
    const filter = search.trim().toLowerCase();

    return spellbookWithCharacterImports
      .filter((spell) => {
        const status = getCharacterSpellStatus(selectedCharacter, spell.name);
        if (activeTab === 'prepared' && status !== 'prepared') return false;
        if (activeTab === 'known' && status !== 'known' && status !== 'cantrip') return false;
        if (activeTab === 'favorites' && !favoriteSet.has(spell.id)) return false;
        if (activeTab === 'custom' && spell.source !== 'custom') return false;
        if (levelFilter !== 'all' && spell.level !== levelFilter) return false;
        if (classFilter !== 'all' && !spell.classes.includes(classFilter)) return false;
        if (schoolFilter !== 'all' && spell.school !== schoolFilter) return false;
        if (ritualFilter !== 'all' && spell.ritual !== (ritualFilter === 'yes')) return false;
        if (concentrationFilter !== 'all' && spell.concentration !== (concentrationFilter === 'yes')) return false;
        if (!filter) return true;

        const damageText = spell.damageProfiles
          .map((profile) => `${profile.label} ${profile.formula} ${profile.damageType} ${profile.condition || ''}`)
          .join(' ');
        const haystack = [
          spell.name,
          spell.school,
          spell.castingTime,
          spell.range,
          componentsToText(spell.components),
          spell.duration,
          spell.description,
          spell.higherLevels,
          spell.classes.join(' '),
          spell.tags.join(' '),
          damageText,
        ].join(' ').toLowerCase();
        return haystack.includes(filter);
      })
      .sort((a, b) => {
        if (isDmMode) {
          const pinDelta = Number(pinnedSet.has(b.id)) - Number(pinnedSet.has(a.id));
          if (pinDelta) return pinDelta;
        }
        if (a.level !== b.level) return a.level - b.level;
        return a.name.localeCompare(b.name, 'uk');
      });
  }, [
    activeTab,
    classFilter,
    concentrationFilter,
    favoriteSet,
    isDmMode,
    levelFilter,
    pinnedSet,
    ritualFilter,
    schoolFilter,
    search,
    selectedCharacter,
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
        setNotice(`Ліміт підготовлених заклять: ${selectedPreparedCount}/${selectedPreparedLimit}.`);
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
    setModalSchool('Власне');
    setModalCastingTime('1 дія');
    setModalRange('');
    setModalComponents('V, S');
    setModalDuration('');
    setModalDescription('');
    setModalHigherLevels('');
    setModalClasses('');
    setModalTags('власне');
    setModalRitual(false);
    setModalConcentration(false);
    setModalDamageProfiles('');
    setIsSpellModalVisible(true);
  };

  const openEditSpellModal = (spell: SpellbookSpell) => {
    setEditingSpell(spell);
    setModalName(spell.name);
    setModalLevel(String(spell.level));
    setModalSchool(spell.school || 'Власне');
    setModalCastingTime(spell.castingTime || '');
    setModalRange(spell.range || '');
    setModalComponents(componentsToText(spell.components));
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
      setNotice(formatSchemaErrors(validation.issues)[0] || 'Невалідні дані закляття.');
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
      return <Text style={styles.metaMuted}>Оберіть персонажа, щоб керувати відомими й підготовленими закляттями.</Text>;
    }
    if (!canUseCharacterActions) {
      return <Text style={styles.metaMuted}>У персонажа не налаштовано магію; Spellbook працює як довідник.</Text>;
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
              {SPELL_STATUS_LABEL[nextStatus]}
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

    return (
      <Pressable
        style={styles.card}
        testID='spellbook.spellCard'
        onPress={() => setSelectedSpellId(item.id)}
        android_ripple={{ color: colors.ripple }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderMain}>
            <Text style={styles.spellName}>{item.name}</Text>
            <Text style={styles.meta}>
              {formatLevel(item.level)} · {item.school || 'Школа невідома'} · {sourceLabel(item.source)}
            </Text>
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
          <Text style={styles.metadataText}>Каст: {item.castingTime || '—'}</Text>
          <Text style={styles.metadataText}>Дистанція: {item.range || '—'}</Text>
          <Text style={styles.metadataText}>Компоненти: {componentsToText(item.components)}</Text>
          <Text style={styles.metadataText}>Тривалість: {item.duration || '—'}</Text>
        </View>

        <View style={styles.tagRow}>
          <View style={[styles.smallTag, item.concentration ? styles.smallTagActive : null]}>
            <Text style={[styles.smallTagText, item.concentration ? styles.smallTagTextActive : null]}>
              Концентрація: {item.concentration ? 'Так' : 'Ні'}
            </Text>
          </View>
          <View style={[styles.smallTag, item.ritual ? styles.smallTagActive : null]}>
            <Text style={[styles.smallTagText, item.ritual ? styles.smallTagTextActive : null]}>Ритуал: {item.ritual ? 'Так' : 'Ні'}</Text>
          </View>
        </View>

        {item.description ? <Text style={styles.description}>{item.description}</Text> : null}

        <View style={styles.statusLine}>
          <Text style={styles.statusText}>Статус: {SPELL_STATUS_LABEL[status]}</Text>
        </View>

        {renderStatusActions(item)}

        <View style={styles.cardActionRow}>
          <Pressable style={styles.cardActionButton} onPress={() => setSelectedSpellId(item.id)} android_ripple={{ color: colors.ripple }}>
            <MaterialCommunityIcons name='text-box-search-outline' size={14} color={colors.text} />
            <Text style={styles.cardActionText}>Швидкий перегляд</Text>
          </Pressable>
          <Pressable style={styles.cardActionButton} onPress={() => openEditSpellModal(item)} android_ripple={{ color: colors.ripple }}>
            <MaterialCommunityIcons name='pencil-outline' size={14} color={colors.text} />
            <Text style={styles.cardActionText}>{item.source === 'custom' ? 'Редагувати' : 'Копія'}</Text>
          </Pressable>
          {item.source === 'custom' ? (
            <Pressable style={styles.deleteCustomButton} onPress={() => void removeCustomSpell(item.id)} android_ripple={{ color: colors.ripple }}>
              <Text style={styles.deleteCustomButtonText}>Видалити</Text>
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
          <Text style={styles.title}>Книга заклять</Text>
          <Text style={styles.hint}>{isDmMode ? 'Закріплені довідки, нотатки і швидкий пошук для столу.' : 'Пошук, підготовка, улюблені й прив’язка заклять до персонажа.'}</Text>
        </View>
        <Pressable style={styles.headerAction} onPress={openCreateSpellModal} android_ripple={{ color: colors.ripple }}>
          <MaterialCommunityIcons name='plus' size={16} color={colors.onPrimary} />
          <Text style={styles.headerActionText}>Додати</Text>
        </Pressable>
      </View>

      <View style={styles.offlineBanner}>
        <MaterialCommunityIcons name='cloud-off-outline' size={16} color={colors.onInfo} />
        <Text style={styles.offlineBannerText}>Локальна книга заклять. DM-закріплення і нотатки зберігаються на цьому пристрої.</Text>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder='Пошук закляття...'
        placeholderTextColor={colors.textSecondary}
        style={styles.search}
        testID='spellbook.searchInput'
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.id}
            style={[styles.tabButton, activeTab === tab.id ? styles.tabButtonActive : null]}
            onPress={() => setActiveTab(tab.id)}
            android_ripple={{ color: colors.ripple }}
            testID={`spellbook.tab.${tab.id}`}
          >
            <Text style={[styles.tabButtonText, activeTab === tab.id ? styles.tabButtonTextActive : null]}>{tab.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.filtersBlock}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {LEVEL_FILTERS.map((item) => (
            <Pressable
              key={`level-${String(item.id)}`}
              style={[styles.chip, levelFilter === item.id ? styles.chipActive : null]}
              onPress={() => setLevelFilter(item.id)}
              android_ripple={{ color: colors.ripple }}
            >
              <Text style={[styles.chipText, levelFilter === item.id ? styles.chipTextActive : null]}>{item.label}</Text>
            </Pressable>
          ))}
          <Pressable style={[styles.chip, classFilter !== 'all' ? styles.chipActive : null]} onPress={() => setClassFilter('all')} android_ripple={{ color: colors.ripple }}>
            <Text style={[styles.chipText, classFilter !== 'all' ? styles.chipTextActive : null]}>{classFilter === 'all' ? 'Клас' : classFilter}</Text>
          </Pressable>
          {classOptions.map((className) => (
            <Pressable
              key={`class-${className}`}
              style={[styles.chip, classFilter === className ? styles.chipActive : null]}
              onPress={() => setClassFilter(className)}
              android_ripple={{ color: colors.ripple }}
            >
              <Text style={[styles.chipText, classFilter === className ? styles.chipTextActive : null]}>{className}</Text>
            </Pressable>
          ))}
          <Pressable style={[styles.chip, schoolFilter !== 'all' ? styles.chipActive : null]} onPress={() => setSchoolFilter('all')} android_ripple={{ color: colors.ripple }}>
            <Text style={[styles.chipText, schoolFilter !== 'all' ? styles.chipTextActive : null]}>{schoolFilter === 'all' ? 'Школа' : schoolFilter}</Text>
          </Pressable>
          {schoolOptions.map((school) => (
            <Pressable
              key={`school-${school}`}
              style={[styles.chip, schoolFilter === school ? styles.chipActive : null]}
              onPress={() => setSchoolFilter(school)}
              android_ripple={{ color: colors.ripple }}
            >
              <Text style={[styles.chipText, schoolFilter === school ? styles.chipTextActive : null]}>{school}</Text>
            </Pressable>
          ))}
          {BOOLEAN_FILTERS.map((item) => (
            <Pressable
              key={`ritual-${item.id}`}
              style={[styles.chip, ritualFilter === item.id && item.id !== 'all' ? styles.chipActive : null]}
              onPress={() => setRitualFilter(item.id)}
              android_ripple={{ color: colors.ripple }}
            >
              <Text style={[styles.chipText, ritualFilter === item.id && item.id !== 'all' ? styles.chipTextActive : null]}>
                Ритуал: {item.label}
              </Text>
            </Pressable>
          ))}
          {BOOLEAN_FILTERS.map((item) => (
            <Pressable
              key={`concentration-${item.id}`}
              style={[styles.chip, concentrationFilter === item.id && item.id !== 'all' ? styles.chipActive : null]}
              onPress={() => setConcentrationFilter(item.id)}
              android_ripple={{ color: colors.ripple }}
            >
              <Text style={[styles.chipText, concentrationFilter === item.id && item.id !== 'all' ? styles.chipTextActive : null]}>
                Концентрація: {item.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        {activeFilterCount ? (
          <View style={styles.activeFiltersRow}>
            <Text style={styles.preparedInfo}>Активні фільтри: {activeFilterCount}</Text>
            <Pressable style={styles.clearButton} onPress={clearFilters} android_ripple={{ color: colors.ripple }}>
              <Text style={styles.clearButtonText}>Скинути</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {!isDmMode ? (
        <View style={styles.characterPickerBlock}>
          <Text style={styles.sectionLabel}>Прив’язка до персонажа</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            <Pressable style={[styles.chip, !selectedCharacter ? styles.chipActive : null]} onPress={() => setSelectedCharacterId('')} android_ripple={{ color: colors.ripple }}>
              <Text style={[styles.chipText, !selectedCharacter ? styles.chipTextActive : null]}>Лише довідник</Text>
            </Pressable>
            {characters.map((character) => (
              <Pressable
                key={`char-${character.id}`}
                style={[styles.chip, selectedCharacter?.id === character.id ? styles.chipActive : null]}
                onPress={() => setSelectedCharacterId(character.id)}
                android_ripple={{ color: colors.ripple }}
              >
                <Text style={[styles.chipText, selectedCharacter?.id === character.id ? styles.chipTextActive : null]}>
                  {character.name || 'Персонаж'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {selectedCharacter && selectedPreparedLimit !== null ? <Text style={styles.preparedInfo}>Підготовлено: {selectedPreparedCount}/{selectedPreparedLimit}</Text> : null}
          {selectedCharacter && !selectedCharacterIsCaster ? <Text style={styles.preparedWarning}>Не кастер: режим довідника.</Text> : null}
          {notice ? <Text style={styles.preparedWarning}>{notice}</Text> : null}
        </View>
      ) : null}

      {isDmMode && pinnedSpellIds.length ? <Text style={styles.preparedInfo}>Закріплені закляття показуються першими.</Text> : null}
      {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}
      {!loadError && !isLoaded ? <SkeletonSpellbook /> : null}

      {!loadError && isLoaded ? (
        <FlatList
          data={filteredSpells}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={renderSpellCard}
          ListEmptyComponent={<Text style={styles.empty}>Заклять не знайдено. Змініть пошук, скиньте фільтри або додайте власне закляття.</Text>}
        />
      ) : null}

      <Modal
        isVisible={Boolean(selectedSpell)}
        onClose={() => setSelectedSpellId(null)}
        title={selectedSpell?.name || 'Деталі закляття'}
        subtitle={selectedSpell ? `${formatLevel(selectedSpell.level)} · ${selectedSpell.school}` : undefined}
      >
        {selectedSpell ? (
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps='handled'>
            <View style={styles.metadataGrid}>
              <Text style={styles.metadataText}>Час касту: {selectedSpell.castingTime || '—'}</Text>
              <Text style={styles.metadataText}>Дистанція: {selectedSpell.range || '—'}</Text>
              <Text style={styles.metadataText}>Компоненти: {componentsToText(selectedSpell.components)}</Text>
              <Text style={styles.metadataText}>Тривалість: {selectedSpell.duration || '—'}</Text>
            </View>
            <View style={styles.tagRow}>
              <View style={[styles.smallTag, selectedSpell.concentration ? styles.smallTagActive : null]}>
                <Text style={[styles.smallTagText, selectedSpell.concentration ? styles.smallTagTextActive : null]}>
                  Концентрація: {selectedSpell.concentration ? 'Так' : 'Ні'}
                </Text>
              </View>
              <View style={[styles.smallTag, selectedSpell.ritual ? styles.smallTagActive : null]}>
                <Text style={[styles.smallTagText, selectedSpell.ritual ? styles.smallTagTextActive : null]}>Ритуал: {selectedSpell.ritual ? 'Так' : 'Ні'}</Text>
              </View>
            </View>
            <Text style={styles.modalLabel}>Опис</Text>
            <Text style={styles.description}>{selectedSpell.description || 'Опису немає.'}</Text>
            {selectedSpell.higherLevels ? (
              <>
                <Text style={styles.modalLabel}>На вищих рівнях</Text>
                <Text style={styles.description}>{selectedSpell.higherLevels}</Text>
              </>
            ) : null}
            <Text style={styles.modalLabel}>Класи</Text>
            <Text style={styles.description}>{selectedSpell.classes.length ? selectedSpell.classes.join(', ') : '—'}</Text>
            <Text style={styles.modalLabel}>Теги</Text>
            <Text style={styles.description}>{selectedSpell.tags.length ? selectedSpell.tags.join(', ') : '—'}</Text>
            {selectedSpell.damageProfiles.length ? (
              <View style={styles.damageBlock}>
                {selectedSpell.damageProfiles.map((damage) => (
                  <Text key={damage.id} style={styles.damageLine}>
                    {damage.label}: {damage.formula} {damage.damageType}
                    {damage.condition ? ` (${damage.condition})` : ''}
                  </Text>
                ))}
              </View>
            ) : null}
            {renderStatusActions(selectedSpell)}
            <View style={styles.cardActionRow}>
              <Pressable style={styles.cardActionButton} onPress={() => void toggleFavorite(selectedSpell.id)} android_ripple={{ color: colors.ripple }}>
                <MaterialCommunityIcons name={favoriteSet.has(selectedSpell.id) ? 'star' : 'star-outline'} size={14} color={colors.text} />
                <Text style={styles.cardActionText}>{favoriteSet.has(selectedSpell.id) ? 'Прибрати з улюблених' : 'В улюблені'}</Text>
              </Pressable>
              {isDmMode ? (
                <Pressable style={styles.cardActionButton} onPress={() => void togglePinnedSpell(selectedSpell.id)} android_ripple={{ color: colors.ripple }}>
                  <MaterialCommunityIcons name={pinnedSet.has(selectedSpell.id) ? 'pin' : 'pin-outline'} size={14} color={colors.text} />
                  <Text style={styles.cardActionText}>{pinnedSet.has(selectedSpell.id) ? 'Відкріпити' : 'Закріпити'}</Text>
                </Pressable>
              ) : null}
            </View>
            {isDmMode ? (
              <>
                <Text style={styles.modalLabel}>Нотатки DM</Text>
                <TextInput
                  value={noteDraft}
                  onChangeText={setNoteDraft}
                  placeholder='Приватна нотатка для цього закляття'
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.modalInput, styles.modalInputMultiline]}
                  multiline
                />
                <Pressable style={styles.headerAction} onPress={saveDmNote} android_ripple={{ color: colors.ripple }}>
                  <MaterialCommunityIcons name='content-save-outline' size={16} color={colors.onPrimary} />
                  <Text style={styles.headerActionText}>Зберегти нотатку</Text>
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
        title={editingSpell ? 'Редагування закляття' : 'Нове закляття'}
        subtitle={editingSpell && editingSpell.source !== 'custom' ? 'Збереження створить власну редаговану копію.' : 'Метадані власного закляття зберігаються локально.'}
      >
        <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps='handled'>
          <Text style={styles.modalLabel}>Назва</Text>
          <TextInput value={modalName} onChangeText={setModalName} placeholder='Назва закляття' placeholderTextColor={colors.textSecondary} style={styles.modalInput} />
          <Text style={styles.modalLabel}>Рівень (0-9)</Text>
          <TextInput value={modalLevel} onChangeText={setModalLevel} keyboardType='number-pad' placeholder='1' placeholderTextColor={colors.textSecondary} style={styles.modalInput} />
          <Text style={styles.modalLabel}>Школа</Text>
          <TextInput value={modalSchool} onChangeText={setModalSchool} placeholder='Втілення / Ілюзія / ...' placeholderTextColor={colors.textSecondary} style={styles.modalInput} />
          <Text style={styles.modalLabel}>Час касту</Text>
          <TextInput value={modalCastingTime} onChangeText={setModalCastingTime} placeholder='1 дія' placeholderTextColor={colors.textSecondary} style={styles.modalInput} />
          <Text style={styles.modalLabel}>Дистанція</Text>
          <TextInput value={modalRange} onChangeText={setModalRange} placeholder='150 футів' placeholderTextColor={colors.textSecondary} style={styles.modalInput} />
          <Text style={styles.modalLabel}>Компоненти</Text>
          <TextInput value={modalComponents} onChangeText={setModalComponents} placeholder='V, S, M (матеріальний компонент)' placeholderTextColor={colors.textSecondary} style={styles.modalInput} />
          <Text style={styles.modalLabel}>Тривалість</Text>
          <TextInput value={modalDuration} onChangeText={setModalDuration} placeholder='Миттєво' placeholderTextColor={colors.textSecondary} style={styles.modalInput} />
          <View style={styles.toggleRow}>
            <Pressable style={[styles.statusButton, modalRitual ? styles.statusButtonActive : null]} onPress={() => setModalRitual((value) => !value)} android_ripple={{ color: colors.ripple }}>
              <Text style={[styles.statusButtonText, modalRitual ? styles.statusButtonTextActive : null]}>Ритуал</Text>
            </Pressable>
            <Pressable style={[styles.statusButton, modalConcentration ? styles.statusButtonActive : null]} onPress={() => setModalConcentration((value) => !value)} android_ripple={{ color: colors.ripple }}>
              <Text style={[styles.statusButtonText, modalConcentration ? styles.statusButtonTextActive : null]}>Концентрація</Text>
            </Pressable>
          </View>
          <Text style={styles.modalLabel}>Опис</Text>
          <TextInput value={modalDescription} onChangeText={setModalDescription} placeholder='Ефект закляття' placeholderTextColor={colors.textSecondary} style={[styles.modalInput, styles.modalInputMultiline]} multiline />
          <Text style={styles.modalLabel}>На вищих рівнях</Text>
          <TextInput value={modalHigherLevels} onChangeText={setModalHigherLevels} placeholder='Як змінюється при касті вищим слотом' placeholderTextColor={colors.textSecondary} style={[styles.modalInput, styles.modalInputMultiline]} multiline />
          <Text style={styles.modalLabel}>Класи (через кому)</Text>
          <TextInput value={modalClasses} onChangeText={setModalClasses} placeholder='Wizard, Sorcerer' placeholderTextColor={colors.textSecondary} style={styles.modalInput} />
          <Text style={styles.modalLabel}>Теги (через кому)</Text>
          <TextInput value={modalTags} onChangeText={setModalTags} placeholder='урон, aoe, fire' placeholderTextColor={colors.textSecondary} style={styles.modalInput} />
          <Text style={styles.modalLabel}>Профілі урону (по одному в рядку)</Text>
          <TextInput
            value={modalDamageProfiles}
            onChangeText={setModalDamageProfiles}
            placeholder='Базово | 8d6 | fire | DEX save, половина'
            placeholderTextColor={colors.textSecondary}
            style={[styles.modalInput, styles.modalInputLarge]}
            multiline
          />
          <Text style={styles.modalHint}>Формат рядка: Назва | Формула | Тип | Умова(опційно)</Text>
          <Text style={styles.modalHint}>Типи урону 5e: {SPELL_DAMAGE_TYPES.join(', ')}</Text>
        </ScrollView>
      </Modal>
    </View>
  );
};

export default Spellbook;
