import React from 'react';
import { act, create } from 'react-test-renderer';
import type { ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MonsterDto } from '@/types/Monster';
import Monster from './Monster';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type MonsterStateMock = {
  pinnedMonsterIds: string[];
  favoriteMonsterIds: string[];
  updateMonster: (id: string, monster: MonsterDto) => Promise<void>;
  addMonster: (monster: MonsterDto) => Promise<void>;
  togglePinnedMonster: (id: string) => Promise<void>;
  toggleFavoriteMonster: (id: string) => Promise<void>;
};

const baseMonster: MonsterDto = {
  id: 'dragon',
  name: 'Young Red Dragon',
  size: 'Large',
  type: 'Dragon',
  challenge: '10',
  armorClass: 18,
  hitPoints: 178,
  speed: '40 ft., fly 80 ft.',
  actions: '**Bite.** Melee Weapon Attack: +10 to hit.',
  legendaryActions: 'Detect. The dragon makes a Wisdom check.',
  stats: { strength: 23, dexterity: 10, constitution: 21, intelligence: 14, wisdom: 11, charisma: 19 },
};

const mocks = vi.hoisted(() => {
  const parent = { dispatch: vi.fn() };
  const navigation = {
    getParent: vi.fn(() => parent),
  };
  return {
    parent,
    navigation,
    monsterState: {
      pinnedMonsterIds: [] as string[],
      favoriteMonsterIds: [] as string[],
      updateMonster: vi.fn(async () => {}),
      addMonster: vi.fn(async () => {}),
      togglePinnedMonster: vi.fn(async () => {}),
      toggleFavoriteMonster: vi.fn(async () => {}),
    },
  };
});

vi.mock('react-native', async () => {
  const ReactNativeMock = await import('react');
  const makeHost = (name: string) => (props: Record<string, unknown>) =>
    ReactNativeMock.createElement(name, props, props.children as React.ReactNode);
  return {
    View: makeHost('View'),
    Text: makeHost('Text'),
    ScrollView: makeHost('ScrollView'),
    Image: makeHost('Image'),
    Pressable: makeHost('Pressable'),
    Button: (props: Record<string, unknown>) => ReactNativeMock.createElement('Button', props),
    StyleSheet: { create: (styles: unknown) => styles, absoluteFill: {} },
  };
});

vi.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => React.createElement('Icon', { name }),
}));

vi.mock('expo-image-picker', () => ({
  MediaTypeOptions: { Images: 'Images' },
  launchImageLibraryAsync: vi.fn(async () => ({ canceled: true })),
}));

vi.mock('@/shared/components/TextInput/TextInput', () => ({
  default: (props: Record<string, unknown>) => React.createElement('TextInput', props),
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

vi.mock('@/context/Monster-store', () => ({
  default: <T,>(selector: (state: MonsterStateMock) => T): T => selector(mocks.monsterState),
}));

vi.mock('@/shared/services/fileSerice', () => ({
  default: {
    exportMonster: vi.fn(),
  },
}));

beforeEach(() => {
  mocks.parent.dispatch.mockClear();
  mocks.navigation.getParent.mockReturnValue(mocks.parent);
  mocks.monsterState.pinnedMonsterIds = [];
  mocks.monsterState.favoriteMonsterIds = [];
  mocks.monsterState.updateMonster.mockClear();
  mocks.monsterState.addMonster.mockClear();
  mocks.monsterState.togglePinnedMonster.mockClear();
  mocks.monsterState.toggleFavoriteMonster.mockClear();
});

async function renderMonster(monster: MonsterDto): Promise<ReactTestRenderer> {
  let tree: ReactTestRenderer;
  await act(async () => {
    tree = create(<Monster route={{ key: 'Monster', name: 'Monster', params: { monster } }} />);
  });
  return tree!;
}

describe('Monster detail screen', () => {
  it('renders legendary actions when present', async () => {
    const tree = await renderMonster(baseMonster);

    expect(tree.root.findByProps({ testID: 'monster.legendaryActionsSection' })).toBeTruthy();

    act(() => tree.unmount());
  });

  it('renders safe empty reactions state when monster has no reactions', async () => {
    const tree = await renderMonster({ ...baseMonster, reactions: undefined, legendaryActions: undefined });

    expect(tree.root.findByProps({ testID: 'monster.reactionsSection' })).toBeTruthy();
    expect(tree.root.findAllByProps({ children: 'Немає реакцій.' }).length).toBeGreaterThan(0);

    act(() => tree.unmount());
  });
});
