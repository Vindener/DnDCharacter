import React from 'react';
import { act, create } from 'react-test-renderer';
import type { ReactTestRenderer } from 'react-test-renderer';
import { Alert } from 'react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CharacterEntity } from '@/domain/types';
import { createInitialDraft, type CreateCharacterDraft } from './createCharacterWizard';
import CreateCharacter from './CreateCharacter';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type CharacterStateMock = {
  addCharacter: (character: CharacterEntity) => Promise<void>;
  updateCharacter: (id: string, character: CharacterEntity) => Promise<void>;
  setCurrentCharacterId: (id: string) => void;
  setLastSessionCharacterId: (id: string | null) => Promise<void>;
};

type SyncStateMock = {
  syncByCharacter: Record<string, unknown>;
  ensureCharacterSync: (characterId: string, hasCloud?: boolean) => Promise<void>;
  markCloudUploaded: (characterId: string) => Promise<void>;
  removeCharacterSync: (characterId: string) => Promise<void>;
  setCloudAvailability: (characterId: string, hasCloud: boolean) => Promise<void>;
  setSyncTransport: (characterId: string, transport: unknown) => Promise<void>;
  markSyncError: (characterId: string, message: string) => Promise<void>;
};

const mocks = vi.hoisted(() => {
  const navigation = { navigate: vi.fn() };
  const characterState: CharacterStateMock = {
    addCharacter: vi.fn(async () => {}),
    updateCharacter: vi.fn(async () => {}),
    setCurrentCharacterId: vi.fn(),
    setLastSessionCharacterId: vi.fn(async () => {}),
  };
  const syncState: SyncStateMock = {
    syncByCharacter: {},
    ensureCharacterSync: vi.fn(async () => {}),
    markCloudUploaded: vi.fn(async () => {}),
    removeCharacterSync: vi.fn(async () => {}),
    setCloudAvailability: vi.fn(async () => {}),
    setSyncTransport: vi.fn(async () => {}),
    markSyncError: vi.fn(async () => {}),
  };
  return {
    navigation,
    characterState,
    syncState,
    draftStore: {
      loadedDraft: null as CreateCharacterDraft | null,
      savedDrafts: [] as CreateCharacterDraft[],
      loadDraft: vi.fn(async () => null as CreateCharacterDraft | null),
      saveDraft: vi.fn(async (draft: CreateCharacterDraft) => {
        mocks.draftStore.savedDrafts.push(draft);
      }),
      clearDraft: vi.fn(async () => {}),
    },
    addEditorByEmail: vi.fn(async (_sheetId: string, _email: string) => {}),
    syncToCloud: vi.fn(async ({ character }: { character: CharacterEntity }) => ({
      status: 'synced',
      targetCharacter: character,
    })),
    netInfo: { isConnected: true, isInternetReachable: true },
    fbAuth: { currentUser: null as null | { uid: string } },
  };
});

vi.mock('react-native', () => {
  const host = (name: string) =>
    ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement(name, props, children);
  return {
    ActivityIndicator: host('ActivityIndicator'),
    Alert: { alert: vi.fn() },
    Image: host('Image'),
    KeyboardAvoidingView: host('KeyboardAvoidingView'),
    Platform: { OS: 'android' },
    Pressable: host('Pressable'),
    SafeAreaView: host('SafeAreaView'),
    ScrollView: host('ScrollView'),
    Text: host('Text'),
    TextInput: host('TextInput'),
    View: host('View'),
    StyleSheet: { create: <T,>(styles: T): T => styles },
  };
});

vi.mock('@react-navigation/native', () => ({
  useNavigation: () => mocks.navigation,
}));

vi.mock('@react-native-community/netinfo', () => ({
  useNetInfo: () => mocks.netInfo,
}));

vi.mock('@react-native-picker/picker', () => {
  const Item = ({ label, value }: { label: string; value: unknown }) => React.createElement('PickerItem', { label, value });
  const Picker = Object.assign(
    ({ children, ...props }: { children?: React.ReactNode; selectedValue?: unknown; onValueChange?: (value: unknown) => void }) =>
      React.createElement('Picker', props, children),
    { Item },
  );
  return { Picker };
});

