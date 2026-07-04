import React from 'react';
import { act, create } from 'react-test-renderer';
import type { ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import References from './References';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  navigation: {
    navigate: vi.fn(),
  },
}));

vi.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => React.createElement('Icon', { name }),
}));

vi.mock('@react-navigation/native', () => ({
  useNavigation: () => mocks.navigation,
}));

vi.mock('@/context/Theme-store', async () => {
  const { darkColors } = await import('@/shared/styles/theme');
  return {
    default: <T,>(selector: (state: { colors: typeof darkColors }) => T): T => selector({ colors: darkColors }),
  };
});

beforeEach(() => {
  mocks.navigation.navigate.mockClear();
});

function renderReferences(): ReactTestRenderer {
  let tree: ReactTestRenderer;
  act(() => {
    tree = create(<References />);
  });
  return tree!;
}

describe('References screen', () => {
  it('renders references catalog', () => {
    const tree = renderReferences();

    expect(tree.root.findByProps({ testID: 'references.screen' })).toBeTruthy();

    act(() => tree.unmount());
  });

  it('opens bestiary and spellbook entries', () => {
    const tree = renderReferences();

    act(() => {
      tree.root.findByProps({ testID: 'references.openBestiaryButton' }).props.onPress();
    });
    expect(mocks.navigation.navigate).toHaveBeenCalledWith('List');

    act(() => {
      tree.root.findByProps({ testID: 'references.openSpellbookButton' }).props.onPress();
    });
    expect(mocks.navigation.navigate).toHaveBeenCalledWith('Spellbook');

    act(() => tree.unmount());
  });

  it('renders structured SRD reference entries with source badges', () => {
    const tree = renderReferences();

    expect(tree.root.findByProps({ testID: 'references.srd.conditions' }).props.disabled).toBeFalsy();
    expect(tree.root.findByProps({ testID: 'references.srd.actions-in-combat' }).props.disabled).toBeFalsy();
    expect(tree.root.findByProps({ testID: 'references.srd.equipment' }).props.disabled).toBeFalsy();
    expect(tree.root.findByProps({ testID: 'references.sourceBadge.conditions' })).toBeTruthy();

    act(() => tree.unmount());
  });
});
