import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, View, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Menu, MenuItem, MenuDivider } from 'react-native-material-menu';
import * as ImagePicker from 'expo-image-picker';
import { uuid } from 'expo-modules-core';
import { CharacterViewModel } from '@/types/Character';
import { getStyles } from './style';
import useThemeStore from '@/context/Theme-store';
import useCharacterStore from '@/context/Character-store';
import useSyncStore from '@/context/Sync-store';
import { Modal } from '@/shared/components/Modal/Modal';
import TextInput from '@/shared/components/TextInput/TextInput';
import { EXPERIENCE_TABLE, getLevelByExperience } from '@/shared/const/experience';
import ShareCharacterSheetModal from '@/components/ShareCharacterSheetModal';
import type { TabStackParamList } from '@/navigation/TabNavigator';
import { syncToCloud } from '@/services/characterSyncCoordinator';

type CharacterStoreState = ReturnType<typeof useCharacterStore.getState>;

function errorCodeOrMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return String(error);
  const maybeCode = (error as { code?: unknown }).code;
  if (typeof maybeCode === 'string' && maybeCode) return maybeCode;
  const maybeMessage = (error as { message?: unknown }).message;
  if (typeof maybeMessage === 'string' && maybeMessage) return maybeMessage;
  return String(error);
}

interface CharacterMenuProps {
  character: CharacterViewModel;
  onChange?: (character: CharacterViewModel) => void;
  isCloudDoc?: boolean;
  isSharedSheet?: boolean;
  onSyncNow?: () => void;
}

