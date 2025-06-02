import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Button,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons"; // Пакет іконок для хрестика
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";

const STORAGE_KEY = "DnD_Characters";

const HomeScreen = ({ navigation }) => {
  const [characters, setCharacters] = useState([]);

  
const updateCharacter = (updatedCharacter) => {
  setCharacters((prevCharacters) =>
    prevCharacters.map((char) =>
      char.id === updatedCharacter.id ? updatedCharacter : char
    )
  );
};


  useEffect(() => {
    const loadCharacters = async () => {
      try {
        const storedCharacters = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedCharacters) {
          setCharacters(JSON.parse(storedCharacters));
        }
      } catch (e) {
        console.error("Помилка завантаження персонажів:", e);
      }
    };

    loadCharacters();
  }, []);

  useEffect(() => {
    const saveCharacters = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
      } catch (e) {
        console.error("Помилка збереження персонажів:", e);
      }
    };

    if (characters.length > 0) {
      saveCharacters();
    }
  }, [characters]);

  const addNewCharacter = (newCharacter) => {
    setCharacters((prevCharacters) => [...prevCharacters, newCharacter]);
  };

  const removeCharacter = (characterId) => {
    setCharacters((prevCharacters) =>
      prevCharacters.filter((character) => character.id !== characterId)
    );
  };

  const renderCharacterItem = ({ item }) => (
    <View style={styles.characterItem}>
      <TouchableOpacity
        style={styles.characterInfo}
        onPress={() =>
          navigation.navigate("CharacterSheet", {
            character: item,
            onUpdateCharacter: updateCharacter,
          })
        }
      >
        <Text style={styles.characterText}>{item.name}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => removeCharacter(item.id)}>
        <Ionicons name="close-circle" size={24} color="red" />
      </TouchableOpacity>
    </View>
  );

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

      if (!jsonData.id) {
        jsonData.id = Date.now().toString();
      }

      setCharacters((prevCharacters) => [...prevCharacters, jsonData]);
      Alert.alert("Успіх", "Дані імпортовано!");
    } catch (e) {
      Alert.alert("Помилка", `Не вдалося імпортувати файл: ${e.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={characters}
        renderItem={renderCharacterItem}
        keyExtractor={(item) => item.id}
      />
      <Button title="Імпортувати героя" onPress={importFromFile} />
      <Button
        title="Створити нового героя"
        onPress={() =>
          navigation.navigate("CreateCharacter", {
            onCreateCharacter: addNewCharacter,
          })
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  characterItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    marginBottom: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  characterInfo: {
    flex: 1,
  },
  characterText: {
    fontSize: 18,
  },
});

export default HomeScreen;
