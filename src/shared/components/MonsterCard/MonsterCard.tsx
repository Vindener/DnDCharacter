import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { BestiaryStackParamList } from '@/navigation/BestiaryNavigator';
import { getStyles } from './style';
import useThemeStore from '@/context/Theme-store';
import { MonsterDto } from '@/types/Monster';
import useMonsterStore from '@/context/Monster-store';

interface MonsterCardProps {
  monster: MonsterDto;
  isPinned?: boolean;
  isFavorite?: boolean;
  onTogglePin?: (monsterId: string) => void;
  onToggleFavorite?: (monsterId: string) => void;
  onAddToEncounter?: (monster: MonsterDto) => void;
  onDuplicate?: (monster: MonsterDto) => void;
  cardTestID?: string;
}

const getMetaLine = (monster: MonsterDto): string => {
  const sizeType = [monster.size, monster.type].filter(Boolean).join(' ');
  return sizeType || monster.type || 'Тип невідомий';
};

const getMainAttack = (monster: MonsterDto): string => {
  if (monster.mainAttack) return monster.mainAttack;
  const match = (monster.actions || '').match(/\*\*([^.*]+)\./);
  return match?.[1]?.trim() || 'Атака не вказана';
};

export const MonsterCard = ({
  monster,
  isPinned = false,
  isFavorite = false,
  onTogglePin,
  onToggleFavorite,
  onAddToEncounter,
  onDuplicate,
  cardTestID,
}: MonsterCardProps) => {
  const navigation = useNavigation<StackNavigationProp<BestiaryStackParamList, 'List'>>();
  const removeMonster = useMonsterStore((s) => s.removeMonster);
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const handleDelete = () => {
    removeMonster(monster.id);
  };

  const handlePress = () => {
    navigation.navigate('Monster', { monster });
  };

  return (
    <Pressable style={styles.card} onPress={handlePress} android_ripple={{ color: colors.ripple }} testID={cardTestID}>
      {monster.photoUri ? <Image source={{ uri: monster.photoUri }} style={styles.avatar} /> : <View style={styles.avatar} />}
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{monster.name}</Text>
          {!!onToggleFavorite && (
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onToggleFavorite(monster.id);
              }}
              style={styles.iconButton}
              android_ripple={{ color: colors.ripple }}
              testID='monsterCard.favoriteButton'
            >
              <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={17} color={colors.text} />
            </Pressable>
          )}
        </View>
        <Text style={styles.meta}>{getMetaLine(monster)} · Скл. {monster.challenge || '—'}</Text>
        <View style={styles.statGrid}>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>КД</Text>
            <Text style={styles.statValue}>{monster.armorClass ?? '—'}</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>ХП</Text>
            <Text style={styles.statValue}>{monster.hitPoints ?? '—'}</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>Швидк.</Text>
            <Text style={styles.statValue}>{monster.speed || '—'}</Text>
          </View>
        </View>
        <Text style={styles.attackLine} numberOfLines={2}>
          {getMainAttack(monster)}
          {monster.attackBonus ? ` · ${monster.attackBonus} до атаки` : ''}
          {monster.damage ? ` · ${monster.damage}` : ''}
        </Text>
        <View style={styles.actionRow}>
          {!!onAddToEncounter && (
            <Pressable
              style={styles.actionButton}
              onPress={(event) => {
                event.stopPropagation();
                onAddToEncounter(monster);
              }}
              android_ripple={{ color: colors.ripple }}
              testID='monsterCard.addToEncounterButton'
            >
              <Ionicons name='add-circle-outline' size={15} color={colors.text} />
              <Text style={styles.actionText}>До сутички</Text>
            </Pressable>
          )}
          {!!onTogglePin && (
            <Pressable
              style={styles.actionButton}
              onPress={(event) => {
                event.stopPropagation();
                onTogglePin(monster.id);
              }}
              android_ripple={{ color: colors.ripple }}
              testID='monsterCard.pinButton'
            >
              <Ionicons name={isPinned ? 'bookmark' : 'bookmark-outline'} size={15} color={colors.text} />
              <Text style={styles.actionText}>{isPinned ? 'Закріплено' : 'Закріпити'}</Text>
            </Pressable>
          )}
          {!!onDuplicate && (
            <Pressable
              style={styles.actionButton}
              onPress={(event) => {
                event.stopPropagation();
                onDuplicate(monster);
              }}
              android_ripple={{ color: colors.ripple }}
              testID='monsterCard.duplicateButton'
            >
              <Ionicons name='copy-outline' size={15} color={colors.text} />
              <Text style={styles.actionText}>Копія</Text>
            </Pressable>
          )}
        </View>
        {!!monster.environment && <Text style={styles.meta}>Середовище: {monster.environment}</Text>}
        {!!monster.source && <Text style={styles.meta}>Джерело: {monster.source}</Text>}
        {!!monster.isCustom && <Text style={styles.customMeta}>Власний монстр</Text>}
      </View>
      <Pressable
        onPress={(event) => {
          event.stopPropagation();
          handleDelete();
        }}
        style={styles.deleteButton}
        android_ripple={{ color: colors.ripple }}
      >
        <Ionicons name='trash-outline' size={20} color={colors.text} />
      </Pressable>
    </Pressable>
  );
};

