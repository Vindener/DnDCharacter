import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { TextInput, MultiTextInput } from '@/shared/components/TextInput/index';
import { Ionicons } from '@expo/vector-icons';
import { getStyles } from '@/shared/components/CharacterStats/Tabs/style';
import useThemeStore from '@/context/Theme-store';
import { CharacterViewModel } from '@/types/Character';
import { Spells as SpellsType } from '@/types/Spells';
import useCharacterStore from '@/context/Character-store';
import { sp } from '@/shared/styles/tokens';

interface SpellsProps {
  data: CharacterViewModel;
}

const EMPTY_SPELLS: SpellsType = {
  spellcastingAbility: '',
  spellSaveDC: 0,
  spellAttackBonus: 0,
  spellSlots: Object.fromEntries(Array.from({ length: 9 }, (_, i) => [i + 1, { max: 0, used: 0 }])),
  knownSpells: [],
  preparedSpells: [],
  cantrips: [],
};

const Spells: React.FC<SpellsProps> = ({ data }) => {
  const updateCharacterSpells = useCharacterStore((s) => s.updateCharacterSpells);
  const character = useCharacterStore((s) => s.characters.find((c) => c.id === data.id));
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

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
    if (nextLevel > 9) return; // ❌ не дозволяємо додати понад 9
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
        <Text style={styles.label}>Характеристика:</Text>
        <TextInput style={{ flex: 1 }} value={spells.spellcastingAbility} onChangeText={handleAbilityChange} />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Рятівний куб:</Text>
        <TextInput value={`${spells.spellSaveDC}`} onChangeText={handleSaveDCChange} />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Бонус атаки закляттям:</Text>
        <TextInput value={`${spells.spellAttackBonus}`} onChangeText={handleAttackBonusChange} />
      </View>

      <Text style={styles.label}>Слоти закляття:</Text>
      {Object.keys(spells.spellSlots)
        .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
        .map((level) => (
          <View key={level} style={[styles.row, { marginLeft: sp(10) }]}>
            <Text style={[styles.label, { width: 50 }]}>Lvl {level}</Text>
            <View style={{ flexDirection: 'column', alignItems: 'center' }}>
              <Text style={[styles.label, { marginHorizontal: 4, flex: 0 }]}>Макс:</Text>
              <TextInput
                style={{ marginHorizontal: 4 }}
                value={`${spells.spellSlots[level].max}`}
                onChangeText={(t) => handleSlotChange(level, 'max', t)}
              />
            </View>
            <View style={{ flexDirection: 'column', alignItems: 'center' }}>
              <Text style={[styles.label, { marginHorizontal: 4, flex: 0 }]}>Вик:</Text>
              <TextInput value={`${spells.spellSlots[level].used}`} onChangeText={(t) => handleSlotChange(level, 'used', t)} />
            </View>
          </View>
        ))}
      {!Object.keys(spells.spellSlots).includes('9') && (
        <TouchableOpacity onPress={handleAddSlot} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
          <Ionicons name='add-circle-outline' size={24} color={colors.success} />
          <Text style={{ marginLeft: sp(8), color: colors.success }}>Додати рівень</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.label}>Відомі закляття:</Text>
      <MultiTextInput
        numberOfLines={8}
        value={knownSpellsText}
        onChangeText={handleKnownSpellsChange}
        placeholder='Введіть відомі закляття'
      />

      <Text style={styles.label}>Підготовлені закляття:</Text>
      <MultiTextInput
        numberOfLines={8}
        value={preparedSpellsText}
        onChangeText={handlePreparedSpellsChange}
        placeholder='Введіть підготовлені закляття'
      />

      <Text style={styles.label}>Заговори:</Text>
      <MultiTextInput numberOfLines={4} value={cantripsText} onChangeText={handleCantripsChange} placeholder='Введіть кантіпси' />
    </ScrollView>
  );
};

export default Spells;




