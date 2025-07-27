import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import TextInput  from '@/shared/components/TextInput/TextInput';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { getStyles } from '@/shared/components/CharacterStats/Tabs/style';
import useThemeStore from '@/context/Theme-store';
import { CharacterDto } from '@/types/Character';
import { Weapon as WeaponType } from '@/types/Weapon';
import useCharacterStore from '@/context/Character-store';
import { Modal } from '@/shared/components/Modal/Modal';
import Loader from '@/shared/components/Loader/Loader';
import { DICE_OPTIONS } from '@/shared/const/DiceOptions';


interface WeaponProps {
  data: CharacterDto;
}

const EMPTY_WEAPON: WeaponType = {
  name: '',
  attackBonus: 0,
  damage: '',
};

const rollDice = (notation: string) => {
  const [countStr, sidesStr] = notation.toLowerCase().split('d');
  const count = parseInt(countStr, 10) || 1;
  const sides = parseInt(sidesStr, 10) || 6;
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
};

const rollDamageWithBonus = (notation: string, bonus: number) => {
  return rollDice(notation) + bonus;
};

const Weapon: React.FC<WeaponProps> = ({ data }) => {
  const updateCharacterWeapons = useCharacterStore((s) => s.updateCharacterWeapons);
  const character = useCharacterStore((s) => s.characters.find((c) => c.id === data.id));
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [weapons, setWeapons] = useState<WeaponType[]>(character?.weapons || []);
  const [visibleIndex, setVisibleIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!character) return;
    setWeapons(character.weapons || []);
  }, [character?.id]);

  const updateWeapons = (updated: WeaponType[]) => {
    setWeapons(updated);
    if (updateCharacterWeapons) updateCharacterWeapons(data.id, updated);
  };

  const handleChange = (index: number, field: keyof WeaponType, text: string) => {
    const updated = weapons.map((w, i) => {
      if (i !== index) return w;
      if (field === 'attackBonus') {
        const val = parseInt(text, 10);
        return { ...w, attackBonus: isNaN(val) ? 0 : val };
      }
      return { ...w, [field]: text } as WeaponType;
    });
    updateWeapons(updated);
  };

  const handleAddWeapon = () => {
    updateWeapons([...weapons, { ...EMPTY_WEAPON }]);
  };

  const handleDeleteWeapon = (index: number) => {
    const updated = weapons.filter((_, i) => i !== index);
    updateWeapons(updated);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Зброя:</Text>
      {weapons.map((weapon, index) => (
        <View key={index} style={{ marginBottom: 12 }}>
          <View style={styles.row}>
            <Text style={styles.label}>Назва:</Text>
            <TextInput style={{ flex: 1 }} value={weapon.name} onChangeText={(t) => handleChange(index, 'name', t)} placeholder='Назва' />
          </View>
          <View style={[styles.row, { alignItems: 'center' }]}>
            <Text style={styles.label}>Бонус атаки:</Text>
            <TextInput
              value={`${weapon.attackBonus}`}
              onChangeText={(t) => handleChange(index, 'attackBonus', t)}
            />
            <Text style={[styles.label, { marginLeft: 8 }]}>Урон:</Text>
            <Picker
              selectedValue={weapon.damage}
              style={[styles.input, { flex: 1, color: 'white' }]}
              dropdownIconColor='white'
              onValueChange={(v) => handleChange(index, 'damage', v)}
            >
              {DICE_OPTIONS.map((opt) => (
                <Picker.Item key={opt} label={opt} value={opt} />
              ))}
            </Picker>
            <TouchableOpacity style={styles.rollButton} onPress={() => setVisibleIndex(index)}>
              <Text style={styles.rollButtonText}>🎲</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteWeapon(index)} style={{ marginLeft: 8 }}>
              <Ionicons name='trash-outline' size={24} color='#d00' />
            </TouchableOpacity>
            <Modal isVisible={visibleIndex === index} onClose={() => setVisibleIndex(null)}>
              <Loader />
              <Text style={styles.rollResult}>Roll result: {rollDamageWithBonus(weapon.damage, weapon.attackBonus)}</Text>
            </Modal>
          </View>
        </View>
      ))}
      <TouchableOpacity onPress={handleAddWeapon} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
        <Ionicons name='add-circle-outline' size={24} color='#28a745' />
        <Text style={{ marginLeft: 8, color: '#28a745' }}>Додати зброю</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default Weapon;
