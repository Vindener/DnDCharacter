import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Button,TouchableOpacity } from 'react-native';
import useMonsterStore from '@/context/Monster-store';
import { MonsterCard } from '@/shared/components/MonsterCard/MonsterCard';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from './style';
import FileService from '@/shared/services/fileSerice';

const Bestiary = () => {
  const monsters = useMonsterStore((s) => s.monsters);
  const addMonster = useMonsterStore((s) => s.addMonster);
  const loadMonsters = useMonsterStore((s) => s.loadMonsters);
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadMonsters();
  }, []);

  const filtered = monsters.filter((m) => (m.name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={styles.container}>
      <View style={styles.topBar}></View>
      <TextInput placeholder='Пошук монстрів' placeholderTextColor='#888' style={styles.search} value={search} onChangeText={setSearch} />
      {!filtered || filtered.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: '#888', textAlign: 'center', marginBottom: 16 }}>
            Немає монстрів. Зайдіть у Налаштування, щоб імпортувати книжку, або створіть власних.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MonsterCard monster={item} />}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={async () => {
            const monster = await FileService.importMonsterFromFile();
            if (monster) await addMonster(monster);
          }}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 14,
            backgroundColor: colors.inputBackground,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
            marginTop: 10,
          }}
        >
          <Text style={{ color: colors.text, textAlign: 'center' }}>Імпортувати монстра</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            addMonster({
              id: Date.now().toString(),
              name: 'Monster',
              stats: {
                strength: 10,
                dexterity: 10,
                constitution: 10,
                intelligence: 10,
                wisdom: 10,
                charisma: 10,
              },
            });
          }}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 14,
            backgroundColor: colors.inputBackground,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
            marginTop: 10,
          }}
        >
          <Text style={{ color: colors.text, textAlign: 'center' }}>Додати монстра</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Bestiary;
