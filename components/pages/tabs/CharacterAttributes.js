import React from "react";
import { View, Text, TextInput, StyleSheet,TouchableOpacity,Alert } from "react-native";

const CharacterAttributes = ({ characterData, setCharacterData }) => {
  const handleInputChange = (field, value) => {
    setCharacterData((prevData) => ({
      ...prevData,
      [field]: parseInt(value) || 0,
    }));
  };

  const rollD20WithModifier = (mod) => {
    const rollResult = Math.floor(Math.random() * 20) + 1 + mod;
     Alert.alert('Результат кидка',`Випав результат: ${rollResult- mod} + ${mod}(мод.) = ${rollResult}`);
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
      ].map((attr) => (
        <View key={attr.key} style={styles.row}>
          <Text style={styles.label}>{attr.label}</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={characterData[attr.key]?.toString() ?? ""}
            onChangeText={(text) => handleInputChange(attr.key, text)}
          />
              <TouchableOpacity
                style={styles.rollButton}
                onPress={() => rollD20WithModifier(Number(characterData[attr.key] || 0))}
              >
                <Text style={styles.rollButtonText}>🎲</Text>
              </TouchableOpacity>

        </View>
      ))}
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
});

export default CharacterAttributes;
