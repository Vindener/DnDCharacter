import React, { useState, useEffect } from 'react';
import { Text, ScrollView } from 'react-native';
import { getStyles } from '@/shared/components/CharacterStats/Tabs/style';
import useThemeStore from '@/context/Theme-store';
import { CharacterDto } from '@/types/Character';
import useCharacterStore from '@/context/Character-store';
import { SKILL_NAMES } from '@/shared/const/SkillsTab';
import { SkillItem } from './SkillItem/SkillItem';

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
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [skills, setSkills] = useState<{ [key: string]: number }>(character?.skills || {});

  useEffect(() => {
    setSkills(character?.skills || {});
  }, [character]);

  const handleChange = (skill: string, value: number) => {
    const newSkills = {
      ...skills,
      [skill]: value,
    };
    setSkills(newSkills);
    updateCharacterSkills(data.id, newSkills);
  };

  return (
    <ScrollView style={styles.container}>
      {SKILLS_LIST.map((skill) => (
        <SkillItem key={skill} label={SKILL_NAMES[skill] || skill} skillKey={skill} value={skills[skill] || 0} onChange={handleChange} />
      ))}
    </ScrollView>
  );
};

export default Skills;
