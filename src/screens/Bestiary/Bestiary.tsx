import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import useMonsterStore from '@/context/Monster-store';
import { MonsterCard } from '@/shared/components/MonsterCard/MonsterCard';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from './style';
import FileService from '@/shared/services/fileSerice';
import type { MonsterDto } from '@/types/Monster';
import { SkeletonBestiary } from '@/shared/ui/skeleton';
import type { ReferencesStackParamList } from '@/navigation/ReferencesNavigator';
import {
  collectUnique,
  DEFAULT_BESTIARY_FILTERS,
  filterMonsters,
  getActiveBestiaryFilterCount,
  type BestiaryFilters,
  type CRFilter,
} from './bestiaryFilters';

type ViewMode = 'full' | 'quick';
type ListMonster = MonsterDto & { section?: 'pinned' | 'all' };

const CR_FILTERS: Array<{ id: CRFilter; label: string }> = [
  { id: 'all', label: 'Скл.' },
  { id: '0-1', label: '0-1' },
  { id: '2-4', label: '2-4' },
  { id: '5-10', label: '5-10' },
  { id: '11+', label: '11+' },
];

const createMonsterSeed = (monster: MonsterDto) => ({
  monsterId: monster.id,
  name: monster.name || 'Монстр',
  challenge: monster.challenge || '0',
  count: 1,
  hitPoints: monster.hitPoints,
});

const createDuplicateMonster = (monster: MonsterDto): MonsterDto => ({
  ...monster,
  id: `${monster.id}-copy-${Date.now()}`,
  name: `${monster.name || 'Монстр'} Копія`,
  source: monster.source || 'Власне',
  isCustom: true,
});

const createBlankMonster = (): MonsterDto => ({
  id: `monster-${Date.now()}`,
  name: 'Монстр',
  size: 'Середній',
  type: 'Невідомий тип',
  challenge: '0',
  armorClass: 10,
  hitPoints: 1,
  speed: '30 фт.',
  source: 'Власне',
  tags: [],
  isCustom: true,
  stats: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
});

