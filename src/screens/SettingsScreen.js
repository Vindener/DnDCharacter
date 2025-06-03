import React from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import { useThemeContext } from "../context/ThemeContext";

const SettingsScreen = () => {
  const { isDark, toggleTheme } = useThemeContext();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Темна тема</Text>
      <Switch value={isDark} onValueChange={toggleTheme} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 20,
    marginBottom: 10,
  },
});

export default SettingsScreen;
