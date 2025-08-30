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
import { subscribeMySheets, subscribeSharedWithMe } from '@/services/characterSheets';
import { fbAuth } from '@/services/firebase';
import { onGoogleButtonPress } from '@/shared/services/auth/index';

const Home = () => {
  const navigation = useNavigation<StackNavigationProp<TabStackParamList>>();
  const setCurrentCharacterId = useCharacterStore((s) => s.setCurrentCharacterId);
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);
  const addCharacterToLocal = useCharacterStore((s) => s.addCharacter);
  const openRemote = async (item: any) => {
    const dto = mapRemoteToLocalDto(item);
    const existsLocal = characters.some(c => c.id === dto.id);
    try {
      if (existsLocal) await updateCharacter(dto.id, dto); else await addCharacterToLocal(dto);
      setCurrentCharacterId(dto.id);
      // @ts-ignore
      navigation.navigate('Character');
    } catch (e) { console.warn('[cloud-open] failed', e); }
  };
  function mapRemoteToLocalDto(d: any) {
    return {
      id: d.id,
      name: d.name || 'Character',
      class: d.class || '',
      race: d.race || '',
      level: d.level || 1,
      stats: d.stats || { charisma: 10, constitution: 10, dexterity: 10, intelligence: 10, strength: 10, wisdom: 10 },
      hp: d.hp || { current: 10, max: 10, temp: 0 },
      ac: d.ac || 10,
      inventory: Array.isArray(d.inventory) ? d.inventory : [],
      notes: d.notes || '',
    } as any;
  }

  const [viewMode, setViewMode] = useState<'local' | 'mine' | 'shared'>('local');
  const [myCloud, setMyCloud] = useState<any[]>([]);
  const [sharedCloud, setSharedCloud] = useState<any[]>([]);

  const combinedList = React.useMemo(() => {
    const byId: Record<string, any> = {};
    const push = (item: any, source: 'local' | 'mine' | 'shared') => {
      const id = item.id;
      const payload = { ...item, __source: source };
      // пріоритет відображення при дублях: shared > mine > local
      const rank = source === 'shared' ? 3 : source === 'mine' ? 2 : 1;
      const prev = byId[id] as any;
      if (!prev || (prev.__rank || 0) < rank) byId[id] = { ...payload, __rank: rank };
    };
    (characters || []).forEach((c) => push(c, 'local'));
    (myCloud || []).forEach((c) => push(c, 'mine'));
    (sharedCloud || []).forEach((c) => push(c, 'shared'));
    return Object.values(byId);
  }, [characters, myCloud, sharedCloud]);


  useEffect(() => {
    if (viewMode === 'mine') {
      const u = fbAuth.currentUser;
      if (!u) return;
      const unsub = subscribeMySheets(setMyCloud);
      return () => { if (typeof unsub === 'function') unsub(); };
    }
    if (viewMode === 'shared') {
      const u = fbAuth.currentUser;
      if (!u) return;
      const unsub = subscribeSharedWithMe(setSharedCloud);
      return () => { if (typeof unsub === 'function') unsub(); };
    }
  }, [viewMode]);
  const characters = useCharacterStore((s) => s.characters);
  const addCharacter = useCharacterStore((s) => s.addCharacter);
  const loadCharacters = useCharacterStore((s) => s.loadCharacters);
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    loadCharacters();
  }, []);

  const filtered = characters
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        {/* Перемикач джерела */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <TouchableOpacity onPress={() => setViewMode('local')}>
            <Text style={{ color: viewMode === 'local' ? '#2f95dc' : '#888' }}>Локальні</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (fbAuth.currentUser) setViewMode('mine');
              else onGoogleButtonPress().catch(() => {});
            }}
          >
            <Text style={{ color: viewMode === 'mine' ? '#2f95dc' : '#888' }}>Мої в хмарі</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (fbAuth.currentUser) setViewMode('shared');
              else onGoogleButtonPress().catch(() => {});
            }}
          >
            <Text style={{ color: viewMode === 'shared' ? '#2f95dc' : '#888' }}>Поділені зі мною</Text>
          </TouchableOpacity>
          <View style={styles.slotBadge}>
            <Text style={styles.slotText}>Слотів: {characters.length}/15</Text>
          </View>
        </View>
      </View>
      <Text style={styles.sortLabel}>Ім'я: </Text>
      <TouchableOpacity onPress={() => setSortAsc((s) => !s)}>
        <Text style={styles.sortValue}>
          {sortAsc ? 'А - Я' : 'Я - А'} <Ionicons name='chevron-up' size={14} color='#2f95dc' />
        </Text>
      </TouchableOpacity>

      <View style={styles.topBar}></View>

      {viewMode !== 'local' ? (
        <>
          {!fbAuth.currentUser ? (
            <View style={{ padding: 12 }}>
              <Text style={{ marginBottom: 8 }}>Щоб бачити хмарні персонажі, увійдіть у обліковий запис.</Text>
              <Button title='Увійти через Google' onPress={() => onGoogleButtonPress().catch(() => {})} />
            </View>
          ) : (
            <FlatList
              data={combinedList.filter(
                (item: any) =>
                  item.name?.toLowerCase?.().includes(search.toLowerCase()) ||
                  item.race?.toLowerCase?.().includes(search.toLowerCase()) ||
                  item.class?.toLowerCase?.().includes(search.toLowerCase()),
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 120 }}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => openRemote(item)} style={{ padding: 12, borderRadius: 12, backgroundColor: '#111' }}>
                  <Text style={{ color: 'white', fontWeight: '600' }}>{item.name || 'Character'}</Text>
                  <Text style={{ color: '#999' }}>
                    {item.class || ''} {item.race || ''} · lvl {item.level || 1}
                  </Text>
                  {viewMode === 'shared' ? <Text style={{ color: '#2f95dc', marginTop: 4 }}>Shared with you</Text> : null}
                  <Text style={{ color: '#999', marginTop: 2 }}>
                    {item.__source === 'shared' ? 'Поділено з вами' : item.__source === 'mine' ? 'Мій (хмара)' : 'Локальний'}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </>
      ) : (
        <>
          <TextInput placeholder='Пошук героїв' placeholderTextColor='#888' style={styles.search} value={search} onChangeText={setSearch} />

          {!filtered || filtered.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <Text style={{ color: '#888', textAlign: 'center', marginBottom: 16 }}>
                Немає персонажів. Імпортуйте або створіть власних.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => <CharacterCard character={item} />}
              contentContainerStyle={{ paddingBottom: 120 }}
            />
          )}
        </>
      )}

      <View style={styles.buttonContainer}>
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