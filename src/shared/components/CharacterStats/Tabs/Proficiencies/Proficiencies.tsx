import React from 'react';
import { View, Text } from 'react-native';
import MultiTextInput  from '@/shared/components/TextInput/MultiTextInput';
import { getStyles } from '@/shared/components/CharacterStats/Tabs/style';
import useThemeStore from '@/context/Theme-store';
import { CharacterDto } from '@/types/Character';
import useCharacterStore from '@/context/Character-store';

interface ProficienciesProps {
  data: CharacterDto;
}

const Proficiencies: React.FC<ProficienciesProps> = ({ data }: ProficienciesProps) => {
  const updateCharacterProficiencies = useCharacterStore((s) => s.updateCharacterProficiencies);
  const character = useCharacterStore((s) => s.characters.find((c) => c.id === data.id));
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const proficienciesText = (character?.proficiencies || []).join('\n');

  const handleChange = (text: string) => {
    const proficienciesArray = text.split('\n').filter((line) => line.trim() !== '');
    updateCharacterProficiencies(data.id, proficienciesArray);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Професійні навички персонажа:</Text>
      <MultiTextInput
        numberOfLines={8}
        value={proficienciesText}
        onChangeText={handleChange}
        placeholder='Введіть навички персонажа'
        blurOnSubmit={false}
      />
    </View>
  );
};

export default Proficiencies;
