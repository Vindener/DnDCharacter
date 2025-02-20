import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

const CharacterSpells = ({ characterData, setCharacterData }) => {
  const handleSpellChange = (text) => {
    setCharacterData({ ...characterData, spells: text });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Закляття персонажа:</Text>
      <TextInput
        style={styles.memoInput}
        multiline={true}
        numberOfLines={6}
        value={characterData.spells || ""}
        onChangeText={handleSpellChange}
        placeholder="Введіть список заклять"
        placeholderTextColor="#888"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#222" },
  label: { color: "white", fontSize: 16, marginBottom: 5 },
  memoInput: {
    backgroundColor: "#555",
    color: "white",
    padding: 10,
    borderRadius: 5,
    height: 150,
    textAlignVertical: "top", // Для вирівнювання тексту по верхньому краю
  },
});

export default CharacterSpells;
