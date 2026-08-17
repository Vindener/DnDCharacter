import { useMemo } from 'react';
import useThemeStore from '@/context/Theme-store';
import { designTokens } from '@/shared/styles/tokens';

export function useDesignTokens() {
  const colors = useThemeStore((s) => s.colors);

  return useMemo(
    () => ({
      colors,
      tokens: designTokens,
    }),
    [colors],
  );
}
