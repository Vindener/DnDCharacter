import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Image, Button, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions, RouteProp, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from './style';
import { MonsterDto } from '@/types/Monster';
import useMonsterStore from '@/context/Monster-store';
import TextInput from '@/shared/components/TextInput/TextInput';
import FileService from '@/shared/services/fileSerice';
import type { ReferencesStackParamList } from '@/navigation/ReferencesNavigator';
import { sp } from '@/shared/styles/tokens';

type MonsterRouteProp = RouteProp<ReferencesStackParamList, 'Monster'>;
type MonsterTextField =
  | 'type'
  | 'size'
  | 'alignment'
  | 'challenge'
  | 'environment'
  | 'source'
  | 'mainAttack'
  | 'attackBonus'
  | 'damage'
  | 'speed'
  | 'savingThrows'
  | 'skills'
  | 'senses'
  | 'languages'
  | 'traits'
  | 'actions'
  | 'reactions'
  | 'legendaryActions'
  | 'notes';
type MonsterNumberField = 'armorClass' | 'hitPoints';

interface Props {
  route: MonsterRouteProp;
}

const COLLAPSE_LIMIT = 220;

const previewText = (value?: string): string => {
  if (!value) return '—';
  if (value.length <= COLLAPSE_LIMIT) return value;
  return `${value.slice(0, COLLAPSE_LIMIT).trim()}...`;
};

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

const getMetaLine = (monster: MonsterDto): string =>
  [monster.size, monster.type, monster.alignment].filter(Boolean).join(' · ') || '—';

const getMainAttack = (monster: MonsterDto): string => {
  if (monster.mainAttack) return monster.mainAttack;
  const match = (monster.actions || '').match(/\*\*([^.*]+)\./);
  return match?.[1]?.trim() || '—';
};

const CollapsibleTextBlock = ({
  title,
  value,
  emptyText,
  expanded,
  onToggle,
  style,
  rippleColor,
  testID,
}: {
  title: string;
  value?: string;
  emptyText?: string;
  expanded: boolean;
  onToggle: () => void;
  style: ReturnType<typeof getStyles>;
  rippleColor: string;
  testID?: string;
}) => {
  const content = value?.trim() || emptyText || '—';
  const text = expanded ? content : previewText(content);
  const canToggle = content.length > COLLAPSE_LIMIT;

  return (
    <View style={style.collapsibleBlock} testID={testID}>
      <Text style={style.sectionTitle}>{title}</Text>
      <Text style={style.value}>{text}</Text>
      {canToggle && (
        <Pressable style={style.collapseButton} onPress={onToggle} android_ripple={{ color: rippleColor }}>
          <Text style={style.collapseButtonText}>{expanded ? 'Згорнути' : 'Показати більше'}</Text>
        </Pressable>
      )}
    </View>
  );
};

