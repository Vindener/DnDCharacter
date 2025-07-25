import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Button, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStyles } from './styles';
import useThemeStore from '@/context/Theme-store';
import { CharacterCard } from '@/shared/components/CharacterCard/CharacterCard';
import useCharacterStore from '@/context/Character-store';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import type { TabStackParamList } from '@/navigation/TabNavigator';
import FileService from '@/shared/services/fileSerice';

const Home = () => {
  const characters = useCharacterStore((s) => s.characters);
  const addCharacter = useCharacterStore((s) => s.addCharacter);
  const loadCharacters = useCharacterStore((s) => s.loadCharacters);
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const navigation = useNavigation<StackNavigationProp<TabStackParamList, 'Home'>>();

  useEffect(() => {
    loadCharacters();
  }, []);

  const filtered = characters
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.sortLabel}>Ім'я: </Text>
        <TouchableOpacity onPress={() => setSortAsc((s) => !s)}>
          <Text style={styles.sortValue}>
            {sortAsc ? 'A - Z' : 'Z - A'} <Ionicons name='chevron-up' size={14} color='#2f95dc' />
          </Text>
        </TouchableOpacity>
        <View style={styles.slotBadge}>
          <Text style={styles.slotText}>Slots: {characters.length}/15</Text>
        </View>
      </View>

      <TextInput placeholder='Пошук героїв' placeholderTextColor='#888' style={styles.search} value={search} onChangeText={setSearch} />

      <FlatList data={filtered} keyExtractor={(item) => String(item.id)} renderItem={({ item }) => <CharacterCard character={item} />} />

      <View style={styles.buttonContainer}>
        <View style={{ height: 8 }} />
        <Button
          title='Імпортувати героя'
          onPress={async () => {
            const character = await FileService.importCharacterFromFile();
            if (character) await addCharacter(character);
          }}
        />
        <View style={{ height: 8 }} />
        <Button title='Створити нового героя' onPress={() => navigation.navigate('CreateCharacter')} />
      </View>
    </View>
  );
};

export default Home;
