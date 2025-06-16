import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { shareAsync } from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { styles } from './style';
import { CharacterDto } from '@/types/Character';
import CharacterMenu from '@/shared/components/CharacterMenu/CharacterMenu';
import CharacterOverview from '@/shared/components/CharacterOverview/CharacterOverview';
import CharacterStats from '@/shared/components/CharacterStats/CharacterStats';

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

  const [characterData, setCharacterData] = useState<CharacterDto | any>(character);
  const [isNameModalVisible, setIsNameModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [isHpModalVisible, setIsHpModalVisible] = useState(false);
  const [tempHp, setTempHp] = useState(0);
  const [tempMaxHp, setTempMaxHp] = useState(0);

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
    setTempHp(characterData?.hp?.temp ?? 0);
    setTempMaxHp(characterData?.hp?.max ?? 0);
  }, [characterData?.hp?.temp, characterData?.hp?.max]);

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
    setCharacterData((prev: any) => ({ ...prev, hp: tempHp, maxHp: tempMaxHp }));
    setIsHpModalVisible(false);
  };

  return (
    <View style={styles.container}>
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
          <CharacterMenu character={characterData} />
        </View>

        <Text style={styles.level}>Рівень {characterData.level}</Text>
        <Text style={styles.exp}>Exp: {characterData.experience}</Text>

        <TouchableOpacity onPress={() => setIsHpModalVisible(true)}>
          <Text style={styles.changeHP}>Редагувати HP</Text>
        </TouchableOpacity>
      </View>

      <CharacterOverview character={characterData.id} />
      <CharacterStats character={characterData} />
    </View>
  );
}
