import React from 'react';
import { Text, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { CharacterContentSourceRef } from '@/types/Character';

type CharacterSourceBadgeProps = {
  source?: CharacterContentSourceRef;
  id: string;
  styles: {
    rankBadge: StyleProp<ViewStyle>;
    rankBadgeText: StyleProp<TextStyle>;
  };
};

export function getCharacterSourceBadgeLabel(
  source: CharacterContentSourceRef | undefined,
  t: (key: string) => string,
): string | null {
  if (!source) return null;
  if (source.origin === 'srd-5.1' || source.source === 'srd-5.1') return t('badges.srd51');
  if (source.origin === 'homebrew' || source.source === 'homebrew') return t('badges.homebrew');
  if (source.origin === 'custom') return t('badges.custom');
  if (source.origin === 'legacy-custom' || source.legacyCustom) return t('badges.legacyCustom');
  return null;
}

export function CharacterSourceBadge({ source, id, styles }: CharacterSourceBadgeProps) {
  const { t } = useTranslation('character');
  const label = getCharacterSourceBadgeLabel(source, t);
  if (!label) return null;

  return (
    <View style={styles.rankBadge} testID={`character.sourceBadge.${id}`}>
      <Text style={styles.rankBadgeText}>{label}</Text>
    </View>
  );
}
