import type { CharacterDraft, CharacterDto, CharacterEntity, CharacterViewModel } from '@/domain/types';
import { parseCharacter } from '@/domain/schemas';
import { LATEST_SCHEMA_VERSION, migratePayloadToLatest } from '@/domain/migrations';

function migrateCharacterPayload(input: unknown): CharacterEntity {
  const migrated = migratePayloadToLatest<CharacterEntity>('character', input);
  return parseCharacter(migrated.data);
}

export function dtoToEntity(dto: CharacterDto): CharacterEntity {
  return migrateCharacterPayload(dto);
}

export function entityToDto(entity: CharacterEntity): CharacterDto {
  const normalized = migrateCharacterPayload(entity);
  return {
    ...normalized,
    schemaVersion: LATEST_SCHEMA_VERSION,
  };
}

export function draftToEntity(draft: CharacterDraft): CharacterEntity {
  return migrateCharacterPayload(draft);
}

export function entityToViewModel(entity: CharacterEntity): CharacterViewModel {
  const normalized = migrateCharacterPayload(entity);
  return {
    ...normalized,
    schemaVersion: LATEST_SCHEMA_VERSION,
  };
}

export function viewModelToEntity(viewModel: CharacterViewModel): CharacterEntity {
  return migrateCharacterPayload(viewModel);
}

export function cloudDocToDraft(doc: Record<string, unknown>): CharacterDraft {
  const migrated = migratePayloadToLatest<CharacterDraft>('character', doc).data;
  const id = typeof migrated.id === 'string' && migrated.id.trim() ? migrated.id : Date.now().toString();
  return parseCharacter({
    ...migrated,
    id,
    schemaVersion: LATEST_SCHEMA_VERSION,
  });
}

export function cloudDocToEntity(doc: Record<string, unknown>): CharacterEntity {
  return migrateCharacterPayload(cloudDocToDraft(doc));
}

// Backward-compatible aliases while call sites migrate to unified API.
export const mapCharacterDtoToEntity = dtoToEntity;
export const mapCharacterEntityToViewModel = entityToViewModel;
export const mapCharacterViewModelToDto = entityToDto;
export const mapCloudCharacterDocToDto = (doc: Record<string, unknown>): CharacterDto => entityToDto(cloudDocToEntity(doc));
