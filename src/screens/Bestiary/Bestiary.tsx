import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import useMonsterStore from '@/context/Monster-store';
import { MonsterCard } from '@/shared/components/MonsterCard/MonsterCard';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from './style';
import FileService from '@/shared/services/fileSerice';
import type { MonsterDto } from '@/types/Monster';

type CRFilter = 'all' | '0-1' | '2-4' | '5-10' | '11+';

const parseChallengeToNumber = (challenge?: string): number => {
  if (!challenge) return 0;
  const normalized = challenge.trim().split(' ')[0];
  if (normalized.includes('/')) {
    const [a, b] = normalized.split('/');
    const numerator = Number(a);
    const denominator = Number(b);
    if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0) return numerator / denominator;
    return 0;
  }
  const direct = Number(normalized.replace(',', '.'));
  return Number.isFinite(direct) ? direct : 0;
};

const passCRFilter = (monster: MonsterDto, filter: CRFilter): boolean => {
  if (filter === 'all') return true;
  const cr = parseChallengeToNumber(monster.challenge);
  if (filter === '0-1') return cr <= 1;
  if (filter === '2-4') return cr >= 2 && cr <= 4;
  if (filter === '5-10') return cr >= 5 && cr <= 10;
  return cr >= 11;
};

const collectUnique = (list: string[]): string[] => Array.from(new Set(list.filter(Boolean))).sort((a, b) => a.localeCompare(b));

