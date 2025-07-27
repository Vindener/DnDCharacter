import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Menu, MenuItem, MenuDivider } from 'react-native-material-menu';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { CharacterDto } from '@/types/Character';
import { getStyles } from './style';
import useThemeStore from '@/context/Theme-store';
import useCharacterStore from '@/context/Character-store';
import FileService from '@/shared/services/fileSerice';
import { Modal } from '@/shared/components/Modal/Modal';
import TextInput from '@/shared/components/TextInput/TextInput';
import { EXPERIENCE_TABLE, getLevelByExperience } from '@/shared/const/experience';

interface CharacterMenuProps {
  character: CharacterDto;
  onChange?: (character: CharacterDto) => void;
}
export default function CharacterMenu({ character, onChange }: CharacterMenuProps) {
  const addCharacter = useCharacterStore((s: any) => s.addCharacter);
  const updateCharacter = useCharacterStore((s: any) => s.updateCharacter);
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [characterData, setCharacterData] = useState<CharacterDto>(character);
  const [isNameModalVisible, setIsNameModalVisible] = useState(false);
  const [newName, setNewName] = useState(character.name);
  const [isExpModalVisible, setIsExpModalVisible] = useState(false);
  const [tempExp, setTempExp] = useState(character.experience ?? 0);
  const [expDelta, setExpDelta] = useState('');

  useEffect(() => {
    if (character.id) {
      AsyncStorage.getItem(`characterData_${character.id}`)
        .then((stored) => {
          if (stored) {
            const parsed = JSON.parse(stored);
            setCharacterData(parsed);
            const xp = Number(parsed.experience);
            setTempExp(Number.isFinite(xp) ? xp : 0);
          }
        })
        .catch(() => {});
    }
  }, [character.id]);

  useEffect(() => {
    if (isExpModalVisible) {
      const xp = Number(characterData.experience);
      setTempExp(Number.isFinite(xp) ? xp : 0);
      setExpDelta('');
    }
  }, [isExpModalVisible, characterData.experience]);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const pickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const updated = { ...characterData, photoUri: uri };
        setCharacterData(updated);
        if (characterData.id) updateCharacter(characterData.id, updated);
        onChange?.(updated);
      }
    } catch {}
  };

  const removePhoto = () => {
    const updated = { ...characterData, photoUri: undefined };
    setCharacterData(updated);
    if (characterData.id) updateCharacter(characterData.id, updated);
    onChange?.(updated);
  };

  const renameCharacter = () => {
    setNewName(characterData.name);
    setIsNameModalVisible(true);
  };

  const handleNameChange = () => {
    if (!newName.trim()) return;
    const updated = { ...characterData, name: newName };
    setCharacterData(updated);
    if (characterData.id) updateCharacter(characterData.id, updated);
    onChange?.(updated);
    setIsNameModalVisible(false);
  };

  const adjustExp = (delta: number) => {
    setTempExp((prev) => Math.max(prev + delta, 0));
  };

  const applyInputDelta = (sign: number) => {
    const value = Number(expDelta);
    if (!Number.isFinite(value)) return;
    adjustExp(sign * value);
    setExpDelta('');
  };

  const handleSaveExp = () => {
    const newLevel = getLevelByExperience(tempExp);
    const updated = { ...characterData, experience: tempExp, level: newLevel };
    setCharacterData(updated);
    if (characterData.id) updateCharacter(characterData.id, updated);
    onChange?.(updated);
    setIsExpModalVisible(false);
    setExpDelta('');
  };

  const importCharacter = async () => {
    const imported = await FileService.importCurrentCharacter(character.id);
    if (imported) {
      addCharacter(imported);
      setCharacterData(imported);
      onChange?.(imported);
    }
  };

  return (
    <>
      <TouchableOpacity onPress={openMenu}>
        <Text style={styles.menuButton}>⋮</Text>
      </TouchableOpacity>
      <Menu visible={menuVisible} onRequestClose={closeMenu} anchor={<></>}>
        <MenuItem
          onPress={() => {
            closeMenu();
            pickPhoto();
          }}
        >
          Завантажити фото
        </MenuItem>
        <MenuItem
          onPress={() => {
            closeMenu();
            removePhoto();
          }}
        >
          Видалити фото
        </MenuItem>
        <MenuItem
          onPress={() => {
            closeMenu();
            renameCharacter();
          }}
        >
          Змінити ім'я
        </MenuItem>
        <MenuItem
          onPress={() => {
            closeMenu();
            setIsExpModalVisible(true);
          }}
        >
          Додати досвід
        </MenuItem>
        <MenuDivider />
        <MenuItem
          onPress={() => {
            closeMenu();
            FileService.exportCharacter(characterData);
          }}
        >
          Експорт JSON
        </MenuItem>
      </Menu>
      <Modal isVisible={isNameModalVisible} onClose={() => setIsNameModalVisible(false)} onSubmit={handleNameChange} title="Нове ім'я">
        <TextInput value={newName} onChangeText={setNewName} style={{ color: 'white' }} />
      </Modal>
      <Modal isVisible={isExpModalVisible} onClose={() => setIsExpModalVisible(false)} onSubmit={handleSaveExp} title='Досвід'>
        <Text style={{ color: 'white', marginBottom: 8 }}>Рівень: {getLevelByExperience(tempExp)}</Text>
        <Text style={{ color: 'white', marginBottom: 8 }}>Досвід: {tempExp}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TextInput value={expDelta} onChangeText={setExpDelta} keyboardType='numeric' style={{ flexGrow: 1, marginRight: 8 }} />
          <TouchableOpacity onPress={() => applyInputDelta(1)} style={styles.adjustButton}>
            <Text style={styles.adjustText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => applyInputDelta(-1)} style={styles.adjustButton}>
            <Text style={styles.adjustText}>-</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 12 }}>
          <TouchableOpacity onPress={() => adjustExp(10)} style={styles.adjustButton}>
            <Text style={styles.adjustText}>+10</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => adjustExp(-10)} style={styles.adjustButton}>
            <Text style={styles.adjustText}>-10</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={{ maxHeight: 150 }}>
          {EXPERIENCE_TABLE.map((row) => (
            <View key={row.level} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text
                style={{
                  color: getLevelByExperience(tempExp) === row.level ? '#ffd700' : colors.text,
                }}
              >
                {row.level} lvl
              </Text>
              <Text
                style={{
                  color: getLevelByExperience(tempExp) === row.level ? '#ffd700' : colors.text,
                }}
              >
                {row.exp}
              </Text>
            </View>
          ))}
        </ScrollView>
      </Modal>
    </>
  );
}
