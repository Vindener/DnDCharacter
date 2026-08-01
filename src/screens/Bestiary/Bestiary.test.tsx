import React from 'react';
import { act, create } from 'react-test-renderer';
import type { ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MonsterDto } from '@/types/Monster';
import type { DMCampaign } from '@/dm/domain/types';
import Bestiary from './Bestiary';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type MonsterStateMock = {
  monsters: MonsterDto[];
  pinnedMonsterIds: string[];
  favoriteMonsterIds: string[];
  isLoaded: boolean;
  loadError: string | null;
  loadMonsters: () => Promise<void>;
  addMonster: (monster: MonsterDto) => Promise<void>;
  togglePinnedMonster: (id: string) => Promise<void>;
  toggleFavoriteMonster: (id: string) => Promise<void>;
  clearPinnedMonsters: () => Promise<void>;
  removeMonster: (id: string) => Promise<void>;
};

const goblin: MonsterDto = {
  id: 'goblin',
  name: 'Goblin',
  size: 'Small',
  type: 'Humanoid',
  challenge: '1/4',
  armorClass: 15,
  hitPoints: 7,
  speed: '30 ft.',
  mainAttack: 'Scimitar',
  attackBonus: '+4',
  damage: '1d6+2',
  stats: { strength: 8, dexterity: 14, constitution: 10, intelligence: 10, wisdom: 8, charisma: 8 },
};

const mocks = vi.hoisted(() => {
  const parent = { dispatch: vi.fn() };
  const navigation = {
    navigate: vi.fn(),
    getParent: vi.fn(() => parent),
  };
  return {
    parent,
    navigation,
    campaigns: [] as DMCampaign[],
    togglePinnedMonsterForCampaign: vi.fn(async (_campaignId: string, _monsterId: string) => null),
    monsterState: {
      monsters: [] as MonsterDto[],
      pinnedMonsterIds: [] as string[],
      favoriteMonsterIds: [] as string[],
      isLoaded: true,
      loadError: null as string | null,
      loadMonsters: vi.fn(async () => {}),
      addMonster: vi.fn(async () => {}),
      togglePinnedMonster: vi.fn(async () => {}),
      toggleFavoriteMonster: vi.fn(async () => {}),
      clearPinnedMonsters: vi.fn(async () => {}),
      removeMonster: vi.fn(async () => {}),
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
    Pressable: makeHost('Pressable'),
    ScrollView: makeHost('ScrollView'),
    TextInput: makeHost('TextInput'),
    Image: makeHost('Image'),
    StyleSheet: { create: (styles: unknown) => styles, absoluteFill: {} },
    FlatList: ({
      data,
      renderItem,
      ListHeaderComponent,
      ListEmptyComponent,
      ...props
    }: {
      data: MonsterDto[];
      renderItem: (info: { item: MonsterDto; index: number }) => React.ReactNode;
      ListHeaderComponent?: () => React.ReactNode;
      ListEmptyComponent?: React.ReactNode;
    }) =>
      ReactNativeMock.createElement(
        'FlatList',
        props,
        ListHeaderComponent ? ListHeaderComponent() : null,
        data.length
          ? data.map((item, index) => ReactNativeMock.createElement('Item', { key: item.id }, renderItem({ item, index })))
          : ListEmptyComponent,
      ),
  };
});

vi.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => React.createElement('Icon', { name }),
}));

