import type { CharacterEntity } from '@/domain/types';
import { homebrewMapper } from '@/domain/mappers';

export function normalizeHomebrewV3(character: CharacterEntity): CharacterEntity {
  return {
    ...character,
    ...homebrewMapper.dtoToEntity(character),
  };
}

export function isHomebrewCharacter(character: CharacterEntity): boolean {
  if ((character.characterTemplateId || 'standard-5e') !== 'standard-5e') return true;
  if ((character.customFields?.length || 0) > 0) return true;
  if ((character.customResources?.length || 0) > 0) return true;
  if ((character.customSections?.length || 0) > 0) return true;
  if ((character.homebrewEntries?.length || 0) > 0) return true;
  if ((character.customNotesGroups || []).some((group) => group.origin === 'custom')) return true;
  return false;
}

export function appendQuickSessionNote(character: CharacterEntity, note: string): CharacterEntity {
  const trimmed = note.trim();
  if (!trimmed) return character;

  const groups = character.customNotesGroups || [];
  const sessionGroup = groups.find(
    (group) =>
      group.id === 'seed-session' || group.title.toLowerCase() === 'session' || group.title.toLowerCase() === 'сесія',
  );

  if (sessionGroup) {
    const merged = sessionGroup.content?.trim() ? `${sessionGroup.content.trim()}\n• ${trimmed}` : `• ${trimmed}`;
    return {
      ...character,
      customNotesGroups: groups.map((group) => (group.id === sessionGroup.id ? { ...group, content: merged } : group)),
    };
  }

  return {
    ...character,
    customNotesGroups: [
      ...groups,
      {
        id: `notes-group-${Date.now()}`,
        title: 'Сесія',
        content: `• ${trimmed}`,
        order: groups.length,
        origin: 'custom',
      },
    ],
  };
}
