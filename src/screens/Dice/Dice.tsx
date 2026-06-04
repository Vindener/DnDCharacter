import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { getStyles } from './styles';
import useThemeStore from '@/context/Theme-store';
import { parseDiceType, rollDice as rollDiceServiceCore } from '@/shared/services/diceRoller';

interface DiceProps {
  route?: {
    params: {
      sides?: number;
    };
  };
  sides?: number;
  onRoll?: (value: number) => void;
}

const Dice: React.FC<DiceProps> = ({ route, sides: propSides, onRoll }) => {
  const sides = propSides ?? route?.params?.sides ?? 6;
  const [result, setResult] = useState<number | null>(null);
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const rollDice = useCallback(() => {
    const value = rollSingleDie(sides);
    setResult(value);
    onRoll?.(value);
  }, [onRoll, sides]);

  useEffect(() => {
    rollDice();
  }, [rollDice]);

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

function rollSingleDie(sides: number): number {
  const dice = parseDiceType(sides);
  return rollDiceServiceCore({ dice, count: 1 }).total;
}

export default Dice;