const CharacterMenu: React.FC<CharacterMenuProps> = ({ character, onChange, isCloudDoc = false, isSharedSheet = false, onSyncNow }) => {
  const navigation = useNavigation<StackNavigationProp<TabStackParamList>>();
  const updateCharacter = useCharacterStore((s: CharacterStoreState) => s.updateCharacter);
  const addCharacter = useCharacterStore((s: CharacterStoreState) => s.addCharacter);
  const setCurrentCharacterId = useCharacterStore((s: CharacterStoreState) => s.setCurrentCharacterId);
  const ensureCharacterSync = useSyncStore((s) => s.ensureCharacterSync);
  const syncByCharacter = useSyncStore((s) => s.syncByCharacter);
  const setCloudAvailability = useSyncStore((s) => s.setCloudAvailability);
  const markCloudUploaded = useSyncStore((s) => s.markCloudUploaded);
  const removeCharacterSync = useSyncStore((s) => s.removeCharacterSync);
  const setSyncTransport = useSyncStore((s) => s.setSyncTransport);
  const markSyncError = useSyncStore((s) => s.markSyncError);
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [characterData, setCharacterData] = useState<CharacterViewModel>(character);
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
  const isCharacterInCloud = isCloudDoc || Boolean(characterData.id && syncByCharacter[characterData.id]?.hasCloud);

  useEffect(() => {
    setCharacterData(character);
    const xp = Number(character.experience);
    setTempExp(Number.isFinite(xp) ? xp : 0);
    const sp = Number(character.speed);
    setTempSpeed(Number.isFinite(sp) ? sp : 0);
    const ac = Number(character.ac);
    setTempAc(Number.isFinite(ac) ? ac : 0);
    const init = Number(character.initiative);
    setTempInit(Number.isFinite(init) ? init : 0);
  }, [character]);

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
      const sourceCharacter = { ...characterData };
      if (!sourceCharacter.id) throw new Error('Character has no id');

      const result = await syncToCloud({
        character: sourceCharacter,
        syncState: useSyncStore.getState().syncByCharacter[sourceCharacter.id],
        actorRole: 'Player',
        syncPort: {
          ensureCharacterSync,
          setCloudAvailability,
          markCloudUploaded,
          setSyncTransport,
          markSyncError,
        },
        isOnline: true,
        fallbackPath: 'overview.identity',
        syncingMessage: 'Синхронізація...',
        syncedMessage: 'Синхронізовано',
        conflictFallbackPath: 'overview.identity',
      });

      if (result.status !== 'synced') {
        throw new Error(result.message || 'Не вдалося синхронізувати');
      }

      const syncedCharacter = result.targetCharacter;
      let targetSheetId = sourceCharacter.id;

      if (syncedCharacter.id !== sourceCharacter.id) {
        await updateCharacter(sourceCharacter.id, syncedCharacter);
        await removeCharacterSync(sourceCharacter.id);
        await ensureCharacterSync(syncedCharacter.id, true);
        targetSheetId = syncedCharacter.id;
      }

      await ensureCharacterSync(targetSheetId, true);
      setCurrentCharacterId(targetSheetId);
      setCharacterData(syncedCharacter);
      onChange?.(syncedCharacter);

      const successMessage = result.created
        ? 'Персонажа збережено у хмарі.'
        : 'Зміни персонажа успішно оновлені у хмарі.';

      Alert.alert(
        'Успіх',
        successMessage,
        [
          {
            text: 'Ок',
            onPress: () => {
              closeMenu();
              if (targetSheetId !== character.id) {
                navigation.navigate('Character', { character: syncedCharacter });
              }
            },
          },
        ],
      );
    } catch (error: unknown) {
      const message = errorCodeOrMessage(error);
      console.warn('[save] failed', message);
      if (message === 'Not signed in') {
        Alert.alert('Помилка авторизації', 'Ви не ввійшли у свій акаунт Google! Будь ласка, авторизуйтеся перед збереженням у хмару.');
      } else {
        Alert.alert('Помилка', 'Не вдалося зберегти у хмару. Спробуйте ще раз.');
      }
    }
  };
  const closeMenu = () => setMenuVisible(false);

  const createDetachedCopy = async (mode: 'local-copy' | 'duplicate-shared') => {
    const suffix = mode === 'local-copy' ? 'Локальна копія' : 'Спільний дублікат';
    const copy: CharacterViewModel = {
      ...characterData,
      id: String(uuid.v4()),
      name: `${characterData.name || 'Персонаж'} (${suffix})`,
    };

    await addCharacter(copy);
    await ensureCharacterSync(copy.id, false);
    setCurrentCharacterId(copy.id);

    Alert.alert('Готово', mode === 'local-copy' ? 'Створено локальну копію без живої синхронізації.' : 'Створено незалежний дублікат зі спільного листа.');
    navigation.navigate('Character', { character: copy });
  };

  const openSharedLiveCopy = () => {
    if (!isCharacterInCloud) {
      Alert.alert('Спільна жива копія', 'Для живого режиму спочатку створіть хмарну версію.');
      return;
    }

    onSyncNow?.();
    Alert.alert('Спільна жива копія', 'Поточний лист відкрито в живому режимі з хмарною синхронізацією.');
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
        if (characterData.id) updateCharacter(characterData.id, updated);
        onChange?.(updated);
      }
    } catch (_error) { /* intentionally ignored */ }
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
      <Menu visible={menuVisible} onRequestClose={closeMenu} anchor={<></>} style={styles.menuContainer}>
        <MenuItem
          textStyle={styles.menuItemText}
          onPress={() => {
            closeMenu();
            pickPhoto();
          }}
        >
          Завантажити фото
        </MenuItem>

        <MenuItem
          textStyle={styles.menuItemText}
          onPress={() => {
            closeMenu();
            removePhoto();
          }}
        >
          Видалити фото
        </MenuItem>

        <MenuItem
          textStyle={styles.menuItemText}
          onPress={() => {
            closeMenu();
            renameCharacter();
          }}
        >
          Змінити ім'я
        </MenuItem>

        <MenuDivider color={colors.border} />

        <MenuItem
          textStyle={styles.menuItemText}
          onPress={() => {
            closeMenu();
            setIsExpModalVisible(true);
          }}
        >
          Редагувати досвід
        </MenuItem>

        <MenuItem
          textStyle={styles.menuItemText}
          onPress={() => {
            closeMenu();
            setIsSpeedModalVisible(true);
          }}
        >
          Редагувати швидкість
        </MenuItem>

        <MenuItem
          textStyle={styles.menuItemText}
          onPress={() => {
            closeMenu();
            setIsAcModalVisible(true);
          }}
        >
          Редагувати захист
        </MenuItem>

        <MenuItem
          textStyle={styles.menuItemText}
          onPress={() => {
            closeMenu();
            setIsInitModalVisible(true);
          }}
        >
          Редагувати ініціативу
        </MenuItem>

        <MenuDivider color={colors.border} />

        <MenuItem textStyle={styles.menuItemText} onPress={onSaveToCloud}>
          {isCharacterInCloud ? 'Оновити в хмарі' : 'Зберегти в хмарі'}
        </MenuItem>
        <MenuItem
          textStyle={styles.menuItemText}
          onPress={() => {
            closeMenu();
            onSyncNow?.();
          }}
        >
          Синхронізувати зараз
        </MenuItem>
        <MenuItem
          textStyle={styles.menuItemText}
          onPress={() => {
            closeMenu();
            openSharedLiveCopy();
          }}
        >
          Спільна жива копія
        </MenuItem>
        <MenuItem
          textStyle={styles.menuItemText}
          onPress={() => {
            closeMenu();
            void createDetachedCopy('local-copy');
          }}
        >
          Створити локальну копію
        </MenuItem>
        {isSharedSheet && (
          <MenuItem
            textStyle={styles.menuItemText}
            onPress={() => {
              closeMenu();
              void createDetachedCopy('duplicate-shared');
            }}
          >
            Дублювати зі спільного
          </MenuItem>
        )}

        <MenuItem
          textStyle={styles.menuItemText}
          onPress={() => {
            setShareOpen(true);
            closeMenu();
          }}
        >
          Поділитися
        </MenuItem>
      </Menu>
      <Modal isVisible={isNameModalVisible} onClose={() => setIsNameModalVisible(false)} onSubmit={handleNameChange} title="Нове ім'я">
        <TextInput value={newName} onChangeText={setNewName} style={styles.tableCell} />
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
        <Text style={styles.modalInfoText}>Рівень: {getLevelByExperience(tempExp)}</Text>
        <Text style={styles.modalInfoText}>Досвід: {tempExp}</Text>
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
            <View key={row.level} style={styles.tableRow}>
              <Text
                style={{
                  color: getLevelByExperience(tempExp) === row.level ? colors.highlight : colors.text,
                }}
              >
                {row.level} рів.
              </Text>
              <Text
                style={{
                  color: getLevelByExperience(tempExp) === row.level ? colors.highlight : colors.text,
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


