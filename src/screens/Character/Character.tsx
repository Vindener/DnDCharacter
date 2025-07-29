import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { shareAsync } from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { getStyles } from './style';
import useThemeStore from '@/context/Theme-store';
import { CharacterDto } from '@/types/Character';
import CharacterMenu from '@/shared/components/CharacterMenu/CharacterMenu';
import CharacterStats from '@/shared/components/CharacterStats/CharacterStats';
import useCharacterStore from '@/context/Character-store';
import { Modal } from '@/shared/components/Modal/Modal';
import TextInput from '@/shared/components/TextInput/TextInput';
import DiceRoller from '@/screens/DiceRoller/DiceRoller';
import Dice from '@/screens/Dice/Dice';
import { calculateModifier } from '@/shared/helpers/calculateModifier';
import { parseDice } from '@/shared/helpers/dice';

interface CharacterProps {
  route: {
    params: {
      character: CharacterDto;
    };
  };
  navigation: any;
}

export default function Character({ route }: CharacterProps) {
  const { character } = route.params;

  const updateCharacter = useCharacterStore((s) => s.updateCharacter);
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [characterData, setCharacterData] = useState<CharacterDto | any>(character);
  const [isNameModalVisible, setIsNameModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [isHpModalVisible, setIsHpModalVisible] = useState(false);
  const [tempHp, setTempHp] = useState(0);
  const [tempMaxHp, setTempMaxHp] = useState(0);
  const [hpDelta, setHpDelta] = useState('');
  const [isDiceModalVisible, setIsDiceModalVisible] = useState(false);
  const [isRestModalVisible, setIsRestModalVisible] = useState(false);
  const [restStep, setRestStep] = useState<'choose' | 'short' | 'roll'>('choose');
  const [shortRestDice, setShortRestDice] = useState('1');
  const [rollsNeeded, setRollsNeeded] = useState(0);
  const [rollResults, setRollResults] = useState<number[]>([]);
  const [diceSides, setDiceSides] = useState(0);

  useEffect(() => {
    if (characterData.id) {
      FileSystem.readAsStringAsync(FileSystem.documentDirectory + `characterData_${characterData.id}.json`)
        .then((stored) => {
          if (stored) setCharacterData(JSON.parse(stored));
        })
        .catch(() => {});
    }
  }, [characterData.id]);

  useEffect(() => {
    setTempHp(characterData?.hp?.current ?? 0);
    setTempMaxHp(characterData?.hp?.max ?? 0);
  }, [characterData?.hp?.current, characterData?.hp?.max]);

  const saveCharacter = async () => {
    if (!characterData.id) return;
    try {
      const path = FileSystem.documentDirectory + `characterData_${characterData.id}.json`;
      await FileSystem.writeAsStringAsync(path, JSON.stringify(characterData));
    } catch {}
  };

  const exportToFile = async () => {
    try {
      const jsonData = JSON.stringify(characterData, null, 2);
      const fileUri = FileSystem.documentDirectory + 'character.json';
      await FileSystem.writeAsStringAsync(fileUri, jsonData, { encoding: FileSystem.EncodingType.UTF8 });
      await shareAsync(fileUri);
    } catch {}
  };

  const pickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setCharacterData((prev: any) => ({ ...prev, photoUri: uri }));
      }
    } catch {}
  };

  const removePhoto = () => {
    setCharacterData((prev: any) => ({ ...prev, photoUri: undefined }));
  };

  const handleNameChange = () => {
    if (!newName.trim()) return;
    setCharacterData((prev: any) => ({ ...prev, name: newName }));
    setIsNameModalVisible(false);
  };

  const handleHPChange = (text: string) => {
    const val = Number(text);
    if (isNaN(val)) return;
    setTempHp(Math.min(val, tempMaxHp));
  };

  const handleMaxHPChange = (text: string) => {
    const val = Number(text);
    if (isNaN(val)) return;
    setTempMaxHp(val);
    if (tempHp > val) setTempHp(val);
  };

  const handleSaveHp = () => {
    const updated = {
      ...characterData,
      hp: { ...characterData.hp, current: tempHp, max: tempMaxHp },
    };
    setCharacterData(updated);
    if (updated.id) updateCharacter(updated.id, updated);
    setIsHpModalVisible(false);
    setHpDelta('');
  };

  const adjustHp = (delta: number) => {
    const value = isNaN(delta) ? 0 : delta;
    setTempHp((prev) => {
      const next = Math.min(Math.max(prev + value, 0), tempMaxHp);
      return next;
    });
  };

  const openRestModal = () => {
    setRestStep('choose');
    setShortRestDice('1');
    setRollsNeeded(0);
    setRollResults([]);
    setDiceSides(0);
    setIsRestModalVisible(true);
  };

  const startShortRestRoll = () => {
    const { count, sides } = parseDice(characterData.hitDice || '0d0');
    let num = parseInt(shortRestDice, 10);
    if (isNaN(num) || num < 1) num = 1;
    if (num > count) num = count;
    setRollsNeeded(num);
    setRollResults([]);
    setDiceSides(sides);
    setRestStep('roll');
  };

  const handleDiceRoll = (value: number) => {
    setRollResults((prev) => (prev.length < rollsNeeded ? [...prev, value] : prev));
  };

  const applyShortRestRolls = () => {
    const { count, sides } = parseDice(characterData.hitDice || '0d0');
    const used = rollResults.length;
    const conMod = calculateModifier(characterData.stats.constitution || 10);
    const heal = rollResults.reduce((a, b) => a + b, 0) + conMod * used;
    const newCurrent = Math.min(characterData.hp.current + heal, characterData.hp.max);
    const updated = {
      ...characterData,
      hp: { ...characterData.hp, current: newCurrent },
      hitDice: `${count - used}d${sides}`,
    };
    setCharacterData(updated);
    if (updated.id) updateCharacter(updated.id, updated);
    setIsRestModalVisible(false);
  };

  const handleLongRest = () => {
    const { sides } = parseDice(characterData.hitDice || '0d0');
    const newSlots = { ...(characterData.spells?.spellSlots || {}) };
    Object.keys(newSlots).forEach((lvl) => {
      newSlots[lvl] = { ...newSlots[lvl], used: 0 };
    });
    const updated = {
      ...characterData,
      hp: { ...characterData.hp, current: characterData.hp.max },
      hitDice: `${characterData.level}d${sides}`,
      spells: { ...characterData.spells, spellSlots: newSlots },
    };
    setCharacterData(updated);
    if (updated.id) updateCharacter(updated.id, updated);
    setIsRestModalVisible(false);
  };

  return (
  <View style={{ flex: 1 }}>
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {characterData.photoUri ? (
          <Image source={{ uri: characterData.photoUri }} style={styles.characterPhoto} />
        ) : (
          <View style={styles.placeholderPhoto}>
            <Text style={styles.placeholderText}>Фото героя</Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.characterName}>{characterData.name}</Text>
          <CharacterMenu character={characterData} onChange={setCharacterData} />
        </View>

        <Text style={styles.level}>Рівень {characterData.level}</Text>
        <Text style={styles.exp}>Exp: {characterData.experience}</Text>

        <TouchableOpacity onPress={() => setIsHpModalVisible(true)}>
          <Text style={styles.changeHP}>Редагувати HP</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={openRestModal}>
          <Text style={styles.restButton}>Відпочинок</Text>
        </TouchableOpacity>
      </View>

      <CharacterStats character={characterData} />
      <Modal isVisible={isHpModalVisible} onClose={() => setIsHpModalVisible(false)} onSubmit={handleSaveHp} title='HP'>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ color: 'white', flex: 1 }}>Max</Text>
          <TextInput value={String(tempMaxHp)} onChangeText={handleMaxHPChange} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ color: 'white', flex: 1 }}>Current</Text>
          <TextInput value={String(tempHp)} onChangeText={handleHPChange} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: 'white', flex: 1 }}>Change</Text>
          <TextInput value={hpDelta} onChangeText={setHpDelta} />
          <TouchableOpacity onPress={() => adjustHp(Number(hpDelta))} style={{ marginLeft: 8 }}>
            <Text style={{ color: 'white' }}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => adjustHp(-Number(hpDelta))} style={{ marginLeft: 8 }}>
            <Text style={{ color: 'white' }}>-</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
    <TouchableOpacity style={styles.diceIcon} onPress={() => setIsDiceModalVisible(true)}>
      <MaterialCommunityIcons name='dice-d20-outline' size={32} color={colors.text} />
    </TouchableOpacity>
    <Modal isVisible={isDiceModalVisible} onClose={() => setIsDiceModalVisible(false)}>
      <DiceRoller />
    </Modal>
    <Modal isVisible={isRestModalVisible} onClose={() => setIsRestModalVisible(false)} title='Відпочинок'>
      {restStep === 'choose' && (
        <>
          <TouchableOpacity onPress={() => setRestStep('short')}>
            <Text style={styles.restOption}>Короткий відпочинок</Text>
          </TouchableOpacity>
          <Text style={styles.restDesc}>
            Короткий відпочинок триває щонайменше годину. Ви можете витратити кості хітів, щоб відновити здоров’я.
          </Text>
          <TouchableOpacity onPress={handleLongRest}>
            <Text style={styles.restOption}>Довгий відпочинок</Text>
          </TouchableOpacity>
          <Text style={styles.restDesc}>Довгий відпочинок повністю відновлює HP та слоти заклять.</Text>
        </>
      )}
      {restStep === 'short' && (
        <>
          <Text style={styles.restDesc}>Доступно: {characterData.hitDice}</Text>
          <Text style={styles.restDesc}>Скільки кісток використати?</Text>
          <TextInput value={shortRestDice} onChangeText={setShortRestDice} keyboardType='numeric' />
          <TouchableOpacity onPress={startShortRestRoll}>
            <Text style={styles.restOption}>Кинути</Text>
          </TouchableOpacity>
        </>
      )}
      {restStep === 'roll' && (
        <>
          <Text style={styles.restDesc}>
            Кидок {rollResults.length + 1} з {rollsNeeded}
          </Text>
          <Dice sides={diceSides} onRoll={handleDiceRoll} />
          {rollResults.length >= rollsNeeded && (
            <TouchableOpacity onPress={applyShortRestRolls}>
              <Text style={styles.restOption}>Застосувати</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </Modal>
  </View>
);
}
