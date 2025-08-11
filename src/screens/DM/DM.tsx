import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from './style';
import type { DMStackParamList } from '@/navigation/DMNavigator';
import { StackNavigationProp } from '@react-navigation/stack';

const DM: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<DMStackParamList, 'DMHome'>>();
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('LootGenerator')}>
        <Ionicons name='diamond-outline' size={20} color={colors.text} />
        <Text style={styles.buttonText}>Генератор добичі</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('EncounterCalculator')}>
        <Ionicons name='calculator-outline' size={20} color={colors.text} />
        <Text style={styles.buttonText}>Калькулятор бою</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('DMNotes')}>
        <Ionicons name='document-text-outline' size={20} color={colors.text} />
        <Text style={styles.buttonText}>Нотатки</Text>
      </TouchableOpacity>
    </View>
  );
};

export default DM;
