import React from 'react';

export function OverviewTab({
  mode,
  renderPlay,
  renderEdit,
}: {
  mode: 'play' | 'edit';
  renderPlay: () => React.ReactNode;
  renderEdit: () => React.ReactNode;
}) {
  return <>{mode === 'play' ? renderPlay() : renderEdit()}</>;
}
