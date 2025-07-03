import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { styles } from '@/shared/components/CharacterStats/Tabs/style';
import { CharacterDto } from '@/types/Character';
import useCharacterStore from '@/context/Character-store';
import { Ionicons } from '@expo/vector-icons';

interface InventoryProps {
  data: CharacterDto;
}

const Inventory: React.FC<InventoryProps> = ({ data }) => {
  const updateCharacterInventory = useCharacterStore((s) => s.updateCharacterInventory);
  const character = useCharacterStore((s) => s.characters.find((c) => c.id === data.id));

  const [items, setItems] = useState<string[]>(character?.inventory || []);

  const handleAddItem = () => {
    setItems((prev) => [...prev, '']); // додаємо пустий рядок
  };

  const handleChangeItem = (text: string, index: number) => {
    const newItems = [...items];
    newItems[index] = text;
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
      <Text style={styles.label}>Інвентар персонажа:</Text>

      <FlatList
        data={items}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={({ item, index }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <TextInput
              style={[styles.memoInput, { flex: 1, height: 40 }]}
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
