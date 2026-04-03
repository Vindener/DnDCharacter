import React from 'react';

export function HomebrewTab({ mode, renderPlay, renderEdit }: { mode: 'play' | 'edit'; renderPlay: () => React.ReactNode; renderEdit: () => React.ReactNode }) {
  return <>{mode === 'play' ? renderPlay() : renderEdit()}</>;
}

