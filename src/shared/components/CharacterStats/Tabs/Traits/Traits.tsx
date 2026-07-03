import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import MultiTextInput  from '@/shared/components/TextInput/MultiTextInput';
import { getStyles } from '@/shared/components/CharacterStats/Tabs/style';
import useThemeStore from '@/context/Theme-store';
import { CharacterViewModel } from '@/types/Character';
import useCharacterStore from '@/context/Character-store';
import { Traits as TraitsType } from '@/types/Traits';

interface TraitsProps {
  data: CharacterViewModel;
}

const Traits: React.FC<TraitsProps> = ({ data }: TraitsProps) => {
  const { t } = useTranslation('character');
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
      <Text style={styles.label}>{t('legacy.traits.personality')}</Text>
      <MultiTextInput
        numberOfLines={8}
        value={traits.personality}
        onChangeText={(text) => handleChange('personality', text)}
        placeholder={t('legacy.traits.personalityPlaceholder')}
      />

      <Text style={styles.label}>{t('legacy.traits.ideals')}</Text>
      <MultiTextInput
        numberOfLines={8}
        value={traits.ideals}
        onChangeText={(text) => handleChange('ideals', text)}
        placeholder={t('legacy.traits.idealsPlaceholder')}
      />

      <Text style={styles.label}>{t('legacy.traits.bonds')}</Text>
      <MultiTextInput
        numberOfLines={8}
        value={traits.bonds}
        onChangeText={(text) => handleChange('bonds', text)}
        placeholder={t('legacy.traits.bondsPlaceholder')}
      />

      <Text style={styles.label}>{t('legacy.traits.flaws')}</Text>
      <MultiTextInput
        numberOfLines={8}
        value={traits.flaws}
        onChangeText={(text) => handleChange('flaws', text)}
        placeholder={t('legacy.traits.flawsPlaceholder')}
      />
    </View>
  );
};

export default Traits;
