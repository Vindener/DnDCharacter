import React from 'react';
import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { CharacterSourceBadge, getCharacterSourceBadgeLabel } from './CharacterSourceBadge';
import type { CharacterContentSourceRef } from '@/types/Character';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('react-native', () => {
  const host = (name: string) =>
    ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement(name, props, children);
  return {
    Text: host('Text'),
    View: host('View'),
    StyleSheet: { create: <T,>(styles: T): T => styles },
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'badges.srd51': 'SRD 5.1',
      'badges.homebrew': 'Homebrew',
      'badges.custom': 'Custom',
      'badges.legacyCustom': 'Legacy custom',
    }[key] || key),
  }),
}));

const styles = {
  rankBadge: { padding: 1 },
  rankBadgeText: { fontSize: 10 },
};

function renderBadge(source: CharacterContentSourceRef) {
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(<CharacterSourceBadge source={source} id={source.origin} styles={styles} />);
  });
  return tree;
}

describe('CharacterSourceBadge', () => {
  it('maps all source origins to visible badge labels', () => {
    const t = (key: string) => key;

    expect(getCharacterSourceBadgeLabel({ origin: 'srd-5.1', source: 'srd-5.1', license: 'ogl-1.0a' }, t)).toBe('badges.srd51');
    expect(getCharacterSourceBadgeLabel({ origin: 'homebrew', source: 'homebrew', license: 'custom' }, t)).toBe('badges.homebrew');
    expect(getCharacterSourceBadgeLabel({ origin: 'custom', source: 'user-custom', license: 'custom' }, t)).toBe('badges.custom');
    expect(getCharacterSourceBadgeLabel({ origin: 'legacy-custom', source: 'user-custom', license: 'unknown', legacyCustom: true }, t)).toBe('badges.legacyCustom');
  });

  it('renders SRD, Homebrew, Custom, and Legacy custom labels', () => {
    expect(JSON.stringify(renderBadge({ origin: 'srd-5.1', source: 'srd-5.1', license: 'ogl-1.0a' }).toJSON())).toContain('SRD 5.1');
    expect(JSON.stringify(renderBadge({ origin: 'homebrew', source: 'homebrew', license: 'custom' }).toJSON())).toContain('Homebrew');
    expect(JSON.stringify(renderBadge({ origin: 'custom', source: 'user-custom', license: 'custom' }).toJSON())).toContain('Custom');
    expect(JSON.stringify(renderBadge({ origin: 'legacy-custom', source: 'user-custom', license: 'unknown', legacyCustom: true }).toJSON())).toContain('Legacy custom');
  });
});
