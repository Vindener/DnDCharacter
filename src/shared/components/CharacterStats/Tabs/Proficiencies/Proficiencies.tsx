import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { styles } from '@/shared/components/CharacterStats/Tabs/Proficiencies/style';
import { CharacterDto } from '@/types/Character';
import useCharacterStore from '@/context/Character-store';

interface ProficienciesProps {
  data: CharacterDto;
}

const Proficiencies: React.FC<ProficienciesProps> = ({ data }: ProficienciesProps) => {
  const updateCharacterProficiencies = useCharacterStore((s) => s.updateCharacterProficiencies);
  const character = useCharacterStore((s) => s.characters.find((c) => c.id === data.id));

  const proficienciesText = (character?.proficiencies || []).join('\n');

  const handleChange = (text: string) => {
    const proficienciesArray = text.split('\n').filter((line) => line.trim() !== '');
    updateCharacterProficiencies(data.id, proficienciesArray);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Професійні навички персонажа:</Text>
      <TextInput
        style={styles.memoInput}
        multiline={true}
        numberOfLines={6}
        value={proficienciesText}
        onChangeText={handleChange}
        placeholder='Введіть навички персонажа'
        placeholderTextColor='#888'
        blurOnSubmit={false}
        returnKeyType='default'
        textAlignVertical='top'
        enablesReturnKeyAutomatically={false}
      />
    </View>
  );
};

export default Proficiencies;
