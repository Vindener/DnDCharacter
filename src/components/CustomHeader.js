import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

const CustomHeader = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const getTitle = () => {
    switch (route.name) {
      case "Home":
        return "My Characters";
      case "Settings":
        return "Settings";
      default:
        return route.name;
    }
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>D</Text>
        </View>
      </TouchableOpacity>
      <Text style={styles.title}>{getTitle()}</Text>
      <View style={{ width: 36 }} /> {/* Порожнє місце для симетрії */}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 30,
    height: 84,
    backgroundColor: "#1c1c1e",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#2c2c2e",
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ff2d55",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default CustomHeader;
