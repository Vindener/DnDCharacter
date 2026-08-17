import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CreateCharacterDraft } from '@/screens/CreateCharacter/createCharacterWizard';
import { mergeDraftWithDefaults } from '@/screens/CreateCharacter/createCharacterWizard';

const STORAGE_KEY = 'createCharacterDraft:v1';

export interface CreateCharacterDraftRepository {
  loadDraft: () => Promise<CreateCharacterDraft | null>;
  saveDraft: (draft: CreateCharacterDraft) => Promise<void>;
  clearDraft: () => Promise<void>;
}

async function loadDraft(): Promise<CreateCharacterDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CreateCharacterDraft>;
    return mergeDraftWithDefaults(parsed);
  } catch {
    return null;
  }
}

async function saveDraft(draft: CreateCharacterDraft): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch (_error) {
    /* intentionally ignored */
  }
}

async function clearDraft(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (_error) {
    /* intentionally ignored */
  }
}

export const createCharacterDraftRepository: CreateCharacterDraftRepository = {
  loadDraft,
  saveDraft,
  clearDraft,
};
