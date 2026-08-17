import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import MultiTextInput from '@/shared/components/TextInput/MultiTextInput';
import { getStyles } from '@/shared/components/CharacterStats/Tabs/style';
import useThemeStore from '@/context/Theme-store';
import { CharacterViewModel } from '@/types/Character';
import useCharacterStore from '@/context/Character-store';

interface NotesProps {
  data: CharacterViewModel;
}

const Notes: React.FC<NotesProps> = ({ data }: NotesProps) => {
  const { t } = useTranslation('character');
  const updateCharacterNotes = useCharacterStore((s) => s.updateCharacterNotes);
  const character = useCharacterStore((s) => s.characters.find((c) => c.id === data.id));
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const handleChange = (text: string) => {
    updateCharacterNotes(data.id, text);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('legacy.notes.title')}</Text>
      <MultiTextInput
        value={character?.notes || ''}
        onChangeText={handleChange}
        placeholder={t('legacy.notes.placeholder')}
        initialHeight={160}
        minHeight={100}
        maxHeight={560}
      />
    </View>
  );
};

export default Notes;
