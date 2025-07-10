import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '@/shared/components/CharacterStats/Tabs/style';
import useCharacterStore from '@/context/Character-store';
import { CharacterDto } from '@/types/Character';
import { HitPoints } from '@/types/HitPoints';
import { DeathSaves } from '@/types/DeathSaves';

interface CombatProps {
  data: CharacterDto;
}

const EMPTY_HP: HitPoints = { max: 1, current: 1, temp: 0 };
const EMPTY_DEATH: DeathSaves = { successes: 1, failures: 1 };

const Combat: React.FC<CombatProps> = ({ data }) => {
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);
  const character = useCharacterStore((s) => s.characters.find((c) => c.id === data.id));

  const [initiative, setInitiative] = useState(character?.initiative ?? 1);
  const [speed, setSpeed] = useState(character?.speed ?? 1);
  const [ac, setAc] = useState(character?.ac ?? 1);
  const [armorDetails, setArmorDetails] = useState(character?.armorClassDetails || '');
  const [hitDice, setHitDice] = useState(character?.hitDice || '');
  const [hp, setHp] = useState<HitPoints>(character?.hp || EMPTY_HP);
  const [deathSaves, setDeathSaves] = useState<DeathSaves>(character?.deathSaves || EMPTY_DEATH);

  useEffect(() => {
    if (!character) return;
    setInitiative(character.initiative ?? 1);
    setSpeed(character.speed ?? 1);
    setAc(character.ac ?? 1);
    setArmorDetails(character.armorClassDetails || '');
    setHitDice(character.hitDice);
    setHp(character.hp || EMPTY_HP);
    setDeathSaves(character.deathSaves || EMPTY_DEATH);
  }, [character?.id]);

  const updateField = (field: keyof CharacterDto, value: any) => {
    if (!character) return;
    updateCharacter(character.id, { ...character, [field]: value });
  };

  const handleInitiativeChange = (text: string) => {
    const val = parseInt(text, 10);
    setInitiative(isNaN(val) ? 1 : val);
    updateField('initiative', isNaN(val) ? 1 : val);
  };

  const handleSpeedChange = (text: string) => {
    const val = parseInt(text, 10);
    setSpeed(isNaN(val) ? 1 : val);
    updateField('speed', isNaN(val) ? 1 : val);
  };

  const handleAcChange = (text: string) => {
    const val = parseInt(text, 10);
    setAc(isNaN(val) ? 1 : val);
    updateField('ac', isNaN(val) ? 1 : val);
  };

  const handleArmorDetailsChange = (text: string) => {
    setArmorDetails(text);
    updateField('armorClassDetails', text);
  };

  const handleHitDiceChange = (text: string) => {
    setHitDice(text);
    updateField('hitDice', text);
  };

  const handleHpChange = (key: keyof HitPoints, text: string) => {
    const val = parseInt(text, 10);
    const newHp = { ...hp, [key]: isNaN(val) ? 1 : val };
    setHp(newHp);
    updateField('hp', newHp);
  };

  const updateDeathSaves = (newValues: Partial<DeathSaves>) => {
    const updated = { ...deathSaves, ...newValues };
    setDeathSaves(updated);
    updateField('deathSaves', updated);
  };

  const handleSuccessPress = (index: number) => {
    const current = deathSaves.successes;
    const newVal = index + 1 <= current ? index : index + 1;
    updateDeathSaves({ successes: newVal });
  };

  const handleFailurePress = (index: number) => {
    const current = deathSaves.failures;
    const newVal = index + 1 <= current ? index : index + 1;
    updateDeathSaves({ failures: newVal });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Ініціатива:</Text>
        <TextInput style={styles.input} keyboardType='numeric' value={`${initiative}`} onChangeText={handleInitiativeChange} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Швидкість:</Text>
        <TextInput style={styles.input} keyboardType='numeric' value={`${speed}`} onChangeText={handleSpeedChange} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>AC:</Text>
        <TextInput style={styles.input} keyboardType='numeric' value={`${ac}`} onChangeText={handleAcChange} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Деталі броні:</Text>
        <TextInput style={[styles.input, { flex: 1 }]} value={armorDetails} onChangeText={handleArmorDetailsChange} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Hit Dice:</Text>
        <TextInput style={[styles.input, { flex: 1 }]} value={hitDice} onChangeText={handleHitDiceChange} />
      </View>
      <Text style={styles.label}>HP:</Text>
      <View style={[styles.row, { marginLeft: 10 }]}>
        <Text style={[styles.label, { width: 70 }]}>Max:</Text>
        <TextInput style={styles.input} keyboardType='numeric' value={`${hp.max}`} onChangeText={(t) => handleHpChange('max', t)} />
      </View>
      <View style={[styles.row, { marginLeft: 10 }]}>
        <Text style={[styles.label, { width: 70 }]}>Current:</Text>
        <TextInput style={styles.input} keyboardType='numeric' value={`${hp.current}`} onChangeText={(t) => handleHpChange('current', t)} />
      </View>
      <View style={[styles.row, { marginLeft: 10 }]}>
        <Text style={[styles.label, { width: 70 }]}>Temp:</Text>
        <TextInput style={styles.input} keyboardType='numeric' value={`${hp.temp}`} onChangeText={(t) => handleHpChange('temp', t)} />
      </View>
      <Text style={styles.label}>Death Saves:</Text>
      <View style={[styles.row, { marginLeft: 10 }]}>
        <Text style={[styles.label, { width: 90 }]}>Успіхи:</Text>
        {[0, 1, 2].map((i) => (
          <TouchableOpacity key={i} onPress={() => handleSuccessPress(i)} style={{ marginHorizontal: 4 }}>
            <Ionicons name={i < deathSaves.successes ? 'ellipse' : 'ellipse-outline'} size={24} color='#28a745' />
          </TouchableOpacity>
        ))}
      </View>
      <View style={[styles.row, { marginLeft: 10 }]}>
        <Text style={[styles.label, { width: 90 }]}>Провали:</Text>
        {[0, 1, 2].map((i) => (
          <TouchableOpacity key={i} onPress={() => handleFailurePress(i)} style={{ marginHorizontal: 4 }}>
            <Ionicons name={i < deathSaves.failures ? 'ellipse' : 'ellipse-outline'} size={24} color='#d00' />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

export default Combat;
