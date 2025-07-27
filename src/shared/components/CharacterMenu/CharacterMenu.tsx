import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity } from 'react-native';
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

  useEffect(() => {
    if (character.id) {
      AsyncStorage.getItem(`characterData_${character.id}`)
        .then((stored) => {
          if (stored) setCharacterData(JSON.parse(stored));
        })
        .catch(() => {});
    }
  }, [character.id]);

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
    </>
  );
}
