import React from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from "react-native";

const CharacterAttributes = ({ characterData, setCharacterData }) => {
  // Функція для обчислення модифікатора
  const calculateModifier = (value) => {
    const modifiers = [
      { range: [1], modifier: -5 },
      { range: [2, 3], modifier: -4 },
      { range: [4, 5], modifier: -3 },
      { range: [6, 7], modifier: -2 },
      { range: [8, 9], modifier: -1 },
      { range: [10, 11], modifier: 0 },
      { range: [12, 13], modifier: 1 },
      { range: [14, 15], modifier: 2 },
      { range: [16, 17], modifier: 3 },
      { range: [18, 19], modifier: 4 },
      { range: [20, 21], modifier: 5 },
      { range: [22, 23], modifier: 6 },
      { range: [24, 25], modifier: 7 },
      { range: [26, 27], modifier: 8 },
      { range: [28, 29], modifier: 9 },
      { range: [30], modifier: 10 },
    ];

    for (const entry of modifiers) {
      if (entry.range.includes(value)) {
        return entry.modifier;
      }
    }
    return 0; // Значення за замовчуванням
  };

  const handleInputChange = (field, value) => {
    setCharacterData((prevData) => ({
      ...prevData,
      [field]: parseInt(value) || 0,
    }));
  };

  const rollD20WithModifier = (mod) => {
    const rollResult = Math.floor(Math.random() * 20) + 1 + mod;
    Alert.alert(
      "Результат кидка",
      `Випав результат: ${rollResult - mod} + ${mod}(мод.) = ${rollResult}`
    );
  };

  return (
    <View style={styles.container}>
      {[
        { key: "strength", label: "Сила" },
        { key: "dexterity", label: "Ловкість" },
        { key: "constitution", label: "Тілобудова" },
        { key: "intelligence", label: "Інтелект" },
        { key: "wisdom", label: "Мудрість" },
        { key: "charisma", label: "Харизма" },
      ].map((attr) => {
        const value = characterData[attr.key] || 0;
        const modifier = calculateModifier(value);

        return (
          <View key={attr.key} style={styles.row}>
            <Text style={styles.label}>{attr.label}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={value.toString()}
              onChangeText={(text) => handleInputChange(attr.key, text)}
            />
            <Text style={styles.modifier}>{modifier >= 0 ? `+${modifier}` : modifier}</Text>
            <TouchableOpacity
              style={styles.rollButton}
              onPress={() => rollD20WithModifier(modifier)}
            >
              <Text style={styles.rollButtonText}>🎲</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#222" },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  label: { color: "white", fontSize: 16, flex: 1 },
  input: {
    backgroundColor: "#555",
    color: "white",
    padding: 8,
    borderRadius: 5,
    width: 60,
    textAlign: "center",
  },
  modifier: { color: "white", fontSize: 16, marginLeft: 10, width: 40, textAlign: "center" },
  rollButton: {
    backgroundColor: "#444",
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  rollButtonText: { color: "white", fontSize: 16 },
});

export default CharacterAttributes;
