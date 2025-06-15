import React, { JSX, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { styles } from '@/screens/CreateCharacter/style';
import useCharacterStore from '@/context/CharacterContext';

type Character = {
  id: string;
  name: string;
  class: string;
  race: string;
  level: number;
};

const CreateCharacter = (): JSX.Element => {
  const [name, setName] = useState('');
  const [charClass, setCharClass] = useState('');
  const [race, setRace] = useState('');
  const [level, setLevel] = useState('1');

  // TODO fix any
  const addCharacter = useCharacterStore((state: any) => state.addCharacter);
  const navigation = useNavigation();

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Помилка', "Ім'я не може бути порожнім");
      return;
    }

    const newChar: Character = {
      id: Date.now().toString(),
      name,
      class: charClass,
      race,
      level: parseInt(level, 10),
    };

    await addCharacter(newChar);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Ім’я:</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Клас:</Text>
      <TextInput style={styles.input} value={charClass} onChangeText={setCharClass} />

      <Text style={styles.label}>Раса:</Text>
      <TextInput style={styles.input} value={race} onChangeText={setRace} />

      <Text style={styles.label}>Рівень:</Text>
      <TextInput style={styles.input} value={level} onChangeText={setLevel} keyboardType='numeric' />

      <View style={{ marginTop: 20 }}>
        <Button title='Створити' onPress={handleCreate} />
      </View>
    </View>
  );
};

export default CreateCharacter;
