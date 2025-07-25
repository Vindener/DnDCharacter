import React from 'react';
import { View, Text } from 'react-native';
import MultiTextInput from '@/shared/components/TextInput/MultiTextInput';
import { getStyles } from '@/shared/components/CharacterStats/Tabs/style';
import useThemeStore from '@/context/Theme-store';
import { CharacterDto } from '@/types/Character';
import useCharacterStore from '@/context/Character-store';

interface BackStoryProps {
  data: CharacterDto;
}

const BackStory: React.FC<BackStoryProps> = ({ data }: BackStoryProps) => {
  const updateCharacterCampaign = useCharacterStore((s) => s.updateCharacterCampaign);
  const updateCharacterBackstory = useCharacterStore((s) => s.updateCharacterBackstory);
  const updateCharacterAlliesAndOrganizations = useCharacterStore((s) => s.updateCharacterAlliesAndOrganizations);
  const character = useCharacterStore((s) => s.characters.find((c) => c.id === data.id));
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const handleChangeCampaign = (text: string) => {
    updateCharacterCampaign(data.id, text);
  };

  const handleChangeBackstory = (text: string) => {
    updateCharacterBackstory(data.id, text);
  };

  const handleChangeAlliesAndOrganizations = (text: string) => {
    updateCharacterAlliesAndOrganizations(data.id, text);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Компанія:</Text>
      <MultiTextInput
        numberOfLines={2}
        value={character?.campaign || ''}
        onChangeText={handleChangeCampaign}
        placeholder='Введіть компанію'
      />

      <Text style={styles.label}>Історія героя:</Text>
      <MultiTextInput
        numberOfLines={5}
        value={character?.backstory || ''}
        onChangeText={handleChangeBackstory}
        placeholder='Введіть історія героя'
      />

      <Text style={styles.label}>Союзники та організації:</Text>
      <MultiTextInput
        numberOfLines={5}
        value={character?.alliesAndOrganizations || ''}
        onChangeText={handleChangeAlliesAndOrganizations}
        placeholder='Введіть союзники та організації героя'
      />
    </View>
  );
};

export default BackStory;
