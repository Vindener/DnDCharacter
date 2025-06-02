import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";

const CreateCharacterScreen = ({ navigation, route }) => {
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [characterClass, setCharacterClass] = useState("");

  const handleCreateCharacter = () => {
    const newCharacter = {
      id: Date.now().toString(),
      name,
      level,
      class: characterClass,
    };

    if (route.params?.onCreateCharacter) {
      route.params.onCreateCharacter(newCharacter);
    }

    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Ім'я персонажа:</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Введіть ім'я"
      />

      <Text style={styles.label}>Рівень персонажа:</Text>
      <TextInput
        style={styles.input}
        value={level}
        onChangeText={setLevel}
        placeholder="Введіть рівень"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Клас персонажа:</Text>
      <TextInput
        style={styles.input}
        value={characterClass}
        onChangeText={setCharacterClass}
        placeholder="Введіть клас"
      />

      <Button title="Створити персонажа" onPress={handleCreateCharacter} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
});

export default CreateCharacterScreen;
