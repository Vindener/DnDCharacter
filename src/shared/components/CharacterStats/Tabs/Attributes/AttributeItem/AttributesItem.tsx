import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '@/shared/components/CharacterStats/Tabs/Attributes/AttributeItem/style';
import { calculateModifier } from '@/shared/helpers/calculateModifier';
import { StatKey } from '@/shared/const/attributes';

interface AttributesItemProps {
  label: string;
  value: number;
  statKey: StatKey;
  onChange: (key: StatKey, value: number) => void;
}

export const AttributesItem: React.FC<AttributesItemProps> = ({ label, value, statKey, onChange }) => {
  const [inputValue, setInputValue] = useState(`${value}`);
  const [modifier, setModifier] = useState(calculateModifier(value));

  useEffect(() => {
    setInputValue(`${value}`);
    setModifier(calculateModifier(value));
  }, [value]);

  const rollD20WithModifier = (mod: number) => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + mod;
    console.log(`Roll: ${roll} + Modifier: ${mod} = Total: ${total}`);
  };

  const handleTextChange = (text: string) => {
    setInputValue(text);
    const numericValue = parseInt(text, 10);
    if (!isNaN(numericValue)) {
      setModifier(calculateModifier(numericValue));
    } else {
      setModifier(calculateModifier(value));
    }
  };

  const handleBlur = () => {
    const numericValue = parseInt(inputValue, 10);
    if (!isNaN(numericValue)) {
      onChange(statKey, numericValue);
    } else {
      setInputValue(`${value}`);
      setModifier(calculateModifier(value));
    }
  };

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} keyboardType='numeric' value={inputValue} onChangeText={handleTextChange} onBlur={handleBlur} />
      <Text style={styles.modifier}>{modifier >= 0 ? `+${modifier}` : `${modifier}`}</Text>
      <TouchableOpacity style={styles.rollButton} onPress={() => rollD20WithModifier(modifier)}>
        <Text style={styles.rollButtonText}>🎲</Text>
      </TouchableOpacity>
    </View>
  );
};
