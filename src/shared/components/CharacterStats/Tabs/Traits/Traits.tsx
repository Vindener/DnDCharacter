import React from 'react';
import { View, Text } from 'react-native';
import MultiTextInput  from '@/shared/components/TextInput/MultiTextInput';
import { getStyles } from '@/shared/components/CharacterStats/Tabs/style';
import useThemeStore from '@/context/Theme-store';
import { CharacterDto } from '@/types/Character';
import useCharacterStore from '@/context/Character-store';
import { Traits as TraitsType } from '@/types/Traits';

interface TraitsProps {
  data: CharacterDto;
}

const Traits: React.FC<TraitsProps> = ({ data }: TraitsProps) => {
  const updateCharacterTraits = useCharacterStore((s) => s.updateCharacterTraits);
  const character = useCharacterStore((s) => s.characters.find((c) => c.id === data.id));
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const traits = character?.traits ?? ({ personality: '', ideals: '', bonds: '', flaws: '' } as TraitsType);

  const handleChange = (key: keyof TraitsType, value: string) => {
    const newTraits = { ...traits, [key]: value } as TraitsType;
    updateCharacterTraits(data.id, newTraits);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Риси характеру:</Text>
      <MultiTextInput
        numberOfLines={8}
        value={traits.personality}
        onChangeText={(text) => handleChange('personality', text)}
        placeholder='Введіть особистість'
      />

      <Text style={styles.label}>Ідеали:</Text>
      <MultiTextInput
        numberOfLines={8}
        value={traits.ideals}
        onChangeText={(text) => handleChange('ideals', text)}
        placeholder='Введіть ідеали'
      />

      <Text style={styles.label}>Зв`язки:</Text>
      <MultiTextInput
        numberOfLines={8}
        value={traits.bonds}
        onChangeText={(text) => handleChange('bonds', text)}
        placeholder='Введіть зв`язки'
      />

      <Text style={styles.label}>Вади:</Text>
      <MultiTextInput
        numberOfLines={8}
        value={traits.flaws}
        onChangeText={(text) => handleChange('flaws', text)}
        placeholder='Введіть вади'
      />
    </View>
  );
};

export default Traits;
