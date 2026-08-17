import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import TextInput from '@/shared/components/TextInput/TextInput';
import { getStyles } from './style';
import useThemeStore from '@/context/Theme-store';
import RollResultModal from '@/shared/components/RollResultModal/RollResultModal';

interface SkillItemProps {
  label: string;
  value: number;
  skillKey: string;
  onChange: (key: string, value: number) => void;
}

export const SkillItem: React.FC<SkillItemProps> = ({ label, value, skillKey, onChange }) => {
  const [inputValue, setInputValue] = useState(`${value}`);
  const [isVisible, setIsVisible] = useState(false);
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  useEffect(() => {
    setInputValue(`${value}`);
  }, [value]);

  const rollD20WithModifier = (mod: number) => {
    const random = Math.floor(Math.random() * 20) + 1;
    const modStr = mod >= 0 ? `+ ${mod}` : `- ${Math.abs(mod)}`;
    return { total: random + mod, formula: `${random} ${modStr}`, random };
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
      <TextInput value={inputValue} onChangeText={handleTextChange} onBlur={handleBlur} />
      <TouchableOpacity style={styles.rollButton} onPress={() => setIsVisible(true)}>
        <Text style={styles.rollButtonText}>🎲</Text>
      </TouchableOpacity>
      <RollResultModal
        isVisible={isVisible}
        onClose={() => setIsVisible(false)}
        roll={() => rollD20WithModifier(parseInt(inputValue, 10) || 0)}
      />
    </View>
  );
};
