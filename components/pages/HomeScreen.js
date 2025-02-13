import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Button,
  StyleSheet,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";

const HomeScreen = ({ navigation }) => {
  const [characters, setCharacters] = useState([]);

  const addNewCharacter = (newCharacter) => {
    setCharacters((prevCharacters) => [...prevCharacters, newCharacter]);
  };

  const renderCharacterItem = ({ item }) => (
    <TouchableOpacity
      style={styles.characterItem}
      onPress={() =>
        navigation.navigate("CharacterSheet", { character: item })
      }
    >
      <Text style={styles.characterText}>{item.name}</Text>
    </TouchableOpacity>
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
    padding: 16,
    marginBottom: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  characterText: {
    fontSize: 18,
  },
});

export default HomeScreen;
