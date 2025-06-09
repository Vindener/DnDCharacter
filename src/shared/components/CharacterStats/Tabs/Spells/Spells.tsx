import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { styles } from '@/shared/components/CharacterStats/Tabs/Spells/style';
import { CharacterDto } from '@/types/Character';

interface SpellsProps {
  data: CharacterDto;
}

const Spells: React.FC<SpellsProps> = ({ data }: SpellsProps) => {
  const handleSpellChange = (text: string) => {
    // TODO
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Закляття персонажа:</Text>
      <TextInput
        style={styles.memoInput}
        multiline
        numberOfLines={6}
        value={data.spells || ''}
        onChangeText={handleSpellChange}
        placeholder='Введіть список заклять'
        placeholderTextColor='#888'
      />
    </View>
  );
};

export default Spells;
