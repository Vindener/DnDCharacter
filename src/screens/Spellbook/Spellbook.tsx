import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useThemeStore from '@/context/Theme-store';
import useCharacterStore from '@/context/Character-store';
import useSpellbookStore from '@/context/Spellbook-store';
import { applySpellStatus, collectCharacterSpellNames, getCharacterSpellStatus, normalizeSpellName } from '@/shared/helpers/spellbook';
import { Modal } from '@/shared/components/Modal/Modal';
import type { CharacterSpellStatus, Dnd5DamageType, SpellDamageProfile, SpellbookSpell } from '@/types/Spellbook';
import { getStyles } from './styles';

type StatusFilter = 'all' | CharacterSpellStatus;
type SourceFilter = 'all' | 'system' | 'custom' | 'imported';
type LevelFilter = 'all' | number;

const STATUS_FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: 'all', label: 'Всі стани' },
  { id: 'available', label: 'Доступні' },
  { id: 'known', label: 'Відомі' },
  { id: 'prepared', label: 'Підготовлені' },
  { id: 'cantrip', label: 'Каніпси' },
];

const SOURCE_FILTERS: Array<{ id: SourceFilter; label: string }> = [
  { id: 'all', label: 'Всі джерела' },
  { id: 'system', label: 'Системні' },
  { id: 'custom', label: 'Власні' },
  { id: 'imported', label: 'Імпортовані' },
];

const LEVEL_FILTERS: Array<{ id: LevelFilter; label: string }> = [
  { id: 'all', label: 'Будь-який рівень' },
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

const SPELL_STATUS_LABEL: Record<CharacterSpellStatus, string> = {
  available: 'Доступне',
  known: 'Відоме',
  prepared: 'Підготовлене',
  cantrip: 'Каніпс',
};

const DAMAGE_TYPES: Dnd5DamageType[] = [
  'acid',
  'bludgeoning',
  'cold',
  'fire',
  'force',
  'lightning',
  'necrotic',
  'piercing',
  'poison',
  'psychic',
  'radiant',
  'slashing',
  'thunder',
];

function clampLevel(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(0, Math.min(9, Math.floor(parsed)));
}

function sourceLabel(source: SpellbookSpell['source']): string {
  if (source === 'custom') return 'власне';
  if (source === 'imported') return 'імпортоване';
  return 'системне';
}

function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
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

function parseDamageProfiles(value: string): Array<Omit<SpellDamageProfile, 'id'>> {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [labelRaw, formulaRaw, damageTypeRaw, conditionRaw] = line.split('|').map((part) => part.trim());
      const label = labelRaw || 'Шкода';
      const formula = formulaRaw || '1d6';
      const normalizedDamageType = DAMAGE_TYPES.includes((damageTypeRaw || '').toLowerCase() as Dnd5DamageType)
        ? ((damageTypeRaw || '').toLowerCase() as Dnd5DamageType)
        : 'force';
      return {
        label,
        formula,
        damageType: normalizedDamageType,
        condition: conditionRaw || undefined,
      };
    });
}

