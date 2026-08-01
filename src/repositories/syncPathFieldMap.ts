export type SyncPathFieldMapResult = { kind: 'narrow'; fieldPaths: string[] } | { kind: 'fallback' };

/**
 * sync-path -> Firestore field path(s), audited call site by call site (see
 * docs/collaborative-editing.md COL-1/2/3 and the fix plan). A path belongs here only
 * if every known caller that tags it touches exactly this set of fields — never a
 * superset "to be safe", because writing an untouched field's stale local value can
 * itself clobber a concurrent legitimate change to that field. Tab-default catch-all
 * tokens (`overview.identity`, `combat.core` when paired with `overview.identity`,
 * `magic.core`, `inventory.core`, `combat.rest`, bare `combat.templates`) and anything
 * not listed here are intentionally left out so the caller falls back to a full
 * transactional merge instead of guessing.
 *
 * `inventory.equipment` maps to no fields on purpose: `CharacterSheet` has no
 * `equipment` key today (pre-existing gap, out of scope here) — the tag still produces
 * a valid narrow write, it just has no content fields to carry.
 */
const NARROW_SYNC_PATH_FIELD_MAP: Record<string, string[]> = {
  'combat.hp': ['hp'],
  'combat.core': ['ac', 'initiative', 'speed'],
  'combat.weapons': ['weapons'],
  'combat.conditions': ['conditions'],
  'overview.conditions': ['conditions'],
  'overview.session-mode': ['sessionMode'],
  'overview.saving-throws': ['savingThrows'],
  'overview.skills': ['skills'],
  'overview.stats': ['stats'],
  'magic.slots': ['spells.spellSlots'],
  'combat.templates.actions': ['combatTemplates.actions'],
  'combat.templates.bonus-actions': ['combatTemplates.bonusActions'],
  'combat.templates.reactions': ['combatTemplates.reactions'],
  'inventory.items': ['inventory'],
  'inventory.equipment': [],
  'homebrew.fields': ['customFields'],
  'homebrew.resources': ['customResources'],
  'homebrew.sections': ['customSections'],
  'homebrew.entries': ['homebrewEntries'],
  'homebrew.notes-groups': ['customNotesGroups'],
  'overview.campaign': ['campaignId', 'campaign'],
};

function cleanPaths(paths: string[] | null | undefined): string[] {
  if (!Array.isArray(paths)) return [];
  return Array.from(new Set(paths.map((path) => String(path || '').trim()).filter(Boolean)));
}

export function mapSyncPathsToFieldPaths(paths: string[] | null | undefined): SyncPathFieldMapResult {
  const cleaned = cleanPaths(paths);
  if (!cleaned.length) return { kind: 'fallback' };

  const fieldPaths = new Set<string>();
  for (const path of cleaned) {
    const mapped = NARROW_SYNC_PATH_FIELD_MAP[path];
    if (!mapped) return { kind: 'fallback' };
    mapped.forEach((field) => fieldPaths.add(field));
  }

  return { kind: 'narrow', fieldPaths: Array.from(fieldPaths) };
}
