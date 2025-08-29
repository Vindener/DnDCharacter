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
import ShareCharacterSheetModal from '@/components/ShareCharacterSheetModal';
import { upsertCharacterSheetFromLocal, saveCharacterSheetAsNew } from '@/services/characterSheets';

interface CharacterMenuProps {
  character: CharacterDto;
  onChange?: (character: CharacterDto) => void;
}

const CharacterMenu: React.FC<CharacterMenuProps> = ({ character, onChange }) => {
  const updateCharacter = useCharacterStore((s: any) => s.updateCharacter);
  const addCharacter = useCharacterStore((s: any) => s.addCharacter);
  const removeCharacter = useCharacterStore((s: any) => s.removeCharacter);
  const setCurrentCharacterId = useCharacterStore((s: any) => s.setCurrentCharacterId);

  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [characterData, setCharacterData] = useState<CharacterDto>(character);
  const [isNameModalVisible, setIsNameModalVisible] = useState(false);
  const [newName, setNewName] = useState(character.name);
  const [isExpModalVisible, setIsExpModalVisible] = useState(false);
  const [tempExp, setTempExp] = useState(character.experience ?? 0);
  const [expDelta, setExpDelta] = useState('');
  const [isSpeedModalVisible, setIsSpeedModalVisible] = useState(false);
  const [tempSpeed, setTempSpeed] = useState(character.speed ?? 0);
  const [isAcModalVisible, setIsAcModalVisible] = useState(false);
  const [tempAc, setTempAc] = useState(character.ac ?? 0);
  const [isInitModalVisible, setIsInitModalVisible] = useState(false);
  const [tempInit, setTempInit] = useState(character.initiative ?? 0);

  useEffect(() => {
    if (character.id) {
      AsyncStorage.getItem(`characterData_${character.id}`)
        .then((stored) => {
          if (stored) {
            const parsed = JSON.parse(stored);
            setCharacterData(parsed);
            const xp = Number(parsed.experience);
            setTempExp(Number.isFinite(xp) ? xp : 0);
            const sp = Number(parsed.speed);
            setTempSpeed(Number.isFinite(sp) ? sp : 0);
            const ac = Number(parsed.ac);
            setTempAc(Number.isFinite(ac) ? ac : 0);
            const init = Number(parsed.initiative);
            setTempInit(Number.isFinite(init) ? init : 0);
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

  useEffect(() => {
    if (isSpeedModalVisible) {
      const sp = Number(characterData.speed);
      setTempSpeed(Number.isFinite(sp) ? sp : 0);
    }
  }, [isSpeedModalVisible, characterData.speed]);

  useEffect(() => {
    if (isAcModalVisible) {
      const ac = Number(characterData.ac);
      setTempAc(Number.isFinite(ac) ? ac : 0);
    }
  }, [isAcModalVisible, characterData.ac]);

  useEffect(() => {
    if (isInitModalVisible) {
      const init = Number(characterData.initiative);
      setTempInit(Number.isFinite(init) ? init : 0);
    }
  }, [isInitModalVisible, characterData.initiative]);


  const [shareOpen, setShareOpen] = useState(false);
  const openMenu = () => setMenuVisible(true);

  const onSaveToCloud = async () => {
    try {
      await upsertCharacterSheetFromLocal(character as any);
      console.log('[save] upsert ok for id', character.id);
    } catch (e: any) {
      console.warn('[save] upsert failed, will try save-as-new', e?.code || e?.message || e);
      try {
        const newId = await saveCharacterSheetAsNew(character as any);
        console.log('[save] saved as NEW id', newId);
        if (typeof onChange === 'function') {
          onChange({ ...character, id: newId } as any);
        }
      } catch (e2: any) {
        console.warn('[save] save-as-new failed', e2?.code || e2?.message || e2);
      }
    } finally {
      closeMenu();
    }
  };
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

  const handleSaveSpeed = () => {
    const value = Math.max(0, tempSpeed);
    const updated = { ...characterData, speed: value };
    setCharacterData(updated);
    if (characterData.id) updateCharacter(characterData.id, updated);
    onChange?.(updated);
    setIsSpeedModalVisible(false);
  };

  const handleSaveAc = () => {
    const value = Math.min(Math.max(0, tempAc), 20);
    const updated = { ...characterData, ac: value };
    setCharacterData(updated);
    if (characterData.id) updateCharacter(characterData.id, updated);
    onChange?.(updated);
    setIsAcModalVisible(false);
  };

  const handleSaveInit = () => {
    const value = Math.max(0, tempInit);
    const updated = { ...characterData, initiative: value };
    setCharacterData(updated);
    if (characterData.id) updateCharacter(characterData.id, updated);
    onChange?.(updated);
    setIsInitModalVisible(false);
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
            setIsExpModalVisible(true);
          }}
        >
          Редагувати досвід
        </MenuItem>
        <MenuItem
          onPress={() => {
            closeMenu();
            setIsSpeedModalVisible(true);
          }}
        >
          Редагувати швидкість
        </MenuItem>
        <MenuItem
          onPress={() => {
            closeMenu();
            setIsAcModalVisible(true);
          }}
        >
          Редагувати захист
        </MenuItem>
        <MenuItem
          onPress={() => {
            closeMenu();
            setIsInitModalVisible(true);
          }}
        >
          Редагувати ініціативу
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
        <MenuItem
          onPress={() => {
            setShareOpen(true);
            closeMenu();
          }}
        >
          Поділитися
        </MenuItem>
        <MenuDivider />
        <MenuItem onPress={onSaveToCloud}>Зберегти в хмарі</MenuItem>
        <MenuDivider />
      </Menu>
      <Modal isVisible={isNameModalVisible} onClose={() => setIsNameModalVisible(false)} onSubmit={handleNameChange} title="Нове ім'я">
        <TextInput value={newName} onChangeText={setNewName} style={{ color: 'white' }} />
      </Modal>
      <Modal isVisible={isSpeedModalVisible} onClose={() => setIsSpeedModalVisible(false)} onSubmit={handleSaveSpeed} title='Швидкість'>
        <TextInput
          value={String(tempSpeed)}
          onChangeText={(t) => {
            const val = parseInt(t, 10);
            setTempSpeed(isNaN(val) ? 0 : val);
          }}
          keyboardType='numeric'
        />
      </Modal>
      <Modal isVisible={isAcModalVisible} onClose={() => setIsAcModalVisible(false)} onSubmit={handleSaveAc} title='Захист'>
        <TextInput
          value={String(tempAc)}
          onChangeText={(t) => {
            const val = parseInt(t, 10);
            setTempAc(isNaN(val) ? 0 : val);
          }}
          keyboardType='numeric'
        />
      </Modal>
      <Modal isVisible={isInitModalVisible} onClose={() => setIsInitModalVisible(false)} onSubmit={handleSaveInit} title='Ініціатива'>
        <TextInput
          value={String(tempInit)}
          onChangeText={(t) => {
            const val = parseInt(t, 10);
            setTempInit(isNaN(val) ? 0 : val);
          }}
          keyboardType='numeric'
        />
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
      <ShareCharacterSheetModal visible={shareOpen} onClose={() => setShareOpen(false)} sheetId={character.id} />
    </>
  );
};

export default CharacterMenu;


