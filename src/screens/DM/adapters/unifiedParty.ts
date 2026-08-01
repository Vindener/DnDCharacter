import { mapCloudCharacterToLocalDto } from '@/shared/helpers/mapCloudCharacter';
import type { CharacterViewModel } from '@/types/Character';

export type UnifiedPartySource = 'local' | 'mine' | 'shared';

export type UnifiedPartyItem = {
  id: string;
  payload: CharacterViewModel;
  source: UnifiedPartySource;
};

export function buildUnifiedPartyList(
  localCharacters: CharacterViewModel[],
  mySheets: Record<string, unknown>[],
  sharedSheets: Record<string, unknown>[],
): UnifiedPartyItem[] {
  const byId = new Map<string, UnifiedPartyItem>();

  localCharacters.forEach((character) => {
    byId.set(character.id, { id: character.id, payload: character, source: 'local' });
  });

  mySheets.forEach((doc) => {
    const mapped = mapCloudCharacterToLocalDto(doc);
    byId.set(mapped.id, { id: mapped.id, payload: mapped, source: 'mine' });
  });

  sharedSheets.forEach((doc) => {
    const mapped = mapCloudCharacterToLocalDto(doc);
    byId.set(mapped.id, { id: mapped.id, payload: mapped, source: 'shared' });
  });

  return Array.from(byId.values()).sort((a, b) => (a.payload.name || '').localeCompare(b.payload.name || ''));
}
