import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { styles } from '@/shared/components/CharacterStats/Tabs/BackStory/style';
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
      <TextInput
        style={styles.memoInput}
        multiline={true}
        numberOfLines={2}
        value={character?.campaign || ''}
        onChangeText={handleChangeCampaign}
        placeholder='Введіть компанію'
        placeholderTextColor='#888'
        returnKeyType='default'
        textAlignVertical='top'
        enablesReturnKeyAutomatically={false}
      />

      <Text style={styles.label}>Історія героя:</Text>
      <TextInput
        style={styles.memoInput}
        multiline={true}
        numberOfLines={5}
        value={character?.backstory || ''}
        onChangeText={handleChangeBackstory}
        placeholder='Введіть історія героя'
        placeholderTextColor='#888'
        returnKeyType='default'
        textAlignVertical='top'
        enablesReturnKeyAutomatically={false}
      />

      <Text style={styles.label}>Союзники та організації:</Text>
      <TextInput
        style={styles.memoInput}
        multiline={true}
        numberOfLines={5}
        value={character?.alliesAndOrganizations || ''}
        onChangeText={handleChangeAlliesAndOrganizations}
        placeholder='Введіть союзники та організації героя'
        placeholderTextColor='#888'
        returnKeyType='default'
        textAlignVertical='top'
        enablesReturnKeyAutomatically={false}
      />
    </View>
  );
};

export default BackStory;
