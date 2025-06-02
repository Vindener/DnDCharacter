import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Button,
  Modal,
  BackHandler,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import * as FileSystem from "expo-file-system";
import { shareAsync } from "expo-sharing";

import * as DocumentPicker from "expo-document-picker";

import { Menu, MenuItem, MenuDivider } from "react-native-material-menu";
import CharacterTabs from "./CharacterTabs";

import Dice from "../../components/Dice";

import * as ImagePicker from "expo-image-picker";

const CharacterSheetScreen = ({ route, navigation }) => {
  const { character, onUpdateCharacter } = route.params; // Отримуємо функцію оновлення

  const [restModalVisible, setRestModalVisible] = useState(false);
  const [tempHitDice, setTempHitDice] = useState(2 || 6);

  const changeCharacterName = (newName) => {
    setCharacterData((prevData) => {
      const updatedCharacter = { ...prevData, name: newName };
      if (onUpdateCharacter) {
        onUpdateCharacter(updatedCharacter); // Оновлюємо дані в HomeScreen
      }
      return updatedCharacter;
    });
  };

  const handleShortRest = () => {
    const heal = Math.floor(Math.random() * tempHitDice) + 1;
    setTempHP(Math.min(tempHp + heal, tempMaxHp));
    handleHPChange(tempHp);
    setRestModalVisible(false);
  };

  const handleLongRest = () => {
    handleHPChange(tempHp + 1);
    setRestModalVisible(false);
  };

  const [characterData, setCharacterData] = useState({
    name: "",
    level: "",
    class: "",
    experience: "",
    health: "",
    armorClass: "",
    strength: "",
    dexterity: "",
    constitution: "",
    intelligence: "",
    wisdom: "",
    charisma: "",
  });

  // Ініціалізація даних, якщо вони прийшли з `route.params`
  useEffect(() => {
    if (route.params?.character) {
      setCharacterData(route.params.character);
    }
  }, [route.params]);

  // Завантаження даних з локального сховища
  useEffect(() => {
    const loadCharacterData = async () => {
      if (characterData.id) {
        // Перевірка наявності id
        try {
          const storedData = await AsyncStorage.getItem(
            `characterData_${characterData.id}`
          );
          if (storedData) {
            setCharacterData(JSON.parse(storedData));
          }
        } catch (error) {
          console.error("Помилка завантаження даних:", error);
        }
      }
    };
    loadCharacterData();
  }, [characterData.id]);

  // Збереження персонажа в локальне сховище
  const saveCharacter = async () => {
    if (characterData.id) {
      try {
        await AsyncStorage.setItem(
          `characterData_${characterData.id}`,
          JSON.stringify(characterData)
        );
        console.log("Персонаж збережений");
      } catch (error) {
        Alert.alert("Помилка", error.message);
        console.error("Помилка збереження даних:", error);
      }
    } else {
      Alert.alert("Помилка", "Ідентифікатор персонажа не знайдено.");
    }
  };

  // Автоматичне збереження кожні 30 секунд
  useEffect(() => {
    const intervalId = setInterval(() => {
      saveCharacter();
    }, 30000); // 30 секунд

    return () => clearInterval(intervalId);
  }, [characterData]);

  // Збереження при виході назад
  useEffect(() => {
    const handleBackPress = () => {
      saveCharacter();
      return false; // Дозволяє стандартний вихід
    };

    const unsubscribe = navigation.addListener("beforeRemove", saveCharacter);
    BackHandler.addEventListener("hardwareBackPress", handleBackPress);

    return () => {
      unsubscribe(); // Відписка від подій навігації
      BackHandler.removeEventListener("hardwareBackPress", handleBackPress);
    };
  }, [characterData]);

  // Функція для завантаження з AsyncStorage
  const loadCharacter = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem("characterData");
      if (jsonValue != null) {
        setCharacterData(JSON.parse(jsonValue));
        Alert.alert("Успіх", "Дані завантажено!");
      } else {
        Alert.alert("Інформація", "Немає збережених даних.");
      }
    } catch (e) {
      Alert.alert("Помилка", "Не вдалося завантажити дані.");
    }
  };

  //  імпорт та експорт JSON із файлу
  const exportToFile = async () => {
    try {
      // Створення JSON-даних
      const jsonData = JSON.stringify(characterData, null, 2);

      // Локальне збереження файлу
      const fileUri = FileSystem.documentDirectory + "character.json";
      await FileSystem.writeAsStringAsync(fileUri, jsonData, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Поширення файлу
      await shareAsync(fileUri);
    } catch (error) {
      Alert.alert("Помилка", `Не вдалося експортувати файл: ${error.message}`);
    }
  };

  const importFromFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
      });

      if (result.canceled || !result.assets || !result.assets.length) {
        Alert.alert("Помилка", "Файл не вибрано!");
        return;
      }

      const fileUri = result.assets[0].uri;
      const jsonString = await FileSystem.readAsStringAsync(fileUri);
      const jsonData = JSON.parse(jsonString);

      setCharacterData(jsonData);
      Alert.alert("Успіх", "Дані імпортовано!");
    } catch (e) {
      Alert.alert("Помилка", `Не вдалося імпортувати файл: ${e.message}`);
    }
  };

  console.log("characterData:", characterData);

  const [menuVisible, setMenuVisible] = useState(false);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  // Функція для вибору фото
  const pickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const photoUri = result.assets[0].uri;
        setCharacterData((prevData) => ({ ...prevData, photoUri }));
        Alert.alert("Успіх", "Фото завантажено!");
      }
    } catch (error) {
      Alert.alert("Помилка", "Не вдалося вибрати фото.");
    }
  };

  // Видалення фото
  const removePhoto = () => {
    setCharacterData((prevData) => ({ ...prevData, photoUri: "" }));
    Alert.alert("Успіх", "Фото видалено!");
  };

  const [isNameModalVisible, setIsNameModalVisible] = useState(false);
  const [newName, setNewName] = useState("");

  const handleNameChange = () => {
    if (!newName.trim()) {
      Alert.alert("Помилка", "Ім'я не може бути порожнім!");
      return;
    }
    setCharacterData((prevData) => ({ ...prevData, name: newName }));
    setIsNameModalVisible(false);
    onUpdateCharacter({ ...characterData, name: newName });
  };

  //НР
  const [isHpModalVisible, setIsHpModalVisible] = useState(false);
  const [tempHp, setTempHP] = useState(characterData.hp);
  const [tempMaxHp, setTempMaxHP] = useState(characterData.maxHp);

  const handleHPChange = (text) => {
    const value = text === "" ? 0 : Number(text);
    setTempHP(isNaN(value) ? 0 : Math.min(value, tempMaxHp));
  };

  const handleMaxHPChange = (text) => {
    const value = text === "" ? 0 : Number(text);
    setTempMaxHP(isNaN(value) ? 0 : value);
  };

  const handleSaveHp = () => {
    setCharacterData((prevData) => ({
      ...prevData,
      hp: tempHp,
      maxHp: tempMaxHp,
    }));
    setIsHpModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Закріплений верхній блок */}
      <View style={styles.header}>
        {/* Відображення фото */}
        {characterData.photoUri ? (
          <Image
            source={{ uri: characterData.photoUri }}
            style={styles.characterPhoto}
          />
        ) : (
          <View style={styles.placeholderPhoto}>
            <Text style={styles.placeholderText}>Фото героя</Text>
          </View>
        )}

        <Text style={styles.characterName}>
          {characterData.name}
          <Menu
            visible={menuVisible}
            anchor={
              <TouchableOpacity onPress={openMenu}>
                <Text style={styles.menuButton}>⋮</Text>
              </TouchableOpacity>
            }
            onRequestClose={closeMenu}
          >
            <MenuItem onPress={() => saveCharacter()}>Зберегти дані</MenuItem>
            <MenuItem onPress={() => loadCharacter()}>
              Завантажити дані
            </MenuItem>
            <MenuItem onPress={() => importFromFile()}>Імпорт JSON</MenuItem>
            <MenuItem onPress={() => exportToFile()}>Експорт JSON</MenuItem>
            <MenuDivider />
            <MenuItem onPress={pickPhoto}>Завантажити фото</MenuItem>
            <MenuItem onPress={removePhoto}>Видалити фото</MenuItem>
            <MenuItem onPress={() => setIsNameModalVisible(true)}>
              Змінити ім'я
            </MenuItem>
          </Menu>
        </Text>
        <Text style={styles.level}>Рівень {characterData.level}</Text>
        <Text style={styles.exp}>{characterData.experience}</Text>

        <TouchableOpacity onPress={() => setRestModalVisible(true)}>
          <Text>Відпочинок</Text>
        </TouchableOpacity>
      </View>

      {/* Основний контент зі скролом */}
      <View contentContainerStyle={styles.content}>
        <View style={styles.statsRow}>
          {[
            { key: "speed", label: "🏃 Швидкість" },
            { key: "ac", label: "🛡 Захист" },
            { key: "hp", label: "❤️ HP" },
            { key: "initiative", label: "⚡ Ініціатива" },
          ].map((stat) => (
            <View key={stat.key} style={styles.statBox}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <TextInput
                style={styles.statInput}
                keyboardType="numeric"
                value={characterData[stat.key]?.toString() ?? ""} // Оновлюємо основні статистики, а не вкладені
                onChangeText={(text) =>
                  setCharacterData((prevData) => ({
                    ...prevData,
                    [stat.key]: parseInt(text) || 0, // Оновлюємо конкретне поле
                  }))
                }
              />
            </View>
          ))}
          <View style={styles.statBox}>
            <Text>
              Здоров'я: {characterData.hp}/{characterData.maxHp}
            </Text>
            <Button
              title="Редагувати HP"
              onPress={() => setIsHpModalVisible(true)}
            />
          </View>
        </View>
      </View>

      <ScrollView>
        {/* Вкладки для навігації */}
        <CharacterTabs
          characterData={characterData}
          setCharacterData={setCharacterData}
        />
      </ScrollView>

      <Dice />

      {/* Модальне вікно для зміни імені */}
      <Modal
        visible={isNameModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Змінити ім'я персонажа</Text>
            <TextInput
              style={styles.modalInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Введіть нове ім'я"
              placeholderTextColor="#888"
            />
            <View style={styles.modalButtons}>
              <Button title="Зберегти" onPress={handleNameChange} />
              <Button
                title="Скасувати"
                onPress={() => setIsNameModalVisible(false)}
                color="#FF3B30"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Модальне вікно дял НР */}
      <Modal visible={isHpModalVisible} animationType="slide">
        <View style={{ padding: 20 }}>
          <Text>Поточне HP: {tempHp}</Text>
          <TextInput
            keyboardType="numeric"
            value={String(tempHp || "")}
            onChangeText={handleHPChange}
          />
          <TouchableOpacity onPress={() => handleHPChange(tempHp + 1)}>
            <Text>+1 HP</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleHPChange(tempHp - 1)}>
            <Text>-1 HP</Text>
          </TouchableOpacity>

          <Text>Максимальне HP:</Text>
          <TextInput
            keyboardType="numeric"
            value={String(tempMaxHp || "")}
            onChangeText={handleMaxHPChange}
            style={{ borderWidth: 1, marginVertical: 10 }}
          />

          <Button title="Зберегти" onPress={handleSaveHp} />
          <Button
            title="Скасувати"
            onPress={() => setIsHpModalVisible(false)}
          />
        </View>
      </Modal>

      <Modal visible={restModalVisible} animationType="slide">
        <View>
          <Text>Відпочинок</Text>
          <Button
            title="Короткий відпочинок (кидання кості хито)"
            onPress={handleShortRest}
          />
          <Button
            title="Тривалий відпочинок (повне відновлення)"
            onPress={handleLongRest}
          />
          <Button title="Закрити" onPress={() => setRestModalVisible(false)} />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#222" },
  header: { backgroundColor: "#3A3A3A", padding: 20, alignItems: "center" },
  characterName: { color: "white", fontSize: 20, fontWeight: "bold" },
  level: { color: "#B39DDB", fontSize: 16 },
  exp: { color: "#B0BEC5", fontSize: 14 },
  button: {
    backgroundColor: "#6200EE",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  buttonText: { color: "white", fontWeight: "bold" },
  content: { padding: 20 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  statBox: { backgroundColor: "#444", padding: 10, borderRadius: 5, margin: 5 },
  statLabel: { color: "white", fontSize: 16 },
  statInput: {
    backgroundColor: "#555",
    color: "white",
    padding: 8,
    borderRadius: 5,
    width: 60,
    textAlign: "center",
  },
  section: { marginTop: 20 },
  sectionTitle: { color: "#B39DDB", fontSize: 18, marginBottom: 10 },
  statRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  statName: { color: "white", fontSize: 16, flex: 1 },
  menuButton: { fontSize: 24, color: "#fff", paddingLeft: 20 },
  characterPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  placeholderPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#555",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#333",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    color: "white",
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: "#555",
    color: "white",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    textAlign: "center",
  },
  modalButtons: { flexDirection: "row", justifyContent: "space-between" },
});

export default CharacterSheetScreen;