export default function Monster({ route }: Props) {
  const { monster } = route.params;
  const navigation = useNavigation<StackNavigationProp<ReferencesStackParamList, 'Monster'>>();
  const updateMonster = useMonsterStore((s) => s.updateMonster);
  const addMonster = useMonsterStore((s) => s.addMonster);
  const pinnedMonsterIds = useMonsterStore((s) => s.pinnedMonsterIds);
  const favoriteMonsterIds = useMonsterStore((s) => s.favoriteMonsterIds);
  const togglePinnedMonster = useMonsterStore((s) => s.togglePinnedMonster);
  const toggleFavoriteMonster = useMonsterStore((s) => s.toggleFavoriteMonster);
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [data, setData] = useState<MonsterDto>(monster);
  const [editing, setEditing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const isPinned = pinnedMonsterIds.includes(data.id);
  const isFavorite = favoriteMonsterIds.includes(data.id);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const pickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setData((prev) => ({ ...prev, photoUri: uri }));
      }
    } catch (_error) { /* intentionally ignored */ }
  };

  const removePhoto = () => {
    setData((prev) => ({ ...prev, photoUri: undefined }));
  };

  const handleSave = () => {
    void updateMonster(data.id, data);
    setEditing(false);
  };

  const duplicateCurrent = () => {
    void addMonster(createDuplicateMonster(data));
  };

  const addToEncounter = () => {
    navigation.getParent()?.dispatch(
      CommonActions.navigate({
        name: 'DM',
        params: {
          screen: 'DMEncounterPrep',
          params: {
            initialMonster: createMonsterSeed(data),
          },
        },
      }),
    );
  };

  const setTextField = (field: MonsterTextField, text: string) => {
    setData((prev) => ({ ...prev, [field]: text }));
  };

  const setNumberField = (field: MonsterNumberField, text: string) => {
    const value = Number.parseInt(text, 10);
    setData((prev) => ({ ...prev, [field]: Number.isNaN(value) ? undefined : value }));
  };

  const renderTextField = (label: string, field: MonsterTextField, placeholder = label) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={String(data[field] || '')}
        onChangeText={(text) => setTextField(field, text)}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
      />
    </>
  );

  const renderStatInput = (key: keyof MonsterDto['stats']) => (
    <TextInput
      unstyled
      style={styles.statInput}
      value={String(data.stats[key])}
      onChangeText={(text) => {
        const val = Number.parseInt(text, 10);
        setData((prev) => ({
          ...prev,
          stats: { ...prev.stats, [key]: Number.isNaN(val) ? 0 : val },
        }));
      }}
      keyboardType='numeric'
    />
  );

  const Stat = ({ label, stat }: { label: string; stat: keyof MonsterDto['stats'] }) => (
    <View style={styles.statBox}>
      <Text style={styles.statName}>{label}</Text>
      {editing ? renderStatInput(stat) : <Text style={styles.statValue}>{data.stats[stat]}</Text>}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps='handled'>
      {data.photoUri ? <Image source={{ uri: data.photoUri }} style={styles.photo} /> : <View style={styles.placeholderPhoto} />}
      {editing && (
        <View style={styles.photoButtonsRow}>
          <Button title='Завантажити фото' onPress={pickPhoto} />
          {data.photoUri && (
            <>
              <View style={{ width: 8 }} />
              <Button title='Видалити фото' onPress={removePhoto} />
            </>
          )}
        </View>
      )}

      <View style={styles.headerRow}>
        {editing ? (
          <TextInput style={[styles.name, styles.nameInput]} value={data.name} onChangeText={(text) => setData((prev) => ({ ...prev, name: text }))} />
        ) : (
          <View style={styles.headerTextBlock}>
            <Text style={styles.name}>{data.name}</Text>
            <Text style={styles.meta}>{getMetaLine(data)}</Text>
          </View>
        )}
        <Pressable style={styles.iconButton} onPress={editing ? handleSave : () => setEditing(true)} android_ripple={{ color: colors.ripple }}>
          <Ionicons name={editing ? 'checkmark' : 'pencil'} size={22} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.actionButton} onPress={addToEncounter} android_ripple={{ color: colors.ripple }} testID='monster.addToEncounterButton'>
          <Ionicons name='add-circle-outline' size={16} color={colors.text} />
          <Text style={styles.actionText}>До сутички</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => void togglePinnedMonster(data.id)} android_ripple={{ color: colors.ripple }}>
          <Ionicons name={isPinned ? 'bookmark' : 'bookmark-outline'} size={16} color={colors.text} />
          <Text style={styles.actionText}>{isPinned ? 'Відкріпити' : 'Закріпити'}</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => void toggleFavoriteMonster(data.id)} android_ripple={{ color: colors.ripple }}>
          <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={16} color={colors.text} />
          <Text style={styles.actionText}>{isFavorite ? 'З улюблених' : 'В улюблені'}</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={duplicateCurrent} android_ripple={{ color: colors.ripple }}>
          <Ionicons name='copy-outline' size={16} color={colors.text} />
          <Text style={styles.actionText}>Дублювати</Text>
        </Pressable>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCell}>
          <Text style={styles.statName}>КД</Text>
          <Text style={styles.summaryValue}>{data.armorClass ?? '—'}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.statName}>ХП</Text>
          <Text style={styles.summaryValue}>{data.hitPoints ?? '—'}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.statName}>Швидк.</Text>
          <Text style={styles.summaryValue}>{data.speed || '—'}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.statName}>Скл.</Text>
          <Text style={styles.summaryValue}>{data.challenge || '—'}</Text>
        </View>
      </View>

      <View style={styles.quickBlock}>
        <Text style={styles.sectionTitle}>Швидкий огляд майстра</Text>
        <Text style={styles.value}>
          {getMainAttack(data)}
          {data.attackBonus ? ` · ${data.attackBonus} до атаки` : ''}
          {data.damage ? ` · ${data.damage} урону` : ''}
        </Text>
      </View>

      {editing ? (
        <>
          {renderTextField('Тип', 'type')}
          {renderTextField('Розмір', 'size')}
          {renderTextField('Світогляд', 'alignment')}
          {renderTextField('Складність', 'challenge')}
          {renderTextField('Середовище', 'environment')}
          {renderTextField('Джерело', 'source')}
          {renderTextField('Основна атака', 'mainAttack')}
          {renderTextField('Бонус атаки', 'attackBonus', '+4')}
          {renderTextField('Урон', 'damage', '1d6+2')}
          <Text style={styles.label}>Клас доспіхів</Text>
          <TextInput
            style={styles.input}
            value={typeof data.armorClass === 'number' ? String(data.armorClass) : ''}
            onChangeText={(text) => setNumberField('armorClass', text)}
            keyboardType='numeric'
          />
          <Text style={styles.label}>ХП</Text>
          <TextInput
            style={styles.input}
            value={typeof data.hitPoints === 'number' ? String(data.hitPoints) : ''}
            onChangeText={(text) => setNumberField('hitPoints', text)}
            keyboardType='numeric'
          />
          {renderTextField('Швидкість', 'speed')}
          {renderTextField('Ряткидки', 'savingThrows')}
          {renderTextField('Навички', 'skills')}
          {renderTextField('Чуття', 'senses')}
          {renderTextField('Мови', 'languages')}
          <Text style={styles.label}>Теги</Text>
          <TextInput
            style={styles.input}
            value={(data.tags || []).join(', ')}
            onChangeText={(text) =>
              setData((prev) => ({
                ...prev,
                tags: text
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              }))
            }
            placeholder='тег, тег'
            placeholderTextColor={colors.textSecondary}
          />
        </>
      ) : (
        <View style={styles.metadataGrid}>
          <Text style={styles.metadataText}>Ряткидки: {data.savingThrows || '—'}</Text>
          <Text style={styles.metadataText}>Навички: {data.skills || '—'}</Text>
          <Text style={styles.metadataText}>Чуття: {data.senses || '—'}</Text>
          <Text style={styles.metadataText}>Мови: {data.languages || '—'}</Text>
          <Text style={styles.metadataText}>Джерело: {data.source || '—'}</Text>
          <Text style={styles.metadataText}>Середовище: {data.environment || '—'}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Характеристики</Text>
      <View style={styles.statRow}>
        <Stat label='СИЛ' stat='strength' />
        <Stat label='СПР' stat='dexterity' />
        <Stat label='ВИТ' stat='constitution' />
      </View>
      <View style={styles.statRow}>
        <Stat label='ІНТ' stat='intelligence' />
        <Stat label='МДР' stat='wisdom' />
        <Stat label='ХАР' stat='charisma' />
      </View>

      {editing ? (
        <>
          <Text style={styles.label}>Риси</Text>
          <TextInput style={styles.textArea} multiline value={data.traits || ''} onChangeText={(text) => setTextField('traits', text)} />
          <Text style={styles.label}>Дії</Text>
          <TextInput style={styles.textArea} multiline value={data.actions || ''} onChangeText={(text) => setTextField('actions', text)} />
          <Text style={styles.label}>Реакції</Text>
          <TextInput style={styles.textArea} multiline value={data.reactions || ''} onChangeText={(text) => setTextField('reactions', text)} />
          <Text style={styles.label}>Легендарні дії</Text>
          <TextInput
            style={styles.textArea}
            multiline
            value={data.legendaryActions || ''}
            onChangeText={(text) => setTextField('legendaryActions', text)}
          />
          <Text style={styles.label}>Нотатки майстра</Text>
          <TextInput style={styles.textArea} multiline value={data.notes || ''} onChangeText={(text) => setTextField('notes', text)} />
        </>
      ) : (
        <>
          <CollapsibleTextBlock
            title='Риси'
            value={data.traits}
            emptyText='Немає рис.'
            expanded={Boolean(expandedSections.traits)}
            onToggle={() => toggleSection('traits')}
            style={styles}
            rippleColor={colors.ripple}
            testID='monster.traitsSection'
          />
          <CollapsibleTextBlock
            title='Дії'
            value={data.actions}
            emptyText='Немає дій.'
            expanded={Boolean(expandedSections.actions)}
            onToggle={() => toggleSection('actions')}
            style={styles}
            rippleColor={colors.ripple}
            testID='monster.actionsSection'
          />
          <CollapsibleTextBlock
            title='Реакції'
            value={data.reactions}
            emptyText='Немає реакцій.'
            expanded={Boolean(expandedSections.reactions)}
            onToggle={() => toggleSection('reactions')}
            style={styles}
            rippleColor={colors.ripple}
            testID='monster.reactionsSection'
          />
          {data.legendaryActions ? (
            <CollapsibleTextBlock
              title='Легендарні дії'
              value={data.legendaryActions}
              expanded={Boolean(expandedSections.legendaryActions)}
              onToggle={() => toggleSection('legendaryActions')}
              style={styles}
              rippleColor={colors.ripple}
              testID='monster.legendaryActionsSection'
            />
          ) : null}
          <CollapsibleTextBlock
            title='Нотатки майстра'
            value={data.notes}
            emptyText='Нотаток немає.'
            expanded={Boolean(expandedSections.notes)}
            onToggle={() => toggleSection('notes')}
            style={styles}
            rippleColor={colors.ripple}
            testID='monster.notesSection'
          />
        </>
      )}

      <View style={{ marginTop: sp(12) }}>
        <Button title='Експорт JSON' onPress={() => FileService.exportMonster(data)} />
      </View>
    </ScrollView>
  );
}
