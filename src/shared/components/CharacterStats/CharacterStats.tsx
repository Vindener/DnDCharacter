import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import Attributes from './Tabs/Attributes/Attributes';
import Spells from './Tabs/Spells/Spells';
import Combat from './Tabs/Combat/Combat';
import Inventory from './Tabs/Inventory/Inventory';
import Proficiencies from './Tabs/Proficiencies/Proficiencies';
import Notes from './Tabs/Notes/Notes';
import BackStory from './Tabs/BackStory/BackStory';
import TraitsTab from './Tabs/Traits/Traits';
import Skills from './Tabs/Skills/Skills';
import { getStyles } from '@/shared/components/CharacterStats/style';
import useThemeStore from '@/context/Theme-store';
import { styles } from '@/shared/components/CharacterStats/style';
import { CharacterDto } from '@/types/Character';
import { CharacterTabs } from '@/shared/const/CharacterTabs';
import CharacterOverview from '../CharacterOverview/CharacterOverview';

interface CharacterStatsProps {
  character: CharacterDto;
}

const CharacterStats: React.FC<CharacterStatsProps> = ({ character }: CharacterStatsProps) => {
  const [selectedTab, setSelectedTab] = useState<CharacterTabs>('Attributes');
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const handleTabChange = (newTab: CharacterTabs) => {
    setSelectedTab(newTab);
  };

  return (
    <View style={styles.tabsContainer}>
      <CharacterOverview />
      <Picker selectedValue={selectedTab} style={styles.picker} onValueChange={(itemValue) => handleTabChange(itemValue as CharacterTabs)}>
        <Picker.Item label='Характеристики' value='Attributes' />
        <Picker.Item label='Навички' value='Skills' />
        <Picker.Item label='Закляття' value='Spells' />
        <Picker.Item label='Бій' value='Combat' />
        <Picker.Item label='Інвентар та зброя' value='Inventory' />
        <Picker.Item label='Професійні навички' value='Proficiencies' />
        <Picker.Item label='Історія героя' value='BackStory' />
        <Picker.Item label='Нотатки' value='Notes' />
        <Picker.Item label='Риси' value='Traits' />
      </Picker>

      {selectedTab === 'Attributes' && <Attributes data={character} />}
      {selectedTab === 'Skills' && <Skills data={character} />}
      {selectedTab === 'Spells' && <Spells data={character} />}
      {selectedTab === 'Combat' && <Combat data={character} />}
      {selectedTab === 'Inventory' && <Inventory data={character} />}
      {selectedTab === 'Proficiencies' && <Proficiencies data={character} />}
      {selectedTab === 'BackStory' && <BackStory data={character} />}
      {selectedTab === 'Notes' && <Notes data={character} />}
      {selectedTab === 'Traits' && <TraitsTab data={character} />}
    </View>
  );
};

export default CharacterStats;
