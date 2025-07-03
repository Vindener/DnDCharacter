import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { styles } from '@/shared/components/CharacterStats/Tabs/style';
import { CharacterDto } from '@/types/Character';
import useCharacterStore from '@/context/Character-store';

interface NotesProps {
  data: CharacterDto;
}

const Notes: React.FC<NotesProps> = ({ data }: NotesProps) => {
  const updateCharacterNotes = useCharacterStore((s) => s.updateCharacterNotes);
  const character = useCharacterStore((s) => s.characters.find((c) => c.id === data.id));

  const handleChange = (text: string) => {
    updateCharacterNotes(data.id, text);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Нотатки:</Text>
      <TextInput
        style={styles.memoInput}
        multiline={true}
        numberOfLines={6}
        value={character?.notes || ''}
        onChangeText={handleChange}
        placeholder='Введіть ваші нотатки'
        placeholderTextColor='#888'
        returnKeyType='default'
        textAlignVertical='top'
        enablesReturnKeyAutomatically={false}
      />
    </View>
  );
};

export default Notes;
