import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Button } from 'react-native';
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

  const filtered = monsters.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={{ color: colors.text }}>Бестіарій</Text>
      </View>
      <TextInput placeholder='Пошук монстрів' placeholderTextColor='#888' style={styles.search} value={search} onChangeText={setSearch} />
      <FlatList data={filtered} keyExtractor={(item) => item.id} renderItem={({ item }) => <MonsterCard monster={item} />} />
      <View style={styles.buttonContainer}>
        <View style={{ height: 8 }} />
        <Button
          title='Імпортувати монстра'
          onPress={async () => {
            const monster = await FileService.importMonsterFromFile();
            if (monster) await addMonster(monster);
          }}
        />
        <View style={{ height: 8 }} />
        <Button
          title='Додати монстра'
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
        />
      </View>
    </View>
  );
};

export default Bestiary;
