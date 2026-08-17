import React, { useState, useEffect } from 'react';
import { ScrollView } from 'react-native';
import { getStyles } from '@/shared/components/CharacterStats/Tabs/style';
import useThemeStore from '@/context/Theme-store';
import { CharacterViewModel } from '@/types/Character';
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
  data: CharacterViewModel;
}

function normalizeSkills(value: CharacterViewModel['skills'] | undefined): CharacterViewModel['skills'] {
  return {
    acrobatics: value?.acrobatics ?? 0,
    animalHandling: value?.animalHandling ?? 0,
    arcana: value?.arcana ?? 0,
    athletics: value?.athletics ?? 0,
    deception: value?.deception ?? 0,
    history: value?.history ?? 0,
    insight: value?.insight ?? 0,
    intimidation: value?.intimidation ?? 0,
    investigation: value?.investigation ?? 0,
    medicine: value?.medicine ?? 0,
    nature: value?.nature ?? 0,
    perception: value?.perception ?? 0,
    performance: value?.performance ?? 0,
    persuasion: value?.persuasion ?? 0,
    religion: value?.religion ?? 0,
    sleightOfHand: value?.sleightOfHand ?? 0,
    stealth: value?.stealth ?? 0,
    survival: value?.survival ?? 0,
  };
}

const Skills: React.FC<SkillsProps> = ({ data }) => {
  const updateCharacterSkills = useCharacterStore((s) => s.updateCharacterSkills);
  const character = useCharacterStore((s) => s.characters.find((c) => c.id === data.id));
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [skills, setSkills] = useState<CharacterViewModel['skills']>(normalizeSkills(character?.skills));

  useEffect(() => {
    setSkills(normalizeSkills(character?.skills));
  }, [character]);

  const handleChange = (skill: string, value: number) => {
    const key = skill as keyof CharacterViewModel['skills'];
    const newSkills = {
      ...skills,
      [key]: value,
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
