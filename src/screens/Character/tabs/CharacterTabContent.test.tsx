import React from 'react';
import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { CharacterTabContent } from './CharacterTabContent';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('./OverviewTab', () => ({
  OverviewTab: ({
    mode,
    renderPlay,
    renderEdit,
  }: {
    mode: 'play' | 'edit';
    renderPlay: () => React.ReactNode;
    renderEdit: () => React.ReactNode;
  }) => <>{mode === 'play' ? renderPlay() : renderEdit()}</>,
}));
vi.mock('./CombatTab', () => ({
  CombatTab: ({
    mode,
    renderPlay,
    renderEdit,
  }: {
    mode: 'play' | 'edit';
    renderPlay: () => React.ReactNode;
    renderEdit: () => React.ReactNode;
  }) => <>{mode === 'play' ? renderPlay() : renderEdit()}</>,
}));
vi.mock('./MagicTab', () => ({
  MagicTab: ({
    mode,
    renderPlay,
    renderEdit,
  }: {
    mode: 'play' | 'edit';
    renderPlay: () => React.ReactNode;
    renderEdit: () => React.ReactNode;
  }) => <>{mode === 'play' ? renderPlay() : renderEdit()}</>,
}));
vi.mock('./InventoryTab', () => ({
  InventoryTab: ({
    mode,
    renderPlay,
    renderEdit,
  }: {
    mode: 'play' | 'edit';
    renderPlay: () => React.ReactNode;
    renderEdit: () => React.ReactNode;
  }) => <>{mode === 'play' ? renderPlay() : renderEdit()}</>,
}));
vi.mock('./NotesTab', () => ({
  NotesTab: ({
    mode,
    renderPlay,
    renderEdit,
  }: {
    mode: 'play' | 'edit';
    renderPlay: () => React.ReactNode;
    renderEdit: () => React.ReactNode;
  }) => <>{mode === 'play' ? renderPlay() : renderEdit()}</>,
}));
vi.mock('./HomebrewTab', () => ({
  HomebrewTab: ({
    mode,
    renderPlay,
    renderEdit,
  }: {
    mode: 'play' | 'edit';
    renderPlay: () => React.ReactNode;
    renderEdit: () => React.ReactNode;
  }) => <>{mode === 'play' ? renderPlay() : renderEdit()}</>,
}));

function makeProps(overrides = {}) {
  return {
    selectedTab: 'Overview' as const,
    mode: 'play' as const,
    renderOverviewPlay: () => React.createElement('Text', { testID: 'overview.play' }, 'Overview Play'),
    renderOverviewEdit: () => React.createElement('Text', { testID: 'overview.edit' }, 'Overview Edit'),
    renderCombatPlay: () => React.createElement('Text', { testID: 'combat.play' }, 'Combat Play'),
    renderCombatEdit: () => React.createElement('Text', { testID: 'combat.edit' }, 'Combat Edit'),
    renderMagicPlay: () => React.createElement('Text', { testID: 'magic.play' }, 'Magic Play'),
    renderMagicEdit: () => React.createElement('Text', { testID: 'magic.edit' }, 'Magic Edit'),
    renderInventoryPlay: () => React.createElement('Text', { testID: 'inventory.play' }, 'Inventory Play'),
    renderInventoryEdit: () => React.createElement('Text', { testID: 'inventory.edit' }, 'Inventory Edit'),
    renderNotesPlay: () => React.createElement('Text', { testID: 'notes.play' }, 'Notes Play'),
    renderNotesEdit: () => React.createElement('Text', { testID: 'notes.edit' }, 'Notes Edit'),
    renderHomebrewPlay: () => React.createElement('Text', { testID: 'homebrew.play' }, 'Homebrew Play'),
    renderHomebrewEdit: () => React.createElement('Text', { testID: 'homebrew.edit' }, 'Homebrew Edit'),
    ...overrides,
  };
}

describe('CharacterTabContent', () => {
  it('renders Play Mode content for the selected tab', () => {
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<CharacterTabContent {...makeProps({ selectedTab: 'Combat' as const })} />);
    });

    expect(tree.root.findByProps({ testID: 'combat.play' })).toBeTruthy();
    expect(() => tree.root.findByProps({ testID: 'combat.edit' })).toThrow();

    act(() => tree.unmount());
  });

  it('renders Edit Mode content for the selected tab', () => {
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<CharacterTabContent {...makeProps({ selectedTab: 'Magic' as const, mode: 'edit' as const })} />);
    });

    expect(tree.root.findByProps({ testID: 'magic.edit' })).toBeTruthy();
    expect(() => tree.root.findByProps({ testID: 'magic.play' })).toThrow();

    act(() => tree.unmount());
  });
});
