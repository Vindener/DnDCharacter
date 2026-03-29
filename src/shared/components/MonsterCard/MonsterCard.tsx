import React from 'react';
import { View, Text, TouchableOpacity, Image, Pressable } from 'react-native';
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
  isPinned?: boolean;
  onTogglePin?: (monsterId: string) => void;
}

export const MonsterCard = ({ monster, isPinned = false, onTogglePin }: MonsterCardProps) => {
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
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.88}>
      {monster.photoUri ? <Image source={{ uri: monster.photoUri }} style={styles.avatar} /> : <View style={styles.avatar} />}
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{monster.name}</Text>
          {!!onTogglePin && (
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onTogglePin(monster.id);
              }}
              style={styles.pinButton}
              android_ripple={{ color: '#888' }}
            >
              <Ionicons name={isPinned ? 'bookmark' : 'bookmark-outline'} size={16} color={colors.text} />
              <Text style={styles.pinText}>{isPinned ? 'Pinned' : 'Pin'}</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.meta}>{monster.type || 'Type unknown'}</Text>
        <View style={styles.quickRow}>
          <Text style={styles.quickMeta}>CR {monster.challenge || '—'}</Text>
          <Text style={styles.quickMeta}>AC {monster.armorClass ?? '—'}</Text>
          <Text style={styles.quickMeta}>HP {monster.hitPoints ?? '—'}</Text>
        </View>
        {!!monster.environment && <Text style={styles.meta}>Env: {monster.environment}</Text>}
        {!!monster.source && <Text style={styles.meta}>Source: {monster.source}</Text>}
        {!!monster.tags?.length && <Text style={styles.meta}>Tags: {monster.tags.join(', ')}</Text>}
      </View>
      <TouchableOpacity
        onPress={(event) => {
          event.stopPropagation();
          handleDelete();
        }}
        style={styles.deleteButton}
      >
        <Ionicons name='trash-outline' size={20} color={colors.text} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};
