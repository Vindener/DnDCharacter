import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
} from "react-native";
import { useCharacters } from "../context/CharacterContext";
import { useNavigation } from "@react-navigation/native";

const CreateCharacterScreen = () => {
  const [name, setName] = useState("");
  const [charClass, setCharClass] = useState("");
  const [race, setRace] = useState("");
  const [level, setLevel] = useState("1");

  const { addCharacter } = useCharacters();
  const navigation = useNavigation();

  const handleCreate = () => {
    if (!name) {
      Alert.alert("Помилка", "Ім'я не може бути порожнім");
      return;
    }

    const newChar = {
      id: Date.now().toString(),
      name,
      class: charClass,
      race,
      level: parseInt(level),
    };

    addCharacter(newChar);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Ім’я:</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Клас:</Text>
      <TextInput style={styles.input} value={charClass} onChangeText={setCharClass} />

      <Text style={styles.label}>Раса:</Text>
      <TextInput style={styles.input} value={race} onChangeText={setRace} />

      <Text style={styles.label}>Рівень:</Text>
      <TextInput style={styles.input} value={level} onChangeText={setLevel} keyboardType="numeric" />

      <View style={{ marginTop: 20 }}>
        <Button title="Створити" onPress={handleCreate} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#1c1c1e",
  },
  label: {
    color: "white",
    marginTop: 12,
    fontSize: 16,
  },
  input: {
    backgroundColor: "#2c2c2e",
    color: "white",
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
});

export default CreateCharacterScreen;
