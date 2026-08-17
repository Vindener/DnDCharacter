import type { CharacterDto } from '@/domain/types';
import { parseHomebrew, type HomebrewEntitySlice } from '@/domain/schemas';

type HomebrewDraft = Partial<HomebrewEntitySlice>;

export function dtoToEntity(dto: HomebrewDraft): HomebrewEntitySlice {
  return parseHomebrew(dto);
}

export function entityToDto(
  entity: HomebrewEntitySlice,
): Pick<
  CharacterDto,
  | 'characterTemplateId'
  | 'customFields'
  | 'customTrackers'
  | 'customSections'
  | 'customResources'
  | 'customResetRules'
  | 'customNotesGroups'
  | 'homebrewEntries'
  | 'customSpellLists'
  | 'customFeatureBlocks'
  | 'notesBlocks'
> {
  return parseHomebrew(entity);
}

export function draftToEntity(draft: HomebrewDraft): HomebrewEntitySlice {
  return parseHomebrew(draft);
}
