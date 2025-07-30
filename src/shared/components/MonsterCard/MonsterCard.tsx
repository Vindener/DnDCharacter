import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/stack';
import type { BestiaryStackParamList } from '@/navigation/BestiaryNavigator';
import { getStyles } from './style';
import useThemeStore from '@/context/Theme-store';
import { MonsterDto } from '@/types/Monster';
import useMonsterStore from '@/context/Monster-store';

interface MonsterCardProps {
  monster: MonsterDto;
}

export const MonsterCard = ({ monster }: MonsterCardProps) => {
  const navigation = useNavigation<NativeStackNavigationProp<BestiaryStackParamList, 'List'>>();
  const removeMonster = useMonsterStore((s) => s.removeMonster);
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const handleDelete = () => {
    removeMonster(monster.id);
  };

  const handlePress = () => {
    navigation.navigate('Monster', { monster });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      {monster.photoUri ? <Image source={{ uri: monster.photoUri }} style={styles.avatar} /> : <View style={styles.avatar} />}
      <View style={styles.info}>
        <Text style={styles.name}>{monster.name}</Text>
        <Text style={styles.meta}>{monster.type || ''}</Text>
      </View>
      <TouchableOpacity onPress={handleDelete}>
        <Ionicons name='trash-outline' size={20} color={colors.text} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};
