import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Menu, MenuItem, MenuDivider } from 'react-native-material-menu';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import { importCharacterFromFile } from '@/shared/services/fileSerice';
import { CharacterDto } from '@/types/Character';
import { styles } from './style';
import useCharacterStore from '@/context/CharacterContext';

export default function CharacterMenu({ character }: { character: CharacterDto }) {
  const addCharacter = useCharacterStore((s: any) => s.addCharacter);
  const updateCharacter = useCharacterStore((s: any) => s.updateCharacter);
  const [menuVisible, setMenuVisible] = useState(false);
  const [characterData, setCharacterData] = useState<CharacterDto>(character);

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
        const updated = { ...characterData, photoUri: uri };
        setCharacterData(updated);
        updateCharacter(updated);
      }
    } catch {}
  };

  const removePhoto = () => {
    const updated = { ...characterData, photoUri: undefined };
    setCharacterData(updated);
    updateCharacter(updated);
  };

  const renameCharacter = () => {};

  const importCharacter = async () => {
    const imported = await importCharacterFromFile();
    if (imported) addCharacter(imported);
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
            importCharacter();
          }}
        >
          Імпорт JSON
        </MenuItem>
        <MenuItem
          onPress={() => {
            closeMenu();
            exportToFile();
          }}
        >
          Експорт JSON
        </MenuItem>
      </Menu>
    </>
  );
}