const Spellbook = () => {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const characters = useCharacterStore((s) => s.characters);
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId);
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);

  const spells = useSpellbookStore((s) => s.spells);
  const favoriteSpellIds = useSpellbookStore((s) => s.favoriteSpellIds);
  const isLoaded = useSpellbookStore((s) => s.isLoaded);
  const loadSpellbook = useSpellbookStore((s) => s.loadSpellbook);
  const upsertCustomSpell = useSpellbookStore((s) => s.upsertCustomSpell);
  const removeCustomSpell = useSpellbookStore((s) => s.removeCustomSpell);
  const toggleFavorite = useSpellbookStore((s) => s.toggleFavorite);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');

  const [isSpellModalVisible, setIsSpellModalVisible] = useState(false);
  const [editingSpell, setEditingSpell] = useState<SpellbookSpell | null>(null);
  const [modalName, setModalName] = useState('');
  const [modalLevel, setModalLevel] = useState('1');
  const [modalSchool, setModalSchool] = useState('Власне');
  const [modalDescription, setModalDescription] = useState('');
  const [modalTags, setModalTags] = useState('');
  const [modalDamageProfiles, setModalDamageProfiles] = useState('');

  useEffect(() => {
    loadSpellbook().catch(() => {});
  }, [loadSpellbook]);

  useEffect(() => {
    if (!characters.length) {
      setSelectedCharacterId('');
      return;
    }

    const hasCurrent = currentCharacterId && characters.some((character) => character.id === currentCharacterId);
    const hasSelected = selectedCharacterId && characters.some((character) => character.id === selectedCharacterId);

    if (hasSelected) return;
    if (hasCurrent) {
      setSelectedCharacterId(currentCharacterId || '');
      return;
    }
    setSelectedCharacterId(characters[0].id);
  }, [characters, currentCharacterId, selectedCharacterId]);

  const selectedCharacter = useMemo(
    () => characters.find((character) => character.id === selectedCharacterId) || null,
    [characters, selectedCharacterId],
  );

  const favoriteSet = useMemo(() => new Set(favoriteSpellIds), [favoriteSpellIds]);

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
        byName.set(key, {
          id: `spell-imported-${key.replace(/\s+/g, '-')}`,
          name,
          level: 1,
          school: 'З листа персонажа',
          description: '',
          tags: ['imported'],
          damageProfiles: [],
          source: 'imported',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });
    });

    return Array.from(byName.values()).sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return a.name.localeCompare(b.name, 'uk');
    });
  }, [characters, spells]);

  const filteredSpells = useMemo(() => {
    const filter = search.trim().toLowerCase();

    return spellbookWithCharacterImports.filter((spell) => {
      if (onlyFavorites && !favoriteSet.has(spell.id)) return false;
      if (sourceFilter !== 'all' && spell.source !== sourceFilter) return false;
      if (levelFilter !== 'all' && spell.level !== levelFilter) return false;

      const characterStatus = getCharacterSpellStatus(selectedCharacter, spell.name);
      if (statusFilter !== 'all' && characterStatus !== statusFilter) return false;

      if (!filter) return true;
      const damageText = (spell.damageProfiles || [])
        .map((profile) => `${profile.label} ${profile.formula} ${profile.damageType} ${profile.condition || ''}`)
        .join(' ');
      const haystack = `${spell.name} ${spell.school} ${spell.description} ${(spell.tags || []).join(' ')} ${damageText}`.toLowerCase();
      return haystack.includes(filter);
    });
  }, [favoriteSet, levelFilter, onlyFavorites, search, selectedCharacter, sourceFilter, spellbookWithCharacterImports, statusFilter]);

  const assignSpellStatus = (spellName: string, status: CharacterSpellStatus) => {
    if (!selectedCharacter) return;
    const updated = applySpellStatus(selectedCharacter, spellName, status);
    void updateCharacter(selectedCharacter.id, updated);
  };

  const openCreateSpellModal = () => {
    setEditingSpell(null);
    setModalName('');
    setModalLevel('1');
    setModalSchool('Власне');
    setModalDescription('');
    setModalTags('custom');
    setModalDamageProfiles('');
    setIsSpellModalVisible(true);
  };

  const openEditSpellModal = (spell: SpellbookSpell) => {
    setEditingSpell(spell);
    setModalName(spell.name);
    setModalLevel(String(spell.level));
    setModalSchool(spell.school || 'Власне');
    setModalDescription(spell.description || '');
    setModalTags((spell.tags || []).join(', '));
    setModalDamageProfiles(damageProfilesToText(spell.damageProfiles || []));
    setIsSpellModalVisible(true);
  };

  const submitSpellModal = async () => {
    const name = modalName.trim();
    if (!name) return;

    const level = clampLevel(modalLevel);
    const saved = await upsertCustomSpell({
      spellId: editingSpell?.id,
      name,
      level,
      school: modalSchool.trim() || 'Власне',
      description: modalDescription.trim(),
      tags: parseTags(modalTags),
      damageProfiles: parseDamageProfiles(modalDamageProfiles),
    });

    if (saved && selectedCharacter) {
      const nextStatus: CharacterSpellStatus = level === 0 ? 'cantrip' : 'known';
      const updated = applySpellStatus(selectedCharacter, saved.name, nextStatus);
      void updateCharacter(selectedCharacter.id, updated);
    }

    setIsSpellModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerMeta}>
          <Text style={styles.title}>Книга заклять</Text>
          <Text style={styles.hint}>Локальна система заклять: пошук, фільтри, улюблені, статуси персонажа і детальний урон.</Text>
        </View>
        <Pressable style={styles.headerAction} onPress={openCreateSpellModal} android_ripple={{ color: '#999' }}>
          <MaterialCommunityIcons name='plus' size={16} color='#fff' />
          <Text style={styles.headerActionText}>Додати</Text>
        </Pressable>
      </View>

      <View style={styles.offlineBanner}>
        <MaterialCommunityIcons name='cloud-off-outline' size={16} color='#f8fafc' />
        <Text style={styles.offlineBannerText}>Поки працює тільки в офлайн режимі. Синхронізація буде додана пізніше.</Text>
      </View>


      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder='Пошук за назвою, школою, тегом...'
        placeholderTextColor={colors.textSecondary}
        style={styles.search}
      />

      <View style={styles.filtersBlock}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          <Pressable
            style={[styles.chip, onlyFavorites ? styles.chipActive : null]}
            onPress={() => setOnlyFavorites((prev) => !prev)}
            android_ripple={{ color: '#999' }}
          >
            <MaterialCommunityIcons name={onlyFavorites ? 'star' : 'star-outline'} size={14} color={onlyFavorites ? '#fff' : colors.text} />
            <Text style={[styles.chipText, onlyFavorites ? styles.chipTextActive : null]}>Улюблені</Text>
          </Pressable>
          {STATUS_FILTERS.map((item) => (
            <Pressable
              key={`status-${item.id}`}
              style={[styles.chip, statusFilter === item.id ? styles.chipActive : null]}
              onPress={() => setStatusFilter(item.id)}
              android_ripple={{ color: '#999' }}
            >
              <Text style={[styles.chipText, statusFilter === item.id ? styles.chipTextActive : null]}>{item.label}</Text>
            </Pressable>
          ))}
          {LEVEL_FILTERS.map((item) => (
            <Pressable
              key={`level-${String(item.id)}`}
              style={[styles.chip, levelFilter === item.id ? styles.chipActive : null]}
              onPress={() => setLevelFilter(item.id)}
              android_ripple={{ color: '#999' }}
            >
              <Text style={[styles.chipText, levelFilter === item.id ? styles.chipTextActive : null]}>{item.label}</Text>
            </Pressable>
          ))}
          {SOURCE_FILTERS.map((item) => (
            <Pressable
              key={`source-${item.id}`}
              style={[styles.chip, sourceFilter === item.id ? styles.chipActive : null]}
              onPress={() => setSourceFilter(item.id)}
              android_ripple={{ color: '#999' }}
            >
              <Text style={[styles.chipText, sourceFilter === item.id ? styles.chipTextActive : null]}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.characterPickerBlock}>
        <Text style={styles.sectionLabel}>Прив’язка до персонажа</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          <Pressable
            style={[styles.chip, !selectedCharacter ? styles.chipActive : null]}
            onPress={() => setSelectedCharacterId('')}
            android_ripple={{ color: '#999' }}
          >
            <Text style={[styles.chipText, !selectedCharacter ? styles.chipTextActive : null]}>Без прив’язки</Text>
          </Pressable>
          {characters.map((character) => (
            <Pressable
              key={`char-${character.id}`}
              style={[styles.chip, selectedCharacter?.id === character.id ? styles.chipActive : null]}
              onPress={() => setSelectedCharacterId(character.id)}
              android_ripple={{ color: '#999' }}
            >
              <Text style={[styles.chipText, selectedCharacter?.id === character.id ? styles.chipTextActive : null]}>
                {character.name || 'Персонаж'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {!isLoaded ? <Text style={styles.empty}>Завантаження книги заклять...</Text> : null}

      <FlatList
        data={filteredSpells}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const status = getCharacterSpellStatus(selectedCharacter, item.name);
          const isFavorite = favoriteSet.has(item.id);
          const canFavorite = item.source !== 'imported';

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderMain}>
                  <Text style={styles.spellName}>{item.name}</Text>
                  <Text style={styles.meta}>
                    {item.level === 0 ? 'Каніпс' : `Рівень ${item.level}`} • {item.school} • {sourceLabel(item.source)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    if (!canFavorite) return;
                    void toggleFavorite(item.id);
                  }}
                  android_ripple={{ color: '#999' }}
                  style={styles.favoriteButton}
                  disabled={!canFavorite}
                >
                  <MaterialCommunityIcons
                    name={isFavorite ? 'star' : 'star-outline'}
                    size={20}
                    color={isFavorite ? '#fbbf24' : canFavorite ? colors.textSecondary : '#666'}
                  />
                </Pressable>
              </View>

              {item.description ? <Text style={styles.description}>{item.description}</Text> : null}

              {!!item.damageProfiles.length && (
                <View style={styles.damageBlock}>
                  {item.damageProfiles.map((damage) => (
                    <Text key={damage.id} style={styles.damageLine}>
                      {damage.label}: {damage.formula} {damage.damageType}
                      {damage.condition ? ` (${damage.condition})` : ''}
                    </Text>
                  ))}
                </View>
              )}

              <View style={styles.statusLine}>
                <Text style={styles.statusText}>Статус: {SPELL_STATUS_LABEL[status]}</Text>
              </View>

              {selectedCharacter ? (
                <View style={styles.statusButtonsRow}>
                  <Pressable
                    style={[styles.statusButton, status === 'available' ? styles.statusButtonActive : null]}
                    onPress={() => assignSpellStatus(item.name, 'available')}
                    android_ripple={{ color: '#999' }}
                  >
                    <Text style={[styles.statusButtonText, status === 'available' ? styles.statusButtonTextActive : null]}>Доступне</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.statusButton, status === 'known' ? styles.statusButtonActive : null]}
                    onPress={() => assignSpellStatus(item.name, 'known')}
                    android_ripple={{ color: '#999' }}
                  >
                    <Text style={[styles.statusButtonText, status === 'known' ? styles.statusButtonTextActive : null]}>Відоме</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.statusButton, status === 'prepared' ? styles.statusButtonActive : null]}
                    onPress={() => assignSpellStatus(item.name, 'prepared')}
                    android_ripple={{ color: '#999' }}
                  >
                    <Text style={[styles.statusButtonText, status === 'prepared' ? styles.statusButtonTextActive : null]}>Підготовлене</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.statusButton, status === 'cantrip' ? styles.statusButtonActive : null]}
                    onPress={() => assignSpellStatus(item.name, 'cantrip')}
                    android_ripple={{ color: '#999' }}
                  >
                    <Text style={[styles.statusButtonText, status === 'cantrip' ? styles.statusButtonTextActive : null]}>Каніпс</Text>
                  </Pressable>
                </View>
              ) : (
                <Text style={styles.metaMuted}>Обери персонажа, щоб керувати станами заклять.</Text>
              )}

              <View style={styles.cardActionRow}>
                <Pressable style={styles.cardActionButton} onPress={() => openEditSpellModal(item)} android_ripple={{ color: '#999' }}>
                  <MaterialCommunityIcons name='pencil-outline' size={14} color={colors.text} />
                  <Text style={styles.cardActionText}>{item.source === 'custom' ? 'Редагувати' : 'Створити свою копію'}</Text>
                </Pressable>
                {item.source === 'custom' && (
                  <Pressable style={styles.deleteCustomButton} onPress={() => void removeCustomSpell(item.id)} android_ripple={{ color: '#999' }}>
                    <Text style={styles.deleteCustomButtonText}>Видалити</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>Нічого не знайдено. Зміни фільтри або додай закляття.</Text>}
      />

      <Modal
        isVisible={isSpellModalVisible}
        onClose={() => setIsSpellModalVisible(false)}
        onSubmit={() => void submitSpellModal()}
        title={editingSpell ? 'Редагування закляття' : 'Нове закляття'}
        subtitle={
          editingSpell && editingSpell.source !== 'custom'
            ? 'Збереження створить свою копію для редагування.'
            : 'Підтримує опис, теги і кілька профілів урону.'
        }
      >
        <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
          <Text style={styles.modalLabel}>Назва</Text>
          <TextInput
            value={modalName}
            onChangeText={setModalName}
            placeholder='Назва закляття'
            placeholderTextColor={colors.textSecondary}
            style={styles.modalInput}
          />

          <Text style={styles.modalLabel}>Рівень (0-9)</Text>
          <TextInput
            value={modalLevel}
            onChangeText={setModalLevel}
            keyboardType='number-pad'
            placeholder='1'
            placeholderTextColor={colors.textSecondary}
            style={styles.modalInput}
          />

          <Text style={styles.modalLabel}>Школа</Text>
          <TextInput
            value={modalSchool}
            onChangeText={setModalSchool}
            placeholder='Втілення / Ілюзія / ...'
            placeholderTextColor={colors.textSecondary}
            style={styles.modalInput}
          />

          <Text style={styles.modalLabel}>Опис</Text>
          <TextInput
            value={modalDescription}
            onChangeText={setModalDescription}
            placeholder='Короткий опис ефекту'
            placeholderTextColor={colors.textSecondary}
            style={[styles.modalInput, styles.modalInputMultiline]}
            multiline
          />

          <Text style={styles.modalLabel}>Теги (через кому)</Text>
          <TextInput
            value={modalTags}
            onChangeText={setModalTags}
            placeholder='урон, контроль, утиліта'
            placeholderTextColor={colors.textSecondary}
            style={styles.modalInput}
          />

          <Text style={styles.modalLabel}>Профілі урону (по одному в рядку)</Text>
          <TextInput
            value={modalDamageProfiles}
            onChangeText={setModalDamageProfiles}
            placeholder='Основний | 8d6 | fire | на провал\nПоловина | 4d6 | fire | на успіх'
            placeholderTextColor={colors.textSecondary}
            style={[styles.modalInput, styles.modalInputLarge]}
            multiline
          />
          <Text style={styles.modalHint}>Формат рядка: Назва | Формула | Тип | Умова(опційно)</Text>
          <Text style={styles.modalHint}>Типи 5e: {DAMAGE_TYPES.join(', ')}</Text>
        </ScrollView>
      </Modal>
    </View>
  );
};

export default Spellbook;


