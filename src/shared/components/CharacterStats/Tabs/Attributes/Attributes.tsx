import React from 'react';
import { View } from 'react-native';
import { styles } from '@/shared/components/CharacterStats/Tabs/Attributes/style';
import { CharacterDto } from '@/types/Character';
import { attributes } from '@/shared/const/attributes';
import { AttributesItem } from '@/shared/components/CharacterStats/Tabs/Attributes/AttributeItem/AttributesItem';

interface AttributesProps {
  data: CharacterDto;
}

const Attributes: React.FC<AttributesProps> = ({ data }) => {
  return (
    <View style={styles.container}>
      {attributes.map(({ key, label }) => (
        <AttributesItem key={key} label={label} value={data?.stats ? data.stats[key] : 0} />
      ))}
    </View>
  );
};

export default Attributes;