const Bestiary = () => {
  const monsters = useMonsterStore((s) => s.monsters);
  const pinnedMonsterIds = useMonsterStore((s) => s.pinnedMonsterIds);
  const addMonster = useMonsterStore((s) => s.addMonster);
  const togglePinnedMonster = useMonsterStore((s) => s.togglePinnedMonster);
  const clearPinnedMonsters = useMonsterStore((s) => s.clearPinnedMonsters);
  const loadMonsters = useMonsterStore((s) => s.loadMonsters);
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [search, setSearch] = useState('');
  const [crFilter, setCrFilter] = useState<CRFilter>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [environmentFilter, setEnvironmentFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    loadMonsters();
  }, [loadMonsters]);

  const typeOptions = useMemo(() => collectUnique(monsters.map((monster) => monster.type || '')), [monsters]);
  const environmentOptions = useMemo(() => collectUnique(monsters.map((monster) => monster.environment || '')), [monsters]);
  const sourceOptions = useMemo(() => collectUnique(monsters.map((monster) => monster.source || '')), [monsters]);
  const tagOptions = useMemo(() => collectUnique(monsters.flatMap((monster) => monster.tags || [])), [monsters]);

  const filtered = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return monsters.filter((monster) => {
      const bySearch =
        !searchText ||
        (monster.name || '').toLowerCase().includes(searchText) ||
        (monster.type || '').toLowerCase().includes(searchText) ||
        (monster.environment || '').toLowerCase().includes(searchText) ||
        (monster.source || '').toLowerCase().includes(searchText) ||
        (monster.tags || []).some((tag) => tag.toLowerCase().includes(searchText));

      const byCR = passCRFilter(monster, crFilter);
      const byType = typeFilter === 'all' || (monster.type || '').toLowerCase() === typeFilter.toLowerCase();
      const byEnvironment =
        environmentFilter === 'all' || (monster.environment || '').toLowerCase() === environmentFilter.toLowerCase();
      const bySource = sourceFilter === 'all' || (monster.source || '').toLowerCase() === sourceFilter.toLowerCase();
      const byTags = selectedTags.every((selectedTag) => (monster.tags || []).includes(selectedTag));

      return bySearch && byCR && byType && byEnvironment && bySource && byTags;
    });
  }, [monsters, search, crFilter, typeFilter, environmentFilter, sourceFilter, selectedTags]);

  const pinnedMonsters = useMemo(
    () => monsters.filter((monster) => pinnedMonsterIds.includes(monster.id)),
    [monsters, pinnedMonsterIds],
  );

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]));
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Швидкий огляд DM</Text>
        <Text style={styles.sectionHint}>Фільтри для швидкого пошуку монстрів у сесії та список закріплень для сутички.</Text>
        <TextInput
          placeholder='Пошук монстрів'
          placeholderTextColor={colors.textSecondary}
          style={styles.search}
          value={search}
          onChangeText={setSearch}
        />

        <View style={styles.laneRow}>
          <View style={styles.laneCell}>
            <Text style={styles.sectionHint}>CR</Text>
            <Picker selectedValue={crFilter} onValueChange={(value: CRFilter) => setCrFilter(value)} style={styles.picker}>
              <Picker.Item label='Усі' value='all' />
              <Picker.Item label='CR 0-1' value='0-1' />
              <Picker.Item label='CR 2-4' value='2-4' />
              <Picker.Item label='CR 5-10' value='5-10' />
              <Picker.Item label='CR 11+' value='11+' />
            </Picker>
          </View>
          <View style={styles.laneCell}>
            <Text style={styles.sectionHint}>Тип</Text>
            <Picker selectedValue={typeFilter} onValueChange={(value: string) => setTypeFilter(value)} style={styles.picker}>
              <Picker.Item label='Усі' value='all' />
              {typeOptions.map((option) => (
                <Picker.Item key={option} label={option} value={option} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.laneRow}>
          <View style={styles.laneCell}>
            <Text style={styles.sectionHint}>Середовище</Text>
            <Picker selectedValue={environmentFilter} onValueChange={(value: string) => setEnvironmentFilter(value)} style={styles.picker}>
              <Picker.Item label='Усі' value='all' />
              {environmentOptions.map((option) => (
                <Picker.Item key={option} label={option} value={option} />
              ))}
            </Picker>
          </View>
          <View style={styles.laneCell}>
            <Text style={styles.sectionHint}>Джерело</Text>
            <Picker selectedValue={sourceFilter} onValueChange={(value: string) => setSourceFilter(value)} style={styles.picker}>
              <Picker.Item label='Усі' value='all' />
              {sourceOptions.map((option) => (
                <Picker.Item key={option} label={option} value={option} />
              ))}
            </Picker>
          </View>
        </View>

        {!!tagOptions.length && (
          <View>
            <Text style={styles.sectionHint}>Теги</Text>
            <View style={styles.tagsWrap}>
              {tagOptions.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    style={[styles.tagChip, active ? styles.tagChipActive : null]}
                    onPress={() => toggleTag(tag)}
                    android_ripple={{ color: '#999' }}
                  >
                    <Text style={[styles.tagChipText, active ? styles.tagChipTextActive : null]}>{tag}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.pinnedRow}>
          <Text style={styles.sectionTitle}>Закріплені для сутички ({pinnedMonsters.length})</Text>
          {!!pinnedMonsters.length && (
            <Pressable style={styles.clearPinsButton} onPress={() => clearPinnedMonsters()} android_ripple={{ color: '#999' }}>
              <Text style={styles.clearPinsText}>Очистити</Text>
            </Pressable>
          )}
        </View>

        {!pinnedMonsters.length ? (
          <Text style={styles.sectionHint}>Позначайте монстрів як «Закріпити» зі списку нижче для швидкого формування сутички.</Text>
        ) : (
          pinnedMonsters.map((monster) => (
            <MonsterCard
              key={`pin-${monster.id}`}
              monster={monster}
              isPinned={true}
              onTogglePin={(monsterId) => {
                void togglePinnedMonster(monsterId);
              }}
            />
          ))
        )}
      </View>

      {!filtered.length ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Немає монстрів за поточними фільтрами.</Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MonsterCard
              monster={item}
              isPinned={pinnedMonsterIds.includes(item.id)}
              onTogglePin={(monsterId) => {
                void togglePinnedMonster(monsterId);
              }}
            />
          )}
          contentContainerStyle={{ paddingBottom: 10 }}
        />
      )}

      <View style={styles.buttonContainer}>
        <Pressable
          onPress={async () => {
            const monster = await FileService.importMonsterFromFile();
            if (monster) await addMonster(monster);
          }}
          style={styles.utilityButton}
          android_ripple={{ color: '#999' }}
        >
          <Text style={styles.utilityButtonText}>Імпортувати монстра</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            void addMonster({
              id: Date.now().toString(),
              name: 'Монстр',
              stats: {
                strength: 10,
                dexterity: 10,
                constitution: 10,
                intelligence: 10,
                wisdom: 10,
                charisma: 10,
              },
              environment: 'Невідомо',
              source: 'Власне',
              tags: [],
            });
          }}
          style={styles.utilityButton}
          android_ripple={{ color: '#999' }}
        >
          <Text style={styles.utilityButtonText}>Додати монстра</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default Bestiary;
