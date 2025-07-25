import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ListRenderItem } from 'react-native';
import { getStyles } from './styles';
import useThemeStore from '@/context/Theme-store';

const diceTypes: number[] = [4, 6, 8, 10, 12, 20];

const DiceRoller: React.FC = () => {
  const [result, setResult] = useState<number | null>(null);
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const rollDice = (sides: number) => {
    setResult(Math.floor(Math.random() * sides) + 1);
  };

  const renderItem: ListRenderItem<number> = ({ item }) => (
    <TouchableOpacity style={styles.diceButton} onPress={() => rollDice(item)}>
      <Text style={styles.diceText}>К{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Вибери кубик:</Text>
      <FlatList data={diceTypes} keyExtractor={(item) => item.toString()} renderItem={renderItem} />
      {result !== null && <Text style={styles.result}>Результат: {result}</Text>}
    </View>
  );
};

export default DiceRoller;
