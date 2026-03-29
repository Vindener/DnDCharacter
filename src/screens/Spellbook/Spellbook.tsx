import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList } from 'react-native';
import useThemeStore from '@/context/Theme-store';
import useCharacterStore from '@/context/Character-store';
import { getStyles } from './styles';

type SpellItem = {
  key: string;
  name: string;
  source: string;
  listType: 'known' | 'prepared' | 'cantrip' | 'homebrew';
};

const Spellbook = () => {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => getStyles(colors), [colors]);
  const characters = useCharacterStore((s) => s.characters);
  const [search, setSearch] = useState('');

  const spells = useMemo<SpellItem[]>(() => {
    const result: SpellItem[] = [];

    characters.forEach((character) => {
      const name = character.name || 'Character';
      const known = character.spells?.knownSpells || [];
      const prepared = character.spells?.preparedSpells || [];
      const cantrips = character.spells?.cantrips || [];

      known.forEach((spell, index) => {
        result.push({ key: `${character.id}-k-${index}-${spell}`, name: spell, source: name, listType: 'known' });
      });
      prepared.forEach((spell, index) => {
        result.push({ key: `${character.id}-p-${index}-${spell}`, name: spell, source: name, listType: 'prepared' });
      });
      cantrips.forEach((spell, index) => {
        result.push({ key: `${character.id}-c-${index}-${spell}`, name: spell, source: name, listType: 'cantrip' });
      });
      (character.homebrewEntries || [])
        .filter((entry) => entry.kind === 'spell')
        .forEach((entry, index) => {
          result.push({
            key: `${character.id}-hb-${index}-${entry.id}`,
            name: entry.name,
            source: `${name} (homebrew)`,
            listType: 'homebrew',
          });
        });
    });

    const filter = search.trim().toLowerCase();
    if (!filter) return result;

    return result.filter((spell) => spell.name.toLowerCase().includes(filter) || spell.source.toLowerCase().includes(filter));
  }, [characters, search]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spellbook</Text>
      <Text style={styles.hint}>Швидкий список заклять з усіх локальних персонажів.</Text>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder='Пошук заклять'
        placeholderTextColor={colors.textSecondary}
        style={styles.search}
      />

      <FlatList
        data={spells}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.spellName}>{item.name}</Text>
            <Text style={styles.meta}>{item.listType} • {item.source}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Заклять поки немає. Додай spells у Character Sheet.</Text>}
      />
    </View>
  );
};

export default Spellbook;
