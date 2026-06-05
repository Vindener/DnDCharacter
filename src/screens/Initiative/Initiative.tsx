import React, { useState, useCallback } from 'react';
import { ScrollView, TouchableOpacity, View, Text } from 'react-native'; 
import useCharacterStore from '@/context/Character-store';
import { useFocusEffect } from '@react-navigation/native';
import { Modal } from '@/shared/components/Modal/Modal';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import useThemeStore from '@/context/Theme-store';
import TextInput from '@/shared/components/TextInput/TextInput';
import { getStyles } from './style';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { AppStackParamList } from '@/navigation/AppNavigator';

interface InitiativeItem {
  id: string;
  name: string;
  roll: string;
  hits?: string;
  defeated?: boolean;
}

type Props = BottomTabScreenProps<AppStackParamList, 'Initiative'>;

const Initiative: React.FC<Props> = ({ route, navigation }) => {
  const colors = useThemeStore((s) => s.colors);
  const styles = getStyles(colors);

  const [items, setItems] = useState<InitiativeItem[]>([{ id: Date.now().toString(), name: '', roll: '', hits: '' }]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [hitsEnabled, setHitsEnabled] = useState<boolean>(false);

  const characters = useCharacterStore((s) => s.characters);
  const loadCharacters = useCharacterStore((s) => s.loadCharacters);

  const [isHeroPickerVisible, setHeroPickerVisible] = useState(false);

  React.useEffect(() => {
    const seed = route.params?.seed;
    if (!seed || !Array.isArray(seed.entries) || !seed.entries.length) return;

    setItems(
      seed.entries.map((entry) => ({
        id: String(entry.id || `${Date.now()}`),
        name: String(entry.name || ''),
        roll: String(entry.roll || ''),
        hits: entry.hits,
        defeated: false,
      })),
    );
    setHitsEnabled(seed.entries.some((entry) => Boolean(entry.hits)));
    navigation.setParams({ seed: undefined });
  }, [navigation, route.params?.seed]);

  useFocusEffect(
    React.useCallback(() => {
      loadCharacters(); 
    }, [loadCharacters]),
  );

  const addHeroToInitiative = useCallback(
    (heroId: string) => {
      const hero = characters.find((c) => c.id === heroId);
      if (!hero) return;
      setItems((prev) => [{ id: `${Date.now()}`, name: hero.name || 'Без імені', roll: '', hits: '' }, ...prev]);
      setHeroPickerVisible(false);
    },
    [characters],
  );

  const handleAdd = useCallback(() => {
    setItems((prev) => [{ id: `${Date.now()}`, name: '', roll: '', hits: '' }, ...prev]);
  }, []);

  const handleRemove = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const handleChangeById = useCallback((id: string, key: keyof InitiativeItem, value: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [key]: value } : it)));
  }, []);

  const toggleDefeated = useCallback((id: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, defeated: !it.defeated, hits: it.defeated ? it.hits : '0' } : it)));
  }, []);

  const toNonNegativeInt = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, '');
    if (!digits) return '0';
    const normalized = String(parseInt(digits, 10));
    return isNaN(Number(normalized)) ? '0' : normalized;
  };

  const keyExtractor = useCallback((item: InitiativeItem) => item.id, []);

  const renderItem = useCallback(
    ({ item, drag, isActive, getIndex }: RenderItemParams<InitiativeItem>) => {
      const currentIndex = typeof getIndex === 'function' ? getIndex() : undefined;
      const safeIndex = currentIndex != null ? currentIndex : items.findIndex((it) => it.id === item.id);

      const draggingStyle = isActive ? { shadowColor: colors.overlayStrong, shadowOpacity: 0.2, shadowRadius: 5, transform: [{ scale: 1.01 }] } : null;

      return (
        <View style={[styles.row, item.defeated ? styles.rowDefeated : null, draggingStyle]}>
          <TouchableOpacity
            activeOpacity={1}
            onLongPress={() => {
              if (!editingId) drag();
            }}
            delayLongPress={150}
            style={styles.rowContent}
          >
            <Text style={styles.order}>{safeIndex + 1}.</Text>

            <TextInput
              style={styles.inputName}
              editable={!item.defeated}
              value={item.name}
              placeholder="Ім'я"
              onChangeText={(t) => handleChangeById(item.id, 'name', t)}
              onFocus={() => setEditingId(item.id)}
              onBlur={() => setEditingId((p) => (p === item.id ? null : p))}
              returnKeyType='next'
            />

            <TextInput
              style={styles.inputRoll}
              editable={!item.defeated}
              value={item.roll}
              placeholder='Кидок'
              keyboardType='number-pad'
              onChangeText={(t) => handleChangeById(item.id, 'roll', t)}
              onFocus={() => setEditingId(item.id)}
              onBlur={() => setEditingId((p) => (p === item.id ? null : p))}
            />

            {hitsEnabled && (
              <TextInput
                style={styles.inputHits}
                editable={!item.defeated}
                value={item.hits ?? '0'}
                placeholder='ХП'
                keyboardType='number-pad'
                onChangeText={(t) => handleChangeById(item.id, 'hits', toNonNegativeInt(t))}
                onFocus={() => setEditingId(item.id)}
                onBlur={() => setEditingId((p) => (p === item.id ? null : p))}
              />
            )}

            <View style={styles.moveButtons}>
              <Ionicons name='reorder-three-outline' size={24} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => toggleDefeated(item.id)}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            style={styles.defeatedButton}
            disabled={isActive}
            accessibilityLabel={item.defeated ? 'Повернути в бій' : 'Позначити переможеним'}
          >
            <Ionicons name={item.defeated ? 'refresh-circle-outline' : 'skull-outline'} size={22} color={item.defeated ? colors.success : colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleRemove(item.id)}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            style={styles.deleteButton}
            disabled={isActive}
            accessibilityLabel='Видалити рядок'
          >
            <Ionicons name='trash-outline' size={22} color={colors.danger} />
          </TouchableOpacity>
        </View>
      );
    },
    [
      colors.danger,
      colors.overlayStrong,
      colors.success,
      colors.textSecondary,
      editingId,
      handleChangeById,
      handleRemove,
      items,
      styles.row,
      styles.rowDefeated,
      styles.rowContent,
      styles.order,
      styles.inputName,
      styles.inputRoll,
      styles.inputHits,
      styles.moveButtons,
      styles.defeatedButton,
      styles.deleteButton,
      hitsEnabled,
      toggleDefeated,
    ],
  );

  return (
    <View style={styles.container}>
      <DraggableFlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onDragEnd={({ data }) => setItems(data)}
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={{ paddingBottom: 96 }}
      />

      <View style={styles.bottomBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={handleAdd} style={styles.addButton}>
            <Ionicons name='add-circle-outline' size={28} color={colors.success} />
            <Text style={styles.addText}>Додати ще</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setHeroPickerVisible(true)}
            style={styles.addHeroButton}
            accessibilityLabel='Додати героя з переліку'
          >
            <Ionicons name='person-add-outline' size={22} color={colors.text} />
            <Text style={styles.addHeroText}>Додати героя</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setHitsEnabled((v) => !v)}
          accessibilityRole='checkbox'
          accessibilityState={{ checked: hitsEnabled }}
        >
          <Ionicons name={hitsEnabled ? 'checkbox-outline' : 'square-outline'} size={22} color={colors.text} />
          <Text style={styles.checkboxLabel}>Вкл. хіт</Text>
        </TouchableOpacity>

        <Modal title='Обрати героя' isVisible={isHeroPickerVisible} onClose={() => setHeroPickerVisible(false)}>
          <ScrollView style={{ maxHeight: 320 }}>
            {characters.length === 0 && <Text style={{ color: colors.textSecondary }}>Немає створених героїв</Text>}
            {characters.map((hero) => (
              <TouchableOpacity key={hero.id} onPress={() => addHeroToInitiative(hero.id)} style={styles.heroItem}>
                <Ionicons name='person-outline' size={18} color={colors.textSecondary} />
                <Text style={styles.heroItemText}>{hero.name || 'Без імені'}</Text>
                <Text style={styles.heroItemText}>{hero.class || '???'}</Text>
                <Text style={styles.heroItemText}>{hero.level || '? рівень'}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Modal>
      </View>
    </View>
  );
};

export default Initiative;
