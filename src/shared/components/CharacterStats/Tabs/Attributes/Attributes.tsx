import React from 'react';
import { View } from 'react-native';
import { styles } from '@/shared/components/CharacterStats/Tabs/Attributes/style';
import { CharacterDto } from '@/types/Character';
import { attributes } from '@/shared/const/attributes';
import { AttributesItem } from '@/shared/components/CharacterStats/Tabs/Attributes/AttributeItem/AttributesItem';
import useCharacterStore from '@/context/Character-store';
import { StatKey } from '@/shared/const/attributes';

interface AttributesProps {
  data: CharacterDto;
}

const Attributes: React.FC<AttributesProps> = ({ data }) => {
  const updateCharacterAttribute = useCharacterStore((s) => s.updateCharacterAttribute);

  const handleChange = (key: StatKey, value: number) => {
    updateCharacterAttribute(data.id ,key, value);
  };

  return (
    <View style={styles.container}>
      {attributes.map(({ key, label }) => (
        <AttributesItem key={key} label={label} statKey={key} value={data?.stats ? data.stats[key] : 0} onChange={handleChange} />
      ))}
    </View>
  );
};

export default Attributes;
