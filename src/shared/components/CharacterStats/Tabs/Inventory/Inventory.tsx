import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { styles } from '@/shared/components/CharacterStats/Tabs/Spells/style';
import { CharacterDto } from '@/types/Character';
import useCharacterStore from '@/context/Character-store';

interface InventoryProps {
  data: CharacterDto;
}

const Inventory: React.FC<InventoryProps> = ({ data }) => {
  const updateCharacterInventory = useCharacterStore((s) => s.updateCharacterInventory);
  const character = useCharacterStore((s) => s.characters.find((c) => c.id === data.id));

  const inventoryText = (character?.inventory || []).join('\n');

  const handleChange = (text: string) => {
    const inventoryArray = text.split('\n').filter((line) => line.trim() !== '');
    updateCharacterInventory(data.id, inventoryArray);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Інвентар персонажа:</Text>
      <TextInput
        style={styles.memoInput}
        multiline={true}
        numberOfLines={6}
        value={inventoryText}
        onChangeText={handleChange}
        placeholder='Введіть інвентар персонажа'
        placeholderTextColor='#888'
        blurOnSubmit={false}
        returnKeyType='default'
        textAlignVertical='top'
        enablesReturnKeyAutomatically={false}
      />
    </View>
  );
};

export default Inventory;
