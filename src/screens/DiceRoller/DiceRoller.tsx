import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ListRenderItem } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getStyles } from './styles';
import useThemeStore from '@/context/Theme-store';
import type { TabStackParamList } from '@/navigation/TabNavigator';

const diceTypes: number[] = [4, 6, 8, 10, 12, 20];

const DiceRoller: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<TabStackParamList, 'DiceRoller'>>();
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const renderItem: ListRenderItem<number> = ({ item }) => (
    <TouchableOpacity style={styles.diceButton} onPress={() => navigation.navigate('Dice', { sides: item })}>
      <Text style={styles.diceText}>К{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Вибери кубик:</Text>
      <FlatList data={diceTypes} keyExtractor={(item) => item.toString()} renderItem={renderItem} />
    </View>
  );
};

export default DiceRoller;
