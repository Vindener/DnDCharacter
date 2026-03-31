import type { CharacterDto } from '@/domain/types';
import { mapCloudCharacterDocToDto } from '@/domain/mappers';

export function mapCloudCharacterToLocalDto(doc: Record<string, unknown>): CharacterDto {
  return mapCloudCharacterDocToDto(doc);
}
