import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { styles } from './style';
import { useCharacters } from '@/context/CharacterContext';
import { CharacterDto } from '@/types/Character';
import { NativeStackNavigationProp } from 'react-native-screens/native-stack';
import { TabStackParamList } from '@/navigation/TabNavigator';

type NavigationProp = NativeStackNavigationProp<TabStackParamList, 'Character'>;

interface CharacterCardProps {
  character: CharacterDto;
}

export const CharacterCard = ({ character }: CharacterCardProps) => {
  const navigation = useNavigation<NavigationProp>();
  const { characters, removeCharacter, updateCharacter } = useCharacters();
  const newChar = character;

  const handlePress = () => {
    navigation.navigate('Character', { character });
  };

  // TODO move this logic to store and just import deleteCharacter here
  // not sure if it should be done since we will use Zustand
  const handleDelete = () => {
    const index = characters.findIndex((c: any) => c.id === character.id);
    if (index !== -1) removeCharacter(index);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      {/* TODO - remove comment below after we add picture option */}
      {/*<Image*/}
      {/*  source={character.avatar ? { uri: character.avatar } : require('../../../assets/avatar-placeholder.png')}*/}
      {/*  style={styles.avatar}*/}
      {/*/>*/}
      <View style={styles.info}>
        <Text style={styles.name}>{character.name}</Text>
        <Text style={styles.meta}>
          Рівень {character.level || 1} <Text style={styles.separator}>|</Text> {character.race || 'Людина'}
        </Text>
        <Text style={styles.classText}>{character.class || 'Клас'}</Text>
      </View>
      <TouchableOpacity onPress={handleDelete}>
        <Ionicons name='ellipsis-vertical' size={20} color='white' />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};
