import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { styles } from '@/shared/components/CharacterStats/Tabs/Attributes/AttributeItem/style';
import { useCharacters } from '@/context/CharacterContext';

interface AttributesItemProps {
  label: string;
  value: number;
}

export const AttributesItem: React.FC<AttributesItemProps> = ({ label, value }) => {
  const { characters, updateCharacter } = useCharacters();
  const modifier = Math.floor((value - 10) / 2);

  const rollD20WithModifier = (mod: number) => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + mod;
    console.log('Результат кидка', `Випав результат: ${roll} + ${mod}(мод.) = ${total}`);
    //   TODO - create custom modal for dice roll result
  };

  const handleTextChange = (text: string) => {
    const numericValue = parseInt(text, 10);
    if (!isNaN(numericValue)) {
      const index = 0;
      const character = characters[index];
      if (character) {
        const updatedCharacter = { ...character, [label.toLowerCase()]: numericValue };
        updateCharacter(index, updatedCharacter);
      }
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
