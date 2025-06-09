import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Button, TouchableOpacity, ListRenderItem } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { CharacterCard } from '@/shared/components/CharacterCard/CharacterCard';
import { useCharacters } from '@/context/CharacterContext';
import { importCharacterFromFile } from '@/shared/services/fileSerice';

type Props = {
  navigation: any;
};

const STORAGE_KEY = 'DnD_Characters';

const Home: React.FC<Props> = ({ navigation }) => {
  const { characters, addCharacter } = useCharacters();
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
  }, [characters]);

  // const filtered = characters
  //   .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
  //   .sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));

  console.log('characters', characters);
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

      <FlatList
        data={characters}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CharacterCard character={item} key={item.id} />}
      />

      <View style={styles.buttonContainer}>
        <View style={{ height: 8 }} />
        <Button
          title='Імпортувати героя'
          onPress={async () => {
            const character = await importCharacterFromFile();
            if (character) addCharacter(character);
          }}
        />
        <View style={{ height: 8 }} />
        <Button title='Створити нового героя' onPress={() => navigation.navigate('CreateCharacter')} />
      </View>
    </View>
  );
};

export default Home;
