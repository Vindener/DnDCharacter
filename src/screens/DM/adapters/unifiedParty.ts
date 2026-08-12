import { mapCloudCharacterToLocalDto } from '@/shared/helpers/mapCloudCharacter';
import type { CharacterViewModel } from '@/types/Character';

export type UnifiedPartySource = 'local' | 'mine' | 'shared';

export type UnifiedPartyItem = {
  id: string;
  payload: CharacterViewModel;
  source: UnifiedPartySource;
  // uid of the cloud owner — undefined for 'local' (no cloud owner concept yet).
  ownerUid?: string;
};

function extractOwnerUid(doc: Record<string, unknown>): string | undefined {
  const value = doc.ownerUid;
  return typeof value === 'string' && value ? value : undefined;
}

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
    byId.set(mapped.id, { id: mapped.id, payload: mapped, source: 'mine', ownerUid: extractOwnerUid(doc) });
  });

  sharedSheets.forEach((doc) => {
    const mapped = mapCloudCharacterToLocalDto(doc);
    byId.set(mapped.id, { id: mapped.id, payload: mapped, source: 'shared', ownerUid: extractOwnerUid(doc) });
  });

  return Array.from(byId.values()).sort((a, b) => (a.payload.name || '').localeCompare(b.payload.name || ''));
}