vi.mock('@/shared/components/MonsterCard/MonsterCard', () => ({
  MonsterCard: ({
    monster,
    cardTestID,
    onAddToEncounter,
    onTogglePin,
    onToggleFavorite,
    onTogglePinForCampaign,
  }: {
    monster: MonsterDto;
    cardTestID?: string;
    onAddToEncounter?: (monster: MonsterDto) => void;
    onTogglePin?: (monsterId: string) => void;
    onToggleFavorite?: (monsterId: string) => void;
    onTogglePinForCampaign?: (monsterId: string) => void;
  }) =>
    React.createElement(
      'View',
      { testID: cardTestID },
      React.createElement('Text', null, monster.name),
      React.createElement('Pressable', {
        testID: 'monsterCard.addToEncounterButton',
        onPress: (event: { stopPropagation: () => void }) => {
          event.stopPropagation();
          onAddToEncounter?.(monster);
        },
      }),
      React.createElement('Pressable', {
        testID: 'monsterCard.pinButton',
        onPress: (event: { stopPropagation: () => void }) => {
          event.stopPropagation();
          onTogglePin?.(monster.id);
        },
      }),
      React.createElement('Pressable', {
        testID: 'monsterCard.favoriteButton',
        onPress: (event: { stopPropagation: () => void }) => {
          event.stopPropagation();
          onToggleFavorite?.(monster.id);
        },
      }),
      onTogglePinForCampaign
        ? React.createElement('Pressable', {
            testID: 'monsterCard.pinForCampaignButton',
            onPress: (event: { stopPropagation: () => void }) => {
              event.stopPropagation();
              onTogglePinForCampaign(monster.id);
            },
          })
        : null,
    ),
}));

