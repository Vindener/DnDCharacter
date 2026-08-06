import React, { useState, useCallback, useMemo, useRef } from 'react';
import { ScrollView, TouchableOpacity, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import useCharacterStore from '@/context/Character-store';
import { useFocusEffect } from '@react-navigation/native';
import { Modal } from '@/shared/components/Modal/Modal';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import useThemeStore from '@/context/Theme-store';
import TextInput from '@/shared/components/TextInput/TextInput';
import { DiceRollerPanel, type DiceRollerPreset } from '@/screens/DiceRoller/DiceRoller';
import type { DiceRollResult } from '@/shared/services/diceRoller';
import { getStyles as getInitiativeStyles } from './style';
import { getStyles as getDmStyles } from '@/screens/DM/style';
import { sp } from '@/shared/styles/tokens';

interface InitiativeItem {
  id: string;
  name: string;
  roll: string;
  hits?: string;
  defeated?: boolean;
}

// Fully local, per-device ad-hoc tracker — no campaign, no Firestore, works offline and
// without login. Kept as the fallback when no campaign is selected/linked (see
// Initiative.tsx's resolver). Shares CampaignInitiativeBoard's shell (DM-style header card,
// lane buttons, empty-state card) so switching between local and campaign mode looks
// consistent rather than like two different screens.
const LocalInitiativeBoard: React.FC = () => {
  const { t } = useTranslation('initiative');
  const colors = useThemeStore((s) => s.colors);
  const styles = getInitiativeStyles(colors);
  const dmStyles = getDmStyles(colors);

  const [items, setItems] = useState<InitiativeItem[]>([{ id: Date.now().toString(), name: '', roll: '', hits: '' }]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [hitsEnabled, setHitsEnabled] = useState<boolean>(false);

  const characters = useCharacterStore((s) => s.characters);
  const loadCharacters = useCharacterStore((s) => s.loadCharacters);

  const [isHeroPickerVisible, setHeroPickerVisible] = useState(false);

  const [rollingItemId, setRollingItemId] = useState<string | null>(null);
  const lastRollTotalRef = useRef<number | null>(null);

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

  // DiceRollerPanel calls this itself on every roll (including "roll again") — capturing the
  // total in a ref rather than state means it can re-roll freely without us re-rendering the
  // row underneath it, and closeRollModal only needs to read the latest value once, on close.
  const handleRollResult = useCallback((result: DiceRollResult) => {
    lastRollTotalRef.current = result.total;
  }, []);

  const rollPreset = useMemo<DiceRollerPreset>(() => ({ id: rollingItemId || 'initiative-roll', dice: 'd20' }), [rollingItemId]);

  const closeRollModal = useCallback(() => {
    if (rollingItemId && lastRollTotalRef.current !== null) {
      handleChangeById(rollingItemId, 'roll', String(lastRollTotalRef.current));
    }
    setRollingItemId(null);
  }, [rollingItemId, handleChangeById]);

  const openRollModal = useCallback((id: string) => {
    lastRollTotalRef.current = null;
    setRollingItemId(id);
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

            {item.roll ? (
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
            ) : (
              <TouchableOpacity
                style={styles.rollDiceButton}
                disabled={item.defeated}
                onPress={() => openRollModal(item.id)}
                accessibilityLabel={t('actions.rollDice')}
              >
                <MaterialCommunityIcons name='dice-d20-outline' size={20} color={colors.text} />
              </TouchableOpacity>
            )}

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
      colors.text,
      colors.textSecondary,
      editingId,
      handleChangeById,
      handleRemove,
      items,
      openRollModal,
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
      styles.rollDiceButton,
      hitsEnabled,
      t,
      toggleDefeated,
    ],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={dmStyles.card}>
        <Text style={dmStyles.title}>{t('title')}</Text>
        <Text style={dmStyles.hint}>{t('localModeHint')}</Text>
        <View style={dmStyles.laneGrid}>
          <TouchableOpacity style={dmStyles.laneButton} onPress={handleAdd}>
            <Ionicons name='add-circle-outline' size={18} color={colors.success} />
            <Text style={dmStyles.laneButtonText}>{t('actions.addRow')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={dmStyles.laneButton}
            onPress={() => setHeroPickerVisible(true)}
            accessibilityLabel={t('actions.addHeroFromList')}
          >
            <Ionicons name='person-add-outline' size={18} color={colors.text} />
            <Text style={dmStyles.laneButtonText}>{t('actions.addHero')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={dmStyles.laneButton}
            onPress={() => setHitsEnabled((v) => !v)}
            accessibilityRole='checkbox'
            accessibilityState={{ checked: hitsEnabled }}
          >
            <Ionicons name={hitsEnabled ? 'checkbox-outline' : 'square-outline'} size={18} color={colors.text} />
            <Text style={dmStyles.laneButtonText}>{t('actions.enableHits')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {items.length ? (
        <DraggableFlatList
          data={items}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          onDragEnd={({ data }) => setItems(data)}
          keyboardShouldPersistTaps='handled'
          contentContainerStyle={{ padding: sp(16), paddingBottom: sp(96) }}
        />
      ) : (
        <View style={dmStyles.card}>
          <Text style={dmStyles.hint}>{t('emptyState')}</Text>
        </View>
      )}

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

      <Modal isVisible={rollingItemId !== null} onClose={closeRollModal}>
        <DiceRollerPanel embedded preset={rollPreset} onRollResult={handleRollResult} />
      </Modal>
    </View>
  );
};

export default LocalInitiativeBoard;
