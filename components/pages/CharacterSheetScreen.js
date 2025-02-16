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

import Dice from "../Dice";



const CharacterSheetScreen = ({route, navigation  }) => {
  const { character } = route.params; 
  const [characterData, setCharacterData] = useState(character);

  // Додай в компонент батька стан для модифікатора
  const [selectedModifier, setSelectedModifier] = useState(0);
  const [isDiceVisible, setDiceVisible] = useState(false);

  // Функція для відкриття Dice з модифікатором
  const handleRollDice = (modifier) => {
    setSelectedModifier(modifier);
    setDiceVisible(true);
  };


  useEffect(() => {
    if (!character) {
      setCurrentCharacter({
        id: `${Date.now()}`,
        name: "Новий персонаж",
        level: 1,
        experience: "0/300",
        hp: 10,
        ac: 10,
        speed: 30,
        initiative: "+0",
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      });
    }
  }, [character]);

  // const [character, setCharacter] = useState({
  //   name: "Безіменний персонаж",
  //   level: 1,
  //   experience: "100/300",
  //   hp: 10,
  //   ac: 10,
  //   speed: 30,
  //   initiative: "+0",
  //   strength: 11,
  //   dexterity: 22,
  //   constitution: 3,
  //   intelligence: 4,
  //   wisdom: 5,
  //   charisma: 10,
  // });
  
// Функція для збереження в AsyncStorage
   const handleInputChange = (field, value) => {
    setCharacterData((prevData) => ({ ...prevData, [field]: value }));
  };

   const saveCharacter = async () => {
    try {
      const storedCharacters = await AsyncStorage.getItem("DnD_Characters");
      const characters = storedCharacters ? JSON.parse(storedCharacters) : [];

      const updatedCharacters = characters.map((char) =>
        char.id === characterData.id ? characterData : char
      );

      await AsyncStorage.setItem("DnD_Characters", JSON.stringify(updatedCharacters));
      alert("Дані збережено!");
    } catch (e) {
      console.error("Помилка збереження даних:", e);
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

const rollD20WithModifier = (mod) => {
  const rollResult = Math.floor(Math.random() * 20) + 1 + mod;
   Alert.alert('Результат кидка',`Випав результат: ${rollResult- mod} + ${mod}(мод.) = ${rollResult}`);
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
              onChangeText={(text) =>
                setCharacter({ ...character, [attr.key]: text })
              }
            />
           <TouchableOpacity
            style={styles.rollButton}
            onPress={() => rollD20WithModifier(2)}
          >
            <Text style={styles.rollButtonText}>🎲</Text>
          </TouchableOpacity>


          </View>
        ))}
        {isDiceVisible && <Dice modifier={selectedModifier} />}
        </View>
      </ScrollView>

      <Dice />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#222" },
  header: { backgroundColor: "#3A3A3A", padding: 20, alignItems: "center" },
  characterName: { color: "white", fontSize: 20, fontWeight: "bold" },
  level: { color: "#B39DDB", fontSize: 16 },
  exp: { color: "#B0BEC5", fontSize: 14 },
  button: { backgroundColor: "#6200EE", padding: 10, borderRadius: 5, marginVertical: 5 },
  buttonText: { color: "white", fontWeight: "bold" },
  content: { padding: 20 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", marginBottom: 10 },
  statBox: { backgroundColor: "#444", padding: 10, borderRadius: 5, margin: 5 },
  statLabel: { color: "white", fontSize: 16 },
  statInput: { backgroundColor: "#555", color: "white", padding: 8, borderRadius: 5, width: 60, textAlign: "center" },
  section: { marginTop: 20 },
  sectionTitle: { color: "#B39DDB", fontSize: 18, marginBottom: 10 },
  statRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  statName: { color: "white", fontSize: 16, flex: 1 }
});

export default CharacterSheetScreen;
