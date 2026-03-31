// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { WEAPONS_DB } from '@/shared/const/WeaponsDb';
import MultiTextInput  from '@/shared/components/TextInput/MultiTextInput';
import { getStyles } from '@/shared/components/CharacterStats/Tabs/style';
import useThemeStore from '@/context/Theme-store';
import { CharacterViewModel } from '@/types/Character';
import useCharacterStore from '@/context/Character-store';
import { Ionicons } from '@expo/vector-icons';
import Weapon from '../Weapons/Weapon';

interface InventoryProps {
  data: CharacterViewModel;
}

const Inventory: React.FC<InventoryProps> = ({ data }) => {
  const updateCharacterInventory = useCharacterStore((s) => s.updateCharacterInventory);
  const character = useCharacterStore((s) => s.characters.find((c) => c.id === data.id));
  const updateCharacterWeapons = useCharacterStore((s) => s.updateCharacterWeapons);
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  
  const [items, setItems] = useState<string[]>(character?.inventory || []);

  const autoMoveIfWeapon = (text: string) => {
    const norm = (text || '').trim().toLowerCase();
    if (!norm) return false;
    // find by exact name (UA) case-insensitive
    const entry = WEAPONS_DB.find(w => w.name.toLowerCase() === norm);
    if (!entry) return false;
    // Move to weapons list
    const currentWeapons = character?.weapons || [];
    updateCharacterWeapons(data.id, [...currentWeapons, { name: entry.name, attackBonus: 0, damage: entry.damage }]);
    Alert.alert('Переміщено', `“${entry.name}” додано до розділу Зброя`);
    return true;
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, '']); // додаємо пустий рядок
  };

  const handleChangeItem = (text: string, index: number) => {
    const newItems = [...items];
    newItems[index] = text;
    // If weapon recognized, remove from inventory and move to weapons
    if (autoMoveIfWeapon(text)) {
      newItems.splice(index, 1);
    }
    setItems(newItems);
    updateCharacterInventory(data.id, newItems);
  };

  const handleDeleteItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
    updateCharacterInventory(data.id, newItems);
  };

  return (
    <View style={styles.container}>
      <Weapon data={data} />

      <Text style={styles.label}>Інвентар персонажа:</Text>

      <FlatList
        data={items}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={({ item, index }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <MultiTextInput
              multiline={false}
              numberOfLines={8}
              style={{ flex: 1, height: 40 }}
              value={item}
              onChangeText={(text) => handleChangeItem(text, index)}
              placeholder='Назва предмета'
            />
            <TouchableOpacity onPress={() => handleDeleteItem(index)} style={{ marginLeft: 8 }}>
              <Ionicons name='trash-outline' size={24} color='#d00' />
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity
        onPress={handleAddItem}
        style={{
          marginTop: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Ionicons name='add-circle-outline' size={28} color='#28a745' />
        <Text style={{ marginLeft: 8, color: '#28a745', fontSize: 16 }}>Додати предмет</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Inventory;

