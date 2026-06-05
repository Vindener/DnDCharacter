import React from 'react';
import { act, create } from 'react-test-renderer';
import type { ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyCharacter } from '@/shared/helpers/createEmptyCharacter';
import type { CharacterViewModel } from '@/types/Character';
import Home from './Home';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type CharacterStateMock = {
  characters: CharacterViewModel[];
  isLoaded: boolean;
  loadError: string | null;
  loadCharacters: () => Promise<void>;
  addCharacter: (character: CharacterViewModel) => Promise<void>;
  updateCharacter: (id: string, character: CharacterViewModel) => Promise<void>;
  setCurrentCharacterId: (id: string) => void;
  currentCharacterId: string | null;
  lastSessionCharacterId: string | null;
  setLastSessionCharacterId: (id: string | null) => Promise<void>;
};

type SyncStateMock = {
  syncByCharacter: Record<string, unknown>;
  loadSyncMeta: () => Promise<void>;
  ensureCharacterSync: (characterId: string, hasCloud?: boolean) => Promise<void>;
  setCloudAvailability: (characterId: string, hasCloud: boolean) => Promise<void>;
};

const mocks = vi.hoisted(() => {
  const navigation = {
    navigate: vi.fn(),
    getParent: vi.fn(),
  };
  const parent = {
    dispatch: vi.fn(),
  };

  return {
    navigation,
    parent,
    netInfo: { isConnected: true },
    authState: { user: null as null | { displayName?: string; email?: string; photoURL?: string; providerData?: Array<{ photoURL?: string; email?: string }> } },
    characterState: {
      characters: [],
      isLoaded: true,
      loadError: null,
      loadCharacters: vi.fn(async () => {}),
      addCharacter: vi.fn(async () => {}),
      updateCharacter: vi.fn(async () => {}),
      setCurrentCharacterId: vi.fn(),
      currentCharacterId: null,
      lastSessionCharacterId: null,
      setLastSessionCharacterId: vi.fn(async () => {}),
    },
    syncState: {
      syncByCharacter: {},
      loadSyncMeta: vi.fn(async () => {}),
      ensureCharacterSync: vi.fn(async () => {}),
      setCloudAvailability: vi.fn(async () => {}),
    },
  };
});

vi.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => React.createElement('Icon', { name }),
}));

vi.mock('@react-native-community/netinfo', () => ({
  useNetInfo: () => mocks.netInfo,
}));

