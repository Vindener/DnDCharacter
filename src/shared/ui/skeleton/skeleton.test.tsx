import React from 'react';
import { Text } from 'react-native';
import { act, create } from 'react-test-renderer';
import type { ReactTestRenderer } from 'react-test-renderer';
import { describe, expect, it } from 'vitest';
import { SkeletonCharacterCard, SkeletonHome } from '@/shared/ui/skeleton';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type LoadStateProps = {
  isLoaded: boolean;
  error?: string | null;
  items: string[];
};

function LoadStateProbe({ isLoaded, error, items }: LoadStateProps) {
  if (error) return <Text testID='error-state'>{error}</Text>;
  if (!isLoaded) return <SkeletonHome />;
  if (!items.length) return <Text testID='empty-state'>Empty</Text>;
  return <Text testID='content-state'>{items.join(', ')}</Text>;
}

describe('skeleton components', () => {
  it('renders without data', () => {
    let tree: ReactTestRenderer;

    act(() => {
      tree = create(<SkeletonCharacterCard />);
    });

    expect(tree!.root.findByProps({ testID: 'skeleton-character-card' })).toBeTruthy();

    act(() => {
      tree!.unmount();
    });
  });

  it('skeleton disappears after loading', () => {
    let tree: ReactTestRenderer;

    act(() => {
      tree = create(<LoadStateProbe isLoaded={false} items={[]} />);
    });

    expect(tree!.root.findByProps({ testID: 'skeleton-home' })).toBeTruthy();

    act(() => {
      tree!.update(<LoadStateProbe isLoaded={true} items={['Aelar']} />);
    });

    expect(tree!.root.findByProps({ testID: 'content-state' })).toBeTruthy();

    act(() => {
      tree!.unmount();
    });
  });

  it('empty state does not conflict with skeleton', () => {
    let tree: ReactTestRenderer;

    act(() => {
      tree = create(<LoadStateProbe isLoaded={false} items={[]} />);
    });

    expect(() => tree!.root.findByProps({ testID: 'empty-state' })).toThrow();

    act(() => {
      tree!.update(<LoadStateProbe isLoaded={true} items={[]} />);
    });

    expect(tree!.root.findByProps({ testID: 'empty-state' })).toBeTruthy();

    act(() => {
      tree!.unmount();
    });
  });

  it('error state has priority over skeleton', () => {
    let tree: ReactTestRenderer;

    act(() => {
      tree = create(<LoadStateProbe isLoaded={false} error='Failed' items={[]} />);
    });

    expect(tree!.root.findByProps({ testID: 'error-state' })).toBeTruthy();
    expect(() => tree!.root.findByProps({ testID: 'skeleton-home' })).toThrow();

    act(() => {
      tree!.unmount();
    });
  });
});
