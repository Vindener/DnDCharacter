import React, { useState } from "react";
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  View,
} from "react-native";

const Dice = ({ modifier }) => {
  const DICE_TYPES = [20, 12, 10, 100, 8, 6, 4, 2];

  const [isDiceMenuVisible, setDiceMenuVisible] = useState(false);
  const [isRollModalVisible, setRollModalVisible] = useState(false);
  const [selectedDice, setSelectedDice] = useState(null);
  const [diceCount, setDiceCount] = useState("1");
  const [rollResults, setRollResults] = useState([]);
  const [totalResult, setTotalResult] = useState(0);

  // Функція для кидка кубиків з обраним типом та кількістю
  const rollDice = (modifier) => {
    const count = parseInt(diceCount) || 1;
    const results = Array.from({ length: count }, () =>
      Math.floor(Math.random() * selectedDice) + 1
    );
    const sum = results.reduce((a, b) => a + b, 0) + parseInt(modifier, 10);
    setRollResults(results);
    setTotalResult(sum);
    setRollModalVisible(false);
  };


  return (
    <>
      {/* Кнопка відкриття меню кубиків */}
      <TouchableOpacity
        style={styles.diceButton}
        onPress={() => setDiceMenuVisible(true)}
      >
        <Text style={styles.diceText}>🎲</Text>
      </TouchableOpacity>

      {/* Меню вибору кубика */}
      {isDiceMenuVisible && (
        <View style={styles.diceMenu}>
          {DICE_TYPES.map((dice) => (
            <TouchableOpacity
              key={dice}
              style={styles.diceOption}
              onPress={() => {
                setSelectedDice(dice);
                setRollModalVisible(true);
                setDiceMenuVisible(false);
              }}
            >
              <Text style={styles.diceOptionText}>к{dice}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.diceClose}
            onPress={() => setDiceMenuVisible(false)}
          >
            <Text style={styles.diceCloseText}>✖</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Модальне вікно для вибору кількості кидків */}
      <Modal visible={isRollModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Кидок к{selectedDice}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={diceCount}
              onChangeText={setDiceCount}
              placeholder="Кількість"
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => rollDice(modifier || 0)}
            >
              <Text style={styles.modalButtonText}>Бросок</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Модальне вікно з результатом */}
      {rollResults.length > 0 && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Результати:</Text>
              <Text style={styles.modalResult}>{rollResults.join(", ")}</Text>
              <Text style={styles.modalResult}>
                Сума: {rollResults.reduce((a, b) => a + b, 0)} = {totalResult}
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setRollResults([])}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  diceButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#6200EE",
    padding: 15,
    borderRadius: 50,
  },
  diceText: {
    color: "white",
    fontSize: 24,
  },
  diceMenu: {
    position: "absolute",
    bottom: 80,
    right: 20,
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 10,
    flexWrap: "wrap",
    flexDirection: "row",
    width: 180,
  },
  diceOption: {
    width: "30%",
    margin: 5,
    backgroundColor: "#444",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  diceOptionText: {
    color: "white",
    fontSize: 16,
  },
  diceClose: {
    width: "30%",
    margin: 5,
    backgroundColor: "#6200EE",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  diceCloseText: {
    color: "white",
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    backgroundColor: "#333",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    color: "white",
    fontSize: 18,
    marginBottom: 10,
  },
  modalResult: {
    color: "#B39DDB",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#6200EE",
    borderRadius: 5,
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
  },
  input: {
    backgroundColor: "#555",
    color: "white",
    padding: 8,
    borderRadius: 5,
    width: 60,
    textAlign: "center",
    marginBottom: 10,
  },
});

export default Dice;
