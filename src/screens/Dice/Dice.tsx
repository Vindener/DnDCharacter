import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { getStyles } from './styles';
import useThemeStore from '@/context/Theme-store';

interface DiceProps {
  route: {
    params: {
      sides: number;
    };
  };
}

const Dice: React.FC<DiceProps> = ({ route }) => {
  const { sides } = route.params;
  const [result, setResult] = useState<number | null>(null);
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const rollDice = () => {
    setResult(Math.floor(Math.random() * sides) + 1);
  };

  useEffect(() => {
    rollDice();
  }, [sides]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>К{sides}</Text>
      {result !== null && <Text style={styles.result}>Результат: {result}</Text>}
      <TouchableOpacity onPress={rollDice} style={styles.rollButton}>
        <Text style={styles.rollButtonText}>Кинути ще раз</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Dice;
