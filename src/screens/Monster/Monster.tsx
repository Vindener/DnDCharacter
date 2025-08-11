import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Button } from 'react-native';
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

export default function Monster({ route }: Props) {
  const { monster } = route.params;
  const updateMonster = useMonsterStore((s) => s.updateMonster);
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [data, setData] = useState<MonsterDto>(monster);
  const [editing, setEditing] = useState(false);

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
    } catch {}
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
      onChangeText={(t) => {
        const val = parseInt(t, 10);
        setData((prev) => ({
          ...prev,
          stats: { ...prev.stats, [key]: isNaN(val) ? 0 : val },
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
    <ScrollView style={styles.container}>
      {data.photoUri ? <Image source={{ uri: data.photoUri }} style={styles.photo} /> : <View style={styles.placeholderPhoto} />}
      {editing && (
        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
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
          <TextInput
            style={[styles.name, styles.nameInput]}
            value={data.name}
            onChangeText={(t) => setData((prev) => ({ ...prev, name: t }))}
          />
        ) : (
          <Text style={styles.name}>{data.name}</Text>
        )}
        <TouchableOpacity onPress={editing ? handleSave : () => setEditing(true)}>
          <Ionicons name={editing ? 'checkmark' : 'pencil'} size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Тип: {editing ? '' : data.type}</Text>
      {editing && <TextInput style={styles.input} value={data.type || ''} onChangeText={(t) => setData((p) => ({ ...p, type: t }))} />}

      <Text style={styles.label}>Розмір: {editing ? '' : data.size}</Text>
      {editing && <TextInput style={styles.input} value={data.size || ''} onChangeText={(t) => setData((p) => ({ ...p, size: t }))} />}

      <Text style={styles.label}>Світогляд: {editing ? '' : data.alignment}</Text>
      {editing && (
        <TextInput style={styles.input} value={data.alignment || ''} onChangeText={(t) => setData((p) => ({ ...p, alignment: t }))} />
      )}

      <Text style={styles.label}>Складність: {editing ? '' : data.challenge}</Text>
      {editing && (
        <TextInput style={styles.input} value={data.challenge || ''} onChangeText={(t) => setData((p) => ({ ...p, challenge: t }))} />
      )}

      <Text style={styles.label}>Клас доспіхів: {editing ? '' : data.armorClass}</Text>
      {editing && (
        <TextInput
          style={styles.input}
          value={data.armorClass ? String(data.armorClass) : ''}
          onChangeText={(t) => setData((p) => ({ ...p, armorClass: parseInt(t, 10) || 0 }))}
          keyboardType='numeric'
        />
      )}

      <Text style={styles.label}>ХП: {editing ? '' : data.hitPoints}</Text>
      {editing && (
        <TextInput
          style={styles.input}
          value={data.hitPoints ? String(data.hitPoints) : ''}
          onChangeText={(t) => setData((p) => ({ ...p, hitPoints: parseInt(t, 10) || 0 }))}
          keyboardType='numeric'
        />
      )}

      <Text style={styles.label}>Швидкість: {editing ? '' : data.speed}</Text>
      {editing && <TextInput style={styles.input} value={data.speed || ''} onChangeText={(t) => setData((p) => ({ ...p, speed: t }))} />}

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

      <Text style={styles.label}>Дії:</Text>
      {editing ? (
        <TextInput
          style={styles.textArea}
          multiline
          value={data.actions || ''}
          onChangeText={(t) => setData((p) => ({ ...p, actions: t }))}
        />
      ) : (
        <Text style={styles.value}>{data.actions}</Text>
      )}

      <Text style={styles.label}>Нотатки:</Text>
      {editing ? (
        <TextInput style={styles.textArea} multiline value={data.notes || ''} onChangeText={(t) => setData((p) => ({ ...p, notes: t }))} />
      ) : (
        <Text style={styles.value}>{data.notes}</Text>
      )}
      <View style={{ marginTop: 12, marginBottom:20 }}>
        <Button title='Експорт JSON' onPress={exportCurrent} />
      </View>
    </ScrollView>
  );
}