vi.mock('@/shared/ui/skeleton', () => ({
  SkeletonBestiary: () => React.createElement('View', { testID: 'skeleton-bestiary' }),
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

vi.mock('@/dm/repositories/campaignRepository', () => ({
  subscribeAccessibleCampaigns: async (cb: (campaigns: DMCampaign[]) => void) => {
    cb(mocks.campaigns);
    return () => {};
  },
  togglePinnedMonsterForCampaign: (campaignId: string, monsterId: string) => mocks.togglePinnedMonsterForCampaign(campaignId, monsterId),
}));

vi.mock('@/shared/services/fileSerice', () => ({
  default: {
    importMonsterFromFile: vi.fn(async () => null),
  },
}));

beforeEach(() => {
  mocks.parent.dispatch.mockClear();
  mocks.navigation.navigate.mockClear();
  mocks.navigation.getParent.mockReturnValue(mocks.parent);
  mocks.campaigns = [];
  mocks.togglePinnedMonsterForCampaign.mockClear();
  mocks.monsterState.monsters = [];
  mocks.monsterState.pinnedMonsterIds = [];
  mocks.monsterState.favoriteMonsterIds = [];
  mocks.monsterState.isLoaded = true;
  mocks.monsterState.loadError = null;
  mocks.monsterState.loadMonsters.mockClear();
  mocks.monsterState.addMonster.mockClear();
  mocks.monsterState.togglePinnedMonster.mockClear();
  mocks.monsterState.toggleFavoriteMonster.mockClear();
  mocks.monsterState.clearPinnedMonsters.mockClear();
  mocks.monsterState.removeMonster.mockClear();
});

async function renderBestiary(campaignId?: string): Promise<ReactTestRenderer> {
  let tree: ReactTestRenderer;
  const route = campaignId ? { params: { campaignId } } : undefined;
  const props = { route } as unknown as React.ComponentProps<typeof Bestiary>;
  await act(async () => {
    tree = create(<Bestiary {...props} />);
  });
  return tree!;
}

describe('Bestiary screen', () => {
  it('shows skeleton while monsters are loading', async () => {
    mocks.monsterState.isLoaded = false;

    const tree = await renderBestiary();

    expect(tree.root.findByProps({ testID: 'skeleton-bestiary' })).toBeTruthy();

    act(() => tree.unmount());
  });

  it('shows empty state for an empty bestiary', async () => {
    const tree = await renderBestiary();

    expect(tree.root.findByProps({ testID: 'bestiary.emptyState' })).toBeTruthy();

    act(() => tree.unmount());
  });

  it('searches monsters and shows no-results state', async () => {
    mocks.monsterState.monsters = [goblin];
    const tree = await renderBestiary();
    vi.useFakeTimers();

    act(() => {
      tree.root.findByProps({ testID: 'bestiary.searchInput' }).props.onChangeText('dragon');
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(tree.root.findByProps({ testID: 'bestiary.noResultsState' })).toBeTruthy();

    act(() => {
      tree.root.findByProps({ testID: 'bestiary.searchInput' }).props.onChangeText('goblin');
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(tree.root.findAllByProps({ testID: 'bestiary.monsterCard' })).toHaveLength(1);

    act(() => tree.unmount());
    vi.useRealTimers();
  });

  it('adds a monster to encounter through DM navigation seed', async () => {
    mocks.monsterState.monsters = [goblin];
    const tree = await renderBestiary();

    act(() => {
      tree.root.findByProps({ testID: 'monsterCard.addToEncounterButton' }).props.onPress({ stopPropagation: vi.fn() });
    });

    expect(mocks.parent.dispatch).toHaveBeenCalledWith({
      type: 'NAVIGATE',
      payload: {
        name: 'DM',
        params: {
          screen: 'DMEncounterPrep',
          params: {
            initialMonster: {
              monsterId: 'goblin',
              name: 'Goblin',
              challenge: '1/4',
              count: 1,
              hitPoints: 7,
            },
          },
        },
      },
    });

    act(() => tree.unmount());
  });

  it('toggles pin and favorite from monster card', async () => {
    mocks.monsterState.monsters = [goblin];
    const tree = await renderBestiary();

    act(() => {
      tree.root.findByProps({ testID: 'monsterCard.pinButton' }).props.onPress({ stopPropagation: vi.fn() });
      tree.root.findByProps({ testID: 'monsterCard.favoriteButton' }).props.onPress({ stopPropagation: vi.fn() });
    });

    expect(mocks.monsterState.togglePinnedMonster).toHaveBeenCalledWith('goblin');
    expect(mocks.monsterState.toggleFavoriteMonster).toHaveBeenCalledWith('goblin');

    act(() => tree.unmount());
  });

  it('toggles a campaign-scoped pin only when a campaignId route param is present', async () => {
    mocks.monsterState.monsters = [goblin];
    mocks.campaigns = [
      {
        id: 'campaign-1',
        name: 'Campaign One',
        nameNormalized: 'campaign one',
        ownerUid: 'u-1',
        owners: ['u-1'],
        editors: [],
        createdAtMs: 1,
        updatedAtMs: 2,
        pinnedMonsterIds: [],
      },
    ];
    const tree = await renderBestiary('campaign-1');

    expect(tree.root.findByProps({ testID: 'monsterCard.pinForCampaignButton' })).toBeTruthy();

    act(() => {
      tree.root.findByProps({ testID: 'monsterCard.pinForCampaignButton' }).props.onPress({ stopPropagation: vi.fn() });
    });

    expect(mocks.togglePinnedMonsterForCampaign).toHaveBeenCalledWith('campaign-1', 'goblin');

    act(() => tree.unmount());
  });

  it('does not show the campaign-scoped pin button without a campaignId route param', async () => {
    mocks.monsterState.monsters = [goblin];
    const tree = await renderBestiary();

    expect(tree.root.findAllByProps({ testID: 'monsterCard.pinForCampaignButton' })).toHaveLength(0);

    act(() => tree.unmount());
  });

  it('does not expose the built-in rules source as a filter', async () => {
    mocks.monsterState.monsters = [
      { ...goblin, id: 'built-in-goblin', source: 'srd-5.1', license: 'ogl-1.0a' },
      { ...goblin, id: 'custom-goblin', source: 'user-custom', license: 'custom', isCustom: true },
    ];

    const tree = await renderBestiary();

    expect(tree.root.findAllByProps({ testID: 'bestiary.source.srd-5.1' })).toHaveLength(0);
    expect(tree.root.findByProps({ testID: 'bestiary.source.user-custom' })).toBeTruthy();

    act(() => tree.unmount());
  });
});
