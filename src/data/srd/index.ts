import { SRD_METADATA } from './metadata';

// Each loader defers JSON module evaluation to first call (Metro still bundles the
// module, but `require()` inside a function body postpones running it) instead of
// running all 12 imports at module-evaluation time, before the first frame.
/* eslint-disable @typescript-eslint/no-require-imports -- deliberate lazy require(), see PERF-1 */
export function loadAbilitiesJson() {
  return require('./abilities.json');
}
export function loadBackgroundsJson() {
  return require('./backgrounds.json');
}
export function loadClassesJson() {
  return require('./classes.json');
}
export function loadClassProgressionJson() {
  return require('./classProgression.json');
}
export function loadConditionsJson() {
  return require('./conditions.json');
}
export function loadEquipmentJson() {
  return require('./equipment.json');
}
export function loadLanguagesJson() {
  return require('./languages.json');
}
export function loadMonstersJson() {
  return require('./monsters.json');
}
export function loadRacesJson() {
  return require('./races.json');
}
export function loadReferencesJson() {
  return require('./references.json');
}
export function loadSkillsJson() {
  return require('./skills.json');
}
export function loadSpellsJson() {
  return require('./spells.json');
}
/* eslint-enable @typescript-eslint/no-require-imports */

export { SRD_METADATA };
