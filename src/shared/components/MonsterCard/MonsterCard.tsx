import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import type { ReferencesStackParamList } from '@/navigation/ReferencesNavigator';
import { getStyles } from './style';
import useThemeStore from '@/context/Theme-store';
import { MonsterDto } from '@/types/Monster';
import useMonsterStore from '@/context/Monster-store';
import { isBuiltInRulesSource, shouldDisplaySourceMetadata } from '@/shared/helpers/sourcePresentation';
import { getLocalizedMonster } from '@/domain/srd/localization';

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

const getMetaLine = (monster: MonsterDto, t: TFunction<'bestiary'>): string => {
  const sizeType = [monster.size, monster.type].filter(Boolean).join(' ');
  return sizeType || monster.type || t('labels.unknownType');
};

const getMainAttack = (monster: MonsterDto, t: TFunction<'bestiary'>): string => {
  if (monster.mainAttack) return monster.mainAttack;
  const firstAction = monster.normalizedActions?.[0]?.name;
  if (firstAction) return firstAction;
  const match = (monster.actions || '').match(/(?:\*\*)?([^.*\n]+)\./);
  return match?.[1]?.trim() || t('labels.missingAttack');
};

const getSourceLabel = (monster: MonsterDto, t: TFunction<'bestiary'>): string | null => {
  if (!shouldDisplaySourceMetadata(monster.source)) return null;
  if (monster.source === 'user-custom') return t('sources.userCustom');
  if (monster.source === 'homebrew') return t('sources.homebrew');
  if (monster.source === 'imported') return t('sources.imported');
  return monster.source || t('sources.unknown');
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
  const { i18n, t } = useTranslation('bestiary');
  const navigation = useNavigation<StackNavigationProp<ReferencesStackParamList, 'List'>>();
  const removeMonster = useMonsterStore((s) => s.removeMonster);
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const isSrdMonster = isBuiltInRulesSource(monster.source);
  const displayMonster = getLocalizedMonster(monster, i18n.language);
  const sourceLabel = getSourceLabel(monster, t);
  const traitsSummary = displayMonster.normalizedTraits?.slice(0, 2).map((trait) => trait.name).join(', ') || displayMonster.traits || '';

  const handleDelete = () => {
    removeMonster(monster.id);
  };

  const handlePress = () => {
    navigation.navigate('Monster', { monster });
  };

  return (
    <Pressable style={styles.card} onPress={handlePress} android_ripple={{ color: colors.ripple }} testID={cardTestID}>
      {displayMonster.photoUri ? <Image source={{ uri: displayMonster.photoUri }} style={styles.avatar} /> : <View style={styles.avatar} />}
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{displayMonster.name}</Text>
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
        <Text style={styles.meta}>
          {getMetaLine(displayMonster, t)} · {t('labels.challengeShort')} {displayMonster.challenge || '—'}
        </Text>
        <View style={styles.statGrid}>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>{t('labels.armorClassShort')}</Text>
            <Text style={styles.statValue}>{displayMonster.armorClass ?? '—'}</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>{t('labels.hitPointsShort')}</Text>
            <Text style={styles.statValue}>{displayMonster.hitPoints ?? '—'}</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>{t('labels.speedShort')}</Text>
            <Text style={styles.statValue}>{displayMonster.speed || '—'}</Text>
          </View>
        </View>
        <Text style={styles.attackLine} numberOfLines={2}>
          {getMainAttack(displayMonster, t)}
          {displayMonster.attackBonus ? ` · ${t('labels.attackBonus', { value: displayMonster.attackBonus })}` : ''}
          {displayMonster.damage ? ` · ${displayMonster.damage}` : ''}
        </Text>
        {!!traitsSummary && (
          <Text style={styles.attackLine} numberOfLines={2}>
            {t('labels.traitsShort')}: {traitsSummary}
          </Text>
        )}
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
              <Text style={styles.actionText}>{t('actions.addToEncounterShort')}</Text>
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
              <Text style={styles.actionText}>{isPinned ? t('actions.pinned') : t('actions.pin')}</Text>
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
              <Text style={styles.actionText}>{t('actions.duplicate')}</Text>
            </Pressable>
          )}
        </View>
        {!!displayMonster.environment && <Text style={styles.meta}>{t('labels.environment', { value: displayMonster.environment })}</Text>}
        {sourceLabel ? (
          <View style={styles.badgeRow}>
            <View style={styles.sourceBadge} testID='monsterCard.sourceBadge'>
              <Text style={styles.sourceBadgeText}>{sourceLabel}</Text>
            </View>
          </View>
        ) : null}
        {!!monster.isCustom && <Text style={styles.customMeta}>{t('labels.customMonster')}</Text>}
      </View>
      {!isSrdMonster ? (
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
      ) : null}
    </Pressable>
  );
};
