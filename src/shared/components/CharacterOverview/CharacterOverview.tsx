import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import useCharacterStore from '@/context/Character-store';
import { styles } from '@/shared/components/CharacterOverview/style';


const CharacterOverview: React.FC = () => {
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId);
  const character = useCharacterStore((s) => s.characters.find((c) => c.id === currentCharacterId));

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
