import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getStyles } from './style';
import useThemeStore from '@/context/Theme-store';
import { CharacterViewModel } from '@/types/Character';
import { NativeStackNavigationProp } from 'react-native-screens/native-stack';
import type { TabStackParamList } from '@/navigation/TabNavigator';
import useCharacterStore from '@/context/Character-store';
import { CLASS_TRANSLATIONS, CLASS_OPTIONS } from '@/shared/const/CharacterClass';
import { subscribeCharacterSheet, deleteCharacterSheet } from '@/repositories/characterCloudRepository';

type NavigationProp = NativeStackNavigationProp<TabStackParamList, 'Character'>;

interface CharacterCardProps {
  character: CharacterViewModel;
}

// TODO fix any
export const CharacterCard = ({ character }: CharacterCardProps) => {
  const navigation = useNavigation<NavigationProp>();
  const removeCharacter = useCharacterStore((s: any) => s.removeCharacter);
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const setCurrentCharacterId = useCharacterStore((s) => s.setCurrentCharacterId);

  const [isShared, setIsShared] = useState(false);

  useEffect(() => {
    const unsub = subscribeCharacterSheet(character.id, (doc) => {
      setIsShared(!!doc && Array.isArray(doc.editors) && doc.editors.length > 0);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [character.id]);

  const handlePress = () => {
    setCurrentCharacterId(character.id);
    navigation.navigate('Character', { character });
  };

  const handleDelete = async () => {
    try {
      await deleteCharacterSheet(character.id);
    } catch (e) {}
    removeCharacter(character.id);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      {/* TODO - remove comment below after we add picture option */}
      {/*<Image*/}
      {/*  source={character.avatar ? { uri: character.avatar } : require('../../../assets/avatar-placeholder.png')}*/}
      {/*  style={styles.avatar}*/}
      {/*/>*/}
      <View style={styles.info}>
        <Text style={styles.name}>
          {character.name} {isShared ? '· Спільний' : ''}
        </Text>
        <Text style={styles.meta}>
          Рівень {character.level || 1} <Text style={styles.separator}>|</Text> {character.race || 'Людина'}
        </Text>
        <Text style={styles.classText}>{character.class || 'Клас'}</Text>
      </View>
      <TouchableOpacity onPress={handleDelete}>
        <Ionicons name='trash-outline' size={20} color={colors.text} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};




