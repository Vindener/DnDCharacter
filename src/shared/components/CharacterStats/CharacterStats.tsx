import React, { useState } from 'react';
import { View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';

import Attributes from './Tabs/Attributes/Attributes';
import Spells from './Tabs/Spells/Spells';
import Combat from './Tabs/Combat/Combat';
import Inventory from './Tabs/Inventory/Inventory';
import Proficiencies from './Tabs/Proficiencies/Proficiencies';
import Notes from './Tabs/Notes/Notes';
import BackStory from './Tabs/BackStory/BackStory';
import TraitsTab from './Tabs/Traits/Traits';
import Skills from './Tabs/Skills/Skills';
import Coins from './Tabs/Coins/Coins';
import { getStyles } from '@/shared/components/CharacterStats/style';
import useThemeStore from '@/context/Theme-store';
import { CharacterViewModel } from '@/types/Character';
import { CharacterTabs } from '@/shared/const/CharacterTabs';
import CharacterOverview from '../CharacterOverview/CharacterOverview';

interface CharacterStatsProps {
  character: CharacterViewModel;
}

const CharacterStats: React.FC<CharacterStatsProps> = ({ character }: CharacterStatsProps) => {
  const { t } = useTranslation('character');
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
        <Picker.Item label={t('legacy.tabs.attributes')} value='Attributes' />
        <Picker.Item label={t('legacy.tabs.skills')} value='Skills' />
        <Picker.Item label={t('legacy.tabs.spells')} value='Spells' />
        <Picker.Item label={t('legacy.tabs.combat')} value='Combat' />
        <Picker.Item label={t('legacy.tabs.inventoryWeapons')} value='Inventory' />
        <Picker.Item label={t('legacy.tabs.proficiencies')} value='Proficiencies' />
        <Picker.Item label={t('legacy.tabs.backstory')} value='BackStory' />
        <Picker.Item label={t('legacy.tabs.notes')} value='Notes' />
        <Picker.Item label={t('legacy.tabs.traits')} value='Traits' />
        <Picker.Item label={t('legacy.tabs.coins')} value='Coins' />
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
      {selectedTab === 'Coins' && <Coins data={character} />}
    </View>
  );
};

export default CharacterStats;
