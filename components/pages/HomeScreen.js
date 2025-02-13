import React from "react";
import { View, Button, StyleSheet } from "react-native";

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Button title="Кинути кубик" onPress={() => navigation.navigate("DiceRoller")} />
      <Button title="Лист персонажа" onPress={() => navigation.navigate("CharacterSheet")} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
});

export default HomeScreen;