import type { CharacterDraft, CharacterDto, CharacterEntity, CharacterViewModel } from '@/domain/types';
import { parseCharacter } from '@/domain/schemas';

export function dtoToEntity(dto: CharacterDto): CharacterEntity {
  return parseCharacter(dto);
}

export function entityToDto(entity: CharacterEntity): CharacterDto {
  return parseCharacter(entity);
}

export function draftToEntity(draft: CharacterDraft): CharacterEntity {
  return parseCharacter(draft);
}

export function entityToViewModel(entity: CharacterEntity): CharacterViewModel {
  return { ...entity };
}

export function viewModelToEntity(viewModel: CharacterViewModel): CharacterEntity {
  return parseCharacter(viewModel);
}

export function cloudDocToDraft(doc: Record<string, unknown>): CharacterDraft {
  const id = typeof doc.id === 'string' && doc.id.trim() ? doc.id : Date.now().toString();
  return parseCharacter({
    ...doc,
    id,
  });
}

export function cloudDocToEntity(doc: Record<string, unknown>): CharacterEntity {
  return parseCharacter(cloudDocToDraft(doc));
}

// Backward-compatible aliases while call sites migrate to unified API.
export const mapCharacterDtoToEntity = dtoToEntity;
export const mapCharacterEntityToViewModel = entityToViewModel;
export const mapCharacterViewModelToDto = entityToDto;
export const mapCloudCharacterDocToDto = (doc: Record<string, unknown>): CharacterDto => entityToDto(cloudDocToEntity(doc));
