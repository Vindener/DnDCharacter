import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '@/shared/components/CharacterStats/Tabs/Attributes/AttributeItem/style';
import useCharacterStore from '@/context/CharacterContext';
import { Modal } from '@/shared/components/Modal/Modal';
import Loader from '@/shared/components/Loader/Loader';

interface AttributesItemProps {
  label: string;
  value: number;
}

export const AttributesItem: React.FC<AttributesItemProps> = ({ label, value }) => {
  const updateCharacter = useCharacterStore((s: any) => s.updateCharacter);
  const character = useCharacterStore((s: any) => s.selectedCharacter);
  const modifier = Math.floor((value - 10) / 2);
  const [isVisible, setIsVisible] = useState(false);

  const rollD20WithModifier = (mod: number) => {
    return Math.floor(Math.random() * 20) + 1 + mod;
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
      <TouchableOpacity style={styles.rollButton} onPress={() => setIsVisible(true)}>
        <Text style={styles.rollButtonText}>🎲</Text>
      </TouchableOpacity>
      <Modal
        isVisible={isVisible}
        onClose={() => setIsVisible(false)}
      >
        <Loader/>
        <Text style={styles.rollResult}>Roll result: {rollD20WithModifier(modifier)}</Text>
      </Modal>
    </View>
  );
};
