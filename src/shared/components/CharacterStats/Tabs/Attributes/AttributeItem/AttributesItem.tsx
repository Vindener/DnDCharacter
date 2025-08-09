import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import TextInput from '@/shared/components/TextInput/TextInput';
import { getStyles } from '@/shared/components/CharacterStats/Tabs/Attributes/AttributeItem/style';
import useThemeStore from '@/context/Theme-store';
import { calculateModifier } from '@/shared/helpers/calculateModifier';
import { StatKey } from '@/shared/const/attributes';
import RollResultModal from '@/shared/components/RollResultModal/RollResultModal';

interface AttributesItemProps {
  label: string;
  value: number;
  statKey: StatKey;
  onChange: (key: StatKey, value: number) => void;
}

export const AttributesItem: React.FC<AttributesItemProps> = ({ label, value, statKey, onChange }) => {
  const [inputValue, setInputValue] = useState(`${value}`);
  const [modifier, setModifier] = useState(calculateModifier(value));
  const [isVisible, setIsVisible] = useState(false);
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  useEffect(() => {
    setInputValue(`${value}`);
    setModifier(calculateModifier(value));
  }, [value]);

  const rollD20WithModifier = (mod: number) => {
    const random = Math.floor(Math.random() * 20) + 1;
    const modStr = mod >= 0 ? `+ ${mod}` : `- ${Math.abs(mod)}`;
    return { total: random + mod, formula: `${random} ${modStr}`, random };
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
      <TextInput value={inputValue} onChangeText={handleTextChange} onBlur={handleBlur} />
      <Text style={styles.modifier}>{modifier >= 0 ? `+${modifier}` : `${modifier}`}</Text>
      <TouchableOpacity style={styles.rollButton} onPress={() => setIsVisible(true)}>
        <Text style={styles.rollButtonText}>🎲</Text>
      </TouchableOpacity>
      <RollResultModal isVisible={isVisible} onClose={() => setIsVisible(false)} roll={() => rollD20WithModifier(modifier)} />
    </View>
  );
};
