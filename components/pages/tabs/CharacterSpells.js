import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";

const CharacterSpells = ({ characterData, setCharacterData }) => {
  const [newSpell, setNewSpell] = useState("");

  const addSpell = () => {
    if (newSpell.trim() !== "") {
      const updatedSpells = characterData.spells || [];
      updatedSpells.push(newSpell);
      setCharacterData({ ...characterData, spells: updatedSpells });
      setNewSpell("");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Додати закляття:</Text>
      <TextInput
        style={styles.input}
        value={newSpell}
        onChangeText={setNewSpell}
        placeholder="Введіть закляття"
        placeholderTextColor="#888"
      />
      <Button title="Додати" onPress={addSpell} />

      <Text style={styles.label}>Список заклять:</Text>
      {characterData.spells?.map((spell, index) => (
        <Text key={index} style={styles.spell}>
          {spell}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#222" },
  label: { color: "white", fontSize: 16, marginBottom: 5 },
  input: {
    backgroundColor: "#555",
    color: "white",
    padding: 8,
    borderRadius: 5,
    marginBottom: 10,
  },
  spell: { color: "white", fontSize: 16, marginTop: 5 },
});

export default CharacterSpells;
