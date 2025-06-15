import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '@/shared/components/CharacterStats/Tabs/Attributes/AttributeItem/style';
import useCharacterStore from '@/context/CharacterContext';

interface AttributesItemProps {
  label: string;
  value: number;
}

export const AttributesItem: React.FC<AttributesItemProps> = ({ label, value }) => {
  const updateCharacter = useCharacterStore((s: any) => s.updateCharacter);
  const character = useCharacterStore((s: any) => s.selectedCharacter);
  const modifier = Math.floor((value - 10) / 2);

  const rollD20WithModifier = (mod: number) => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + mod;
    console.log('Результат кидка', `Випав результат: ${roll} + ${mod}(мод.) = ${total}`);
    //   TODO add custom modal here
  };

  const handleTextChange = (text: string) => {
    const numericValue = parseInt(text, 10);
    if (!isNaN(numericValue) && character) {
      const updatedCharacter = { ...character, [label.toLowerCase()]: numericValue };
      updateCharacter(updatedCharacter);
    }
  };

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} keyboardType='numeric' value={`${value}`} onChangeText={handleTextChange} />
      <Text style={styles.modifier}>{modifier >= 0 ? `+${modifier}` : modifier}</Text>
      <TouchableOpacity style={styles.rollButton} onPress={() => rollD20WithModifier(modifier)}>
        <Text style={styles.rollButtonText}>🎲</Text>
      </TouchableOpacity>
    </View>
  );
};