vi.mock('@react-navigation/native', () => ({
  CommonActions: {
    navigate: (payload: unknown) => ({ type: 'NAVIGATE', payload }),
  },
  useNavigation: () => mocks.navigation,
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

vi.mock('@/context/Sync-store', () => ({
  default: <T,>(selector: (state: SyncStateMock) => T): T => selector(mocks.syncState),
}));

vi.mock('@/repositories/characterCloudRepository', () => ({
  subscribeMySheets: (cb: (list: unknown[]) => void) => {
    cb([]);
    return () => {};
  },
  subscribeSharedWithMe: (cb: (list: unknown[]) => void) => {
    cb([]);
    return () => {};
  },
}));

vi.mock('@/services/users', () => ({
  ensureUserIndexOnLogin: vi.fn(async () => {}),
}));

vi.mock('@/shared/services/auth/index', () => ({
  configureGoogleSignIn: vi.fn(),
  onGoogleButtonPress: vi.fn(async () => {}),
  useAuth: () => mocks.authState,
}));

vi.mock('@/shared/services/telemetry/productTelemetry', () => ({
  trackProductEvent: vi.fn(),
}));

beforeEach(() => {
  mocks.navigation.navigate.mockClear();
  mocks.navigation.getParent.mockReturnValue(mocks.parent);
  mocks.parent.dispatch.mockClear();
  mocks.netInfo.isConnected = true;
  mocks.authState.user = null;
  mocks.characterState.characters = [];
  mocks.characterState.isLoaded = true;
  mocks.characterState.loadError = null;
  mocks.characterState.currentCharacterId = null;
  mocks.characterState.lastSessionCharacterId = null;
  mocks.characterState.loadCharacters.mockClear();
  mocks.characterState.addCharacter.mockClear();
  mocks.characterState.updateCharacter.mockClear();
  mocks.characterState.setCurrentCharacterId.mockClear();
  mocks.characterState.setLastSessionCharacterId.mockClear();
  mocks.syncState.syncByCharacter = {};
  mocks.syncState.loadSyncMeta.mockClear();
  mocks.syncState.ensureCharacterSync.mockClear();
  mocks.syncState.setCloudAvailability.mockClear();
});

async function renderHome(): Promise<ReactTestRenderer> {
  let tree: ReactTestRenderer;
  await act(async () => {
    tree = create(<Home />);
  });
  return tree!;
}

describe('Home screen', () => {
  it('shows skeleton while characters are loading', async () => {
    mocks.characterState.isLoaded = false;

    const tree = await renderHome();

    expect(tree.root.findByProps({ testID: 'skeleton-home' })).toBeTruthy();

    act(() => {
      tree.unmount();
    });
  });

  it('shows empty state without characters', async () => {
    const tree = await renderHome();

    expect(tree.root.findByProps({ testID: 'home.emptyState' })).toBeTruthy();
    expect(tree.root.findByProps({ testID: 'home.emptyCreateButton' })).toBeTruthy();

    act(() => {
      tree.unmount();
    });
  });

  it('shows last session character and sync badges', async () => {
    const arthas = createEmptyCharacter({
      id: 'arthas',
      name: 'Arthas',
      race: 'Human',
      class: 'Paladin',
      level: 5,
      hp: { current: 32, max: 42, temp: 0 },
      ac: 18,
      initiative: 1,
    });
    mocks.characterState.characters = [arthas];
    mocks.characterState.lastSessionCharacterId = 'arthas';
    mocks.syncState.syncByCharacter = {
      arthas: {
        characterId: 'arthas',
        hasCloud: true,
        localRevision: 1,
        cloudRevision: 1,
        lastLocalChangeAt: null,
        lastSyncAt: 1000,
        pendingPaths: [],
        conflictPaths: [],
        status: 'in-sync',
        transportState: 'idle',
        transportMessage: null,
        lastSyncError: null,
        lastSyncAttemptAt: 1000,
      },
    };

    const tree = await renderHome();

    expect(tree.root.findByProps({ testID: 'home.character.arthas' })).toBeTruthy();
    expect(tree.root.findAllByProps({ children: 'Синхронізовано' }).length).toBeGreaterThan(0);

    act(() => {
      tree.unmount();
    });
  });

  it('quick actions navigate to their existing routes', async () => {
    const tree = await renderHome();

    act(() => {
      tree.root.findByProps({ testID: 'home.createCharacterButton' }).props.onPress();
    });
    expect(mocks.navigation.navigate).toHaveBeenCalledWith('CreateCharacter');

    act(() => {
      tree.root.findByProps({ testID: 'home.openDiceButton' }).props.onPress();
    });
    expect(mocks.navigation.navigate).toHaveBeenCalledWith('DiceRoller');

    act(() => {
      tree.root.findByProps({ testID: 'home.openSpellbookButton' }).props.onPress();
    });
    expect(mocks.navigation.navigate).toHaveBeenCalledWith('Spellbook');

    act(() => {
      tree.root.findByProps({ testID: 'home.openBestiaryButton' }).props.onPress();
    });
    expect(mocks.parent.dispatch).toHaveBeenCalledWith({
      type: 'NAVIGATE',
      payload: { name: 'References', params: { screen: 'List' } },
    });

    expect(() => tree.root.findByProps({ testID: 'home.openDMButton' })).toThrow();

    act(() => {
      tree.unmount();
    });
  });

  it('shows quick actions before continue session', async () => {
    const tree = await renderHome();
    const screen = tree.root.findByProps({ testID: 'home.screen' });
    const children = React.Children.toArray(screen.props.children) as Array<React.ReactElement<{ testID?: string }>>;
    const quickIndex = children.findIndex((child) => child.props?.testID === 'home.quickActions');
    const continueIndex = children.findIndex((child) => child.props?.testID === 'home.continueSession');

    expect(quickIndex).toBeGreaterThan(-1);
    expect(continueIndex).toBeGreaterThan(-1);
    expect(quickIndex).toBeLessThan(continueIndex);

    act(() => {
      tree.unmount();
    });
  });
});
