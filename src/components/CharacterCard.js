import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const CharacterCard = ({ character, onPress, onDelete }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image
        source={
          character.avatar
            ? { uri: character.avatar }
            : require("../../assets/avatar-placeholder.png")
        }
        style={styles.avatar}
      />
      <View style={styles.info}>
        <Text style={styles.name}>{character.name}</Text>
        <Text style={styles.meta}>
          Рівень {character.level || 1} <Text style={styles.separator}>|</Text> {character.race || "Людина"}
        </Text>
        <Text style={styles.classText}>{character.class || "Клас"}</Text>
      </View>
      <TouchableOpacity onPress={onDelete}>
        <Ionicons name="ellipsis-vertical" size={20} color="white" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#2c2c2e",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: "#444",
  },
  info: {
    flex: 1,
  },
  name: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  meta: {
    color: "gray",
    fontSize: 13,
    marginTop: 2,
  },
  classText: {
    color: "#999",
    fontSize: 13,
  },
  separator: {
    color: "#ff2d55",
  },
});

export default CharacterCard;
