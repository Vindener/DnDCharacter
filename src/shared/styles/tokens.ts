import type { TextStyle } from 'react-native';

const spacingScale = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  '2xl': 14,
  '3xl': 16,
  '4xl': 20,
  '5xl': 24,
} as const;

const spacingCompatibility: Record<number, number> = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  11: 11,
  12: 12,
  13: 13,
  14: 14,
  15: 15,
  16: 16,
  18: 18,
  20: 20,
  22: 22,
  24: 24,
  26: 26,
  28: 28,
  32: 32,
  37: 37,
  50: 50,
  99: 99,
  999: 999,
};

const radiusScale = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  '2xl': 14,
  '3xl': 16,
  round: 999,
  pill: 99,
} as const;

const radiusCompatibility: Record<number, number> = {
  0: 0,
  4: 4,
  5: 5,
  6: 6,
  8: 8,
  10: 10,
  12: 12,
  13: 13,
  14: 14,
  16: 16,
  18: 18,
  22: 22,
  26: 26,
  37: 37,
  50: 50,
  99: 99,
  999: 999,
};

const fontSizeScale = {
  xs: 10,
  sm: 11,
  bodySm: 12,
  body: 13,
  bodyLg: 14,
  label: 15,
  subtitle: 16,
  titleSm: 17,
  title: 18,
  titleLg: 20,
  displaySm: 21,
  display: 22,
  displayLg: 24,
  hero: 28,
} as const;

const fontSizeCompatibility: Record<number, number> = {
  10: 10,
  11: 11,
  12: 12,
  13: 13,
  14: 14,
  15: 15,
  16: 16,
  17: 17,
  18: 18,
  20: 20,
  21: 21,
  22: 22,
  24: 24,
  28: 28,
};

const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  black: '800',
} as const;

export type SpacingToken = keyof typeof spacingScale;
export type RadiusToken = keyof typeof radiusScale;
export type FontSizeToken = keyof typeof fontSizeScale;
export type TypographyWeightToken = keyof typeof fontWeights;

export type TypographyVariant =
  | 'caption'
  | 'bodySm'
  | 'body'
  | 'bodyLg'
  | 'label'
  | 'subtitle'
  | 'titleSm'
  | 'title'
  | 'titleLg'
  | 'display';

const typographyVariants: Record<TypographyVariant, Pick<TextStyle, 'fontSize' | 'lineHeight' | 'fontWeight'>> = {
  caption: { fontSize: fontSizeScale.xs, lineHeight: 14, fontWeight: fontWeights.medium },
  bodySm: { fontSize: fontSizeScale.bodySm, lineHeight: 16, fontWeight: fontWeights.regular },
  body: { fontSize: fontSizeScale.body, lineHeight: 18, fontWeight: fontWeights.regular },
  bodyLg: { fontSize: fontSizeScale.bodyLg, lineHeight: 20, fontWeight: fontWeights.regular },
  label: { fontSize: fontSizeScale.label, lineHeight: 20, fontWeight: fontWeights.semibold },
  subtitle: { fontSize: fontSizeScale.subtitle, lineHeight: 22, fontWeight: fontWeights.semibold },
  titleSm: { fontSize: fontSizeScale.titleSm, lineHeight: 24, fontWeight: fontWeights.bold },
  title: { fontSize: fontSizeScale.title, lineHeight: 26, fontWeight: fontWeights.bold },
  titleLg: { fontSize: fontSizeScale.titleLg, lineHeight: 28, fontWeight: fontWeights.bold },
  display: { fontSize: fontSizeScale.display, lineHeight: 30, fontWeight: fontWeights.bold },
};

export function space(tokenOrValue: SpacingToken | number): number {
  if (typeof tokenOrValue === 'number') {
    return spacingCompatibility[tokenOrValue] ?? tokenOrValue;
  }
  return spacingScale[tokenOrValue];
}

export function radius(tokenOrValue: RadiusToken | number): number {
  if (typeof tokenOrValue === 'number') {
    return radiusCompatibility[tokenOrValue] ?? tokenOrValue;
  }
  return radiusScale[tokenOrValue];
}

export function fontSize(tokenOrValue: FontSizeToken | number): number {
  if (typeof tokenOrValue === 'number') {
    return fontSizeCompatibility[tokenOrValue] ?? tokenOrValue;
  }
  return fontSizeScale[tokenOrValue];
}

export function typography(variant: TypographyVariant): Pick<TextStyle, 'fontSize' | 'lineHeight' | 'fontWeight'> {
  return typographyVariants[variant];
}

export const designTokens = {
  spacing: spacingScale,
  radius: radiusScale,
  typography: {
    sizes: fontSizeScale,
    weights: fontWeights,
    variants: typographyVariants,
  },
} as const;

export type DesignTokens = typeof designTokens;

export const sp = space;
export const rd = radius;
export const fs = fontSize;
