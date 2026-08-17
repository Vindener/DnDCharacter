import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import MultiTextInput from '@/shared/components/TextInput/MultiTextInput';
import { getStyles } from '@/shared/components/CharacterStats/Tabs/style';
import useThemeStore from '@/context/Theme-store';
import { CharacterViewModel } from '@/types/Character';
import useCharacterStore from '@/context/Character-store';

interface BackStoryProps {
  data: CharacterViewModel;
}

const BackStory: React.FC<BackStoryProps> = ({ data }: BackStoryProps) => {
  const { t } = useTranslation('character');
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
      <Text style={styles.label}>{t('legacy.backstory.campaign')}</Text>
      <MultiTextInput
        numberOfLines={8}
        value={character?.campaign || ''}
        onChangeText={handleChangeCampaign}
        placeholder={t('legacy.backstory.campaignPlaceholder')}
      />

      <Text style={styles.label}>{t('legacy.backstory.backstory')}</Text>
      <MultiTextInput
        numberOfLines={8}
        value={character?.backstory || ''}
        onChangeText={handleChangeBackstory}
        placeholder={t('legacy.backstory.backstoryPlaceholder')}
      />

      <Text style={styles.label}>{t('legacy.backstory.alliesAndOrganizations')}</Text>
      <MultiTextInput
        numberOfLines={8}
        value={character?.alliesAndOrganizations || ''}
        onChangeText={handleChangeAlliesAndOrganizations}
        placeholder={t('legacy.backstory.alliesAndOrganizationsPlaceholder')}
      />
    </View>
  );
};

export default BackStory;
