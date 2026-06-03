import React from 'react';

export function MagicTab({ mode, renderPlay, renderEdit }: { mode: 'play' | 'edit'; renderPlay: () => React.ReactNode; renderEdit: () => React.ReactNode }) {
  return <>{mode === 'play' ? renderPlay() : renderEdit()}</>;
}

