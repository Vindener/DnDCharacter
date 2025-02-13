import React, { useState,useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert 
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import * as FileSystem from "expo-file-system";
import { shareAsync } from "expo-sharing";

import * as DocumentPicker from 'expo-document-picker';


const DICE_TYPES = [20, 12, 10, 100, 8, 6, 4, 2];

const CharacterSheetScreen = () => {
  // const { character } = route.params; 
  // const [currentCharacter, setCurrentCharacter] = useState(character);

  // useEffect(() => {
  //   if (!character) {
  //     setCurrentCharacter({
  //       id: `${Date.now()}`,
  //       name: "Новий персонаж",
  //       level: 1,
  //       experience: "0/300",
  //       hp: 10,
  //       ac: 10,
  //       speed: 30,
  //       initiative: "+0",
  //       strength: 10,
  //       dexterity: 10,
  //       constitution: 10,
  //       intelligence: 10,
  //       wisdom: 10,
  //       charisma: 10,
  //     });
  //   }
  // }, [character]);

  const [character, setCharacter] = useState({
    name: "Безіменний персонаж",
    level: 1,
    experience: "100/300",
    hp: 10,
    ac: 10,
    speed: 30,
    initiative: "+0",
    strength: 11,
    dexterity: 22,
    constitution: 3,
    intelligence: 4,
    wisdom: 5,
    charisma: 10,
  });

  const [isDiceMenuVisible, setDiceMenuVisible] = useState(false);
  const [isRollModalVisible, setRollModalVisible] = useState(false);
  const [selectedDice, setSelectedDice] = useState(null);
  const [diceCount, setDiceCount] = useState("1");
  const [rollResults, setRollResults] = useState([]);

  const rollDice = () => {
    const count = parseInt(diceCount) || 1;
    const results = Array.from({ length: count }, () => Math.floor(Math.random() * selectedDice) + 1);
    setRollResults(results);
    setRollModalVisible(false);
  };

const rollD20 = (modifier) => {
  const roll = Math.floor(Math.random() * 20) + 1;
  setRollResult(roll + parseInt(modifier, 10));
  setRollModalVisible(true);
};

// Функція для збереження в AsyncStorage
const saveCharacter = async () => {
  try {
    const jsonValue = JSON.stringify(character);
    await AsyncStorage.setItem("@character_data", jsonValue);
    Alert.alert("Успіх", "Дані збережено!");
  } catch (e) {
    Alert.alert("Помилка", "Не вдалося зберегти дані.");
  }
};

// Функція для завантаження з AsyncStorage
const loadCharacter = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem("@character_data");
    if (jsonValue != null) {
      setCharacter(JSON.parse(jsonValue));
      Alert.alert("Успіх", "Дані завантажено!");
    } else {
      Alert.alert("Інформація", "Немає збережених даних.");
    }
  } catch (e) {
    Alert.alert("Помилка", "Не вдалося завантажити дані.");
  }
};


// Функція для імпорту JSON із файлу
const exportToFile = async () => {
    try {
      // Створення JSON-даних
      const jsonData = JSON.stringify(character, null, 2);

      // Локальне збереження файлу
      const fileUri = FileSystem.documentDirectory + "character.json";
      await FileSystem.writeAsStringAsync(fileUri, jsonData, { encoding: FileSystem.EncodingType.UTF8 });

      // Поширення файлу
      await shareAsync(fileUri);
    } catch (error) {
      Alert.alert("Помилка", `Не вдалося експортувати файл: ${error.message}`);
    }
  };


