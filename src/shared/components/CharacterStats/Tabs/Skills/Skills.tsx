import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { styles } from '@/shared/components/CharacterStats/Tabs/style';
import { CharacterDto } from '@/types/Character';
import useCharacterStore from '@/context/Character-store';
import { SKILL_NAMES } from '@/shared/const/SkillsTab';

const SKILLS_LIST = [
  'acrobatics',
  'animalHandling',
  'arcana',
  'athletics',
  'deception',
  'history',
  'insight',
  'intimidation',
  'investigation',
  'medicine',
  'nature',
  'perception',
  'performance',
  'persuasion',
  'religion',
  'sleightOfHand',
  'stealth',
  'survival',
];

interface SkillsProps {
  data: CharacterDto;
}

const Skills: React.FC<SkillsProps> = ({ data }) => {
  const updateCharacterSkills = useCharacterStore((s) => s.updateCharacterSkills);
  const character = useCharacterStore((s) => s.characters.find((c) => c.id === data.id));

  const [skills, setSkills] = useState<{ [key: string]: number }>(character?.skills || {});

  useEffect(() => {
    setSkills(character?.skills || {});
  }, [character]);

  const handleChange = (skill: string, value: string) => {
    const numericValue = parseInt(value, 10);
    const newSkills = {
      ...skills,
      [skill]: isNaN(numericValue) ? 0 : numericValue,
    };
    setSkills(newSkills);
    updateCharacterSkills(data.id, newSkills);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Навички персонажа:</Text>

      {SKILLS_LIST.map((skill) => (
        <View
          key={skill}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <Text style={[styles.label, { flex: 1 }]}>{SKILL_NAMES[skill] || skill}</Text>
          <TextInput
            style={[styles.memoInput, { width: 60, height: 40, textAlign: 'center' }]}
            keyboardType='numeric'
            value={skills[skill]?.toString() || '0'}
            onChangeText={(value) => handleChange(skill, value)}
            placeholder='0'
          />
        </View>
      ))}
    </ScrollView>
  );
}; 

export default Skills;
