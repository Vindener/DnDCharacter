import abilities from './abilities.json';
import backgrounds from './backgrounds.json';
import classes from './classes.json';
import classProgression from './classProgression.json';
import conditions from './conditions.json';
import equipment from './equipment.json';
import languages from './languages.json';
import monsters from './monsters.json';
import races from './races.json';
import references from './references.json';
import skills from './skills.json';
import spells from './spells.json';
import { SRD_METADATA } from './metadata';

export const srdData = {
  metadata: SRD_METADATA,
  abilities,
  backgrounds,
  classes,
  classProgression,
  conditions,
  equipment,
  languages,
  monsters,
  races,
  references,
  skills,
  spells,
} as const;

export { SRD_METADATA };
