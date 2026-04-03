import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Button, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from './style';
import { MonsterDto } from '@/types/Monster';
import useMonsterStore from '@/context/Monster-store';
import TextInput from '@/shared/components/TextInput/TextInput';
import FileService from '@/shared/services/fileSerice';
import type { BestiaryStackParamList } from '@/navigation/BestiaryNavigator';

type MonsterRouteProp = RouteProp<BestiaryStackParamList, 'Monster'>;

interface Props {
  route: MonsterRouteProp;
}

const COLLAPSE_LIMIT = 180;

const previewText = (value?: string): string => {
  if (!value) return '—';
  if (value.length <= COLLAPSE_LIMIT) return value;
  return `${value.slice(0, COLLAPSE_LIMIT).trim()}…`;
};

const CollapsibleTextBlock = ({
  title,
  value,
  expanded,
  onToggle,
  style,
}: {
  title: string;
  value?: string;
  expanded: boolean;
  onToggle: () => void;
  style: ReturnType<typeof getStyles>;
}) => {
  const text = expanded ? value || '—' : previewText(value);
  const canToggle = (value || '').length > COLLAPSE_LIMIT;

  return (
    <View style={style.collapsibleBlock}>
      <Text style={style.label}>{title}</Text>
      <Text style={style.value}>{text}</Text>
      {canToggle && (
        <Pressable style={style.collapseButton} onPress={onToggle} android_ripple={{ color: '#999' }}>
          <Text style={style.collapseButtonText}>{expanded ? 'Згорнути' : 'Показати більше'}</Text>
        </Pressable>
      )}
    </View>
  );
};

export default function Monster({ route }: Props) {
  const { monster } = route.params;
  const updateMonster = useMonsterStore((s) => s.updateMonster);
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [data, setData] = useState<MonsterDto>(monster);
  const [editing, setEditing] = useState(false);
  const [actionsExpanded, setActionsExpanded] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);

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

  const exportCurrent = () => {
    FileService.exportMonster(data);
  };

  const handleSave = () => {
    updateMonster(data.id, data);
    setEditing(false);
  };

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

  const renderStatValue = (key: keyof MonsterDto['stats']) => <Text style={styles.statValue}>{data.stats[key]}</Text>;

  const Stat = ({ label, stat }: { label: string; stat: keyof MonsterDto['stats'] }) => (
    <View style={styles.statBox}>
      <Text style={styles.statName}>{label}</Text>
      {editing ? renderStatInput(stat) : renderStatValue(stat)}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
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
          <Text style={styles.name}>{data.name}</Text>
        )}
        <TouchableOpacity onPress={editing ? handleSave : () => setEditing(true)}>
          <Ionicons name={editing ? 'checkmark' : 'pencil'} size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Тип: {editing ? '' : data.type || '—'}</Text>
      {editing && <TextInput style={styles.input} value={data.type || ''} onChangeText={(text) => setData((prev) => ({ ...prev, type: text }))} />}

      <Text style={styles.label}>Розмір: {editing ? '' : data.size || '—'}</Text>
      {editing && <TextInput style={styles.input} value={data.size || ''} onChangeText={(text) => setData((prev) => ({ ...prev, size: text }))} />}

      <Text style={styles.label}>Світогляд: {editing ? '' : data.alignment || '—'}</Text>
      {editing && <TextInput style={styles.input} value={data.alignment || ''} onChangeText={(text) => setData((prev) => ({ ...prev, alignment: text }))} />}

      <Text style={styles.label}>Складність (CR): {editing ? '' : data.challenge || '—'}</Text>
      {editing && <TextInput style={styles.input} value={data.challenge || ''} onChangeText={(text) => setData((prev) => ({ ...prev, challenge: text }))} />}

      <Text style={styles.label}>Середовище: {editing ? '' : data.environment || '—'}</Text>
      {editing && <TextInput style={styles.input} value={data.environment || ''} onChangeText={(text) => setData((prev) => ({ ...prev, environment: text }))} />}

      <Text style={styles.label}>Джерело: {editing ? '' : data.source || '—'}</Text>
      {editing && <TextInput style={styles.input} value={data.source || ''} onChangeText={(text) => setData((prev) => ({ ...prev, source: text }))} />}

      <Text style={styles.label}>Теги: {editing ? '' : (data.tags || []).join(', ') || '—'}</Text>
      {editing && (
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
        />
      )}

      <Text style={styles.label}>Клас доспіхів: {editing ? '' : data.armorClass ?? '—'}</Text>
      {editing && (
        <TextInput
          style={styles.input}
          value={typeof data.armorClass === 'number' ? String(data.armorClass) : ''}
          onChangeText={(text) => setData((prev) => ({ ...prev, armorClass: Number.parseInt(text, 10) || 0 }))}
          keyboardType='numeric'
        />
      )}

      <Text style={styles.label}>ХП: {editing ? '' : data.hitPoints ?? '—'}</Text>
      {editing && (
        <TextInput
          style={styles.input}
          value={typeof data.hitPoints === 'number' ? String(data.hitPoints) : ''}
          onChangeText={(text) => setData((prev) => ({ ...prev, hitPoints: Number.parseInt(text, 10) || 0 }))}
          keyboardType='numeric'
        />
      )}

      <Text style={styles.label}>Швидкість: {editing ? '' : data.speed || '—'}</Text>
      {editing && <TextInput style={styles.input} value={data.speed || ''} onChangeText={(text) => setData((prev) => ({ ...prev, speed: text }))} />}

      <Text style={styles.sectionTitle}>Характеристики</Text>
      <View style={styles.statRow}>
        <Stat label='СИЛ' stat='strength' />
        <Stat label='ВИТ' stat='constitution' />
        <Stat label='СПР' stat='dexterity' />
      </View>
      <View style={styles.statRow}>
        <Stat label='ІНТ' stat='intelligence' />
        <Stat label='МДР' stat='wisdom' />
        <Stat label='ХАР' stat='charisma' />
      </View>

      {editing ? (
        <>
          <Text style={styles.label}>Дії</Text>
          <TextInput style={styles.textArea} multiline value={data.actions || ''} onChangeText={(text) => setData((prev) => ({ ...prev, actions: text }))} />
          <Text style={styles.label}>Нотатки</Text>
          <TextInput style={styles.textArea} multiline value={data.notes || ''} onChangeText={(text) => setData((prev) => ({ ...prev, notes: text }))} />
        </>
      ) : (
        <>
          <CollapsibleTextBlock
            title='Дії'
            value={data.actions}
            expanded={actionsExpanded}
            onToggle={() => setActionsExpanded((prev) => !prev)}
            style={styles}
          />
          <CollapsibleTextBlock
            title='Нотатки'
            value={data.notes}
            expanded={notesExpanded}
            onToggle={() => setNotesExpanded((prev) => !prev)}
            style={styles}
          />
        </>
      )}

      <View style={{ marginTop: 12 }}>
        <Button title='Експорт JSON' onPress={exportCurrent} />
      </View>
    </ScrollView>
  );
}

