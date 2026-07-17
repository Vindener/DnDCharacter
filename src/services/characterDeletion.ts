export type DeleteCharacterCopiesArgs = {
  characterId: string;
  deleteCloud: boolean;
  deleteCloudCopy: (characterId: string) => Promise<void>;
  deleteLocalCopy: (characterId: string) => Promise<void>;
};

export async function deleteCharacterCopies({
  characterId,
  deleteCloud,
  deleteCloudCopy,
  deleteLocalCopy,
}: DeleteCharacterCopiesArgs): Promise<void> {
  if (deleteCloud) {
    await deleteCloudCopy(characterId);
  }

  await deleteLocalCopy(characterId);
}
