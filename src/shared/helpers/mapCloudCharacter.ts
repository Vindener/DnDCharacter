import type { CharacterEntity } from '@/domain/types';
import { characterMapper } from '@/domain/mappers';

export function mapCloudCharacterToLocalDto(doc: Record<string, unknown>): CharacterEntity {
  return characterMapper.cloudDocToEntity(doc);
}
