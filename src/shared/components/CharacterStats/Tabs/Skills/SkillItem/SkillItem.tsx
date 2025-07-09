import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from './style';
import { Modal } from '@/shared/components/Modal/Modal';
import Loader from '@/shared/components/Loader/Loader';

interface SkillItemProps {
  label: string;
  value: number;
  skillKey: string;
  onChange: (key: string, value: number) => void;
}

export const SkillItem: React.FC<SkillItemProps> = ({ label, value, skillKey, onChange }) => {
  const [inputValue, setInputValue] = useState(`${value}`);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setInputValue(`${value}`);
  }, [value]);

  const rollD20WithModifier = (mod: number) => {
    return Math.floor(Math.random() * 20) + 1 + mod;
  };

  const handleTextChange = (text: string) => {
    setInputValue(text);
  };

  const handleBlur = () => {
    const numericValue = parseInt(inputValue, 10);
    if (!isNaN(numericValue)) {
      onChange(skillKey, numericValue);
    } else {
      setInputValue(`${value}`);
    }
  };

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} keyboardType='numeric' value={inputValue} onChangeText={handleTextChange} onBlur={handleBlur} />
      <TouchableOpacity style={styles.rollButton} onPress={() => setIsVisible(true)}>
        <Text style={styles.rollButtonText}>🎲</Text>
      </TouchableOpacity>
      <Modal isVisible={isVisible} onClose={() => setIsVisible(false)}>
        <Loader />
        <Text style={styles.rollResult}>Roll result: {rollD20WithModifier(parseInt(inputValue, 10) || 0)}</Text>
      </Modal>
    </View>
  );
};
