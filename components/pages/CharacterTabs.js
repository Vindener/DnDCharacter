import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Picker } from "@react-native-picker/picker";

import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
const Tab = createMaterialTopTabNavigator();

import CharacterAttributes from "./tabs/CharacterAttributes";
import CharacterSpells from "./tabs/CharacterSpells";

const CharacterTabs = ({ characterData, setCharacterData }) => {
  const [selectedTab, setSelectedTab] = useState("Attributes");

  const handleTabChange = (newTab) => {
    setSelectedTab(newTab);
  };

  return (
    <View style={styles.tabsContainer}>
      {/* Випадаючий список для вибору вкладки */}
      <Picker
        selectedValue={selectedTab}
        style={styles.picker}
        onValueChange={(itemValue) => handleTabChange(itemValue)}
      >
        <Picker.Item label="Характеристики" value="Attributes" />
        <Picker.Item label="Закляття" value="Spells" />
      </Picker>

      {/* Відображення вкладки залежно від вибору */}
      {selectedTab === "Attributes" && (
        <CharacterAttributes
          characterData={characterData}
          setCharacterData={setCharacterData}
        />
      )}
      {selectedTab === "Spells" && (
        <CharacterSpells
          characterData={characterData}
          setCharacterData={setCharacterData}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tabsContainer: { marginVertical: 20 },
  picker: {
    height: 50,
    width: "100%",
    color: "white",
    backgroundColor: "#444",
    marginBottom: 10,
    borderRadius: 5,
  },
});

export default CharacterTabs;
