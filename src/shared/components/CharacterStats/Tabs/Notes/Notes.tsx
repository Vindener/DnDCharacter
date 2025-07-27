import React from 'react';
import { View, Text } from 'react-native';
import MultiTextInput from '@/shared/components/TextInput/MultiTextInput';
import { getStyles } from '@/shared/components/CharacterStats/Tabs/style';
import useThemeStore from '@/context/Theme-store';
import { CharacterDto } from '@/types/Character';
import useCharacterStore from '@/context/Character-store';

interface NotesProps {
  data: CharacterDto;
}

const Notes: React.FC<NotesProps> = ({ data }: NotesProps) => {
  const updateCharacterNotes = useCharacterStore((s) => s.updateCharacterNotes);
  const character = useCharacterStore((s) => s.characters.find((c) => c.id === data.id));
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const handleChange = (text: string) => {
    updateCharacterNotes(data.id, text);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Нотатки:</Text>
      <MultiTextInput numberOfLines={6} value={character?.notes || ''} onChangeText={handleChange} placeholder='Введіть ваші нотатки' />
    </View>
  );
};

export default Notes;
