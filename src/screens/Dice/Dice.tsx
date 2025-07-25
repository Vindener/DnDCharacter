import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ListRenderItem } from 'react-native';
import useThemeStore from '@/context/Theme-store';

const diceTypes: number[] = [4, 6, 8, 10, 12, 20];

const DiceRoller: React.FC = () => {
  const [result, setResult] = useState<number | null>(null);
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => useStyles(colors), [colors]);

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

const useStyles = (c: ReturnType<typeof useThemeStore>['colors']) =>
StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  title: { fontSize: 20, marginBottom: 16, textAlign: 'center' },
  diceButton: {
    padding: 16,
    marginVertical: 4,
    backgroundColor: '#2f95dc',
    borderRadius: 8,
    alignItems: 'center',
  },
  diceText: { fontSize: 18, color: c.text },
  result: { fontSize: 22, textAlign: 'center', marginTop: 16, color: c.text },
});

export default DiceRoller;
