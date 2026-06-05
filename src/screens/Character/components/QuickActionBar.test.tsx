import React from 'react';
import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { darkColors } from '@/shared/styles/theme';
import { QuickActionBar } from './QuickActionBar';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: ({ name }: { name: string }) => React.createElement('Icon', { name }),
}));

vi.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  Pressable: 'Pressable',
  FlatList: ({ data, renderItem, keyExtractor }: { data: unknown[]; renderItem: (item: { item: unknown }) => React.ReactNode; keyExtractor?: (item: unknown) => string }) =>
    React.createElement(
      'FlatList',
      null,
      data.map((item, index) => React.createElement(React.Fragment, { key: keyExtractor ? keyExtractor(item) : String(index) }, renderItem({ item }))),
    ),
}));

function makeStyles() {
  return {
    quickActionsWrapper: {},
    quickActionButton: {},
    quickActionText: {},
    quickActionsRow: {},
  };
}

describe('QuickActionBar', () => {
  it('renders stable session action test IDs and dispatches selected actions', () => {
    const minusHp = vi.fn();
    const tempHp = vi.fn();
    const roll = vi.fn();
    const condition = vi.fn();
    const onQuickActionPress = vi.fn((action: { onPress: () => void }) => action.onPress());
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <QuickActionBar
          styles={makeStyles() as never}
          colors={darkColors as never}
          quickActions={[
            { id: 'minus-hp', label: '-HP', icon: 'heart-minus-outline', onPress: minusHp },
            { id: 'temp-hp', label: 'Temp', icon: 'shield-half-full', onPress: tempHp },
            { id: 'roll', label: 'Roll', icon: 'dice-multiple-outline', onPress: roll },
            { id: 'condition', label: 'Стан', icon: 'alert-circle-outline', onPress: condition },
          ]}
          onQuickActionPress={onQuickActionPress}
        />,
      );
    });

    act(() => {
      tree.root.findByProps({ testID: 'character.quickAction.hpMinus' }).props.onPress();
      tree.root.findByProps({ testID: 'character.quickAction.tempHp' }).props.onPress();
      tree.root.findByProps({ testID: 'character.quickAction.roll' }).props.onPress();
      tree.root.findByProps({ testID: 'character.quickAction.condition' }).props.onPress();
    });

    expect(onQuickActionPress).toHaveBeenCalledTimes(4);
    expect(minusHp).toHaveBeenCalledTimes(1);
    expect(tempHp).toHaveBeenCalledTimes(1);
    expect(roll).toHaveBeenCalledTimes(1);
    expect(condition).toHaveBeenCalledTimes(1);

    act(() => tree.unmount());
  });
});
