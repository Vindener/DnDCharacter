import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('dice');
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
      <Text style={styles.title}>{t('labels.dieTitle', { sides })}</Text>
      {result !== null && <Text style={styles.result}>{t('labels.simpleResult', { result })}</Text>}
      <TouchableOpacity onPress={rollDice} style={styles.rollButton}>
        <Text style={styles.rollButtonText}>{t('actions.rollAgain')}</Text>
      </TouchableOpacity>
    </View>
  );
};

function rollSingleDie(sides: number): number {
  const dice = parseDiceType(sides);
  return rollDiceServiceCore({ dice, count: 1 }).total;
}

export default Dice;
