import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { styles } from '@/shared/components/CharacterStats/Tabs/style';
import { CharacterDto } from '@/types/Character';
import useCharacterStore from '@/context/Character-store';
import { Traits as TraitsType } from '@/types/Traits';

interface TraitsProps {
  data: CharacterDto;
}

const Traits: React.FC<TraitsProps> = ({ data }: TraitsProps) => {
  const updateCharacterTraits = useCharacterStore((s) => s.updateCharacterTraits);
  const character = useCharacterStore((s) => s.characters.find((c) => c.id === data.id));
  const traits = character?.traits ?? ({ personality: '', ideals: '', bonds: '', flaws: '' } as TraitsType);

  const handleChange = (key: keyof TraitsType, value: string) => {
    const newTraits = { ...traits, [key]: value } as TraitsType;
    updateCharacterTraits(data.id, newTraits);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Риси характеру:</Text>
      <TextInput
        style={styles.memoInput}
        multiline
        numberOfLines={2}
        value={traits.personality}
        onChangeText={(text) => handleChange('personality', text)}
        placeholder='Введіть особистість'
        placeholderTextColor='#888'
        returnKeyType='default'
        textAlignVertical='top'
        enablesReturnKeyAutomatically={false}
      />

      <Text style={styles.label}>Ідеали:</Text>
      <TextInput
        style={styles.memoInput}
        multiline
        numberOfLines={2}
        value={traits.ideals}
        onChangeText={(text) => handleChange('ideals', text)}
        placeholder='Введіть ідеали'
        placeholderTextColor='#888'
        returnKeyType='default'
        textAlignVertical='top'
        enablesReturnKeyAutomatically={false}
      />

      <Text style={styles.label}>Зв`язки:</Text>
      <TextInput
        style={styles.memoInput}
        multiline
        numberOfLines={2}
        value={traits.bonds}
        onChangeText={(text) => handleChange('bonds', text)}
        placeholder='Введіть зв`язки'
        placeholderTextColor='#888'
        returnKeyType='default'
        textAlignVertical='top'
        enablesReturnKeyAutomatically={false}
      />

      <Text style={styles.label}>Вади:</Text>
      <TextInput
        style={styles.memoInput}
        multiline
        numberOfLines={2}
        value={traits.flaws}
        onChangeText={(text) => handleChange('flaws', text)}
        placeholder='Введіть вади'
        placeholderTextColor='#888'
        returnKeyType='default'
        textAlignVertical='top'
        enablesReturnKeyAutomatically={false}
      />
    </View>
  );
};

export default Traits;
