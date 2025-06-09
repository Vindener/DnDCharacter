import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { CharacterDto } from '@/types/Character';
import { styles } from '@/shared/components/CharacterOverview/style';

interface CharacterStatsProps {
  character: CharacterDto;
}

const CharacterOverview: React.FC<CharacterStatsProps> = ({ character }: CharacterStatsProps) => {
  return (
    <ScrollView style={styles.content}>
      <View style={styles.statsRow}>
        <Text style={styles.attributes}>Швидкість: {character.speed ?? '-'}</Text>
        <Text style={styles.attributes}>Захист: {character.ac ?? '-'}</Text>
        <Text style={styles.attributes}>
          HP: {character.hp.current ?? '-'} / {character.hp.max ?? '-'}
        </Text>
        <Text style={styles.attributes}>Ініціатива: {character.initiative ?? '-'}</Text>
      </View>
    </ScrollView>
  );
};

export default CharacterOverview;
