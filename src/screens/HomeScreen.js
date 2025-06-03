import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CharacterCard from "../components/CharacterCard";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const STORAGE_KEY = "DnD_Characters";

const HomeScreen = ({ navigation }) => {

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

  const [characters, setCharacters] = useState([]);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    const loadCharacters = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setCharacters(JSON.parse(stored));
      } catch (e) {
        console.error("Помилка завантаження:", e);
      }
    };
    loadCharacters();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
  }, [characters]);

  const filtered = characters
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sortAsc
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.sortLabel}>Ім'я: </Text>
        <TouchableOpacity onPress={() => setSortAsc((s) => !s)}>
          <Text style={styles.sortValue}>
            {sortAsc ? "A - Z" : "Z - A"}{" "}
            <Ionicons name="chevron-up" size={14} color="#2f95dc" />
          </Text>
        </TouchableOpacity>
        <View style={styles.slotBadge}>
          <Text style={styles.slotText}>Slots: {characters.length}/15</Text>
        </View>
      </View>

      <TextInput
        placeholder="Пошук героїв"
        placeholderTextColor="#888"
        style={styles.search}
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <CharacterCard
            character={item}
            onPress={() =>
              navigation.navigate("CharacterSheet", {
                character: item,
                onUpdateCharacter: (updated) => {
                  const updatedList = characters.map((c) =>
                    c.id === updated.id ? updated : c
                  );
                  setCharacters(updatedList);
                },
              })
            }
            onDelete={() =>
              setCharacters((prev) =>
                prev.filter((c) => c.id !== item.id)
              )
            }
          />
        )}
      />

      <View style={styles.buttonContainer}>
        <View style={{ height: 8 }} />
        <Button
          title="Імпортувати героя"
          onPress={importFromFile}
        />
        <View style={{ height: 8 }} />
        <Button
          title="Створити нового героя"
          onPress={() =>
            navigation.navigate("CreateCharacter", {
              onCreateCharacter: (newChar) =>
                setCharacters((prev) => [...prev, newChar]),
            })
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1c1c1e",
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  sortLabel: {
    color: "white",
    fontWeight: "bold",
    marginRight: 4,
  },
  sortValue: {
    color: "#2f95dc",
    fontWeight: "600",
    marginRight: 12,
  },
  slotBadge: {
    backgroundColor: "#ff3b30",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: "auto",
  },
  slotText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  search: {
    backgroundColor: "#2c2c2e",
    padding: 10,
    borderRadius: 8,
    color: "white",
    marginBottom: 10,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
  },
});

export default HomeScreen;
