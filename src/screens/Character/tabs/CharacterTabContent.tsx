import React from 'react';
import { OverviewTab } from './OverviewTab';
import { CombatTab } from './CombatTab';
import { MagicTab } from './MagicTab';
import { InventoryTab } from './InventoryTab';
import { NotesTab } from './NotesTab';
import { HomebrewTab } from './HomebrewTab';

type CharacterTabContentProps = {
  selectedTab: 'Overview' | 'Combat' | 'Magic' | 'Inventory' | 'Notes' | 'Homebrew';
  mode: 'play' | 'edit';
  renderOverviewPlay: () => React.ReactNode;
  renderOverviewEdit: () => React.ReactNode;
  renderCombatPlay: () => React.ReactNode;
  renderCombatEdit: () => React.ReactNode;
  renderMagicPlay: () => React.ReactNode;
  renderMagicEdit: () => React.ReactNode;
  renderInventoryPlay: () => React.ReactNode;
  renderInventoryEdit: () => React.ReactNode;
  renderNotesPlay: () => React.ReactNode;
  renderNotesEdit: () => React.ReactNode;
  renderHomebrewPlay: () => React.ReactNode;
  renderHomebrewEdit: () => React.ReactNode;
};

function CharacterTabContentBase(props: CharacterTabContentProps) {
  const {
    selectedTab,
    mode,
    renderOverviewPlay,
    renderOverviewEdit,
    renderCombatPlay,
    renderCombatEdit,
    renderMagicPlay,
    renderMagicEdit,
    renderInventoryPlay,
    renderInventoryEdit,
    renderNotesPlay,
    renderNotesEdit,
    renderHomebrewPlay,
    renderHomebrewEdit,
  } = props;

  if (selectedTab === 'Overview') {
    return <OverviewTab mode={mode} renderPlay={renderOverviewPlay} renderEdit={renderOverviewEdit} />;
  }
  if (selectedTab === 'Combat') {
    return <CombatTab mode={mode} renderPlay={renderCombatPlay} renderEdit={renderCombatEdit} />;
  }
  if (selectedTab === 'Magic') {
    return <MagicTab mode={mode} renderPlay={renderMagicPlay} renderEdit={renderMagicEdit} />;
  }
  if (selectedTab === 'Inventory') {
    return <InventoryTab mode={mode} renderPlay={renderInventoryPlay} renderEdit={renderInventoryEdit} />;
  }
  if (selectedTab === 'Notes') {
    return <NotesTab mode={mode} renderPlay={renderNotesPlay} renderEdit={renderNotesEdit} />;
  }
  return <HomebrewTab mode={mode} renderPlay={renderHomebrewPlay} renderEdit={renderHomebrewEdit} />;
}

export const CharacterTabContent = React.memo(CharacterTabContentBase);
