import React, { useState, useCallback } from 'react';
import { ScrollView, TouchableOpacity, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import useCharacterStore from '@/context/Character-store';
import { useFocusEffect } from '@react-navigation/native';
import { Modal } from '@/shared/components/Modal/Modal';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import useThemeStore from '@/context/Theme-store';
import TextInput from '@/shared/components/TextInput/TextInput';
import { getStyles } from './style';

interface InitiativeItem {
  id: string;
  name: string;
  roll: string;
  hits?: string;
  defeated?: boolean;
}

// Fully local, per-device ad-hoc tracker — no campaign, no Firestore, works offline and
// without login. This is the entire previous Initiative.tsx behavior, unchanged, kept as
// the fallback when no campaign is selected/linked (see Initiative.tsx's resolver).
const LocalInitiativeBoard: React.FC = () => {
  const { t } = useTranslation('initiative');
  const colors = useThemeStore((s) => s.colors);
  const styles = getStyles(colors);

  const [items, setItems] = useState<InitiativeItem[]>([{ id: Date.now().toString(), name: '', roll: '', hits: '' }]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [hitsEnabled, setHitsEnabled] = useState<boolean>(false);

  const characters = useCharacterStore((s) => s.characters);
  const loadCharacters = useCharacterStore((s) => s.loadCharacters);

  const [isHeroPickerVisible, setHeroPickerVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadCharacters();
    }, [loadCharacters]),
  );

  const addHeroToInitiative = useCallback(
    (heroId: string) => {
      const hero = characters.find((c) => c.id === heroId);
      if (!hero) return;
      setItems((prev) => [{ id: `${Date.now()}`, name: hero.name || t('heroPicker.fallbackName'), roll: '', hits: '' }, ...prev]);
      setHeroPickerVisible(false);
    },
    [characters, t],
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

      const draggingStyle = isActive
        ? { shadowColor: colors.overlayStrong, shadowOpacity: 0.2, shadowRadius: 5, transform: [{ scale: 1.01 }] }
        : null;

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
              placeholder={t('placeholders.name')}
              onChangeText={(t) => handleChangeById(item.id, 'name', t)}
              onFocus={() => setEditingId(item.id)}
              onBlur={() => setEditingId((p) => (p === item.id ? null : p))}
              returnKeyType='next'
            />

            <TextInput
              style={styles.inputRoll}
              editable={!item.defeated}
              value={item.roll}
              placeholder={t('placeholders.roll')}
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
                placeholder={t('placeholders.hits')}
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
            accessibilityLabel={item.defeated ? t('actions.returnToFight') : t('actions.markDefeated')}
          >
            <Ionicons
              name={item.defeated ? 'refresh-circle-outline' : 'skull-outline'}
              size={22}
              color={item.defeated ? colors.success : colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleRemove(item.id)}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            style={styles.deleteButton}
            disabled={isActive}
            accessibilityLabel={t('actions.deleteRow')}
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
      t,
      toggleDefeated,
    ],
  );

  return (
    <View style={styles.container}>
      <View style={styles.localModeBanner}>
        <Ionicons name='information-circle-outline' size={20} color={colors.textSecondary} />
        <Text style={styles.localModeBannerText}>{t('localModeHint')}</Text>
      </View>

      <DraggableFlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onDragEnd={({ data }) => setItems(data)}
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={{ paddingBottom: 96 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name='bonfire-outline' size={28} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>{t('emptyState')}</Text>
          </View>
        }
      />

      <View style={styles.bottomBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={handleAdd} style={styles.addButton}>
            <Ionicons name='add-circle-outline' size={28} color={colors.success} />
            <Text style={styles.addText}>{t('actions.addRow')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setHeroPickerVisible(true)}
            style={styles.addHeroButton}
            accessibilityLabel={t('actions.addHeroFromList')}
          >
            <Ionicons name='person-add-outline' size={22} color={colors.text} />
            <Text style={styles.addHeroText}>{t('actions.addHero')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setHitsEnabled((v) => !v)}
          accessibilityRole='checkbox'
          accessibilityState={{ checked: hitsEnabled }}
        >
          <Ionicons name={hitsEnabled ? 'checkbox-outline' : 'square-outline'} size={22} color={colors.text} />
          <Text style={styles.checkboxLabel}>{t('actions.enableHits')}</Text>
        </TouchableOpacity>

        <Modal title={t('heroPicker.title')} isVisible={isHeroPickerVisible} onClose={() => setHeroPickerVisible(false)}>
          <ScrollView style={{ maxHeight: 320 }}>
            {characters.length === 0 && <Text style={{ color: colors.textSecondary }}>{t('heroPicker.empty')}</Text>}
            {characters.map((hero) => (
              <TouchableOpacity key={hero.id} onPress={() => addHeroToInitiative(hero.id)} style={styles.heroItem}>
                <Ionicons name='person-outline' size={18} color={colors.textSecondary} />
                <Text style={styles.heroItemText}>{hero.name || t('heroPicker.fallbackName')}</Text>
                <Text style={styles.heroItemText}>{hero.class || '???'}</Text>
                <Text style={styles.heroItemText}>{hero.level || t('heroPicker.fallbackLevel')}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Modal>
      </View>
    </View>
  );
};

export default LocalInitiativeBoard;
