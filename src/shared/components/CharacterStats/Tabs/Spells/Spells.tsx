import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '@/shared/components/CharacterStats/Tabs/style';
import { CharacterDto } from '@/types/Character';
import { Spells as SpellsType } from '@/types/Spells';
import useCharacterStore from '@/context/Character-store';

interface SpellsProps {
  data: CharacterDto;
}

const EMPTY_SPELLS: SpellsType = {
  spellcastingAbility: '',
  spellSaveDC: 0,
  spellAttackBonus: 0,
  spellSlots: {},
  knownSpells: [],
  preparedSpells: [],
  cantrips: [],
};

const Spells: React.FC<SpellsProps> = ({ data }) => {
  const updateCharacterSpells = useCharacterStore((s) => s.updateCharacterSpells);
  const character = useCharacterStore((s) => s.characters.find((c) => c.id === data.id));

  const [spells, setSpells] = useState<SpellsType>(character?.spells || EMPTY_SPELLS);
  const [knownSpellsText, setKnownSpellsText] = useState((character?.spells?.knownSpells || []).join('\n'));
  const [preparedSpellsText, setPreparedSpellsText] = useState((character?.spells?.preparedSpells || []).join('\n'));
  const [cantripsText, setCantripsText] = useState((character?.spells?.cantrips || []).join('\n'));

  useEffect(() => {
    if (!character) return;
    setSpells(character.spells || EMPTY_SPELLS);
    setKnownSpellsText((character.spells?.knownSpells || []).join('\n'));
    setPreparedSpellsText((character.spells?.preparedSpells || []).join('\n'));
    setCantripsText((character.spells?.cantrips || []).join('\n'));
  }, [character?.id]);

  const updateSpells = (updated: SpellsType) => {
    setSpells(updated);
    updateCharacterSpells(data.id, updated);
  };

  const handleAbilityChange = (text: string) => {
    updateSpells({ ...spells, spellcastingAbility: text });
  };

  const handleSaveDCChange = (text: string) => {
    const value = parseInt(text, 10);
    updateSpells({ ...spells, spellSaveDC: isNaN(value) ? 0 : value });
  };

  const handleAttackBonusChange = (text: string) => {
    const value = parseInt(text, 10);
    updateSpells({ ...spells, spellAttackBonus: isNaN(value) ? 0 : value });
  };

  const handleSlotChange = (level: string, field: 'max' | 'used', text: string) => {
    const value = parseInt(text, 10);
    const slot = spells.spellSlots[level] || { max: 0, used: 0 };
    const newSlots = {
      ...spells.spellSlots,
      [level]: { ...slot, [field]: isNaN(value) ? 0 : value },
    };
    updateSpells({ ...spells, spellSlots: newSlots });
  };

  const handleAddSlot = () => {
    const levels = Object.keys(spells.spellSlots).map((l) => parseInt(l, 10));
    const nextLevel = levels.length > 0 ? Math.max(...levels) + 1 : 1;
    const newSlots = {
      ...spells.spellSlots,
      [nextLevel]: { max: 0, used: 0 },
    };
    updateSpells({ ...spells, spellSlots: newSlots });
  };

  const handleKnownSpellsChange = (text: string) => {
    setKnownSpellsText(text);
    const arr = text.split('\n').filter((l) => l.trim() !== '');
    updateSpells({ ...spells, knownSpells: arr });
  };

  const handlePreparedSpellsChange = (text: string) => {
    setPreparedSpellsText(text);
    const arr = text.split('\n').filter((l) => l.trim() !== '');
    updateSpells({ ...spells, preparedSpells: arr });
  };

  const handleCantripsChange = (text: string) => {
    setCantripsText(text);
    const arr = text.split('\n').filter((l) => l.trim() !== '');
    updateSpells({ ...spells, cantrips: arr });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Здатність:</Text>
        <TextInput style={[styles.input, { flex: 1 }]} value={spells.spellcastingAbility} onChangeText={handleAbilityChange} />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Spell Save DC:</Text>
        <TextInput style={styles.input} keyboardType='numeric' value={`${spells.spellSaveDC}`} onChangeText={handleSaveDCChange} />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Spell Attack Bonus:</Text>
        <TextInput
          style={styles.input}
          keyboardType='numeric'
          value={`${spells.spellAttackBonus}`}
          onChangeText={handleAttackBonusChange}
        />
      </View>

      <Text style={styles.label}>Spell Slots:</Text>
      {Object.keys(spells.spellSlots)
        .sort()
        .map((level) => (
          <View key={level} style={[styles.row, { marginLeft: 10 }]}>
            <Text style={[styles.label, { width: 50 }]}>Lvl {level}</Text>
            <View style={{ flexDirection: 'column', alignItems: 'center' }}>
              <Text style={[styles.label, { marginHorizontal: 4, flex: 0 }]}>Макс:</Text>
              <TextInput
                style={[styles.input, { marginHorizontal: 4 }]}
                keyboardType='numeric'
                value={`${spells.spellSlots[level].max}`}
                onChangeText={(t) => handleSlotChange(level, 'max', t)}
              />
            </View>
            <View style={{ flexDirection: 'column', alignItems: 'center' }}>
              <Text style={[styles.label, { marginHorizontal: 4, flex: 0 }]}>Вик:</Text>
              <TextInput
                style={styles.input}
                keyboardType='numeric'
                value={`${spells.spellSlots[level].used}`}
                onChangeText={(t) => handleSlotChange(level, 'used', t)}
              />
            </View>
          </View>
        ))}
      <TouchableOpacity onPress={handleAddSlot} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
        <Ionicons name='add-circle-outline' size={24} color='#28a745' />
        <Text style={{ marginLeft: 8, color: '#28a745' }}>Додати рівень</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Відомі закляття:</Text>
      <TextInput
        style={styles.memoInput}
        multiline
        numberOfLines={4}
        value={knownSpellsText}
        onChangeText={handleKnownSpellsChange}
        placeholder='Введіть відомі закляття'
        placeholderTextColor='#888'
      />

      <Text style={styles.label}>Підготовлені закляття:</Text>
      <TextInput
        style={styles.memoInput}
        multiline
        numberOfLines={4}
        value={preparedSpellsText}
        onChangeText={handlePreparedSpellsChange}
        placeholder='Введіть підготовлені закляття'
        placeholderTextColor='#888'
      />

      <Text style={styles.label}>Кантіпси:</Text>
      <TextInput
        style={styles.memoInput}
        multiline
        numberOfLines={4}
        value={cantripsText}
        onChangeText={handleCantripsChange}
        placeholder='Введіть кантіпси'
        placeholderTextColor='#888'
      />
    </ScrollView>
  );
};

export default Spells;