const Bestiary = () => {
  const navigation = useNavigation<StackNavigationProp<ReferencesStackParamList, 'List'>>();
  const monsters = useMonsterStore((s) => s.monsters);
  const pinnedMonsterIds = useMonsterStore((s) => s.pinnedMonsterIds);
  const favoriteMonsterIds = useMonsterStore((s) => s.favoriteMonsterIds);
  const isLoaded = useMonsterStore((s) => s.isLoaded);
  const loadError = useMonsterStore((s) => s.loadError);
  const addMonster = useMonsterStore((s) => s.addMonster);
  const togglePinnedMonster = useMonsterStore((s) => s.togglePinnedMonster);
  const toggleFavoriteMonster = useMonsterStore((s) => s.toggleFavoriteMonster);
  const clearPinnedMonsters = useMonsterStore((s) => s.clearPinnedMonsters);
  const loadMonsters = useMonsterStore((s) => s.loadMonsters);
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [filters, setFilters] = useState<BestiaryFilters>(DEFAULT_BESTIARY_FILTERS);
  const [viewMode, setViewMode] = useState<ViewMode>('full');

  useEffect(() => {
    void loadMonsters();
  }, [loadMonsters]);

  const typeOptions = useMemo(() => collectUnique(monsters.map((monster) => monster.type || '')), [monsters]);
  const environmentOptions = useMemo(() => collectUnique(monsters.map((monster) => monster.environment || '')), [monsters]);
  const sizeOptions = useMemo(() => collectUnique(monsters.map((monster) => monster.size || '')), [monsters]);
  const sourceOptions = useMemo(() => collectUnique(monsters.map((monster) => monster.source || '')), [monsters]);
  const favoriteSet = useMemo(() => new Set(favoriteMonsterIds), [favoriteMonsterIds]);
  const pinnedSet = useMemo(() => new Set(pinnedMonsterIds), [pinnedMonsterIds]);

  const filtered = useMemo(() => filterMonsters(monsters, filters, favoriteMonsterIds), [favoriteMonsterIds, filters, monsters]);
  const pinnedMonsters = useMemo(() => monsters.filter((monster) => pinnedSet.has(monster.id)), [monsters, pinnedSet]);
  const activeFilterCount = getActiveBestiaryFilterCount(filters);

  const listData = useMemo<ListMonster[]>(() => {
    if (viewMode === 'quick') {
      const quickList = pinnedMonsters.length ? pinnedMonsters : filtered;
      return quickList.map((monster) => ({ ...monster, section: pinnedSet.has(monster.id) ? 'pinned' : 'all' }));
    }
    return filtered.map((monster) => ({ ...monster, section: pinnedSet.has(monster.id) ? 'pinned' : 'all' }));
  }, [filtered, pinnedMonsters, pinnedSet, viewMode]);

  const patchFilters = (patch: Partial<BestiaryFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const clearFilters = () => {
    setFilters(DEFAULT_BESTIARY_FILTERS);
  };

  const addToEncounter = (monster: MonsterDto) => {
    navigation.getParent()?.dispatch(
      CommonActions.navigate({
        name: 'DM',
        params: {
          screen: 'DMEncounterPrep',
          params: {
            initialMonster: createMonsterSeed(monster),
          },
        },
      }),
    );
  };

  const duplicateMonster = (monster: MonsterDto) => {
    void addMonster(createDuplicateMonster(monster));
  };

  const renderChoiceChip = (label: string, active: boolean, onPress: () => void, testID?: string, chipKey = `${label}-${testID || ''}`) => (
    <Pressable
      key={chipKey}
      style={[styles.chip, active ? styles.chipActive : null]}
      onPress={onPress}
      android_ripple={{ color: colors.ripple }}
      testID={testID}
    >
      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{label}</Text>
    </Pressable>
  );

  const renderHeader = () => (
    <View>
      <View style={styles.headerRow}>
        <View style={styles.headerMeta}>
          <Text style={styles.sectionTitle}>Бестіарій</Text>
          <Text style={styles.sectionHint}>Бойовий довідник майстра: пошук, закріплення, улюблені й підготовка сутички.</Text>
        </View>
        <Pressable
          style={styles.headerAction}
          onPress={() => void addMonster(createBlankMonster())}
          android_ripple={{ color: colors.ripple }}
          testID='bestiary.addCustomButton'
        >
          <Text style={styles.headerActionText}>Додати</Text>
        </Pressable>
      </View>

      <View style={styles.modeRow}>
        {renderChoiceChip('Бестіарій', viewMode === 'full', () => setViewMode('full'), 'bestiary.mode.full')}
        {renderChoiceChip('Швидкий огляд майстра', viewMode === 'quick', () => setViewMode('quick'), 'bestiary.mode.quick')}
      </View>

      <TextInput
        placeholder='Пошук монстра...'
        placeholderTextColor={colors.textSecondary}
        style={styles.search}
        value={filters.search}
        onChangeText={(search) => patchFilters({ search })}
        testID='bestiary.searchInput'
      />

      <View style={styles.filtersBlock}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {CR_FILTERS.map((item) =>
            renderChoiceChip(
              item.label,
              filters.cr === item.id && item.id !== 'all',
              () => patchFilters({ cr: item.id }),
              `bestiary.filter.cr.${item.id}`,
              `cr-${item.id}`,
            ),
          )}
          {renderChoiceChip('Улюблені', filters.favoritesOnly, () => patchFilters({ favoritesOnly: !filters.favoritesOnly }), 'bestiary.filter.favorites', 'favorites')}
          {renderChoiceChip(filters.type === 'all' ? 'Тип' : filters.type, filters.type !== 'all', () => patchFilters({ type: 'all' }), undefined, 'type-all')}
          {typeOptions.map((option) =>
            renderChoiceChip(option, filters.type === option, () => patchFilters({ type: option }), `bestiary.filter.type.${option}`, `type-${option}`),
          )}
          {renderChoiceChip(filters.environment === 'all' ? 'Середовище' : filters.environment, filters.environment !== 'all', () => patchFilters({ environment: 'all' }), undefined, 'environment-all')}
          {environmentOptions.map((option) =>
            renderChoiceChip(option, filters.environment === option, () => patchFilters({ environment: option }), undefined, `environment-${option}`),
          )}
          {renderChoiceChip(filters.size === 'all' ? 'Розмір' : filters.size, filters.size !== 'all', () => patchFilters({ size: 'all' }), undefined, 'size-all')}
          {sizeOptions.map((option) => renderChoiceChip(option, filters.size === option, () => patchFilters({ size: option }), undefined, `size-${option}`))}
          {renderChoiceChip(filters.source === 'all' ? 'Джерело' : filters.source, filters.source !== 'all', () => patchFilters({ source: 'all' }), undefined, 'source-all')}
          {sourceOptions.map((option) => renderChoiceChip(option, filters.source === option, () => patchFilters({ source: option }), undefined, `source-${option}`))}
        </ScrollView>
        {activeFilterCount ? (
          <View style={styles.activeFiltersRow}>
            <Text style={styles.activeFiltersText}>Активні фільтри: {activeFilterCount}</Text>
            <Pressable style={styles.clearButton} onPress={clearFilters} android_ripple={{ color: colors.ripple }} testID='bestiary.clearFiltersButton'>
              <Text style={styles.clearButtonText}>Скинути</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.pinnedRow}>
          <Text style={styles.sectionTitle}>Закріплені монстри ({pinnedMonsters.length})</Text>
          {!!pinnedMonsters.length && (
            <Pressable style={styles.clearPinsButton} onPress={() => void clearPinnedMonsters()} android_ripple={{ color: colors.ripple }}>
              <Text style={styles.clearPinsText}>Очистити</Text>
            </Pressable>
          )}
        </View>
        {!pinnedMonsters.length ? (
          <Text style={styles.sectionHint}>Закріплюйте монстрів для наступної сутички. Швидкий огляд показує їх першими.</Text>
        ) : (
          <Text style={styles.sectionHint}>Закріплені монстри готові до підготовки сутички й показуються першими у швидкому огляді майстра.</Text>
        )}
      </View>

      {viewMode === 'quick' ? (
        <View style={styles.quickBanner} testID='bestiary.quickViewBanner'>
          <Text style={styles.quickBannerTitle}>Швидкий огляд майстра</Text>
          <Text style={styles.sectionHint}>Компактні блоки: КД, ХП, бонус атаки, урон, риси й дії.</Text>
        </View>
      ) : null}

      {!monsters.length ? (
        <View style={styles.emptyPanel} testID='bestiary.emptyState'>
          <Text style={styles.emptyText}>Бестіарій порожній. Додайте власного монстра або імпортуйте JSON.</Text>
        </View>
      ) : null}
    </View>
  );

  if (loadError) {
    return (
      <View style={styles.container}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Помилка завантаження</Text>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      </View>
    );
  }

  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <SkeletonBestiary />
      </View>
    );
  }

  return (
    <View style={styles.container} testID='bestiary.screen'>
      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          monsters.length ? (
            <View style={styles.emptyPanel} testID='bestiary.noResultsState'>
              <Text style={styles.emptyText}>Немає монстрів за поточним пошуком або фільтрами.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <MonsterCard
            monster={item}
            isPinned={pinnedSet.has(item.id)}
            isFavorite={favoriteSet.has(item.id)}
            cardTestID='bestiary.monsterCard'
            onTogglePin={(monsterId) => void togglePinnedMonster(monsterId)}
            onToggleFavorite={(monsterId) => void toggleFavoriteMonster(monsterId)}
            onAddToEncounter={addToEncounter}
            onDuplicate={duplicateMonster}
          />
        )}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps='handled'
      />

      <View style={styles.buttonContainer}>
        <Pressable
          onPress={async () => {
            const monster = await FileService.importMonsterFromFile();
            if (monster) await addMonster(monster);
          }}
          style={styles.utilityButton}
          android_ripple={{ color: colors.ripple }}
        >
          <Text style={styles.utilityButtonText}>Імпортувати монстра</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default Bestiary;