vi.mock('expo-image-picker', () => ({
  MediaTypeOptions: { Images: 'Images' },
  launchImageLibraryAsync: vi.fn(async () => ({ canceled: true, assets: [] })),
}));

vi.mock('expo-modules-core', () => ({
  uuid: { v4: () => 'local-id' },
}));

vi.mock('@/context/Theme-store', async () => {
  const { darkColors } = await import('@/shared/styles/theme');
  return {
    default: <T,>(selector: (state: { colors: typeof darkColors }) => T): T => selector({ colors: darkColors }),
  };
});

vi.mock('@/context/Character-store', () => ({
  default: <T,>(selector: (state: CharacterStateMock) => T): T => selector(mocks.characterState),
}));

vi.mock('@/context/Sync-store', () => {
  const useSyncStore = (<T,>(selector: (state: SyncStateMock) => T): T => selector(mocks.syncState)) as (<T>(selector: (state: SyncStateMock) => T) => T) & {
    getState: () => SyncStateMock;
  };
  useSyncStore.getState = () => mocks.syncState;
  return { default: useSyncStore };
});

vi.mock('@/repositories/createCharacterDraftRepository', () => ({
  createCharacterDraftRepository: {
    loadDraft: () => mocks.draftStore.loadDraft(),
    saveDraft: (draft: CreateCharacterDraft) => mocks.draftStore.saveDraft(draft),
    clearDraft: () => mocks.draftStore.clearDraft(),
  },
}));

vi.mock('@/repositories/characterCloudRepository', () => ({
  addEditorByEmail: (sheetId: string, email: string) => mocks.addEditorByEmail(sheetId, email),
}));

vi.mock('@/services/firebase', () => ({
  fbAuth: mocks.fbAuth,
}));

vi.mock('@/services/characterSyncCoordinator', () => ({
  syncToCloud: (args: { character: CharacterEntity }) => mocks.syncToCloud(args),
}));

vi.mock('@/shared/services/auth', () => ({
  onGoogleButtonPress: vi.fn(async () => {}),
}));

