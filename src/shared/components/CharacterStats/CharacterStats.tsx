import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import Attributes from './Tabs/Attributes/Attributes';
import Spells from './Tabs/Spells/Spells';
import Inventory from './Tabs/Inventory/Inventory';
import Proficiencies from './Tabs/Proficiencies/Proficiencies';
import Notes from './Tabs/Notes/Notes';
import { styles } from '@/shared/components/CharacterStats/style';
import { CharacterDto } from '@/types/Character';

interface CharacterStatsProps {
  character: CharacterDto;
}

const CharacterStats: React.FC<CharacterStatsProps> = ({ character }: CharacterStatsProps) => {
  const [selectedTab, setSelectedTab] = useState<'Attributes' | 'Spells' | 'Inventory' | 'Proficiencies' | 'Notes'>('Attributes');

  const handleTabChange = (newTab: 'Attributes' | 'Spells' | 'Inventory' | 'Proficiencies' | 'Notes') => {
    setSelectedTab(newTab);
  };

  return (
    <View style={styles.tabsContainer}>
      <Picker
        selectedValue={selectedTab}
        style={styles.picker}
        onValueChange={(itemValue) => handleTabChange(itemValue as 'Attributes' | 'Spells')}
      >
        <Picker.Item label='Характеристики' value='Attributes' />
        <Picker.Item label='Закляття' value='Spells' />
        <Picker.Item label='Інвентар' value='Inventory' />
        <Picker.Item label='Професійні навички' value='Proficiencies' />
        <Picker.Item label='Нотатки' value='Notes' />
      </Picker>

      {selectedTab === 'Attributes' && <Attributes data={character} />}
      {selectedTab === 'Spells' && <Spells data={character} />}
      {selectedTab === 'Inventory' && <Inventory data={character} />}
      {selectedTab === 'Proficiencies' && <Proficiencies data={character} />}
      {selectedTab === 'Notes' && <Notes data={character} />}
    </View>
  );
};

export default CharacterStats;
