import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import useCharacterStore from '@/context/Character-store';
import { getStyles } from '@/shared/components/CharacterOverview/style';
import useThemeStore from '@/context/Theme-store';

const CharacterOverview: React.FC = () => {
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId);
  const character = useCharacterStore((s) => s.characters.find((c) => c.id === currentCharacterId));
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  if (!character) return null;
  return (
    <ScrollView style={styles.content}>
      <View style={styles.statsRow}>
        <Text style={styles.attributes}>Швидкість: {character.speed ?? '-'}</Text>
        <Text style={styles.attributes}>Захист: {character.ac ?? '-'}</Text>
        <Text style={styles.attributes}>
          HP: {character?.hp?.current ?? '-'} / {character?.hp?.max ?? '-'}
        </Text>
        <Text style={styles.attributes}>Ініціатива: {character.initiative ?? '-'}</Text>
      </View>
    </ScrollView>
  );
};

export default CharacterOverview;