vi.mock('@/shared/services/fileSerice', () => ({
  default: {
    importCharacterFromFile: vi.fn(async () => null),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.syncState.syncByCharacter = {};
  mocks.draftStore.loadedDraft = null;
  mocks.draftStore.savedDrafts = [];
  mocks.draftStore.loadDraft.mockImplementation(async () => mocks.draftStore.loadedDraft);
  mocks.netInfo.isConnected = true;
  mocks.netInfo.isInternetReachable = true;
  mocks.fbAuth.currentUser = null;
});

async function renderScreen(): Promise<ReactTestRenderer> {
  let tree: ReactTestRenderer | undefined;
  await act(async () => {
    tree = create(<CreateCharacter />);
  });
  await act(async () => {});
  return tree!;
}

function findByTestId(tree: ReactTestRenderer, testID: string) {
  return tree.root.findByProps({ testID });
}

function press(tree: ReactTestRenderer, testID: string): void {
  act(() => {
    findByTestId(tree, testID).props.onPress();
  });
}

async function pressAsync(tree: ReactTestRenderer, testID: string): Promise<void> {
  await act(async () => {
    await findByTestId(tree, testID).props.onPress();
  });
}

function pressLatestAlertAction(): void {
  const alertMock = vi.mocked(Alert.alert);
  const latestCall = alertMock.mock.calls[alertMock.mock.calls.length - 1];
  const buttons = latestCall?.[2];
  if (!Array.isArray(buttons)) throw new Error('Expected alert buttons');

  act(() => {
    buttons[0]?.onPress?.();
  });
}

function enterName(tree: ReactTestRenderer, name: string): void {
  act(() => {
    findByTestId(tree, 'createCharacter.nameInput').props.onChangeText(name);
  });
}

function advanceToReview(tree: ReactTestRenderer): void {
  for (let index = 0; index < 8; index += 1) {
    press(tree, 'createCharacter.nextButton');
  }
}

function advanceToStats(tree: ReactTestRenderer): void {
  press(tree, 'createCharacter.nextButton');
  enterName(tree, 'Стат Герой');
  press(tree, 'createCharacter.nextButton');
  press(tree, 'createCharacter.nextButton');
}

describe('CreateCharacter', () => {
  it('restores autosaved draft', async () => {
    mocks.draftStore.loadedDraft = { ...createInitialDraft(), step: 2, name: 'Restored Hero' };
    const tree = await renderScreen();

    expect(findByTestId(tree, 'createCharacter.nameInput').props.value).toBe('Restored Hero');
  });

  it('keeps identity data when navigating forward and back', async () => {
    const tree = await renderScreen();

    press(tree, 'createCharacter.nextButton');
    enterName(tree, 'Arthas');
    press(tree, 'createCharacter.nextButton');
    press(tree, 'createCharacter.backButton');

    expect(findByTestId(tree, 'createCharacter.nameInput').props.value).toBe('Arthas');
  });

  it('renders review summary from draft data', async () => {
    const tree = await renderScreen();

    press(tree, 'createCharacter.nextButton');
    enterName(tree, 'Arthas');
    advanceToReview(tree);

    const reviewText = JSON.stringify(tree.toJSON());
    expect(reviewText).toContain('Arthas');
    expect(findByTestId(tree, 'createCharacter.review')).toBeTruthy();
  });

  it('rolls an ability score interactively', async () => {
    const tree = await renderScreen();

    advanceToStats(tree);
    press(tree, 'createCharacter.statMethod.roll');
    press(tree, 'createCharacter.rollStat.strength');

    const text = JSON.stringify(tree.toJSON());
    expect(text).toContain('stats.rollDetail');
  });

  it('generates random ability scores', async () => {
    const tree = await renderScreen();

    advanceToStats(tree);
    press(tree, 'createCharacter.statMethod.random');

    const text = JSON.stringify(tree.toJSON());
    expect(findByTestId(tree, 'createCharacter.randomStatsButton')).toBeTruthy();
    expect(text).toContain('stats.rollDetail');
  });

  it('creates a local character', async () => {
    const tree = await renderScreen();

    press(tree, 'createCharacter.nextButton');
    enterName(tree, 'Local Hero');
    advanceToReview(tree);
    await pressAsync(tree, 'createCharacter.submitButton');

    expect(mocks.characterState.addCharacter).toHaveBeenCalledTimes(1);
    expect(mocks.syncState.ensureCharacterSync).toHaveBeenCalledWith('local-id', false);
    expect(mocks.characterState.setCurrentCharacterId).toHaveBeenCalledWith('local-id');
    expect(mocks.draftStore.clearDraft).toHaveBeenCalled();

    expect(mocks.navigation.navigate).not.toHaveBeenCalled();
    pressLatestAlertAction();
    expect(mocks.navigation.navigate).toHaveBeenCalledWith('Character', expect.objectContaining({ character: expect.objectContaining({ name: 'Local Hero' }) }));
  });

  it('creates a cloud shared character when signed in', async () => {
    mocks.fbAuth.currentUser = { uid: 'user-1' };
    mocks.draftStore.loadedDraft = {
      ...createInitialDraft(),
      step: 11,
      name: 'Cloud Hero',
      storageMode: 'local-cloud',
      shareTarget: 'dm',
      inviteEmail: 'dm@example.com',
    };
    const tree = await renderScreen();

    await pressAsync(tree, 'createCharacter.submitButton');

    expect(mocks.characterState.addCharacter).toHaveBeenCalledTimes(1);
    expect(mocks.syncToCloud).toHaveBeenCalledWith(expect.objectContaining({ isOnline: true }));
    expect(mocks.addEditorByEmail).toHaveBeenCalledWith('local-id', 'dm@example.com');
    expect(mocks.syncState.ensureCharacterSync).toHaveBeenCalledWith('local-id', true);
  });
});