const importFromFile = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });

    if (result.canceled || !result.assets || !result.assets.length) {
      Alert.alert("Помилка", "Файл не вибрано!");
      return;
    }

    const fileUri = result.assets[0].uri;
    const jsonString = await FileSystem.readAsStringAsync(fileUri);
    const jsonData = JSON.parse(jsonString);
    
    setCharacter(jsonData);
    Alert.alert("Успіх", "Дані імпортовано!");
  } catch (e) {
    Alert.alert("Помилка", `Не вдалося імпортувати файл: ${e.message}`);
  }
};



  return (
    <View style={styles.container}>
      {/* Закріплений верхній блок */}
      <View style={styles.header}>
        <Text style={styles.characterName}>{character.name}</Text>
        <Text style={styles.level}>Рівень {character.level}</Text>
        <Text style={styles.exp}>{character.experience}</Text>
        
        <TouchableOpacity style={styles.button} onPress={saveCharacter}>
    <Text style={styles.buttonText}>Зберегти</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.button} onPress={loadCharacter}>
    <Text style={styles.buttonText}>Завантажити</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.button} onPress={importFromFile}>
    <Text style={styles.buttonText}>Імпорт JSON</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.button} onPress={exportToFile}>
    <Text style={styles.buttonText}>експор JSON</Text>
  </TouchableOpacity>
      </View>

      {/* Основний контент зі скролом */}
      <ScrollView contentContainerStyle={styles.content}>
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
                value={character[stat.key]}
                onChangeText={(text) => setCharacter({ ...character, [stat.key]: text })}
              />
            </View>
          ))}
        </View> 

        {/* Характеристики */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Характеристики та навички</Text>
        {[
          { key: "strength", label: "Сила" },
          { key: "dexterity", label: "Ловкість" },
          { key: "constitution", label: "Тілобудова" },
          { key: "intelligence", label: "Інтелект" },
          { key: "wisdom", label: "Мудрість" },
          { key: "charisma", label: "Харизма" },
        ].map((attr) => (
          <View key={attr.key} style={styles.statRow}>
            <Text style={styles.statName}>{attr.label}</Text>
            <TextInput
              style={styles.statInput}
              keyboardType="numeric"
              value={character[attr.key]}
              onChangeText={(text) => setCharacter({ ...character, [attr.key]: text })}
            />
            <TouchableOpacity
              style={styles.rollButton}
              onPress={() => rollD20(character[attr.key])}
            >
              <Text style={styles.rollButtonText}>{character[attr.key]}</Text>
            </TouchableOpacity>
          </View>
        ))}
        </View>
      </ScrollView>

      {/* Кнопка відкриття меню кубиків */}
      <TouchableOpacity style={styles.diceButton} onPress={() => setDiceMenuVisible(true)}>
        <Text style={styles.diceText}>🎲</Text>
      </TouchableOpacity>

      {/* Меню вибору кубика */}
      {isDiceMenuVisible && (
        <View style={styles.diceMenu}>
          {DICE_TYPES.map((dice) => (
            <TouchableOpacity
              key={dice}
              style={styles.diceOption}
              onPress={() => {
                setSelectedDice(dice);
                setRollModalVisible(true);
                setDiceMenuVisible(false);
              }}
            >
              <Text style={styles.diceOptionText}>к{dice}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.diceClose} onPress={() => setDiceMenuVisible(false)}>
            <Text style={styles.diceCloseText}>✖</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Модальне вікно для вибору кількості кидків */}
      <Modal visible={isRollModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Кидок к{selectedDice}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={diceCount}
              onChangeText={setDiceCount}
              placeholder="Кількість"
            />
            <TouchableOpacity style={styles.modalButton} onPress={rollDice}>
              <Text style={styles.modalButtonText}>Бросок</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Модальне вікно з результатом */}
      {rollResults.length > 0 && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Результати:</Text>
              <Text style={styles.modalResult}>{rollResults.join(", ")}</Text>
              <Text style={styles.modalResult}>Сума: {rollResults.reduce((a, b) => a + b, 0)}</Text>
              <TouchableOpacity style={styles.modalButton} onPress={() => setRollResults([])}>
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: "#222" },
  content: { padding: 20 },
  diceButton: { position: "absolute", bottom: 20, right: 20, backgroundColor: "#6200EE", padding: 15, borderRadius: 50 },
  diceText: { color: "white", fontSize: 24 },
  diceMenu: { position: "absolute", bottom: 80, right: 20, backgroundColor: "#333", padding: 10, borderRadius: 10, flexWrap: "wrap", flexDirection: "row", width: 180 },
  diceOption: { width: "30%", margin: 5, backgroundColor: "#444", padding: 10, borderRadius: 5, alignItems: "center" },
  diceOptionText: { color: "white", fontSize: 16 },
  diceClose: { width: "30%", margin: 5, backgroundColor: "#6200EE", padding: 10, borderRadius: 5, alignItems: "center" },
  diceCloseText: { color: "white", fontSize: 16 },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.7)" },
  modalContent: { backgroundColor: "#333", padding: 20, borderRadius: 10, alignItems: "center" },
  modalTitle: { color: "white", fontSize: 18, marginBottom: 10 },
  modalResult: { color: "#B39DDB", fontSize: 20, fontWeight: "bold" },
  modalButton: { marginTop: 10, padding: 10, backgroundColor: "#6200EE", borderRadius: 5 },
  modalButtonText: { color: "white", fontSize: 16 },
  input: { backgroundColor: "#555", color: "white", padding: 8, borderRadius: 5, width: 60, textAlign: "center", marginBottom: 10 },
  header: { backgroundColor: "#3A3A3A", padding: 20, alignItems: "center" },
  characterName: { color: "white", fontSize: 20, fontWeight: "bold" },
  level: { color: "#B39DDB", fontSize: 16 },
  exp: { color: "#B0BEC5", fontSize: 14 },
  content: { padding: 20 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", marginBottom: 10 },
  statBox: { backgroundColor: "#444", color: "white", padding: 10, borderRadius: 5, margin: 5 },
  section: { marginTop: 20 },
  sectionTitle: { color: "#B39DDB", fontSize: 18, marginBottom: 10 },
  statRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  statName: { color: "white", fontSize: 16, flex: 1 },
  statInput: { backgroundColor: "#555", color: "white", padding: 8, borderRadius: 5, width: 60, textAlign: "center" },
  diceButton: { position: "absolute", bottom: 20, right: 20, backgroundColor: "#6200EE", padding: 15, borderRadius: 50 },
  diceText: { color: "white", fontSize: 24 },
  diceMenu: { position: "absolute", bottom: 80, right: 20, backgroundColor: "#333", padding: 10, borderRadius: 10, flexWrap: "wrap", flexDirection: "row", width: 180 },
  diceOption: { width: "30%", margin: 5, backgroundColor: "#444", padding: 10, borderRadius: 5, alignItems: "center" },
  diceOptionText: { color: "white", fontSize: 16 },
  diceClose: { width: "30%", margin: 5, backgroundColor: "#6200EE", padding: 10, borderRadius: 5, alignItems: "center" },
  diceCloseText: { color: "white", fontSize: 16 },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.7)" },
  modalContent: { backgroundColor: "#333", padding: 20, borderRadius: 10, alignItems: "center" },
  modalTitle: { color: "white", fontSize: 18, marginBottom: 10 },
  modalResult: { color: "#B39DDB", fontSize: 30, fontWeight: "bold" },
  modalButton: { marginTop: 10, padding: 10, backgroundColor: "#6200EE", borderRadius: 5 },
  modalButtonText: { color: "white", fontSize: 16 },

  saveButton: { backgroundColor: "#4CAF50", padding: 10, borderRadius: 5 },
  loadButton: { backgroundColor: "#2196F3", padding: 10, borderRadius: 5 },
  buttonText: { color: "white", fontWeight: "bold" },
});

export default CharacterSheetScreen;
