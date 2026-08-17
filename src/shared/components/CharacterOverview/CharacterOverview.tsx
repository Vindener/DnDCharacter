import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import useCharacterStore from '@/context/Character-store';
import { getStyles } from '@/shared/components/CharacterOverview/style';
import useThemeStore from '@/context/Theme-store';

const CharacterOverview: React.FC = () => {
  const { t } = useTranslation('character');
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId);
  const character = useCharacterStore((s) => s.characters.find((c) => c.id === currentCharacterId));
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  if (!character) return null;
  return (
    <ScrollView style={styles.content}>
      <View style={styles.statsRow}>
        <Text style={styles.attributes}>{t('legacy.overview.speed', { value: character.speed ?? '-' })}</Text>
        <Text style={styles.attributes}>{t('legacy.overview.ac', { value: character.ac ?? '-' })}</Text>
        <Text style={styles.attributes}>
          HP: {character?.hp?.current ?? '-'} / {character?.hp?.max ?? '-'}
        </Text>
        <Text style={styles.attributes}>{t('legacy.overview.initiative', { value: character.initiative ?? '-' })}</Text>
      </View>
    </ScrollView>
  );
};

export default CharacterOverview;
