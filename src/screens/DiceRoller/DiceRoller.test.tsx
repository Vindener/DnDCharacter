import React from 'react';
import { act, create } from 'react-test-renderer';
import type { ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DiceRollerPanel } from './DiceRoller';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  rollDice: vi.fn(
    (input: { dice: string; count?: number; modifier?: number; proficiencyBonus?: number; mode?: string; label?: string }) => ({
      label: input.label,
      formula: `${input.count ?? 1}${input.dice}`,
      rolls: Array.from({ length: input.mode === 'normal' ? (input.count ?? 1) : 2 }, () => 4),
      usedRoll: input.mode === 'normal' ? 4 * (input.count ?? 1) : 4,
      modifier: input.modifier ?? 0,
      proficiencyBonus: input.proficiencyBonus ?? 0,
      total: 4 * (input.mode === 'normal' ? (input.count ?? 1) : 1),
      mode: input.mode ?? 'normal',
      isCriticalSuccess: false,
      isCriticalFailure: false,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }),
  ),
  rollFormula: vi.fn((input: { formula: string; label?: string }) => ({
    label: input.label,
    formula: input.formula,
    rolls: [4],
    usedRoll: 4,
    modifier: 0,
    proficiencyBonus: 0,
    total: 4,
    mode: 'normal',
    isCriticalSuccess: false,
    isCriticalFailure: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  })),
}));

vi.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: ({ name }: { name: string }) => React.createElement('Icon', { name }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (!params) return key;
      return Object.entries(params).reduce((out, [paramKey, value]) => out.replace(`{{${paramKey}}}`, String(value)), key);
    },
  }),
}));

vi.mock('@/context/Theme-store', async () => {
  const { darkColors } = await import('@/shared/styles/theme');
  return {
    default: <T,>(selector: (state: { colors: typeof darkColors }) => T): T => selector({ colors: darkColors }),
  };
});

vi.mock('@/shared/services/diceRoller', () => ({
  rollDice: mocks.rollDice,
  rollFormula: mocks.rollFormula,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function renderPanel(): ReactTestRenderer {
  let tree: ReactTestRenderer | undefined;
  act(() => {
    tree = create(<DiceRollerPanel />);
  });
  return tree!;
}

describe('DiceRollerPanel', () => {
  it('taps on a die chip accumulate a count and roll via a formula', () => {
    const tree = renderPanel();

    // Preset-less panel seeds diceCounts to { d20: 1 } — one more tap makes it 2.
    act(() => {
      tree.root.findByProps({ testID: 'diceRoller.diceChip.d20' }).props.onPress();
    });
    act(() => {
      tree.root.findByProps({ testID: 'diceRoller.rollButton' }).props.onPress();
    });

    expect(mocks.rollFormula).toHaveBeenCalledWith(expect.objectContaining({ formula: '2d20' }));
    expect(mocks.rollDice).not.toHaveBeenCalled();

    act(() => tree.unmount());
  });

  it('mixes multiple dice types into one formula and supports resetting the counts', () => {
    const tree = renderPanel();

    act(() => {
      tree.root.findByProps({ testID: 'diceRoller.diceChip.d8' }).props.onPress();
    });
    act(() => {
      tree.root.findByProps({ testID: 'diceRoller.diceChip.d8' }).props.onPress();
    });
    act(() => {
      tree.root.findByProps({ testID: 'diceRoller.diceChip.d6' }).props.onPress();
    });
    act(() => {
      tree.root.findByProps({ testID: 'diceRoller.rollButton' }).props.onPress();
    });

    // Default d20:1 from the seed plus 2d8 + 1d6 from the taps above.
    expect(mocks.rollFormula).toHaveBeenCalledWith(expect.objectContaining({ formula: '1d20+2d8+1d6' }));

    const rollFormulaCallsBeforeReset = mocks.rollFormula.mock.calls.length;

    act(() => {
      tree.root.findByProps({ testID: 'diceRoller.resetCount' }).props.onPress();
    });
    act(() => {
      tree.root.findByProps({ testID: 'diceRoller.rollButton' }).props.onPress();
    });

    // All counts reset to 0 (min) — nothing to roll, so no new roll is executed.
    expect(mocks.rollFormula.mock.calls.length).toBe(rollFormulaCallsBeforeReset);

    act(() => tree.unmount());
  });

  it('locks to 1d20 for advantage and disadvantage modes, ignoring dice chip taps', () => {
    const tree = renderPanel();

    act(() => {
      tree.root.findByProps({ testID: 'diceRoller.diceChip.d20' }).props.onPress();
    });
    act(() => {
      tree.root.findByProps({ testID: 'diceRoller.mode.advantage' }).props.onPress();
    });

    expect(() => tree.root.findByProps({ testID: 'diceRoller.diceChip.d20' })).toThrow();

    act(() => {
      tree.root.findByProps({ testID: 'diceRoller.rollButton' }).props.onPress();
    });

    expect(mocks.rollDice).toHaveBeenCalledWith(expect.objectContaining({ dice: 'd20', count: 1, mode: 'advantage' }));

    act(() => tree.unmount());
  });
});
