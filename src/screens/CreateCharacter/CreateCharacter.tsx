import React, { JSX, useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { getStyles } from '@/screens/CreateCharacter/style';
import useThemeStore from '@/context/Theme-store';
import useCharacterStore from '@/context/Character-store';
import { createEmptyCharacter } from '@/shared/helpers/createEmptyCharacter';
import { CLASS_OPTIONS, CLASS_TRANSLATIONS } from '@/shared/const/CharacterClass';

const CreateCharacter = (): JSX.Element => {
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState(CLASS_OPTIONS[0]);
  const [customClassName, setCustomClassName] = useState('');
  const [customHitDice, setCustomHitDice] = useState('8');
  const [race, setRace] = useState('');
  const [level, setLevel] = useState('1');
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const addCharacter = useCharacterStore((state: any) => state.addCharacter);
  const navigation = useNavigation();

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Помилка', "Ім'я не може бути порожнім");
      return;
    }

    let finalClass = selectedClass;
    let hitDice: string | undefined;
    if (selectedClass === 'custom') {
      if (!customClassName.trim()) {
        Alert.alert('Помилка', 'Вкажіть назву класу');
        return;
      }
      const sides = parseInt(customHitDice, 10);
      if (isNaN(sides) || sides < 1) {
        Alert.alert('Помилка', 'Некоректна кістка хітів');
        return;
      }
      finalClass = customClassName.trim();
      hitDice = `${parseInt(level, 10) || 1}d${sides}`;
    }

    const newChar = createEmptyCharacter({
      id: Date.now().toString(),
      name,
      class: finalClass,
      race,
      level: parseInt(level, 10),
      hitDice,
    });

    await addCharacter(newChar);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Ім’я:</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Клас:</Text>
      <Picker selectedValue={selectedClass} style={styles.picker} onValueChange={(v) => setSelectedClass(v)}>
        {CLASS_OPTIONS.map((opt) => (
          <Picker.Item key={opt} label={opt === 'custom' ? 'Свій клас' : CLASS_TRANSLATIONS[opt]} value={opt} />
        ))}
      </Picker>
      {selectedClass === 'custom' && (
        <>
          <Text style={styles.label}>Назва класу:</Text>
          <TextInput style={styles.input} value={customClassName} onChangeText={setCustomClassName} />
          <Text style={styles.label}>Кістка хітів:</Text>
          <TextInput style={styles.input} value={customHitDice} onChangeText={setCustomHitDice} keyboardType='numeric' />
        </>
      )}

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
