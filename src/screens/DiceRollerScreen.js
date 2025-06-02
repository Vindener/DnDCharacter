import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";

const DiceRollerScreen = () => {
  const diceTypes = [4, 6, 8, 10, 12, 20];
  const [result, setResult] = useState(null);

  const rollDice = (sides) => {
    setResult(Math.floor(Math.random() * sides) + 1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Вибери кубик:</Text>
      <FlatList
        data={diceTypes}
        keyExtractor={(item) => item.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.diceButton} onPress={() => rollDice(item)}>
            <Text style={styles.diceText}>К{item}</Text>
          </TouchableOpacity>
        )}
      />
      {result !== null && <Text style={styles.result}>Результат: {result}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 20, marginBottom: 20 },
  diceButton: { backgroundColor: "#6200EE", padding: 10, borderRadius: 5, marginVertical: 5 },
  diceText: { color: "white", fontSize: 18 },
  result: { fontSize: 24, marginTop: 20, fontWeight: "bold" },
});

export default DiceRollerScreen;
